import { createClient } from '@supabase/supabase-js'

// Z-API webhook payload types (simplified)
interface ZApiMessage {
  instanceId?: string
  messageId?: string
  phone?: string
  momment?: number // Z-API typo in their API 😅
  type?: string
  text?: { message?: string }
  image?: { caption?: string; imageUrl?: string }
  audio?: { audioUrl?: string }
  document?: { fileName?: string; documentUrl?: string }
  senderName?: string
  fromMe?: boolean
  isGroup?: boolean
  status?: string
  // Z-API connection events
  connected?: boolean
  error?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  let payload: ZApiMessage
  try {
    payload = await readBody<ZApiMessage>(event)
  } catch {
    return { ok: false, error: 'Invalid JSON body' }
  }

  // ⚡ Log all events for debugging
  console.log('[ZAPI Webhook]', JSON.stringify(payload, null, 2))

  // Ignore group messages for now
  if (payload.isGroup) {
    return { ok: true, skipped: 'group message' }
  }

  // Ignore messages sent by us (fromMe) — we handle outgoing separately
  if (payload.fromMe) {
    return { ok: true, skipped: 'outgoing message' }
  }

  // Handle status updates (connected/disconnected events have no phone)
  if (!payload.phone && payload.connected !== undefined) {
    const { data: channel } = await supabase
      .from('channels')
      .select('id')
      .eq('zapi_instance_id', payload.instanceId ?? '')
      .single()

    if (channel) {
      await supabase
        .from('channels')
        .update({ status: payload.connected ? 'connected' : 'disconnected' })
        .eq('id', channel.id)
    }
    return { ok: true, event: 'status_update' }
  }

  // ── Process incoming message ───────────────────────────────────────────────

  const instanceId = payload.instanceId
  const messageId = payload.messageId
  const phone = payload.phone?.replace('@c.us', '') ?? ''
  const senderName = payload.senderName ?? phone

  if (!instanceId || !phone) {
    return { ok: false, error: 'Missing instanceId or phone' }
  }

  // 1. Look up channel by instanceId
  const { data: channel } = await supabase
    .from('channels')
    .select('id, workspace_id')
    .eq('zapi_instance_id', instanceId)
    .single()

  if (!channel) {
    console.warn('[ZAPI Webhook] Channel not found for instanceId:', instanceId)
    return { ok: false, error: 'Channel not found' }
  }

  // 2. Idempotency: skip duplicate messages
  if (messageId) {
    const { data: existing } = await supabase
      .from('messages')
      .select('id')
      .eq('zapi_message_id', messageId)
      .single()

    if (existing) {
      return { ok: true, skipped: 'duplicate message' }
    }
  }

  // 3. Upsert contact
  const { data: contact } = await supabase
    .from('contacts')
    .upsert({ workspace_id: channel.workspace_id, phone, name: senderName }, { onConflict: 'workspace_id,phone' })
    .select('id')
    .single()

  if (!contact) {
    return { ok: false, error: 'Failed to upsert contact' }
  }

  // 4. Extract message body
  const msgType = payload.type ?? 'text'
  let body = ''
  let mediaUrl: string | null = null

  if (payload.text?.message) body = payload.text.message
  else if (payload.image?.caption) { body = payload.image.caption; mediaUrl = payload.image.imageUrl ?? null }
  else if (payload.audio?.audioUrl) { body = '🎤 Áudio'; mediaUrl = payload.audio.audioUrl }
  else if (payload.document?.fileName) { body = `📎 ${payload.document.fileName}`; mediaUrl = payload.document.documentUrl ?? null }

  // 5. Upsert conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .upsert(
      {
        workspace_id: channel.workspace_id,
        channel_id: channel.id,
        contact_id: contact.id,
        last_message_at: new Date().toISOString(),
        last_message_preview: body.substring(0, 100),
        unread_count: 1,
      },
      { onConflict: 'channel_id,contact_id' }
    )
    .select('id')
    .single()

  if (!conversation) {
    return { ok: false, error: 'Failed to upsert conversation' }
  }

  // 6. Insert message
  await supabase.from('messages').insert({
    conversation_id: conversation.id,
    zapi_message_id: messageId ?? null,
    direction: 'incoming',
    type: msgType,
    body,
    media_url: mediaUrl,
    sender_name: senderName,
  })

  console.log(`[ZAPI Webhook] ✅ Message from ${phone} saved in conversation ${conversation.id}`)
  return { ok: true }
})
