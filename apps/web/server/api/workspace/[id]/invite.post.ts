import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string)

  const workspaceId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { email } = body

  if (!workspaceId || !email) {
    throw createError({ statusCode: 400, statusMessage: 'workspace_id and email are required' })
  }

  // 1. Invite user via Supabase Auth
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${config.public.appUrl ?? ''}/auth/confirm`,
    data: { invited_workspace_id: workspaceId },
  })

  if (inviteError) {
    // If user already exists, we can still add them to the workspace
    if (!inviteError.message.includes('User already registered')) {
      throw createError({ statusCode: 400, statusMessage: inviteError.message })
    }
  }

  // 2. Get user id (either newly invited or already existing)
  const userId = inviteData?.user?.id
  if (!userId) {
    // User already exists — look them up by email
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u) => u.email === email)
    if (!existingUser) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    // Add to workspace if not already a member
    const { error: uwError } = await supabase.from('user_workspaces').upsert(
      { user_id: existingUser.id, workspace_id: workspaceId, role: 'member' },
      { onConflict: 'user_id,workspace_id' }
    )
    if (uwError) throw createError({ statusCode: 500, statusMessage: uwError.message })

    return { ok: true, status: 'added_existing_user' }
  }

  // 3. Add newly invited user to workspace (they'll be linked after they accept the invite)
  const { error: uwError } = await supabase.from('user_workspaces').upsert(
    { user_id: userId, workspace_id: workspaceId, role: 'member' },
    { onConflict: 'user_id,workspace_id' }
  )
  if (uwError) throw createError({ statusCode: 500, statusMessage: uwError.message })

  return { ok: true, status: 'invited' }
})
