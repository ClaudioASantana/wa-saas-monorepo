import { createClient } from '@supabase/supabase-js'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'

export default defineEventHandler(async (event) => {
  const channelId = event.context.params?.id
  if (!channelId) throw createError({ statusCode: 400, statusMessage: 'Channel ID required' })

  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  // 1. Fetch channel credentials from DB
  const { data: channel, error: dbError } = await supabase
    .from('channels')
    .select('provider_instance_id, provider_token')
    .eq('id', channelId)
    .single()

  if (dbError || !channel) {
    console.error('[QR Code] DB error:', dbError)
    throw createError({ statusCode: 404, statusMessage: 'Canal não encontrado no banco de dados.' })
  }

  console.log(`[QR Code] Fetching QR for instance: ${channel.provider_instance_id}`)

  // 2. Call Evolution API QR code / connect endpoint
  const evolutionUrl = `${EVOLUTION_API_URL}/instance/connect/${channel.provider_instance_id}`
  console.log(`[QR Code] Calling Evolution API: ${evolutionUrl}`)

  const evolutionHeaders: Record<string, string> = {
    'apikey': channel.provider_token
  }

  const evolutionResponse = await fetch(evolutionUrl, { headers: evolutionHeaders }).catch((err) => {
    console.error('[QR Code] Fetch failed:', err)
    throw createError({ statusCode: 502, statusMessage: 'Não foi possível conectar. Verifique se a API está online.' })
  })

  // 3. Handle Evolution API errors
  if (!evolutionResponse.ok) {
    let errBody = ''
    try { errBody = await evolutionResponse.text() } catch { /* ignore */ }
    console.error(`[QR Code] Evolution API returned ${evolutionResponse.status}: ${errBody}`)

    if (evolutionResponse.status === 404) {
      throw createError({ statusCode: 404, statusMessage: 'Instância não encontrada na Evolution API. Verifique a Instance ID.' })
    }
    if (evolutionResponse.status === 401 || evolutionResponse.status === 403) {
      throw createError({ statusCode: 401, statusMessage: 'Token inválido. Verifique o apikey da instância.' })
    }
    throw createError({ statusCode: 502, statusMessage: `Evolution API retornou erro ${evolutionResponse.status}: ${errBody}` })
  }

  await supabase.from('channels').update({ status: 'qr_pending' }).eq('id', channelId)

  // Evolution returns JSON with the base64 qr code
  const json = await evolutionResponse.json() as { base64?: string; state?: string }
  console.log('[QR Code] Evolution API JSON keys:', Object.keys(json))
  
  const base64Str = json.base64 ?? ''
  if (!base64Str) {
    if (json.state === 'open') {
       throw createError({ statusCode: 400, statusMessage: 'Este Whatsapp já está conectado.' })
    }
    throw createError({ statusCode: 502, statusMessage: 'Evolution API retornou JSON sem campo de imagem base64. Tente novamente.' })
  }

  // If already a data URL, return as-is; otherwise wrap it
  const qrDataUrl = base64Str.startsWith('data:') ? base64Str : `data:image/png;base64,${base64Str}`

  console.log(`[QR Code] ✅ QR ready, dataUrl length: ${qrDataUrl.length} chars`)
  return { qrcode: qrDataUrl }
})
