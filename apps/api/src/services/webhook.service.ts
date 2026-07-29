import { pool } from '../config/db'
import pino from 'pino'
import { routingService } from './routing.service'
import { emitToTenant } from '../realtime/websocket-server'

const logger = pino({ name: 'WebhookService' })

export class WebhookService {
  async processEvent(payload: any) {
    const { event, instance, data } = payload
    
    logger.info({ event, instance }, 'Processando evento do webhook')

    if (event === 'messages.upsert') {
      await this.processMessage(instance, data)
    } else if (event === 'connection.update') {
      await this.processConnectionUpdate(instance, data)
    }
  }

  private async processMessage(instanceName: string, msg: any) {
    try {
      logger.info({ msg, instanceName }, 'Recebida mensagem no webhook')

      // Ignore fromMe or system messages
      if (msg.key.fromMe) {
        logger.info('Ignorando mensagem (fromMe=true)')
        return
      }
      
      const remoteJid = msg.key.remoteJid
      if (!remoteJid || remoteJid.includes('@g.us')) {
        logger.info({ remoteJid }, 'Ignorando mensagem sem remoteJid ou de grupo')
        return // Ignora grupos por enquanto
      }

      const phone = remoteJid.split('@')[0]
      const pushName = msg.pushName || phone

      // Obter tenant_id da instancia (channel)
      const channelResult = await pool.query('SELECT tenant_id, id FROM channels WHERE name = $1', [instanceName])
      if (channelResult.rows.length === 0) {
        logger.error({ instanceName }, 'Canal não encontrado')
        return
      }
      const tenantId = channelResult.rows[0].tenant_id

      // 1. Encontrar ou criar contato
      let contactId: string
      const contactResult = await pool.query('SELECT id FROM contacts WHERE tenant_id = $1 AND phone = $2', [tenantId, phone])
      if (contactResult.rows.length > 0) {
        contactId = contactResult.rows[0].id
        // Update pushname if changed
        await pool.query('UPDATE contacts SET name = $1 WHERE id = $2 AND name = $3', [pushName, contactId, phone])
      } else {
        const newContact = await pool.query(
          'INSERT INTO contacts (tenant_id, name, phone) VALUES ($1, $2, $3) RETURNING id',
          [tenantId, pushName, phone]
        )
        contactId = newContact.rows[0].id
      }

      // 2. Encontrar ou criar conversa ativa
      let conversationId: string
      let isNewConversation = false
      const convResult = await pool.query(`
        SELECT id, status, unread_count 
        FROM conversations 
        WHERE tenant_id = $1 AND contact_id = $2 AND status != 'resolved' 
        LIMIT 1
      `, [tenantId, contactId])

      if (convResult.rows.length > 0) {
        conversationId = convResult.rows[0].id
        const unreadCount = convResult.rows[0].unread_count + 1
        await pool.query('UPDATE conversations SET unread_count = $1, updated_at = NOW() WHERE id = $2', [unreadCount, conversationId])
      } else {
        isNewConversation = true
        const newConv = await pool.query(
          'INSERT INTO conversations (tenant_id, contact_id, status, unread_count) VALUES ($1, $2, $3, 1) RETURNING id',
          [tenantId, contactId, 'open']
        )
        conversationId = newConv.rows[0].id
      }

      // 3. Inserir a mensagem
      const content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[Mídia ou Mensagem não suportada]'
      
      const msgInsert = await pool.query(`
        INSERT INTO messages (conversation_id, tenant_id, direction, type, content)
        VALUES ($1, $2, 'inbound', 'text', $3)
        RETURNING id, content, created_at
      `, [conversationId, tenantId, content])

      // 4. Smart Routing
      if (isNewConversation) {
        await routingService.routeConversation(tenantId, conversationId, contactId)
      }

      // 5. Emitir evento WebSocket
      emitToTenant(tenantId, 'message:new', {
        conversationId,
        message: {
          id: msgInsert.rows[0].id,
          direction: 'inbound',
          type: 'text',
          content: content,
          created_at: msgInsert.rows[0].created_at
        }
      })
      
      emitToTenant(tenantId, 'conversation:updated', {
        id: conversationId,
        unread_count: convResult.rows.length > 0 ? convResult.rows[0].unread_count + 1 : 1,
        last_message: content
      })

    } catch (err) {
      logger.error({ err, instanceName }, 'Erro ao processar mensagem do whatsapp')
    }
  }

  private async processConnectionUpdate(instanceName: string, data: any) {
    try {
      const status = data.state === 'open' ? 'connected' : data.state === 'close' ? 'disconnected' : data.state
      await pool.query('UPDATE channels SET status = $1 WHERE name = $2', [status, instanceName])
    } catch (err) {
      logger.error({ err, instanceName }, 'Erro ao atualizar status do canal')
    }
  }
}

export const webhookService = new WebhookService()
