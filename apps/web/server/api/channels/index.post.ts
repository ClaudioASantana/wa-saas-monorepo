import { createClient } from '@supabase/supabase-js'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVOLUTION_GLOBAL_API_KEY = process.env.EVOLUTION_GLOBAL_API_KEY || 'B6D711FCDE4D4FD5936544120E713976'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { workspace_id, name, provider_instance_id, provider_token } = body

  if (!workspace_id || !name || !provider_instance_id || !provider_token) {
    throw createError({ statusCode: 400, statusMessage: 'workspace_id, name, provider_instance_id, and provider_token are required' })
  }

  const config = useRuntimeConfig()
  const appUrl = (config.public.appUrl as string) || 'http://localhost:3000'

  // 1. Create instance in Evolution API
  console.log(`[Channel Create] Creating Evolution instance: ${provider_instance_id}`)
  const createRes = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_GLOBAL_API_KEY
    },
    body: JSON.stringify({
      instanceName: provider_instance_id,
      token: provider_token,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    })
  }).catch(err => {
    console.error('[Channel Create] Evolution API unreachable:', err)
    throw createError({ statusCode: 502, statusMessage: 'Não foi possível conectar à Evolution API. Verifique se o serviço está rodando.' })
  })

  if (!createRes.ok) {
    const errorText = await createRes.text()
    console.warn(`[Channel Create] Evolution API create returned ${createRes.status}: ${errorText}`)
    // 409 means instance already exists — that's fine, continue
    if (createRes.status !== 409) {
      throw createError({ statusCode: 502, statusMessage: `Erro ao criar instância na Evolution API: ${errorText}` })
    }
  } else {
    console.log('[Channel Create] ✅ Instance created')
  }

  // 2. Register webhook on the new instance so Baileys can initialize and deliver QR code events
  const webhookUrl = `${appUrl}/api/webhooks/evolution`
  console.log(`[Channel Create] Registering webhook: ${webhookUrl}`)

  const webhookRes = await fetch(`${EVOLUTION_API_URL}/webhook/set/${provider_instance_id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_GLOBAL_API_KEY
    },
    body: JSON.stringify({
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: true,
      events: [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED'
      ]
    })
  }).catch(err => {
    console.warn('[Channel Create] Webhook registration failed (non-fatal):', err)
    return null
  })

  if (webhookRes && !webhookRes.ok) {
    const errText = await webhookRes.text()
    console.warn(`[Channel Create] Webhook registration returned ${webhookRes.status}: ${errText}`)
  } else if (webhookRes) {
    console.log('[Channel Create] ✅ Webhook registered successfully')
  }

  // 3. Save to database
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  const { data, error } = await supabase
    .from('channels')
    .insert({ workspace_id, name, provider_instance_id, provider_token, status: 'disconnected' })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return data
})
