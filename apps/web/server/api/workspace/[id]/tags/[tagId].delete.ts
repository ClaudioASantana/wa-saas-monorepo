import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { id: workspaceId, tagId } = event.context.params || {}
  if (!workspaceId || !tagId) {
    throw createError({ statusCode: 400, message: 'Workspace ID and Tag ID are required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', tagId)
    .eq('workspace_id', workspaceId)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { success: true }
})
