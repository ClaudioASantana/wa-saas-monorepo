import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody(event)
  const { workspace_id, tenant_id, name } = body

  if (!workspace_id || !tenant_id || !name) {
    throw createError({ statusCode: 400, statusMessage: 'workspace_id, tenant_id, and name are required' })
  }

  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  const { data: funnel, error } = await supabase
    .from('crm_funnels')
    .insert({ workspace_id, tenant_id, name })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  // Seeding default stages for the new funnel
  const defaultStages = [
    { funnel_id: funnel.id, tenant_id, name: 'Novo Lead', position: 1, color: 'blue' },
    { funnel_id: funnel.id, tenant_id, name: 'Em Contato', position: 2, color: 'yellow' },
    { funnel_id: funnel.id, tenant_id, name: 'Proposta', position: 3, color: 'purple' },
    { funnel_id: funnel.id, tenant_id, name: 'Fechado', position: 4, color: 'green' },
    { funnel_id: funnel.id, tenant_id, name: 'Perdido', position: 5, color: 'red' },
  ]

  await supabase.from('crm_stages').insert(defaultStages)

  return funnel
})
