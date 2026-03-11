import { Worker } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { redis } from './redis'
import { logger } from './logger'
import { emitToTenant } from './socket'

/**
 * Worker to process media uploads from Evolution API to Supabase Storage.
 */
export function createMediaWorker(supabaseUrl: string, supabaseServiceKey: string) {
  const worker = new Worker('media-uploads', async (job) => {
    const { tenantId, messageId, mediaId, mimeType, evolutionInstanceId } = job.data
    
    logger.info({ messageId, mediaId, tenantId }, '[MediaWorker] Processing job')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
      // 1. Mark as processing
      await supabase.from('media_files').update({ status: 'processing' }).eq('message_id', messageId)

      // 2. Obtain media from Evolution API
      const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
      const EVOLUTION_GLOBAL_API_KEY = process.env.EVOLUTION_GLOBAL_API_KEY || 'B6D711FCDE4D4FD5936544120E713976'
      
      const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchMedia/${evolutionInstanceId}?mediaId=${mediaId}`, {
        headers: { 'apikey': EVOLUTION_GLOBAL_API_KEY }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch media from Evolution: ${response.statusText}`)
      }

      const blob = await response.blob()
      const buffer = Buffer.from(await blob.arrayBuffer())

      // 3. Upload to Supabase Storage
      const fileName = `${tenantId}/${messageId}.${mimeType.split('/')[1] || 'bin'}`
      
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, buffer, { contentType: mimeType, upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(fileName)

      // 4. Update database
      await supabase.from('media_files').update({ 
        status: 'uploaded', 
        storage_url: publicUrl,
        updated_at: new Date().toISOString()
      }).eq('message_id', messageId)

      // 5. Update the message record with the new URL
      await supabase.from('messages').update({ media_url: publicUrl }).eq('wa_message_id', messageId)

      // 6. Emit Real-time event via Socket.IO
      emitToTenant(tenantId, 'message:update', {
        messageId: messageId,
        mediaUrl: publicUrl,
        status: 'uploaded'
      })

      logger.info({ messageId, publicUrl }, '[MediaWorker] Media processed successfully')
      return { success: true, url: publicUrl }

    } catch (err: any) {
      logger.error({ error: err.message, messageId }, '[MediaWorker] Job failed')
      await supabase.from('media_files').update({ 
        status: 'failed', 
        error: err.message,
        updated_at: new Date().toISOString()
      }).eq('message_id', messageId)
      throw err
    }
  }, {
    connection: redis as any,
    concurrency: 5,
  })

  worker.on('failed', (job, err) => {
    logger.error({ id: job?.id, error: err.message }, '[MediaWorker] Worker error')
  })

  return worker
}
