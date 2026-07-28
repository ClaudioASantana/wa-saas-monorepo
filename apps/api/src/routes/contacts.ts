import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { pool } from '../config/db'

export async function contactsRoutes(fastify: FastifyInstance) {
  // GET /contacts
  fastify.get('/contacts', { preHandler: [authenticate] }, async (request, reply) => {
    const { tenant_id, page = 1, limit = 50 } = request.query as { tenant_id: string, page?: number, limit?: number }
    const { tenantId: userTenantId } = request.user!

    if (tenant_id !== userTenantId) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }

    const offset = (page - 1) * limit

    try {
      // 1. Get count
      const countRes = await pool.query('SELECT count(*) FROM contacts WHERE tenant_id = $1', [tenant_id])
      const total = parseInt(countRes.rows[0].count)

      // 2. Get rows with last conversation
      const result = await pool.query(
        `SELECT 
          c.id, c.name, c.phone, 
          COALESCE(c.metadata->>'notes', '') as notes,
          COALESCE((c.metadata->>'is_active')::boolean, true) as is_active,
          c.updated_at,
          (
            SELECT updated_at 
            FROM conversations 
            WHERE contact_id = c.id 
            ORDER BY updated_at DESC 
            LIMIT 1
          ) as last_conversation_at
         FROM contacts c
         WHERE c.tenant_id = $1
         ORDER BY c.updated_at DESC
         LIMIT $2 OFFSET $3`,
        [tenant_id, limit, offset]
      )

      return reply.send({
        rows: result.rows,
        count: total
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao buscar contatos' })
    }
  })

  // PATCH /contacts/:id
  fastify.patch('/contacts/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { name, phone, notes, is_active } = request.body as any
    const { tenantId } = request.user!

    try {
      // Fetch current metadata to avoid overwriting other keys
      const currentRes = await pool.query('SELECT metadata FROM contacts WHERE id = $1 AND tenant_id = $2', [id, tenantId])
      if (currentRes.rowCount === 0) {
        return reply.status(404).send({ error: 'Contato não encontrado' })
      }
      
      const currentMetadata = currentRes.rows[0].metadata || {}
      const newMetadata = { ...currentMetadata, notes, is_active }

      const result = await pool.query(
        `UPDATE contacts 
         SET name = $1, phone = $2, metadata = $3 
         WHERE id = $4 AND tenant_id = $5
         RETURNING 
          id, name, phone, 
          COALESCE(metadata->>'notes', '') as notes,
          COALESCE((metadata->>'is_active')::boolean, true) as is_active,
          updated_at`,
        [name, phone, newMetadata, id, tenantId]
      )
      
      return reply.send(result.rows[0])
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao atualizar contato' })
    }
  })
}
