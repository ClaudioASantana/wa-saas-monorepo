import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { pool } from '../config/db'

export async function conversationsRoutes(fastify: FastifyInstance) {
  // GET /conversations
  fastify.get('/conversations', { preHandler: [authenticate] }, async (request, reply) => {
    const { tenant_id, status, limit = 100 } = request.query as any
    const { tenantId: userTenantId } = request.user!

    if (tenant_id !== userTenantId) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }

    try {
      let query = `
        SELECT c.id, c.tenant_id, co.name, co.phone 
        FROM conversations c 
        LEFT JOIN contacts co ON c.contact_id = co.id 
        WHERE c.tenant_id = $1
      `
      const params: any[] = [tenant_id]

      if (status) {
        params.push(status)
        query += ` AND c.status = $${params.length}`
      }

      query += ` ORDER BY c.updated_at DESC LIMIT $${params.length + 1}`
      params.push(limit)

      const result = await pool.query(query, params)

      const mapped = result.rows.map(r => ({
        id: r.id,
        tenant_id: r.tenant_id,
        contact: { name: r.name, phone: r.phone }
      }))

      return reply.send(mapped)
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao buscar conversas' })
    }
  })
}
