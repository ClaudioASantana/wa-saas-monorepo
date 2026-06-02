import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { workspace_id, name, provider_instance_id, provider_token } = body

  if (!workspace_id || !name || !provider_instance_id || !provider_token) {
    throw createError({ statusCode: 400, statusMessage: 'workspace_id, name, provider_instance_id, and provider_token are required' })
  }

  const config = useRuntimeConfig()

  // 1. Save to database
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  const { data, error } = await supabase
    .from('channels')
    .insert({ workspace_id, name, provider_instance_id, provider_token, status: 'disconnected' })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return data
})
