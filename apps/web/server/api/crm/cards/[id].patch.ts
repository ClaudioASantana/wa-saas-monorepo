import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const cardId = event.context.params?.id
  if (!cardId) throw createError({ statusCode: 400, statusMessage: 'Card ID is required' })

  const body = await readBody(event)
  const { stage_id, position } = body

  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  const updates: any = {}
  if (stage_id) updates.stage_id = stage_id
  if (position !== undefined) updates.position = position

  const { data: card, error } = await supabase
    .from('crm_cards')
    .update(updates)
    .eq('id', cardId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return card
})
