import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'

const quickReplySchema = z.object({
  shortcut: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Atalho deve conter apenas letras, números, - e _').optional(),
  content: z.string().min(1).max(2000).optional(),
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { id: workspaceId, replyId } = event.context.params || {}
  if (!workspaceId || !replyId) {
    throw createError({ statusCode: 400, message: 'Workspace ID and Reply ID are required' })
  }

  const body = await readBody(event)
  const updates = quickReplySchema.parse(body)

  if (updates.shortcut) {
    updates.shortcut = updates.shortcut.toLowerCase()
  }

  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .from('quick_replies')
    .update(updates)
    .eq('id', replyId)
    .eq('workspace_id', workspaceId)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({ statusCode: 409, message: 'Este atalho já existe neste workspace' })
    }
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
