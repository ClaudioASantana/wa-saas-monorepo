import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const workspaceId = query.workspace_id as string

  if (!workspaceId) {
    throw createError({ statusCode: 400, statusMessage: 'workspace_id is required' })
  }

  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)

  const { data, error } = await supabase
    .from('channels')
    .select('id, name, status, phone_number, provider_instance_id, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return data
})
