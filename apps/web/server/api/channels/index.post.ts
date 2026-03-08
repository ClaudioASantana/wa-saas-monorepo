import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { workspace_id, name, zapi_instance_id, zapi_token } = body

  if (!workspace_id || !name || !zapi_instance_id || !zapi_token) {
    throw createError({ statusCode: 400, statusMessage: 'workspace_id, name, zapi_instance_id, and zapi_token are required' })
  }

  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)

  const { data, error } = await supabase
    .from('channels')
    .insert({ workspace_id, name, zapi_instance_id, zapi_token, status: 'disconnected' })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return data
})
