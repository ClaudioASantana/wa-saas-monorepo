import Fastify from 'fastify'
import cors from '@fastify/cors'
import { healthRoute } from './routes/health'
import { setupWebSocketServer } from './realtime/websocket-server'

const app = Fastify({ logger: true })

app.register(cors, { origin: true })
app.register(healthRoute)

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
const gracefulShutdown = () => {
  app.log.info('Encerrando servidor gracefully...')
  app.close(() => {
    app.log.info('Servidor Fastify fechado.')
    process.exit(0)
  })
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

start()
