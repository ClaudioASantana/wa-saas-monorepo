import { createClient } from '@supabase/supabase-js'

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

  const messageData = payload.data?.message
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
  const phone = messageData.key?.remoteJid?.replace('@s.whatsapp.net', '') ?? ''
  const senderName = messageData.pushName ?? phone

  if (!phone) {
    return { ok: false, error: 'Missing phone' }
  }

  // 1. Look up channel by instanceId and its workspace's tenant_id
  const { data: channel } = await supabase
    .from('channels')
    .select('id, workspace_id, workspaces(tenant_id)')
    .eq('provider_instance_id', instanceId)
    .single()

  if (!channel) {
    console.warn('[Evolution Webhook] Channel not found for instanceId:', instanceId)
    return { ok: false, error: 'Channel not found' }
  }

  // Workaround since supabase relation includes an array if not singular, but we know workspace is 1-1 to channel
  const wsData = channel.workspaces as any
  const tenantId = Array.isArray(wsData) ? wsData[0]?.tenant_id : wsData?.tenant_id

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
  const { data: contact } = await supabase
    .from('contacts')
    .upsert(
      { workspace_id: channel.workspace_id, phone, name: senderName, tenant_id: tenantId },
      { onConflict: 'workspace_id,phone' }
    )
    .select('id')
    .single()

  if (!contact) {
    return { ok: false, error: 'Failed to upsert contact' }
  }

  // 4. Extract message content (Evolution API structure)
  const contentMsg = messageData.message
  let msgType = 'text'
  let content = ''
  let mediaUrl: string | null = null

  if (contentMsg?.conversation) {
    content = contentMsg.conversation
  } else if (contentMsg?.extendedTextMessage?.text) {
    content = contentMsg.extendedTextMessage.text
  } else if (contentMsg?.imageMessage) {
    msgType = 'image'
    content = contentMsg.imageMessage.caption || '📷 Imagem'
    // Media handling will require downloading or a different URL logic since evolution sends base64/mimetype if requested
  } else if (contentMsg?.audioMessage) {
    msgType = 'audio'
    content = '🎤 Áudio'
  } else if (contentMsg?.documentMessage) {
    msgType = 'document'
    content = `📎 ${contentMsg.documentMessage.fileName || 'Documento'}`
  }

  // Use the mediaUrl to stop lints
  if (mediaUrl) {
    console.log('[MediaURL placeholder]', mediaUrl)
  }

  const now = new Date().toISOString()

  // 5. Upsert conversation (channel_id + contact_id as unique key)
  const { data: conversation } = await supabase
    .from('conversations')
    .upsert(
      {
        workspace_id: channel.workspace_id,
        channel_id: channel.id,
        contact_id: contact.id,
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

  // Update unread_count and last message cache (when conversation already existed)
  await supabase
    .from('conversations')
    .update({
      last_message_at: now,
      last_message_preview: content.substring(0, 100),
      unread_count: supabase.rpc('increment', { row_id: conversation.id }) as unknown as number,
      status: 'open',
    })
    .eq('id', conversation.id)

  // 6. Insert message (uses 'content' and 'inbound' direction)
  await supabase.from('messages').insert({
    conversation_id: conversation.id,
    tenant_id: conversation.tenant_id,
    wa_message_id: messageId ?? null,
    direction: 'inbound',
    type: msgType,
    content,
    media_url: mediaUrl,
    sender_name: senderName,
    sent_at: now,
  })

  console.log(`[ZAPI Webhook] ✅ Message from ${phone} saved in conversation ${conversation.id}`)
  return { ok: true }
})
