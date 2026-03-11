import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { redis } from './redis'
import { logger } from './logger'
import { mediaQueue } from './media-queue'

/**
 * Worker to process consolidated Evolution API webhooks.
 * Implements the core logic previously held in the webhook route.
 */
export function createWebhookWorker(supabaseUrl: string, supabaseServiceKey: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const worker = new Worker(
    'webhook-processing',
    async (job: Job) => {
      const { payload } = job.data
      const { event, instance, data } = payload

      logger.info({ event, instance, jobId: job.id }, '[WebhookWorker] Processing job')

      try {
        // 1. Connection Status Update
        if (event === 'connection.update') {
          await handleConnectionUpdate(supabase, instance, data)
          return { status: 'connection_updated' }
        }

        // 2. Message Upsert
        if (event === 'messages.upsert') {
          await handleMessageUpsert(supabase, instance, data)
          return { status: 'message_processed' }
        }

        logger.debug({ event }, '[WebhookWorker] Skipping unhandled event')
        return { status: 'skipped', reason: 'unhandled_event' }
      } catch (error: any) {
        logger.error({ error, event, jobId: job.id }, '[WebhookWorker] Error processing job')
        throw error // Rethrow for BullMQ retry
      }
    },
    { 
      connection: redis as any,
      concurrency: 5 // Process up to 5 webhooks in parallel per worker instance
    }
  )

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, '[WebhookWorker] Job failed')
  })

  return worker
}

async function handleConnectionUpdate(supabase: any, instanceId: string, data: any) {
  const { state } = data
  const statusMap: Record<string, string> = {
    open: 'connected',
    connecting: 'connecting',
    close: 'disconnected',
  }
  
  const dbStatus = statusMap[state]
  if (!dbStatus) return

  const { data: channel } = await supabase
    .from('channels')
    .select('id')
    .eq('provider_instance_id', instanceId)
    .single()

  if (channel) {
    await supabase.from('channels').update({ status: dbStatus }).eq('id', channel.id)
    logger.debug({ instanceId, status: dbStatus }, '[WebhookWorker] Channel status updated')
  }
}

async function handleMessageUpsert(supabase: any, instanceId: string, messageData: any) {
  // Logic from evolution.post.ts refactored for worker
  if (messageData.key?.remoteJid?.includes('@g.us')) return
  if (messageData.key?.fromMe) return

  const messageId = messageData.key?.id
  const remoteJid = messageData.key?.remoteJid ?? ''
  const phone = remoteJid.includes('@lid') ? remoteJid : remoteJid.replace('@s.whatsapp.net', '')
  const senderName = messageData.pushName ?? (phone.includes('@') ? phone.split('@')[0] : phone)

  if (!phone) throw new Error('Missing phone in message data')

  // 1. Fetch Channel & Workspace
  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .select('id, workspace_id, workspaces!inner(tenant_id)')
    .eq('provider_instance_id', instanceId)
    .single()

  if (channelError || !channel) {
    throw new Error(`Channel not found for instance ${instanceId}`)
  }

  const wsData = channel.workspaces as any
  const tenantId = wsData?.tenant_id
  if (!tenantId) throw new Error(`Tenant not found for channel ${instanceId}`)

  // 2. Upsert Contact
  let contactId: string | null = null
  if (remoteJid.includes('@lid')) {
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('workspace_id', channel.workspace_id)
      .eq('name', senderName)
      .not('phone', 'ilike', '%@lid')
      .limit(1)
      .maybeSingle()
    
    if (existingContact) contactId = existingContact.id
  }

  if (!contactId) {
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .upsert(
        { workspace_id: channel.workspace_id, phone, name: senderName, tenant_id: tenantId },
        { onConflict: 'workspace_id,phone' }
      )
      .select('id')
      .single()

    if (contactError || !contact) throw contactError || new Error('Failed to upsert contact')
    contactId = contact.id
  }

  // 3. Extract Content & Handle Media intent
  const contentMsg = messageData.message
  let msgType = 'text'
  let content = ''

  if (contentMsg?.conversation) {
    content = contentMsg.conversation
  } else if (contentMsg?.extendedTextMessage?.text) {
    content = contentMsg.extendedTextMessage.text
  } else if (contentMsg?.imageMessage || contentMsg?.audioMessage) {
    const isImage = !!contentMsg.imageMessage
    msgType = isImage ? 'image' : 'audio'
    content = isImage ? (contentMsg.imageMessage.caption || '📷 Imagem') : '🎤 Áudio'
    
    // Enqueue Media Processing
    const mediaId = isImage ? contentMsg.imageMessage.url : contentMsg.audioMessage.url
    await supabase.from('media_files').insert({
      tenant_id: tenantId,
      message_id: messageId,
      media_id: mediaId || 'unknown',
      mime_type: isImage ? 'image/jpeg' : 'audio/ogg',
      status: 'pending'
    })

    await mediaQueue.add('process-media', {
      tenantId,
      messageId,
      mediaId: mediaId || messageId,
      mimeType: isImage ? 'image/jpeg' : 'audio/ogg',
      evolutionInstanceId: instanceId,
    })
  } else if (contentMsg?.documentMessage) {
    msgType = 'document'
    content = `📎 ${contentMsg.documentMessage.fileName || 'Documento'}`
  }

  const now = new Date().toISOString()

  // 4. Upsert Conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .upsert(
      {
        workspace_id: channel.workspace_id,
        channel_id: channel.id,
        contact_id: contactId,
        tenant_id: tenantId,
        last_message_at: now,
        last_message_preview: content.substring(0, 100),
        status: 'open',
      },
      { onConflict: 'channel_id,contact_id' }
    )
    .select('id, tenant_id')
    .single()

  if (convError || !conversation) throw convError || new Error('Failed to upsert conversation')

  // 5. Insert Message
  const { error: insertError } = await supabase.from('messages').insert({
    conversation_id: conversation.id,
    tenant_id: conversation.tenant_id,
    wa_message_id: messageId ?? null,
    direction: 'inbound',
    type: msgType,
    content,
    sender_name: senderName,
    sent_at: now,
  })

  if (insertError) throw insertError
}
