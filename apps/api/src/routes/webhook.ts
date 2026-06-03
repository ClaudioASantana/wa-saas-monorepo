import { FastifyInstance } from 'fastify'
import { createHmac } from 'crypto'
import { isWebhookDuplicate } from '../services/webhook-idempotency'
import { webhookQueue } from '../queues/webhook-queue'

// Métricas temporárias na memória (em produção usaria um store prometheus ou redis)
export const webhookMetrics = {
  processed: 0,
  discarded: 0
}

export async function webhookRoutes(app: FastifyInstance) {
  app.post('/webhook/whatsapp', async (req, reply) => {
    // 1. Verificar assinatura Meta (HMAC-SHA256)
    const signature = req.headers['x-hub-signature-256']
    
    const secret = process.env.META_APP_SECRET || 'test_secret'
    const expected = 'sha256=' + createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex')
      
    // Verifica a assinatura apenas se não estivermos num ambiente de dev sem secret configurado
    if (process.env.NODE_ENV !== 'development' && signature !== expected) {
      app.log.warn('Webhook com assinatura inválida')
      return reply.status(401).send({ error: 'Invalid webhook signature' })
    }

    // 2. Checar idempotencia ANTES de enfileirar
    const isDuplicate = await isWebhookDuplicate(req.body as object)
    if (isDuplicate) {
      webhookMetrics.discarded++
      return reply.status(200).send({ status: 'duplicate_discarded' })
    }

    webhookMetrics.processed++

    // 3. Enfileirar para processamento assíncrono
    await webhookQueue.add('process-webhook', req.body)

    return reply.status(200).send({ status: 'queued' })
  })
}
