import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { pool } from '../config/db'

export async function agentsRoutes(fastify: FastifyInstance) {
  // PUT /agents/me
  // Atualiza os dados do agente (usuário) atual (ex: nome)
  fastify.put('/agents/me', { preHandler: [authenticate] }, async (request, reply) => {
    const { agentId } = request.user!

    const { full_name } = request.body as { full_name?: string }
    if (!full_name) {
      return reply.status(400).send({ error: 'Nome completo é obrigatório' })
    }

    try {
      const result = await pool.query(
        'UPDATE agents SET full_name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, full_name, avatar_url, role',
        [full_name, agentId]
      )
      return reply.send(result.rows[0])
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao atualizar dados do usuário' })
    }
  })
}
