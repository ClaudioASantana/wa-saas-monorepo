import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { redis } from './redis'
import { logger } from './logger'
import { emitToTenant } from './socket'

export function createMediaWorker(
  supabaseUrl: string,
  supabaseServiceKey: string,
  evolutionApiUrl: string,
  evolutionApiKey: string
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const worker = new Worker(
    'media-uploads',
    async (job: Job) => {
      const { tenantId, messageId, mediaId, mimeType, evolutionInstanceId } = job.data
      
      logger.info({ messageId, tenantId }, '[MediaWorker] Processing media')

      try {
        // 1. Get media from Evolution API (using passed parameters)
        if (!evolutionApiUrl || !evolutionApiKey) {
          throw new Error('Evolution API credentials missing')
        }

        const response = await fetch(`${evolutionApiUrl}/chat/getBase64FromMediaMessage/${evolutionInstanceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey
          },
          body: JSON.stringify({
            message: {
              key: { id: messageId },
              url: mediaId,
              mimetype: mimeType
            }
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch media from Evolution: ${response.statusText}`)
        }

        const result: any = await response.json()
        const base64Data = result.base64 || result.data?.base64
        
        if (!base64Data) {
          throw new Error('No base64 data received from Evolution')
        }

        const buffer = Buffer.from(base64Data, 'base64')

        // 2. Upload to Supabase Storage
        const fileExt = mimeType.split('/')[1] || 'bin'
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const fileName = `${tenantId}/${year}/${month}/${messageId}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: true
          })

        if (uploadError) throw uploadError

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('chat-media')
          .getPublicUrl(fileName)

        // 4. Update Message & Notify via ChatService
        const { data: message } = await supabase
          .from('messages')
          .update({ media_url: publicUrl, status: 'delivered' })
          .eq('wa_message_id', messageId)
          .select('id, conversation_id')
          .single()

        if (message) {
          emitToTenant(tenantId, 'message:update', {
            messageId: messageId,
            mediaUrl: publicUrl,
            status: 'delivered'
          })
        }

        // 5. Update media_files record
        await supabase.from('media_files')
          .update({ status: 'completed', storage_path: fileName })
          .eq('message_id', messageId)

        return { status: 'success', url: publicUrl }
      } catch (error: any) {
        logger.error({ error: error.message || error, messageId }, '[MediaWorker] Error processing media')
        await supabase.from('media_files').update({ status: 'failed' }).eq('message_id', messageId)
        throw error
      }
    },
    { connection: redis as any, concurrency: 2 }
  )

  worker.on('failed', (job, err) => {
    logger.error({ id: job?.id, error: err.message }, '[MediaWorker] Worker error')
  })

  return worker
}
