import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const workspaceId = event.context.params?.id
  if (!workspaceId) {
    throw createError({ statusCode: 400, message: 'Workspace ID is required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .from('tags')
    .select('id, name, color')
    .eq('workspace_id', workspaceId)
    .order('name', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
