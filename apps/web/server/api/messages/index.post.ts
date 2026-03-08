import { createClient } from '@supabase/supabase-js'

const ZAPI_BASE = 'https://api.z-api.io/instances'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { conversation_id, message } = body

  if (!conversation_id || !message) {
    throw createError({ statusCode: 400, statusMessage: 'conversation_id and message are required' })
  }

  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  // 1. Get conversation + channel + contact
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, contact:contacts(phone), channel:channels(zapi_instance_id, zapi_token)')
    .eq('id', conversation_id)
    .single()

  if (!conv) throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })

  const channel = Array.isArray(conv.channel) ? conv.channel[0] : conv.channel
  const contact = Array.isArray(conv.contact) ? conv.contact[0] : conv.contact

  if (!channel || !contact) throw createError({ statusCode: 404, statusMessage: 'Channel or contact not found' })

  // 2. Send via Z-API
  const zapiUrl = `${ZAPI_BASE}/${channel.zapi_instance_id}/token/${channel.zapi_token}/send-text`
  const zapiRes = await fetch(zapiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: contact.phone, message }),
  })

  if (!zapiRes.ok) {
    const zapiErr = await zapiRes.text()
    throw createError({ statusCode: 502, statusMessage: `Z-API error: ${zapiErr}` })
  }

  // 3. Save outgoing message to DB
  const { data: msg } = await supabase.from('messages').insert({
    conversation_id,
    direction: 'outgoing',
    type: 'text',
    body: message,
    sender_name: 'Agente',
  }).select().single()

  // 4. Update conversation last_message_at
  await supabase.from('conversations').update({
    last_message_at: new Date().toISOString(),
    last_message_preview: message.substring(0, 100),
  }).eq('id', conversation_id)

  return msg
})
