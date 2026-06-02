import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody(event)
  const { stage_id, conversation_id, tenant_id } = body

  if (!stage_id || !conversation_id || !tenant_id) {
    throw createError({ statusCode: 400, statusMessage: 'stage_id, conversation_id, and tenant_id are required' })
  }

  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  // Determine the highest position in this stage
  const { data: existingCards } = await supabase
    .from('crm_cards')
    .select('position')
    .eq('stage_id', stage_id)
    .order('position', { ascending: false })
    .limit(1)

  const newPosition = existingCards && existingCards.length > 0 ? existingCards[0].position + 1024 : 1024

  const { data: card, error } = await supabase
    .from('crm_cards')
    .insert({
      stage_id,
      conversation_id,
      tenant_id,
      position: newPosition
    })
    .select(`
      *,
      conversation:conversations (
        id,
        last_message_preview,
        last_message_at,
        contact:contacts (
          id,
          name,
          phone
        )
      )
    `)
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return card
})
