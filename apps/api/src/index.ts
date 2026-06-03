import Fastify from 'fastify'
import cors from '@fastify/cors'
import { healthRoute } from './routes/health'
import { webhookRoutes } from './routes/webhook'
import { metricsRoute } from './routes/metrics'
import { setupWebSocketServer } from './realtime/websocket-server'
import { logger } from './config/logger'
import requestLoggerPlugin from './middleware/request-logger'

const app = Fastify({ 
  logger: logger,
  disableRequestLogging: true // Disables Fastify's default request logging because we do it ourselves
})

app.register(cors, { origin: true })
app.register(requestLoggerPlugin)
app.register(healthRoute)
app.register(webhookRoutes)
app.register(metricsRoute)

const start = async () => {
  try {
    const port = parseInt(process.env.API_PORT ?? '4000', 10)
    
    await app.ready()
    setupWebSocketServer(app.server)

    await app.listen({ port, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

// Graceful shutdown
const gracefulShutdown = async () => {
  app.log.info('Encerrando servidor gracefully...')
  try {
    const { redis } = await import('./config/redis')
    const { webhookWorker } = await import('./queues/webhook-queue')
    const { mediaWorker } = await import('./queues/media-queue')
    
    await Promise.all([webhookWorker.close(), mediaWorker.close()])
    app.log.info('BullMQ workers fechados.')
    
    redis.quit()
    app.log.info('Conexão Redis fechada.')
  } catch (err) {
    app.log.error(err, 'Erro ao fechar dependencias:')
  }

  app.close(() => {
    app.log.info('Servidor Fastify fechado.')
    process.exit(0)
  })
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

start()
