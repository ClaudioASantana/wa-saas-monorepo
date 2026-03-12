import type { Job } from 'bullmq'
import { Worker } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { redis } from './redis'
import { logger } from './logger'
import { mediaQueue } from './media-queue'
import { ChatService } from '../services/chat.service'
import { ContactService } from '../services/contact.service'
import { EvolutionMessageUpsertDataSchema } from '../schemas/evolution.schema'
import type { MessageType } from '../../types/chat.types'

export function createWebhookWorker(supabaseUrl: string, supabaseServiceKey: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const chatService = new ChatService(supabase)
  const contactService = new ContactService(supabase)

  const worker = new Worker(
    'webhook-processing',
    async (job: Job) => {
      const { payload } = job.data
      const { event, instance, data } = payload

      logger.info({ event, instance, jobId: job.id }, '[WebhookWorker] Processing job')

      try {
        if (event === 'connection.update') {
          await handleConnectionUpdate(supabase, instance, data)
          return { status: 'connection_updated' }
        }

        if (event === 'messages.upsert') {
          // Validate with Zod
          const validatedData = EvolutionMessageUpsertDataSchema.parse(data)
          await handleMessageUpsert(chatService, contactService, instance, validatedData, supabase)
          return { status: 'message_processed' }
        }

        return { status: 'skipped', reason: 'unhandled_event' }
      } catch (error: any) {
        logger.error({ error: error.message || error, event, jobId: job.id }, '[WebhookWorker] Error processing job')
        throw error
      }
    },
    { connection: redis as any, concurrency: 5 }
  )

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, '[WebhookWorker] Job failed')
  })

  return worker
}

async function handleConnectionUpdate(supabase: any, instanceId: string, data: any) {
  const { state } = data
  const statusMap: Record<string, string> = { open: 'connected', connecting: 'connecting', close: 'disconnected' }
  const dbStatus = statusMap[state]
  if (!dbStatus) return

  const { data: channel } = await supabase.from('channels').select('id').eq('provider_instance_id', instanceId).single()
  if (channel) {
    await supabase.from('channels').update({ status: dbStatus }).eq('id', channel.id)
  }
}

async function handleMessageUpsert(
  chatService: ChatService, 
  contactService: ContactService, 
  instanceId: string, 
  messageData: any,
  supabase: any
) {
  if (messageData.key?.remoteJid?.includes('@g.us')) return
  if (messageData.key?.fromMe) return

  const messageId = messageData.key?.id
  const remoteJid = messageData.key?.remoteJid ?? ''
  const phone = remoteJid.includes('@lid') ? remoteJid : remoteJid.replace('@s.whatsapp.net', '')
  const senderName = messageData.pushName ?? (phone.includes('@') ? phone.split('@')[0] : phone)

  // 1. Fetch Channel
  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .select('id, workspace_id, workspaces!inner(tenant_id)')
    .eq('provider_instance_id', instanceId)
    .single()

  if (channelError || !channel) throw new Error(`Channel not found for instance ${instanceId}`)
  const tenantId = (channel.workspaces as any)?.tenant_id

  // 2. Upsert Contact via Service
  const contact = await contactService.upsertContact({
    workspaceId: channel.workspace_id,
    phone,
    name: senderName,
    tenantId,
    remoteJid
  })

  // 3. Extract Content & Handle Media
  const contentMsg = messageData.message
  let msgType: MessageType = 'text'
  let content = ''

  if (contentMsg?.conversation) {
    content = contentMsg.conversation
  } else if (contentMsg?.extendedTextMessage?.text) {
    content = contentMsg.extendedTextMessage.text
  } else if (contentMsg?.imageMessage || contentMsg?.audioMessage || contentMsg?.documentMessage) {
    const isImage = !!contentMsg.imageMessage
    const isAudio = !!contentMsg.audioMessage
    
    msgType = isImage ? 'image' : (isAudio ? 'audio' : 'document')
    
    if (isImage) {
      content = contentMsg.imageMessage.caption || '📷 Imagem'
    } else if (isAudio) {
      content = '🎤 Áudio'
    } else {
      content = `📎 ${contentMsg.documentMessage.fileName || 'Documento'}`
    }
    
    const mediaId = isImage 
      ? contentMsg.imageMessage.url 
      : (isAudio ? contentMsg.audioMessage.url : contentMsg.documentMessage.url)
    
    const mimeType = isImage 
      ? 'image/jpeg' 
      : (isAudio ? 'audio/ogg' : (contentMsg.documentMessage.mimetype || 'application/pdf'))
    
    await supabase.from('media_files').insert({
      tenant_id: tenantId, 
      message_id: messageId, 
      media_id: mediaId || 'unknown',
      mime_type: mimeType, 
      status: 'pending'
    })

    await mediaQueue.add('process-media', {
      tenantId, 
      messageId, 
      mediaId: mediaId || messageId,
      mimeType: mimeType, 
      evolutionInstanceId: instanceId,
    })
  }

  // 4. Upsert Conversation via Service
  const conversation = await chatService.upsertConversation({
    workspaceId: channel.workspace_id,
    channelId: channel.id,
    contactId: contact.id,
    tenantId,
    lastMessagePreview: content
  })

  // 5. Insert Message via Service
  await chatService.insertMessage({
    conversationId: conversation.id,
    tenantId,
    waMessageId: messageId,
    direction: 'inbound',
    type: msgType,
    content,
    senderName
  })
}
