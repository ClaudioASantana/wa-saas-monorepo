import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'id')
  if (!workspaceId) {
    throw createError({ statusCode: 400, statusMessage: 'Workspace ID is required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching templates:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch templates' })
  }

  return data || []
})
