import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { pool } from '../config/db'

export async function channelsRoutes(fastify: FastifyInstance) {
  // GET /channels?workspace_id=...
  fastify.get('/channels', { preHandler: [authenticate] }, async (request, reply) => {
    const { workspace_id } = request.query as { workspace_id: string }
    const { tenantId } = request.user!

    if (workspace_id !== tenantId) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }

    try {
      const result = await pool.query(
        'SELECT id, name, status, phone_number, provider_instance_id, created_at FROM channels WHERE workspace_id = $1 ORDER BY created_at ASC',
        [tenantId]
      )
      return reply.send(result.rows)
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao buscar canais' })
    }
  })

  // POST /channels
  fastify.post('/channels', { preHandler: [authenticate] }, async (request, reply) => {
    const { workspace_id, name, provider_instance_id, provider_token } = request.body as any
    const { tenantId } = request.user!

    if (workspace_id !== tenantId) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }

    if (!name || !provider_instance_id || !provider_token) {
      return reply.status(400).send({ error: 'Nome, instance_id e token são obrigatórios' })
    }

    try {
      const result = await pool.query(
        `INSERT INTO channels (workspace_id, name, provider_instance_id, provider_token, status) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, name, provider_instance_id, provider_token, 'disconnected']
      )
      return reply.send(result.rows[0])
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao criar canal' })
    }
  })

  // DELETE /channels/:id
  fastify.delete('/channels/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tenantId } = request.user!

    try {
      const result = await pool.query('DELETE FROM channels WHERE id = $1 AND workspace_id = $2 RETURNING id', [id, tenantId])
      if (result.rowCount === 0) {
        return reply.status(404).send({ error: 'Canal não encontrado ou sem permissão' })
      }
      return reply.send({ success: true })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao deletar canal' })
    }
  })

  // GET /channels/:id/status
  fastify.get('/channels/:id/status', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tenantId } = request.user!

    try {
      const result = await pool.query('SELECT id, status, provider_instance_id FROM channels WHERE id = $1 AND workspace_id = $2', [id, tenantId])
      if (result.rowCount === 0) {
        return reply.status(404).send({ error: 'Canal não encontrado' })
      }

      const channel = result.rows[0]
      const engineUrl = `${process.env.WHATSAPP_ENGINE_URL || 'http://localhost:3001'}/instances/${channel.provider_instance_id}/status`
      
      let engineStatus = 'disconnected'
      try {
        const engineResponse = await fetch(engineUrl)
        if (engineResponse.ok) {
          const engineData = await engineResponse.json() as { status?: string }
          if (engineData.status) {
            engineStatus = engineData.status
          }
        }
      } catch (error) {
        request.log.warn(`Failed to fetch status from engine for channel ${id}: ${error}`)
      }

      const newStatus = engineStatus === 'connected' ? 'connected' : 'disconnected'
      
      if (channel.status !== newStatus) {
        await pool.query('UPDATE channels SET status = $1 WHERE id = $2', [newStatus, id])
      }

      return reply.send({ status: newStatus })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao checar status' })
    }
  })

  // GET /channels/:id/qrcode
  fastify.get('/channels/:id/qrcode', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tenantId } = request.user!

    try {
      const result = await pool.query('SELECT provider_instance_id FROM channels WHERE id = $1 AND workspace_id = $2', [id, tenantId])
      if (result.rowCount === 0) {
        return reply.status(404).send({ error: 'Canal não encontrado' })
      }

      const channel = result.rows[0]
      const engineUrl = process.env.WHATSAPP_ENGINE_URL || 'http://localhost:3001'
      
      // Start instance
      try {
        await fetch(`${engineUrl}/instances/${channel.provider_instance_id}/start`, { method: 'POST' })
      } catch (err) {
        request.log.error(err)
        return reply.status(502).send({ error: 'Não foi possível conectar ao motor do WhatsApp' })
      }

      // Check status with retry loop since Baileys takes a few seconds to emit QR
      let json: { status: string; qr?: string } = { status: 'disconnected' }
      for (let i = 0; i < 10; i++) {
        // Wait 1 second between checks
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const statusRes = await fetch(`${engineUrl}/instances/${channel.provider_instance_id}/status`).catch(() => null)
        if (statusRes && statusRes.ok) {
          json = await statusRes.json() as { status: string; qr?: string }
          if (json.qr || json.status === 'connected') {
            break;
          }
        }
      }

      if (json.status === 'connected') {
        return reply.status(400).send({ error: 'Este Whatsapp já está conectado' })
      }

      if (!json.qr) {
        return reply.status(202).send({ error: 'Gerando QR Code... Aguarde um instante' })
      }

      await pool.query("UPDATE channels SET status = 'qr_pending' WHERE id = $1", [id])
      
      let qrDataUrl = json.qr;
      if (!qrDataUrl.startsWith('data:')) {
        const qrcode = await import('qrcode');
        qrDataUrl = await qrcode.toDataURL(json.qr);
      }

      return reply.send({ qrcode: qrDataUrl })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Erro ao buscar QR code' })
    }
  })
}
