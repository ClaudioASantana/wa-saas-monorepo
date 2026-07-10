import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { randomUUID } from 'crypto'
import { logger } from '../config/logger'
import { utcNow } from '../utils/time'
import fp from 'fastify-plugin'

const requestLoggerPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onRequest', async (req) => {
    // Sobrescreve o ID default se necessário ou usa UUID v4
    req.id = randomUUID()
    ;(req as unknown as Record<string, number>).startTime = utcNow().getTime()
  })

  app.addHook('onResponse', async (req, reply) => {
    const start = (req as unknown as Record<string, number>).startTime || utcNow().getTime()
    const duration_ms = utcNow().getTime() - start

    const tenant_id = (req as unknown as Record<string, string>).tenantId || (req.headers['x-tenant-id'] as string) || 'anonymous'

    logger.info({
      request_id: req.id,
      tenant_id,
      method: req.method,
      path: req.url,
      status: reply.statusCode,
      duration_ms,
      time: utcNow().toISOString(),
    }, 'Request completed')
  })

  app.addHook('onError', async (req, reply, error) => {
    logger.error({
      request_id: req.id,
      error_message: error.message,
      error_stack: error.stack,
    }, 'Error processing request')
  })
}

export default fp(requestLoggerPlugin)
