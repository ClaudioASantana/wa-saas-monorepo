import { Queue, Worker } from 'bullmq'
import { redis } from '../config/redis'
import { uploadMediaToS3 } from '../services/media-upload'
import { supabase } from '../config/supabase'
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
  await supabase
    .from('media_files')
    .update({ status: 'processing', attempts: job.attemptsMade + 1, updated_at: new Date().toISOString() })
    .eq('id', mediaFileId)

  try {
    // 1. Fazer upload pro S3/LocalStack via Stream
    const storageUrl = await uploadMediaToS3({ tenantId, messageId, mediaId, mimeType })

    // 2. Atualizar banco de dados para uploaded
    const { error } = await supabase
      .from('media_files')
      .update({ 
        status: 'uploaded', 
        storage_url: storageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', mediaFileId)

    if (error) {
      throw new Error(`Failed to update media status in DB: ${error.message}`)
    }

    // 3. Notificar Frontend via WebSocket
    emitToTenant(tenantId, 'message:media_ready', {
      messageId,
      mediaFileId,
      storageUrl,
      mimeType
    })

    console.log(`[MediaWorker] Upload concluído: ${storageUrl}`)

  } catch (err: any) {
    // Em caso de falha, registrar no DB e jogar exceção para retry do BullMQ
    await supabase
      .from('media_files')
      .update({ 
        status: 'failed', 
        error: err.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', mediaFileId)

    throw err
  }

}, {
  connection: redis,
  concurrency: 3,
})

mediaWorker.on('failed', (job, err) => {
  console.error(`[MediaWorker] Job ${job?.id} falhou na tentativa ${job?.attemptsMade}:`, err.message)
})
