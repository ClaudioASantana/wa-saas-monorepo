import { Queue, Worker } from 'bullmq'
import { redis } from '../config/redis'
import { uploadMediaToS3 } from '../services/media-upload'
import { pool } from '../config/db'
import { emitToTenant } from '../realtime/websocket-server'

interface MediaJobData {
  tenantId: string
  messageId: string
  mediaId: string
  mimeType: string
  mediaFileId: string // ID da linha na tabela media_files
}

export const mediaQueue = new Queue<MediaJobData>('media-uploads', { 
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    }
  }
})

export const mediaWorker = new Worker<MediaJobData>('media-uploads', async (job) => {
  const { tenantId, messageId, mediaId, mimeType, mediaFileId } = job.data

  console.log(`[MediaWorker] Processando upload de midia ${mediaId} para messageId: ${messageId}`)
  
  // Atualiza para processing
  await pool.query(
    'UPDATE public.media_files SET status = $1, attempts = $2, updated_at = NOW() WHERE id = $3',
    ['processing', job.attemptsMade + 1, mediaFileId]
  )

  try {
    // 1. Fazer upload pro S3/LocalStack via Stream
    const storageUrl = await uploadMediaToS3({ tenantId, messageId, mediaId, mimeType })

    // 2. Atualizar banco de dados para uploaded
    await pool.query(
      'UPDATE public.media_files SET status = $1, storage_url = $2, updated_at = NOW() WHERE id = $3',
      ['uploaded', storageUrl, mediaFileId]
    )

    // 3. Notificar Frontend via WebSocket
    emitToTenant(tenantId, 'message:media_ready', {
      messageId,
      mediaFileId,
      storageUrl,
      mimeType
    })

    console.log(`[MediaWorker] Upload concluído: ${storageUrl}`)

  } catch (err: unknown) {
    const error = err as Error
    // Em caso de falha, registrar no DB e jogar exceção para retry do BullMQ
    await pool.query(
      'UPDATE public.media_files SET status = $1, error = $2, updated_at = NOW() WHERE id = $3',
      ['failed', error.message, mediaFileId]
    )

    throw error
  }

}, {
  connection: redis,
  concurrency: 3,
})

mediaWorker.on('failed', (job, err) => {
  console.error(`[MediaWorker] Job ${job?.id} falhou na tentativa ${job?.attemptsMade}:`, err.message)
})
