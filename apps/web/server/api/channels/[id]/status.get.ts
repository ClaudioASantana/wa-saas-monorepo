import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const channelId = event.context.params?.id
  if (!channelId) throw createError({ statusCode: 400, statusMessage: 'Channel ID required' })

  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  // 1. Fetch channel from DB
  const { data: channel } = await supabase
    .from('channels')
    .select('id, status, provider_instance_id')
    .eq('id', channelId)
    .single()

  if (!channel) throw createError({ statusCode: 404, statusMessage: 'Channel not found' })

  // 2. Call WhatsApp Engine API to get instance status
  const engineUrl = `${config.whatsappEngineUrl || 'http://localhost:3001'}/instances/${channel.provider_instance_id}/status`
  
  let engineStatus = 'disconnected'
  try {
    const engineResponse = await fetch(engineUrl)
    if (engineResponse.ok) {
      const engineData = await engineResponse.json() as { status?: string }
      if (engineData.status) {
        engineStatus = engineData.status
      }
    }
  } catch (error) {
    console.warn(`[Status] Failed to fetch status from engine for channel ${channelId}:`, error)
  }

  // 3. Determine new status
  const newStatus = engineStatus === 'connected' ? 'connected' : 'disconnected'
  
  // 4. Update DB status if changed
  if (channel.status !== newStatus) {
    await supabase.from('channels').update({ status: newStatus }).eq('id', channelId)
    console.log(`[Status] Channel ${channelId} → ${newStatus}`)
  }

  return { status: newStatus }
})
