import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const channelId = event.context.params?.id
  if (!channelId) throw createError({ statusCode: 400, statusMessage: 'Channel ID required' })

  const config = useRuntimeConfig()
  const WHATSAPP_ENGINE_URL = config.whatsappEngineUrl as string

  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  // 1. Fetch channel credentials from DB
  const { data: channel, error: dbError } = await supabase
    .from('channels')
    .select('provider_instance_id')
    .eq('id', channelId)
    .single()

  if (dbError || !channel) {
    console.error('[QR Code] DB error:', dbError)
    throw createError({ statusCode: 404, statusMessage: 'Canal não encontrado no banco de dados.' })
  }

  console.log(`[QR Code] Requesting QR for instance: ${channel.provider_instance_id}`)

  // 2. Call WhatsApp Engine to ensure the instance is started
  const startUrl = `${WHATSAPP_ENGINE_URL}/instances/${channel.provider_instance_id}/start`
  try {
    await fetch(startUrl, { method: 'POST' })
  } catch (err) {
    console.error('[QR Code] Failed to start instance:', err)
    throw createError({ statusCode: 502, statusMessage: 'Não foi possível conectar ao motor do WhatsApp.' })
  }

  // 3. Call WhatsApp Engine to get status and QR
  const statusUrl = `${WHATSAPP_ENGINE_URL}/instances/${channel.provider_instance_id}/status`
  const statusRes = await fetch(statusUrl).catch((err) => {
    console.error('[QR Code] Status fetch failed:', err)
    throw createError({ statusCode: 502, statusMessage: 'Não foi possível verificar o status do motor.' })
  })

  if (!statusRes.ok) {
    throw createError({ statusCode: statusRes.status, statusMessage: 'Erro ao consultar status da instância.' })
  }

  const json = await statusRes.json() as { status: string; qr?: string }
  console.log('[QR Code] WhatsApp Engine status:', json.status)

  if (json.status === 'connected') {
    throw createError({ statusCode: 400, statusMessage: 'Este Whatsapp já está conectado.' })
  }

  const base64Str = json.qr ?? ''
  if (!base64Str) {
    throw createError({ statusCode: 202, statusMessage: 'Gerando QR Code... Aguarde um instante.' })
  }

  // Update status in db
  await supabase.from('channels').update({ status: 'qr_pending' }).eq('id', channelId)

  // If already a data URL, return as-is; otherwise wrap it
  const qrDataUrl = base64Str.startsWith('data:') ? base64Str : `data:image/png;base64,${base64Str}`

  console.log(`[QR Code] ✅ QR ready, dataUrl length: ${qrDataUrl.length} chars`)
  return { qrcode: qrDataUrl }
})
