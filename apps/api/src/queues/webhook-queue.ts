import { Queue, Worker } from 'bullmq'
import { redis } from '../config/redis'

export const webhookQueue = new Queue('webhooks', { connection: redis })

export const webhookWorker = new Worker('webhooks', async (job) => {
  console.log(`[Worker] Processando webhook job ${job.id}`)
  
  // TODO: Implementar processamento do webhook
  // await processWebhookPayload(job.data)
  
  console.log(`[Worker] Webhook job ${job.id} processado com sucesso.`)
}, {
  connection: redis,
  concurrency: 10,
})

webhookWorker.on('failed', (job, err) => {
  console.error(`[Worker] Webhook job ${job?.id} falhou:`, err)
})
