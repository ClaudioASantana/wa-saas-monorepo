import { createClient } from '@supabase/supabase-js'

const ZAPI_BASE = 'https://api.z-api.io/instances'

export default defineEventHandler(async (event) => {
  const channelId = event.context.params?.id
  if (!channelId) throw createError({ statusCode: 400, statusMessage: 'Channel ID required' })

  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)
  const zapiClientToken = config.zapiClientToken as string | undefined

  // 1. Fetch channel credentials from DB
  const { data: channel, error: dbError } = await supabase
    .from('channels')
    .select('zapi_instance_id, zapi_token')
    .eq('id', channelId)
    .single()

  if (dbError || !channel) {
    console.error('[QR Code] DB error:', dbError)
    throw createError({ statusCode: 404, statusMessage: 'Canal não encontrado no banco de dados.' })
  }

  console.log(`[QR Code] Fetching QR for instance: ${channel.zapi_instance_id}`)

  // 2. Call Z-API QR code endpoint
  const zapiUrl = `${ZAPI_BASE}/${channel.zapi_instance_id}/token/${channel.zapi_token}/qr-code/image`
  console.log(`[QR Code] Calling Z-API: ${zapiUrl}`)

  const zapiHeaders: Record<string, string> = {}
  if (zapiClientToken) zapiHeaders['Client-Token'] = zapiClientToken

  const zapiResponse = await fetch(zapiUrl, { headers: zapiHeaders }).catch((err) => {
    console.error('[QR Code] Fetch failed:', err)
    throw createError({ statusCode: 502, statusMessage: 'Não foi possível conectar com o Z-API. Verifique sua Instance ID e Token.' })
  })

  // 3. Handle Z-API errors
  if (!zapiResponse.ok) {
    let errBody = ''
    try { errBody = await zapiResponse.text() } catch { /* ignore */ }
    console.error(`[QR Code] Z-API returned ${zapiResponse.status}: ${errBody}`)

    if (zapiResponse.status === 404) {
      throw createError({ statusCode: 404, statusMessage: 'Instância não encontrada no Z-API. Verifique a Instance ID.' })
    }
    if (zapiResponse.status === 401) {
      throw createError({ statusCode: 401, statusMessage: 'Token inválido. Verifique o Token da instância Z-API.' })
    }
    if (zapiResponse.status === 400) {
      throw createError({ statusCode: 400, statusMessage: `Z-API: ${errBody}` })
    }
    throw createError({ statusCode: 502, statusMessage: `Z-API retornou erro ${zapiResponse.status}: ${errBody}` })
  }

  await supabase.from('channels').update({ status: 'qr_pending' }).eq('id', channelId)

  const contentType = zapiResponse.headers.get('content-type') ?? ''
  console.log(`[QR Code] Content-Type from Z-API: ${contentType}`)

  let qrDataUrl = ''

  if (contentType.includes('application/json') || contentType.includes('text/')) {
    // Z-API returns JSON like: { "value": "base64string..." }
    const json = await zapiResponse.json() as { value?: string; qrcode?: string; base64?: string }
    console.log('[QR Code] Z-API JSON keys:', Object.keys(json))
    const base64Str = json.value ?? json.qrcode ?? json.base64 ?? ''
    if (!base64Str) {
      throw createError({ statusCode: 502, statusMessage: 'Z-API retornou JSON sem campo de imagem. Tente novamente.' })
    }
    // If already a data URL, return as-is; otherwise wrap it
    qrDataUrl = base64Str.startsWith('data:') ? base64Str : `data:image/png;base64,${base64Str}`
  } else {
    // Raw binary image
    const imageBuffer = await zapiResponse.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString('base64')
    const imgType = contentType || 'image/png'
    qrDataUrl = `data:${imgType};base64,${base64}`
  }

  console.log(`[QR Code] ✅ QR ready, dataUrl length: ${qrDataUrl.length} chars`)
  return { qrcode: qrDataUrl }
})
