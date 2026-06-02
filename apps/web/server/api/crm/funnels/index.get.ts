import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const query = getQuery(event)
  const workspaceId = query.workspaceId as string
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'workspaceId is required' })

  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  const { data: funnels, error } = await supabase
    .from('crm_funnels')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return funnels
})
