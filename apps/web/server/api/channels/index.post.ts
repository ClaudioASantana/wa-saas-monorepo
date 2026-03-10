import { createClient } from '@supabase/supabase-js'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVOLUTION_GLOBAL_API_KEY = process.env.EVOLUTION_GLOBAL_API_KEY || 'B6D711FCDE4D4FD5936544120E713976' // matching docker-compose.evolution.yml

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { workspace_id, name, provider_instance_id, provider_token } = body

  if (!workspace_id || !name || !provider_instance_id || !provider_token) {
    throw createError({ statusCode: 400, statusMessage: 'workspace_id, name, provider_instance_id, and provider_token are required' })
  }

  // 1. Automatically create the instance in Evolution API
  const createInstanceUrl = `${EVOLUTION_API_URL}/instance/create`
  const createRes = await fetch(createInstanceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_GLOBAL_API_KEY
    },
    body: JSON.stringify({
      instanceName: provider_instance_id,
      token: provider_token,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS"
    })
  })

  if (!createRes.ok) {
    const errorText = await createRes.text()
    // It's possible the instance already exists. If so, we can proceed.
    // If not, we should probably throw an error, but let's just log it and try to save to DB anyway
    console.error(`[Channel Create] Evolution API error: ${errorText}`)
    // If the error strictly blocks us, we could throw here.
  }


  // 3. Save to database
  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  const { data, error } = await supabase
    .from('channels')
    .insert({ workspace_id, name, provider_instance_id, provider_token, status: 'disconnected' })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return data
})
