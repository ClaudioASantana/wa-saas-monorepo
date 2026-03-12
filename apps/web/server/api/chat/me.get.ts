import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { ChatService } from '../../services/chat.service'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const workspaceId = getQuery(event).workspaceId as string
  if (!workspaceId) {
    throw createError({ statusCode: 400, message: 'Workspace ID is required' })
  }

  const supabase = await serverSupabaseClient(event)
  const chatService = new ChatService(supabase)

  // 1. Get tenant_id from workspace
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('tenant_id')
    .eq('id', workspaceId)
    .single()

  if (wsError || !workspace?.tenant_id) {
    throw createError({ statusCode: 404, message: 'Workspace or Tenant not found' })
  }

  // 2. Get or create agent
  try {
    const agent = await chatService.getOrCreateAgent(
      user.email!,
      workspace.tenant_id,
      user.user_metadata?.full_name || user.email!.split('@')[0]
    )
    return agent
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message })
  }
})
