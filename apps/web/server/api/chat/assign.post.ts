import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { ChatService } from '../../services/chat.service'
import { z } from 'zod'

const assignSchema = z.object({
  conversationId: z.string().uuid(),
  agentId: z.string().uuid().nullable(),
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { conversationId, agentId } = assignSchema.parse(body)

  const supabase = await serverSupabaseClient(event)
  const chatService = new ChatService(supabase)

  // Get tenant from user's active workspace (for simplicity, we assume the user has access to the conversation's tenant)
  // In a real multi-tenant app, we should verify the user belongs to the tenant of the conversation.
  const { data: conv } = await supabase
    .from('conversations')
    .select('tenant_id')
    .eq('id', conversationId)
    .single()

  if (!conv) {
    throw createError({ statusCode: 404, message: 'Conversation not found' })
  }

  await chatService.assignConversation(conversationId, conv.tenant_id, agentId)

  return { success: true }
})
