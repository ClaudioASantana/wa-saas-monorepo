import { createClient } from '@supabase/supabase-js'
import { mediaQueue } from '../../utils/media-queue'

// Evolution API webhook payload types
interface EvolutionMessage {
  event: string // e.g., 'messages.upsert', 'connection.update'
  instance: string // The name of the instance we created
  data: any // The actual payload, differs by event
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  let payload: EvolutionMessage
  try {
    payload = await readBody<EvolutionMessage>(event)
  } catch {
    return { ok: false, error: 'Invalid JSON body' }
  }

  // ⚡ Log all events for debugging
  console.log('[Evolution Webhook]', JSON.stringify(payload, null, 2))

  const instanceId = payload.instance
  if (!instanceId) {
    return { ok: false, error: 'Missing instance ID' }
  }

  // Handle connection status updates
  if (payload.event === 'connection.update') {
    const { state } = payload.data
    // state can be 'connecting', 'open', 'close'
    const statusMap: Record<string, string> = {
      open: 'connected',
      connecting: 'connecting',
      close: 'disconnected',
    }
    
    const dbStatus = statusMap[state]

    if (dbStatus) {
      const { data: channel } = await supabase
        .from('channels')
        .select('id')
        .eq('provider_instance_id', instanceId) // updated to generic provider column
        .single()

      if (channel) {
        await supabase
          .from('channels')
          .update({ status: dbStatus })
          .eq('id', channel.id)
      }
    }
    return { ok: true, event: 'status_update' }
  }

  // Handle messages
  if (payload.event !== 'messages.upsert') {
    return { ok: true, skipped: 'unhandled event type' }
  }

  const messageData = payload.data
  if (!messageData) {
    return { ok: false, error: 'Missing message data' }
  }

  // Ignore group messages
  if (messageData.key?.remoteJid?.includes('@g.us')) {
    return { ok: true, skipped: 'group message' }
  }

  // Ignore messages sent by us (fromMe)
  if (messageData.key?.fromMe) {
    return { ok: true, skipped: 'outgoing message' }
  }

  // ── Process incoming message ───────────────────────────────────────────────

  const messageId = messageData.key?.id
  const remoteJid = messageData.key?.remoteJid ?? ''
  
  // Se for @lid, mantemos o JID completo para envio posterior. 
  // Se for @s.whatsapp.net, extraímos apenas o número.
  const phone = remoteJid.includes('@lid') 
    ? remoteJid 
    : remoteJid.replace('@s.whatsapp.net', '')

  const senderName = messageData.pushName ?? (phone.includes('@') ? phone.split('@')[0] : phone)

  if (!phone) {
    return { ok: false, error: 'Missing phone' }
  }

  // 1. Look up channel by instanceId and its workspace's tenant_id
  const { data: channel } = await supabase
    .from('channels')
    .select('id, workspace_id, workspaces!inner(tenant_id)')
    .eq('provider_instance_id', instanceId)
    .single()

  if (!channel) {
    console.warn('[Evolution Webhook] Channel not found for instanceId:', instanceId)
    return { ok: false, error: 'Channel not found' }
  }

  // Handle relation data correctly
  const wsData = channel.workspaces as any
  const tenantId = wsData?.tenant_id || (Array.isArray(wsData) ? wsData[0]?.tenant_id : null)

  if (!tenantId) {
    console.warn('[Evolution Webhook] Tenant not found for channel:', instanceId)
    return { ok: false, error: 'Tenant not found' }
  }

  // 2. Idempotency: skip duplicate messages
  if (messageId) {
    const { data: existing } = await supabase
      .from('messages')
      .select('id')
      .eq('wa_message_id', messageId)
      .single()

    if (existing) {
      return { ok: true, skipped: 'duplicate message' }
    }
  }

  // 3. Upsert contact (workspace_id + phone as unique key)
  // Se for LID, tentamos primeiro achar um contato pelo nome no mesmo workspace
  let contactId: string | null = null

