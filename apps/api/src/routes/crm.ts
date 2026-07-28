import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { pool } from '../config/db'

export async function crmRoutes(fastify: FastifyInstance) {
  // GET /crm/funnels
  fastify.get('/crm/funnels', { preHandler: [authenticate] }, async (request, reply) => {
    const { workspaceId } = request.query as { workspaceId: string }
    const { tenantId } = request.user!

    if (workspaceId !== tenantId) return reply.status(403).send({ error: 'Acesso negado' })

    try {
      const result = await pool.query('SELECT * FROM crm_funnels WHERE tenant_id = $1 ORDER BY created_at ASC', [tenantId])
      return reply.send(result.rows)
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao buscar funis' })
    }
  })

  // POST /crm/funnels
  fastify.post('/crm/funnels', { preHandler: [authenticate] }, async (request, reply) => {
    const { workspace_id, name } = request.body as any
    const { tenantId } = request.user!

    if (workspace_id !== tenantId) return reply.status(403).send({ error: 'Acesso negado' })

    try {
      const funnelRes = await pool.query(
        'INSERT INTO crm_funnels (tenant_id, name) VALUES ($1, $2) RETURNING *',
        [tenantId, name]
      )
      const funnel = funnelRes.rows[0]

      // Default stages
      const stages = [
        { name: 'Lead', color: 'gray', position: 0 },
        { name: 'Em Contato', color: 'blue', position: 1 },
        { name: 'Proposta Enviada', color: 'yellow', position: 2 },
        { name: 'Negociação', color: 'orange', position: 3 },
        { name: 'Ganho', color: 'green', position: 4 },
        { name: 'Perdido', color: 'red', position: 5 }
      ]

      for (const stage of stages) {
        await pool.query(
          'INSERT INTO crm_stages (tenant_id, funnel_id, name, color, position) VALUES ($1, $2, $3, $4, $5)',
          [tenantId, funnel.id, stage.name, stage.color, stage.position]
        )
      }

      return reply.send(funnel)
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao criar funil' })
    }
  })

  // GET /crm/funnels/:funnelId/stages
  fastify.get('/crm/funnels/:funnelId/stages', { preHandler: [authenticate] }, async (request, reply) => {
    const { funnelId } = request.params as { funnelId: string }
    const { tenantId } = request.user!

    try {
      const stagesRes = await pool.query(
        'SELECT * FROM crm_stages WHERE funnel_id = $1 AND tenant_id = $2 ORDER BY position ASC',
        [funnelId, tenantId]
      )
      const stages = stagesRes.rows

      for (const stage of stages) {
        const cardsRes = await pool.query(
          `SELECT 
            c.id, c.position, c.conversation_id, c.tenant_id,
            co.contact_id, co.last_message_at, co.last_message_preview, co.unread_count,
            cnt.name as contact_name, cnt.phone as contact_phone
           FROM crm_cards c
           JOIN conversations co ON c.conversation_id = co.id
           JOIN contacts cnt ON co.contact_id = cnt.id
           WHERE c.stage_id = $1 AND c.tenant_id = $2
           ORDER BY c.position ASC`,
          [stage.id, tenantId]
        )
        
        stage.crm_cards = cardsRes.rows.map(row => ({
          id: row.id,
          position: row.position,
          conversation_id: row.conversation_id,
          conversation: {
            id: row.conversation_id,
            contact_id: row.contact_id,
            last_message_at: row.last_message_at,
            last_message_preview: row.last_message_preview,
            unread_count: row.unread_count || 0,
            contact: {
              name: row.contact_name,
              phone: row.contact_phone
            }
          }
        }))
      }

      return reply.send(stages)
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao buscar stages' })
    }
  })

  // POST /crm/cards
  fastify.post('/crm/cards', { preHandler: [authenticate] }, async (request, reply) => {
    const { stage_id, conversation_id, tenant_id } = request.body as any
    const { tenantId } = request.user!

    if (tenant_id !== tenantId) return reply.status(403).send({ error: 'Acesso negado' })

    try {
      // get max position
      const posRes = await pool.query('SELECT MAX(position) as max_pos FROM crm_cards WHERE stage_id = $1', [stage_id])
      const pos = (posRes.rows[0].max_pos || 0) + 1024

      const result = await pool.query(
        'INSERT INTO crm_cards (tenant_id, stage_id, conversation_id, position) VALUES ($1, $2, $3, $4) RETURNING *',
        [tenantId, stage_id, conversation_id, pos]
      )
      return reply.send(result.rows[0])
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao criar card' })
    }
  })

  // PATCH /crm/cards/:id
  fastify.patch('/crm/cards/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { stage_id, position } = request.body as any
    const { tenantId } = request.user!

    try {
      const result = await pool.query(
        'UPDATE crm_cards SET stage_id = $1, position = $2, updated_at = NOW() WHERE id = $3 AND tenant_id = $4 RETURNING *',
        [stage_id, position, id, tenantId]
      )
      if (result.rowCount === 0) return reply.status(404).send({ error: 'Card não encontrado' })
      return reply.send(result.rows[0])
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao atualizar card' })
    }
  })

  // DELETE /crm/cards/:id
  fastify.delete('/crm/cards/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tenantId } = request.user!

    try {
      const result = await pool.query('DELETE FROM crm_cards WHERE id = $1 AND tenant_id = $2 RETURNING id', [id, tenantId])
      if (result.rowCount === 0) return reply.status(404).send({ error: 'Card não encontrado' })
      return reply.send({ success: true })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao deletar card' })
    }
  })
}
