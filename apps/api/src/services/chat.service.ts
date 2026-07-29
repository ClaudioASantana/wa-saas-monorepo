import { pool } from '../config/db'
import pino from 'pino'
import { emitToTenant } from '../realtime/websocket-server'
import { commandQueue } from '../queues/command-queue'

const logger = pino({ name: 'ChatService' })

export class ChatService {
  /**
   * Atribui ou libera uma conversa e gera mensagem de sistema
   */
  async assignConversation(
    tenantId: string, 
    conversationId: string, 
    agentId: string | null, 
    assignerId: string
  ) {
    // 1. Atualizar a conversa
    const result = await pool.query(
      'UPDATE conversations SET agent_id = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *',
      [agentId, conversationId, tenantId]
    )

    if (result.rows.length === 0) {
      throw new Error('Conversa não encontrada')
    }

    const conversation = result.rows[0]

    // Obter o nome do agente que fez a ação
    const assignerRes = await pool.query('SELECT name FROM agents WHERE id = $1', [assignerId])
    const assignerName = assignerRes.rows[0]?.name || 'Agente'

    // 2. Gerar Mensagem de Sistema
    let content = ''
    if (agentId) {
      if (agentId === assignerId) {
        content = `Conversa assumida por ${assignerName}`
      } else {
        const agentRes = await pool.query('SELECT name FROM agents WHERE id = $1', [agentId])
        const assigneeName = agentRes.rows[0]?.name || 'Agente'
        content = `Conversa atribuída a ${assigneeName} por ${assignerName}`
      }
    } else {
      content = `Conversa liberada por ${assignerName}`
    }

    const msgResult = await pool.query(`
      INSERT INTO messages (conversation_id, tenant_id, direction, type, content, is_internal)
      VALUES ($1, $2, 'outbound', 'system', $3, true)
      RETURNING *
    `, [conversationId, tenantId, content])

    const systemMessage = msgResult.rows[0]

    // 3. Emitir eventos Real-Time
    // Evento de nova mensagem (para quem está visualizando a conversa)
    emitToTenant(tenantId, 'message:new', {
      conversationId,
      message: systemMessage
    })

    // Evento de atualização da conversa (para atualizar as listas de todos)
    emitToTenant(tenantId, 'conversation:updated', {
      id: conversationId,
      agent_id: agentId,
      last_message: content
    })

    return conversation
  }

  /**
   * Insere uma mensagem na conversa (interna ou externa)
   */
  async insertMessage(
    tenantId: string,
    conversationId: string,
    agentId: string,
    content: string,
    isInternal: boolean
  ) {
    // 1. Validar conversa e pegar telefone do contato para envio
    const convCheck = await pool.query(`
      SELECT c.id, c.contact_id, ct.phone, ch.name as channel_name
      FROM conversations c
      JOIN contacts ct ON c.contact_id = ct.id
      JOIN channels ch ON ch.tenant_id = c.tenant_id 
        -- Pega o canal padrão ou conectado, por simplificação pegamos qualquer canal ativo do tenant
        -- Em um sistema real a conversa pode estar atrelada ao número recebido
      WHERE c.id = $1 AND c.tenant_id = $2
      LIMIT 1
    `, [conversationId, tenantId])

    if (convCheck.rows.length === 0) {
      throw new Error('Conversa não encontrada')
    }

    const conv = convCheck.rows[0]

    // 2. Pegar nome do agente
    const agentRes = await pool.query('SELECT name FROM agents WHERE id = $1', [agentId])
    const senderName = agentRes.rows[0]?.name || 'Agente'

    // 3. Inserir no banco
    const msgResult = await pool.query(
      `INSERT INTO messages (conversation_id, tenant_id, direction, type, content, sender_name, is_internal)
       VALUES ($1, $2, 'outbound', 'text', $3, $4, $5) RETURNING *`,
      [conversationId, tenantId, content, senderName, isInternal]
    )
    const newMessage = msgResult.rows[0]

    // 4. Atualizar `last_message_preview`
    await pool.query(
      `UPDATE conversations 
       SET last_message_preview = $1, last_message_at = NOW(), updated_at = NOW() 
       WHERE id = $2`,
      [content, conversationId]
    )

    // 5. Emitir socket local
    emitToTenant(tenantId, 'message:new', {
      conversationId,
      message: newMessage
    })
    
    emitToTenant(tenantId, 'conversation:updated', {
      id: conversationId,
      last_message: content
    })

    // 6. Enviar para a Fila do WhatsApp Engine SE não for interna
    if (!isInternal) {
      // Como não temos o canal exato amarrado na conversa nesta arquitetura (ainda), 
      // pegamos o primeiro canal ativo do tenant. Em produção, deveria vir da conversa.
      const channelResult = await pool.query('SELECT name FROM channels WHERE tenant_id = $1 LIMIT 1', [tenantId])
      const instanceName = channelResult.rows[0]?.name

      if (instanceName && conv.phone) {
        await commandQueue.add('send-message', {
          action: 'sendMessage',
          instanceId: instanceName,
          data: {
            to: conv.phone,
            text: content
          }
        })
      }
    }

    return newMessage
  }
}

export const chatService = new ChatService()
