import { createClient } from '@supabase/supabase-js'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'

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
    .select('id, tenant_id, contact:contacts(phone), channel:channels(provider_instance_id, provider_token)')
    .eq('id', conversation_id)
    .single()

  if (!conv) throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })

  const channel = Array.isArray(conv.channel) ? conv.channel[0] : conv.channel
  const contact = Array.isArray(conv.contact) ? conv.contact[0] : conv.contact

  if (!channel || !contact) throw createError({ statusCode: 404, statusMessage: 'Channel or contact not found' })

  // 2. Send via Evolution API
  const evolutionUrl = `${EVOLUTION_API_URL}/message/sendText/${channel.provider_instance_id}`
  const evolutionRes = await fetch(evolutionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': channel.provider_token
    },
    body: JSON.stringify({
      number: contact.phone,
      text: message
    }),
  })

  // 3. Save outgoing message to DB
  let errorText = ''
  if (!evolutionRes.ok) {
    // If it fails, we should still probably log it or throw
    errorText = await evolutionRes.text()
    console.error(`Evolution API error: ${errorText}`)
  }
  
  // NOTE: even if sending fails, maybe we don't save or we save as failed. For now, if not ok, we throw:
  if (!evolutionRes.ok) {
     throw createError({ statusCode: 502, statusMessage: `Evolution API error: ${errorText}` })
  }

  const { data: msg } = await supabase.from('messages').insert({
    conversation_id,
    tenant_id: conv.tenant_id,
    direction: 'outgoing',
    type: 'text',
    content: message,
    sender_name: 'Agente',
  }).select().single()

  // 4. Update conversation last_message_at
  await supabase.from('conversations').update({
    last_message_at: new Date().toISOString(),
    last_message_preview: message.substring(0, 100),
  }).eq('id', conversation_id)

  return msg
})
