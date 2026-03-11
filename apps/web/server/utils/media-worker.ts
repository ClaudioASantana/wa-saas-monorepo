import { Worker } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { redis } from './redis'
import { logger } from './logger'

const config = useRuntimeConfig()

export const mediaWorker = new Worker('media-uploads', async (job) => {
  const { tenantId, messageId, mediaId, mimeType, evolutionInstanceId } = job.data
  
  logger.info({ msg: 'Processing media job', messageId, mediaId, tenantId })

  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  try {
    // 1. Mark as processing
    await supabase.from('media_files').update({ status: 'processing' }).eq('message_id', messageId)

    // 2. Obtain media from Evolution API
    // Note: Evolution API provides a direct download endpoint or base64. 
    // In Story 0.5, we assume we need to fetch it from Evolution service.
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
    const EVOLUTION_GLOBAL_API_KEY = process.env.EVOLUTION_GLOBAL_API_KEY || 'B6D711FCDE4D4FD5936544120E713976'

    // First, get the media URL or base64 from Evolution
    // Evolution API v2: GET /instance/fetchMedia/{{instanceName}}?fileName={{fileName}}&group={{group}}
    // Actually, Evolution usually delivers the base64 in the webhook if "Always Send Media Base64" is on.
    // If we only have mediaId, we might need a specific Evolution endpoint.
    
    // For this implementation, we assume the job DATA contains the base64 or we fetch it.
    // Let's assume we fetch it to keep the webhook light.
    
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

    logger.info({ msg: 'Media processed successfully', messageId, publicUrl })
    return { success: true, url: publicUrl }

  } catch (err: any) {
    logger.error({ msg: 'Media worker failed', error: err.message, messageId })
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

mediaWorker.on('completed', (job) => {
  logger.info({ msg: 'Job completed', id: job.id })
})

mediaWorker.on('failed', (job, err) => {
  logger.error({ msg: 'Job failed', id: job?.id, error: err.message })
})
