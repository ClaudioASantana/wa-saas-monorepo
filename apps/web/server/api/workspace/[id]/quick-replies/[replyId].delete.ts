import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { id: workspaceId, replyId } = event.context.params || {}
  if (!workspaceId || !replyId) {
    throw createError({ statusCode: 400, message: 'Workspace ID and Reply ID are required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { error } = await supabase
    .from('quick_replies')
    .delete()
    .eq('id', replyId)
    .eq('workspace_id', workspaceId)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { success: true }
})
