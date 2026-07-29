import { Queue, Worker } from 'bullmq'
import { redis } from '../config/redis'

import { webhookService } from '../services/webhook.service'

export const webhookQueue = new Queue('webhook-processing', { connection: redis })

export const webhookWorker = new Worker('webhook-processing', async (job) => {
  console.log(`[Worker] Processando webhook job ${job.id}`)
  
  // Call the webhook service
  await webhookService.processEvent(job.data.payload)
  
  console.log(`[Worker] Webhook job ${job.id} processado com sucesso.`)
}, {
  connection: redis,
  concurrency: 10,
})

webhookWorker.on('failed', (job, err) => {
  console.error(`[Worker] Webhook job ${job?.id} falhou:`, err)
})
