import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'

const syncTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()),
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const conversationId = event.context.params?.id
  if (!conversationId) {
    throw createError({ statusCode: 400, message: 'Conversation ID is required' })
  }

  const body = await readBody(event)
  const { tagIds } = syncTagsSchema.parse(body)

  const supabase = await serverSupabaseClient(event)

  // 1. Delete existing links
  const { error: deleteError } = await supabase
    .from('conversation_tags')
    .delete()
    .eq('conversation_id', conversationId)

  if (deleteError) {
    throw createError({ statusCode: 500, message: deleteError.message })
  }

  // 2. Insert new links if any
  if (tagIds.length > 0) {
    const { error: insertError } = await supabase
      .from('conversation_tags')
      .insert(tagIds.map(tagId => ({
        conversation_id: conversationId,
        tag_id: tagId,
      })))

    if (insertError) {
      throw createError({ statusCode: 500, message: insertError.message })
    }
  }

  return { success: true }
})
