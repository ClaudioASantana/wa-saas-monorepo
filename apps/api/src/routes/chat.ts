import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { pool } from '../config/db'

export async function chatRoutes(fastify: FastifyInstance) {
  // GET /chat/me - fetch current agent info
  fastify.get('/chat/me', { preHandler: [authenticate] }, async (request, reply) => {
    const { tenantId, agentId } = request.user!

    try {
      const result = await pool.query(
        'SELECT id, name, email, role FROM agents WHERE id = $1 AND tenant_id = $2 AND status = $3',
        [agentId, tenantId, 'active']
      )

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Agente não encontrado ou inativo' })
      }

      return reply.send(result.rows[0])
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao buscar agente' })
    }
  })

  // GET /chat/conversations
  fastify.get('/chat/conversations', { preHandler: [authenticate] }, async (request, reply) => {
    const { tenantId } = request.user!

    try {
      const result = await pool.query(
        `SELECT 
          c.id, c.workspace_id, c.channel_id, c.contact_id, c.agent_id, c.tenant_id, 
          c.status, c.last_message_at, c.last_message_preview, c.unread_count, c.created_at,
          co.name as contact_name, co.phone as contact_phone, co.notes as contact_notes,
          a.name as agent_name
         FROM conversations c
         LEFT JOIN contacts co ON c.contact_id = co.id
         LEFT JOIN agents a ON c.agent_id = a.id
         WHERE c.tenant_id = $1
         ORDER BY c.last_message_at DESC NULLS LAST`,
        [tenantId]
      )

      // Get tags for these conversations (if any exist)
      const tagsRes = await pool.query(
        `SELECT ct.conversation_id, t.id, t.name, t.color
         FROM conversation_tags ct
         JOIN tags t ON ct.tag_id = t.id
         WHERE t.tenant_id = $1`,
        [tenantId]
      )

      const tagsByConvId = tagsRes.rows.reduce((acc: any, row: any) => {
        if (!acc[row.conversation_id]) acc[row.conversation_id] = []
        acc[row.conversation_id].push({ tag: { id: row.id, name: row.name, color: row.color } })
        return acc
      }, {})

      const conversations = result.rows.map(r => ({
        id: r.id,
        workspace_id: r.workspace_id,
        channel_id: r.channel_id,
        contact_id: r.contact_id,
        agent_id: r.agent_id,
        tenant_id: r.tenant_id,
        status: r.status,
        last_message_at: r.last_message_at,
        last_message_preview: r.last_message_preview,
        unread_count: r.unread_count || 0,
        created_at: r.created_at,
        contact: {
          id: r.contact_id,
          name: r.contact_name,
          phone: r.contact_phone,
          notes: r.contact_notes
        },
        agent: r.agent_id ? { id: r.agent_id, name: r.agent_name } : null,
        tags: tagsByConvId[r.id] || []
      }))

      return reply.send(conversations)
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao buscar conversas' })
    }
  })

  // GET /chat/conversations/:id/messages
  fastify.get('/chat/conversations/:id/messages', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tenantId } = request.user!

    try {
      // Validate conversation belongs to tenant
      const convCheck = await pool.query('SELECT id FROM conversations WHERE id = $1 AND tenant_id = $2', [id, tenantId])
      if (convCheck.rows.length === 0) {
        return reply.status(404).send({ error: 'Conversa não encontrada' })
      }

      const result = await pool.query(
        `SELECT id, conversation_id, tenant_id, wa_message_id, direction, type, content, media_url, sender_name, is_internal, created_at, sent_at
         FROM messages 
         WHERE conversation_id = $1 AND tenant_id = $2
         ORDER BY created_at ASC`,
        [id, tenantId]
      )

      return reply.send(result.rows)
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao buscar mensagens' })
    }
  })

  // PATCH /chat/conversations/:id/read
  fastify.patch('/chat/conversations/:id/read', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tenantId } = request.user!

    try {
      const result = await pool.query(
        'UPDATE conversations SET unread_count = 0 WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [id, tenantId]
      )
      if (result.rowCount === 0) return reply.status(404).send({ error: 'Conversa não encontrada' })
      return reply.send({ success: true })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao marcar conversa como lida' })
    }
  })

  // PATCH /chat/conversations/:id/status
  fastify.patch('/chat/conversations/:id/status', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status } = request.body as { status: string }
    const { tenantId } = request.user!

    try {
      const result = await pool.query(
        'UPDATE conversations SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING id',
        [status, id, tenantId]
      )
      if (result.rowCount === 0) return reply.status(404).send({ error: 'Conversa não encontrada' })
      return reply.send({ success: true })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao atualizar status da conversa' })
    }
  })

  // POST /chat/assign
  fastify.post('/chat/assign', { preHandler: [authenticate] }, async (request, reply) => {
    const { conversationId, agentId } = request.body as { conversationId: string, agentId: string | null }
    const { tenantId } = request.user!

    try {
      // Assign or Unassign
      const result = await pool.query(
        'UPDATE conversations SET agent_id = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING id',
        [agentId, conversationId, tenantId]
      )
      if (result.rowCount === 0) return reply.status(404).send({ error: 'Conversa não encontrada' })
      return reply.send({ success: true })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao atribuir agente' })
    }
  })

  // POST /chat/conversations/:id/tags
  fastify.post('/chat/conversations/:id/tags', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tenantId } = request.user!
    const { tagIds } = request.body as { tagIds: string[] }

    try {
      // 1. Verify conversation belongs to tenant
      const convCheck = await pool.query('SELECT id FROM conversations WHERE id = $1 AND tenant_id = $2', [id, tenantId])
      if (convCheck.rows.length === 0) {
        return reply.status(404).send({ error: 'Conversa não encontrada' })
      }

      // 2. Delete existing tags
      await pool.query('DELETE FROM conversation_tags WHERE conversation_id = $1', [id])

      // 3. Insert new tags
      if (tagIds && tagIds.length > 0) {
        // Build values for batch insert
        const values = tagIds.map((_, i) => `($1, $${i + 2})`).join(', ')
        const params = [id, ...tagIds]
        await pool.query(`INSERT INTO conversation_tags (conversation_id, tag_id) VALUES ${values}`, params)
      }

      return reply.send({ success: true })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao atualizar tags da conversa' })
    }
  })

  // POST /chat/messages
  fastify.post('/chat/messages', { preHandler: [authenticate] }, async (request, reply) => {
    const { conversation_id, message, is_internal } = request.body as any
    const { tenantId, agentId } = request.user!

    try {
      // Validate conversation belongs to tenant
      const convCheck = await pool.query('SELECT id, contact_id FROM conversations WHERE id = $1 AND tenant_id = $2', [conversation_id, tenantId])
      if (convCheck.rows.length === 0) {
        return reply.status(404).send({ error: 'Conversa não encontrada' })
      }

      // Get agent name
      const agentRes = await pool.query('SELECT name FROM agents WHERE id = $1', [agentId])
      const senderName = agentRes.rows[0]?.name || 'Agent'

      // Insert message
      const msgResult = await pool.query(
        `INSERT INTO messages (conversation_id, tenant_id, direction, type, content, sender_name, is_internal)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [conversation_id, tenantId, 'outbound', 'text', message, senderName, !!is_internal]
      )

      const newMessage = msgResult.rows[0]

      // Update conversation last_message
      await pool.query(
        `UPDATE conversations 
         SET last_message_preview = $1, last_message_at = NOW(), updated_at = NOW() 
         WHERE id = $2`,
        [message, conversation_id]
      )

      return reply.send(newMessage)
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao enviar mensagem' })
    }
  })
}
