import { createClient } from '@supabase/supabase-js'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'

export default defineEventHandler(async (event) => {
  const channelId = event.context.params?.id
  if (!channelId) throw createError({ statusCode: 400, statusMessage: 'Channel ID required' })

  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  // 1. Fetch channel credentials from DB
  const { data: channel } = await supabase
    .from('channels')
    .select('provider_instance_id, provider_token')
    .eq('id', channelId)
    .single()

  if (!channel) throw createError({ statusCode: 404, statusMessage: 'Channel not found' })

  // 2. Call Evolution API to get instance status
  const evolutionUrl = `${EVOLUTION_API_URL}/instance/connectionState/${channel.provider_instance_id}`
  const evolutionHeaders: Record<string, string> = {
    'apikey': channel.provider_token
  }

  const evolutionResponse = await fetch(evolutionUrl, { headers: evolutionHeaders })
  const evolutionData = await evolutionResponse.json() as { instance?: { state?: string }; state?: string; phone?: string }

  console.log(`[Status] Evolution raw response for channel ${channelId}:`, JSON.stringify(evolutionData))

  // 3. Determine new status
  // Evolution returns state within instance.state or at the root depending on versions.
  const stateStr = evolutionData?.instance?.state || evolutionData?.state
  const newStatus = stateStr === 'open' ? 'connected' : 'disconnected'
  
  // Note: Evolution API connectionState might not return the phone number directly in V2.
  // We can fetch from `/instance/fetchInstances` if we need the phone, but for status pooling it's okay.
  const phoneNumber = evolutionData.phone ?? null

  // 4. Update DB status
  await supabase.from('channels').update({ status: newStatus, phone_number: phoneNumber }).eq('id', channelId)

  console.log(`[Status] Channel ${channelId} → ${newStatus}`)
  return { status: newStatus, phone: phoneNumber, raw: evolutionData }
})
