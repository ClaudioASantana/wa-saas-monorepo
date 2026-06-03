import { FastifyInstance } from 'fastify'
import { webhookMetrics } from './webhook'

export async function metricsRoute(app: FastifyInstance) {
  app.get('/metrics', async () => {
    return {
      webhooks: webhookMetrics
    }
  })
}
