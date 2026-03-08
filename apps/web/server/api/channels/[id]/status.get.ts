import { createClient } from '@supabase/supabase-js'

const ZAPI_BASE = 'https://api.z-api.io/instances'

export default defineEventHandler(async (event) => {
  const channelId = event.context.params?.id
  if (!channelId) throw createError({ statusCode: 400, statusMessage: 'Channel ID required' })

  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)
  const zapiClientToken = config.zapiClientToken as string | undefined

  // 1. Fetch channel credentials from DB
  const { data: channel } = await supabase
    .from('channels')
    .select('zapi_instance_id, zapi_token')
    .eq('id', channelId)
    .single()

  if (!channel) throw createError({ statusCode: 404, statusMessage: 'Channel not found' })

  // 2. Call Z-API to get instance status (with Client-Token)
  const zapiUrl = `${ZAPI_BASE}/${channel.zapi_instance_id}/token/${channel.zapi_token}/status`
  const zapiHeaders: Record<string, string> = {}
  if (zapiClientToken) zapiHeaders['Client-Token'] = zapiClientToken

  const zapiResponse = await fetch(zapiUrl, { headers: zapiHeaders })
  const zapiData = await zapiResponse.json() as { connected: boolean; smartphoneConnected?: boolean; phone?: string }

  console.log(`[Status] Z-API raw response for channel ${channelId}:`, JSON.stringify(zapiData))

  // 3. Determine new status
  const newStatus = zapiData.connected ? 'connected' : 'disconnected'
  const phoneNumber = zapiData.phone ?? null

  // 4. Update DB status
  await supabase.from('channels').update({ status: newStatus, phone_number: phoneNumber }).eq('id', channelId)

  console.log(`[Status] Channel ${channelId} → ${newStatus}`)
  return { status: newStatus, phone: phoneNumber, raw: zapiData }
})
