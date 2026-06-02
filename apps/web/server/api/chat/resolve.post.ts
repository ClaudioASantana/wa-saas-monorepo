import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { ChatService } from '../../services/chat.service'
import { z } from 'zod'

const resolveSchema = z.object({
  conversationId: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { conversationId } = resolveSchema.parse(body)

  const supabase = await serverSupabaseClient(event)
  const chatService = new ChatService(supabase)

  // Get tenant
  const { data: conv } = await supabase
    .from('conversations')
    .select('tenant_id')
    .eq('id', conversationId)
    .single()

  if (!conv) {
    throw createError({ statusCode: 404, message: 'Conversation not found' })
  }

  await chatService.setConversationStatus(conversationId, conv.tenant_id, 'resolved')

  return { success: true }
})
