import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { pool } from '../config/db'

export async function tenantRoutes(fastify: FastifyInstance) {
  // GET /tenant/me
  // Retorna os dados do tenant do usuário atual
  fastify.get('/tenant/me', { preHandler: [authenticate] }, async (request, reply) => {
    const { tenantId } = request.user!

    try {
      const result = await pool.query('SELECT id, name, slug, stripe_customer_id, plan FROM tenants WHERE id = $1', [tenantId])
      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Tenant não encontrado' })
      }
      return reply.send(result.rows[0])
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao buscar dados do tenant' })
    }
  })

  // PUT /tenant/me
  // Atualiza os dados do tenant (ex: nome)
  fastify.put('/tenant/me', { preHandler: [authenticate] }, async (request, reply) => {
    const { tenantId, role } = request.user!
    
    // Apenas dono ou admin pode atualizar o tenant
    if (role !== 'owner' && role !== 'admin') {
      return reply.status(403).send({ error: 'Permissão negada' })
    }

    const { name } = request.body as { name?: string }
    if (!name) {
      return reply.status(400).send({ error: 'Nome é obrigatório' })
    }

    try {
      const result = await pool.query(
        'UPDATE tenants SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, slug, stripe_customer_id, plan',
        [name, tenantId]
      )
      return reply.send(result.rows[0])
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao atualizar dados do tenant' })
    }
  })

  // GET /tenant/agents
  // Retorna os agentes do tenant
  fastify.get('/tenant/agents', { preHandler: [authenticate] }, async (request, reply) => {
    const { tenantId } = request.user!

    try {
      const result = await pool.query(
        'SELECT id, email, full_name, avatar_url, role, created_at FROM agents WHERE tenant_id = $1 ORDER BY created_at ASC',
        [tenantId]
      )
      return reply.send(result.rows)
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao buscar agentes' })
    }
  })
}