  if (remoteJid.includes('@lid')) {
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('workspace_id', channel.workspace_id)
      .eq('name', senderName)
      .not('phone', 'ilike', '%@lid') // preferimos o que não é LID
      .limit(1)
      .single()
    
    if (existingContact) {
      contactId = existingContact.id
      console.log(`[Evolution Webhook] Mapped LID message to existing contact: ${senderName} (${contactId})`)
    }
  }

  if (!contactId) {
    const { data: contact, error: upsertError } = await supabase
      .from('contacts')
      .upsert(
        { workspace_id: channel.workspace_id, phone, name: senderName, tenant_id: tenantId },
        { onConflict: 'workspace_id,phone' }
      )
      .select('id')
      .single()

    if (upsertError || !contact) {
      console.error('[Evolution Webhook] Failed to upsert contact:', upsertError)
      return { ok: false, error: 'Failed to upsert contact' }
    }
    contactId = contact.id
  }

  // 4. Extract message content (Evolution API structure)
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
    
    // ⚡ NEW ASYNC PIPELINE (Story 0.5)
    // We don't wait for the upload here. We just record the intent and queue it.
    const mediaId = isImage ? contentMsg.imageMessage.url : contentMsg.audioMessage.url // Evolution uses 'url' or 'directPath'
    // Actually Evolution v2 returns media metadata. Let's get the ID if available or just use the whole message data.
    
    try {
      // 1. Insert into media_files tracking table
      await supabase.from('media_files').insert({
        tenant_id: tenantId,
        message_id: messageId,
        media_id: mediaId || 'unknown',
        mime_type: isImage ? 'image/jpeg' : 'audio/ogg',
        status: 'pending'
      })

      // 2. Enqueue job
      await mediaQueue.add('process-media', {
        tenantId,
        messageId,
        mediaId: mediaId || messageId, // use messageId as fallback
        mimeType: isImage ? 'image/jpeg' : 'audio/ogg',
        evolutionInstanceId: instanceId,
        // If we have base64 already, we could pass it, but better fetch it in worker to keep Redis light
        // base64: messageData.base64
      })

      console.log(`[Evolution Webhook] Media job enqueued: ${messageId}`)
    } catch (err) {
      console.error('[Evolution Webhook] Failed to enqueue media job:', err)
    }
  }
 else if (contentMsg?.documentMessage) {
    msgType = 'document'
    content = `📎 ${contentMsg.documentMessage.fileName || 'Documento'}`
  }

  const now = new Date().toISOString()

  // 5. Upsert conversation (channel_id + contact_id as unique key)
  const { data: conversation } = await supabase
    .from('conversations')
    .upsert(
      {
        workspace_id: channel.workspace_id,
        channel_id: channel.id,
        contact_id: contactId,
        tenant_id: tenantId,
        last_message_at: now,
        last_message_preview: content.substring(0, 100),
        unread_count: 1,
        status: 'open',
      },
      {
        onConflict: 'channel_id,contact_id',
        ignoreDuplicates: false,
      }
    )
    .select('id, tenant_id')
    .single()

  if (!conversation) {
    return { ok: false, error: 'Failed to upsert conversation' }
  }

  // Update conversation status and last message (when conversation already existed)
  await supabase
    .from('conversations')
    .update({
      last_message_at: now,
      last_message_preview: content.substring(0, 100),
      // For now, just reset or maintain unread. 
      // Correct increment requires a separate RPC call or DB trigger.
      status: 'open',
    })
    .eq('id', conversation.id)

  // 6. Insert message (uses 'content' and 'inbound' direction)
  console.log(`[Evolution Webhook] Inserting message: type=${msgType}, content="${content}"`)
  
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

  if (insertError) {
    console.error('[Evolution Webhook] Error inserting message:', insertError)
  }

  console.log(`[Evolution Webhook] ✅ Message from ${phone} processed`)
  return { ok: true }
})
