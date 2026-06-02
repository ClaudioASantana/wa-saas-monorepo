import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const cardId = event.context.params?.id
  if (!cardId) throw createError({ statusCode: 400, statusMessage: 'Card ID is required' })

  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  const { error } = await supabase
    .from('crm_cards')
    .delete()
    .eq('id', cardId)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true }
})
