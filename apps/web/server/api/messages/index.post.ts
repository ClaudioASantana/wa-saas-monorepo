import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { conversation_id, message, is_internal } = body
  
  if (!conversation_id || !message) {
    throw createError({ statusCode: 400, statusMessage: 'conversation_id and message are required' })
  }

  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  // 1. Get conversation + channel + contact
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, tenant_id, contact:contacts(phone), channel_id, channel_data:channels(provider_instance_id, provider_token)')
    .eq('id', conversation_id)
    .single()

  if (!conv) {
    console.error(`[Message API] Conversation ${conversation_id} not found`)
    throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
  }

  const channel = Array.isArray(conv.channel_data) ? conv.channel_data[0] : conv.channel_data
  const contact = Array.isArray(conv.contact) ? conv.contact[0] : conv.contact

  if (!channel || !contact) {
    throw createError({ statusCode: 404, statusMessage: 'Channel or contact not found' })
  }

  // 2. Send via Evolution API (Only if NOT internal)
  if (!is_internal) {
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

    if (!evolutionRes.ok) {
      const errorText = await evolutionRes.text()
      console.error(`[Message API] Evolution API error: ${evolutionRes.status} ${errorText}`)
      throw createError({ statusCode: 502, statusMessage: `Evolution API error: ${errorText}` })
    }
  }

  // 3. Insert message and notify via ChatService
  const { ChatService } = await import('../../services/chat.service')
  const chatService = new ChatService(supabase)

  // Resolve real agent name
  let senderName = user.user_metadata?.full_name || user.email!.split('@')[0]
  try {
    const agent = await chatService.getOrCreateAgent(user.email!, conv.tenant_id, senderName)
    if (agent?.name) senderName = agent.name
  } catch {
    // Fallback to user metadata name
  }

  try {
    const msg = await chatService.insertMessage({
      conversationId: conversation_id,
      tenantId: conv.tenant_id,
      waMessageId: null,
      direction: 'outbound',
      type: 'text',
      content: message,
      senderName,
      isInternal: !!is_internal
    })

  // 4. Update conversation last_message_at (ChatService.insertMessage notifies message:new, but we still update conv metadata)
    await supabase.from('conversations').update({
      last_message_at: new Date().toISOString(),
      last_message_preview: message.substring(0, 100),
    }).eq('id', conversation_id)

    return msg
  } catch (error) {
    console.error(`[Message API] Error:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw createError({ statusCode: 500, statusMessage: errorMessage })
  }
})
