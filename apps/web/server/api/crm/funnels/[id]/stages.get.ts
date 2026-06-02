import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const funnelId = event.context.params?.id
  if (!funnelId) throw createError({ statusCode: 400, statusMessage: 'Funnel ID is required' })

  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  // Fetch stages along with cards and their respective conversations & contacts
  const { data: stages, error } = await supabase
    .from('crm_stages')
    .select(`
      *,
      crm_cards (
        *,
        conversation:conversations (
          id,
          last_message_preview,
          last_message_at,
          unread_count,
          contact:contacts (
            id,
            name,
            phone
          )
        )
      )
    `)
    .eq('funnel_id', funnelId)
    .order('position', { ascending: true })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return stages
})
