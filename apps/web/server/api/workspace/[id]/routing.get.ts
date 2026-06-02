import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const workspaceId = getRouterParam(event, 'id')
  if (!workspaceId) throw createError({ statusCode: 400, message: 'Workspace ID required' })

  const supabase = await serverSupabaseClient(event)

  // Verify access
  const { data: access } = await supabase
    .from('user_workspaces')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!access) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  // Fetch config
  const { data: config, error } = await supabase
    .from('routing_config')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw createError({ statusCode: 500, message: error.message })
  }

  // If not found, return default
  if (!config) {
    return {
      workspace_id: workspaceId,
      round_robin_enabled: false,
      retention_days: 7,
      tag_routing: {}
    }
  }

  return config
})
