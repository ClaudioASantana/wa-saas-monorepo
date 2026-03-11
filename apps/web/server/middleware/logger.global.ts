import { logger } from '../utils/logger'

export default defineEventHandler(async (event) => {
  const start = Date.now()
  const requestId = crypto.randomUUID()
  
  // Attach requestId to context if needed by other handlers
  event.context.requestId = requestId

  // Use the hook to log after response is sent
  event.node.res.on('finish', () => {
    const duration = Date.now() - start
    const { method, url } = event.node.req
    const status = event.node.res.statusCode

    logger.info({
      type: 'request',
      request_id: requestId,
      method,
      path: url,
      status,
      duration_ms: duration,
      tenant_id: event.context.tenantId || event.node.req.headers['x-tenant-id'] || null,
    })
  })
})
