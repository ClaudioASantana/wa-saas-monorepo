import Fastify from 'fastify'
import cors from '@fastify/cors'
import { healthRoute } from './routes/health'

const app = Fastify({ logger: true })

app.register(cors, { origin: true })
app.register(healthRoute)

const start = async () => {
  try {
    const port = parseInt(process.env.API_PORT ?? '4000', 10)
    await app.listen({ port, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
