import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { pool } from '../config/db'

export async function workspaceRoutes(fastify: FastifyInstance) {
  // GET /workspace/:id
  fastify.get('/workspace/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tenantId } = request.user!

    if (id !== tenantId) {
      return reply.status(403).send({ error: 'Acesso negado ao workspace' })
    }

    try {
      const result = await pool.query(
        'SELECT id, name, slug, plan, status as subscription_status FROM tenants WHERE id = $1',
        [tenantId]
      )

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Workspace não encontrado' })
      }

      return reply.send(result.rows[0])
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao buscar dados do workspace' })
    }
  })

  // GET /workspace/:id/dashboard
  fastify.get('/workspace/:id/dashboard', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tenantId } = request.user!

    if (id !== tenantId) {
      return reply.status(403).send({ error: 'Acesso negado ao workspace' })
    }

    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayStartISO = todayStart.toISOString()

      // 1. Open conversations
      const openRes = await pool.query(
        'SELECT count(id) as count FROM conversations WHERE tenant_id = $1 AND status = $2',
        [tenantId, 'open']
      )

      // 2. Messages today
      const todayMsgRes = await pool.query(
        'SELECT count(id) as count FROM messages WHERE tenant_id = $1 AND created_at >= $2',
        [tenantId, todayStartISO]
      )

      // 3. Total contacts
      const contactsRes = await pool.query(
        'SELECT count(id) as count FROM contacts WHERE tenant_id = $1',
        [tenantId]
      )

      // 4. Resolved today
      const resolvedRes = await pool.query(
        'SELECT count(id) as count FROM conversations WHERE tenant_id = $1 AND status = $2 AND updated_at >= $3',
        [tenantId, 'resolved', todayStartISO]
      )

      // 5. Recent conversations (limit 5)
      const recentRes = await pool.query(
        `SELECT 
          c.id, c.status, c.updated_at as last_message_at, 
          m.content as last_message_preview,
          co.name as contact_name, co.phone as contact_phone
         FROM conversations c
         LEFT JOIN contacts co ON c.contact_id = co.id
         LEFT JOIN LATERAL (
           SELECT content FROM messages WHERE conversation_id = c.id ORDER BY sent_at DESC LIMIT 1
         ) m ON true
         WHERE c.tenant_id = $1
         ORDER BY c.updated_at DESC
         LIMIT 5`,
        [tenantId]
      )

      const recentConversations = recentRes.rows.map(r => ({
        id: r.id,
        status: r.status,
        last_message_at: r.last_message_at,
        last_message_preview: r.last_message_preview,
        contact: {
          name: r.contact_name,
          phone: r.contact_phone
        }
      }))

      return reply.send({
        metrics: {
          openConversations: parseInt(openRes.rows[0].count),
          messagesToday: parseInt(todayMsgRes.rows[0].count),
          totalContacts: parseInt(contactsRes.rows[0].count),
          resolvedToday: parseInt(resolvedRes.rows[0].count)
        },
        recentConversations
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao buscar métricas do dashboard' })
    }
  })

  // GET /workspace/:id/channels-status
  fastify.get('/workspace/:id/channels-status', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tenantId } = request.user!

    if (id !== tenantId) {
      return reply.status(403).send({ error: 'Acesso negado ao workspace' })
    }

    try {
      const result = await pool.query('SELECT count(*) FROM channels WHERE workspace_id = $1', [tenantId])
      const hasConnectedChannel = parseInt(result.rows[0].count) > 0
      return reply.send({ hasConnectedChannel }) 
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao buscar status dos canais' })
    }
  })

  // GET /workspace/:id/tags
  fastify.get('/workspace/:id/tags', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tenantId } = request.user!

    if (id !== tenantId) {
      return reply.status(403).send({ error: 'Acesso negado ao workspace' })
    }

    try {
      const result = await pool.query('SELECT id, name, color FROM tags WHERE tenant_id = $1 ORDER BY name ASC', [tenantId])
      return reply.send(result.rows)
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao buscar tags' })
    }
  })

  // POST /workspace/:id/tags
  fastify.post('/workspace/:id/tags', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tenantId } = request.user!

    if (id !== tenantId) {
      return reply.status(403).send({ error: 'Acesso negado ao workspace' })
    }

    const { name, color } = request.body as { name: string, color: string }

    if (!name || !color) {
      return reply.status(400).send({ error: 'Nome e cor são obrigatórios' })
    }

    try {
      const result = await pool.query(
        'INSERT INTO tags (tenant_id, name, color) VALUES ($1, $2, $3) RETURNING id, name, color',
        [tenantId, name, color]
      )
      return reply.status(201).send(result.rows[0])
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao criar tag' })
    }
  })

  // PATCH /workspace/:id/tags/:tagId
  fastify.patch('/workspace/:id/tags/:tagId', { preHandler: [authenticate] }, async (request, reply) => {
    const { id, tagId } = request.params as { id: string, tagId: string }
    const { tenantId } = request.user!

    if (id !== tenantId) {
      return reply.status(403).send({ error: 'Acesso negado ao workspace' })
    }

    const { name, color } = request.body as { name: string, color: string }

    try {
      const result = await pool.query(
        'UPDATE tags SET name = COALESCE($1, name), color = COALESCE($2, color) WHERE id = $3 AND tenant_id = $4 RETURNING id, name, color',
        [name, color, tagId, tenantId]
      )

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Tag não encontrada' })
      }

      return reply.send(result.rows[0])
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao atualizar tag' })
    }
  })

  // DELETE /workspace/:id/tags/:tagId
  fastify.delete('/workspace/:id/tags/:tagId', { preHandler: [authenticate] }, async (request, reply) => {
    const { id, tagId } = request.params as { id: string, tagId: string }
    const { tenantId } = request.user!

    if (id !== tenantId) {
      return reply.status(403).send({ error: 'Acesso negado ao workspace' })
    }

    try {
      const result = await pool.query(
        'DELETE FROM tags WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [tagId, tenantId]
      )

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Tag não encontrada' })
      }

      return reply.send({ success: true })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao deletar tag' })
    }
  })

  // GET /workspace/:id/templates
  fastify.get('/workspace/:id/templates', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tenantId } = request.user!

    if (id !== tenantId) {
      return reply.status(403).send({ error: 'Acesso negado ao workspace' })
    }

    try {
      // Retorna uma lista vazia de templates por enquanto, até integrar com a Engine do WhatsApp
      return reply.send([])
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao carregar templates' })
    }
  })

  // POST /workspace/:id/templates/sync
  fastify.post('/workspace/:id/templates/sync', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tenantId } = request.user!

    if (id !== tenantId) {
      return reply.status(403).send({ error: 'Acesso negado ao workspace' })
    }

    try {
      // Simula sincronização bem-sucedida
      return reply.send({ success: true })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao sincronizar templates' })
    }
  })
}
