import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { pool } from '../config/db'

export async function quickRepliesRoutes(fastify: FastifyInstance) {
  // GET /workspace/:id/quick-replies
  fastify.get('/workspace/:id/quick-replies', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tenantId } = request.user!

    if (id !== tenantId) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }

    try {
      const result = await pool.query(
        'SELECT id, shortcut, content FROM quick_replies WHERE tenant_id = $1 ORDER BY shortcut ASC',
        [tenantId]
      )
      return reply.send(result.rows)
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao buscar respostas rápidas' })
    }
  })

  // POST /workspace/:id/quick-replies
  fastify.post('/workspace/:id/quick-replies', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tenantId } = request.user!

    if (id !== tenantId) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }

    const { shortcut, content } = request.body as { shortcut: string, content: string }

    if (!shortcut || !content) {
      return reply.status(400).send({ error: 'Atalho e conteúdo são obrigatórios' })
    }

    try {
      const result = await pool.query(
        'INSERT INTO quick_replies (tenant_id, shortcut, content) VALUES ($1, $2, $3) RETURNING id, shortcut, content',
        [tenantId, shortcut, content]
      )
      return reply.status(201).send(result.rows[0])
    } catch (error: any) {
      request.log.error(error)
      if (error.code === '23505') { // unique_violation
        return reply.status(400).send({ error: 'Atalho já existe' })
      }
      return reply.status(500).send({ error: 'Erro ao criar resposta rápida' })
    }
  })

  // PATCH /workspace/:id/quick-replies/:replyId
  fastify.patch('/workspace/:id/quick-replies/:replyId', { preHandler: [authenticate] }, async (request, reply) => {
    const { id, replyId } = request.params as { id: string, replyId: string }
    const { tenantId } = request.user!

    if (id !== tenantId) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }

    const { shortcut, content } = request.body as { shortcut: string, content: string }

    try {
      const result = await pool.query(
        'UPDATE quick_replies SET shortcut = COALESCE($1, shortcut), content = COALESCE($2, content) WHERE id = $3 AND tenant_id = $4 RETURNING id, shortcut, content',
        [shortcut, content, replyId, tenantId]
      )

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Resposta rápida não encontrada' })
      }

      return reply.send(result.rows[0])
    } catch (error: any) {
      request.log.error(error)
      if (error.code === '23505') { // unique_violation
        return reply.status(400).send({ error: 'Atalho já existe' })
      }
      return reply.status(500).send({ error: 'Erro ao atualizar resposta rápida' })
    }
  })

  // DELETE /workspace/:id/quick-replies/:replyId
  fastify.delete('/workspace/:id/quick-replies/:replyId', { preHandler: [authenticate] }, async (request, reply) => {
    const { id, replyId } = request.params as { id: string, replyId: string }
    const { tenantId } = request.user!

    if (id !== tenantId) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }

    try {
      const result = await pool.query(
        'DELETE FROM quick_replies WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [replyId, tenantId]
      )

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Resposta rápida não encontrada' })
      }

      return reply.send({ success: true })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao deletar resposta rápida' })
    }
  })
}
