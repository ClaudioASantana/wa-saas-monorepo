import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'

const routingSchema = z.object({
  round_robin_enabled: z.boolean(),
  retention_days: z.number().min(0).max(365),
  tag_routing: z.record(z.string()).optional() // Maps tag ID to agent/group ID
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const workspaceId = getRouterParam(event, 'id')
  if (!workspaceId) throw createError({ statusCode: 400, message: 'Workspace ID required' })

  const body = await readBody(event)
  const parsed = routingSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid data' })
  }

  const supabase = await serverSupabaseClient(event)

  // Verify admin access
  const { data: access } = await supabase
    .from('user_workspaces')
    .select('role, workspaces(tenant_id)')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .single()

  if (!access) {
    throw createError({ statusCode: 403, message: 'Forbidden: Admins only' })
  }

  const tenantId = (access.workspaces as any).tenant_id

  // Upsert config
  const { data, error } = await supabase
    .from('routing_config')
    .upsert({
      workspace_id: workspaceId,
      tenant_id: tenantId,
      round_robin_enabled: parsed.data.round_robin_enabled,
      retention_days: parsed.data.retention_days,
      tag_routing: parsed.data.tag_routing || {},
      updated_at: new Date().toISOString()
    }, { onConflict: 'workspace_id' })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
