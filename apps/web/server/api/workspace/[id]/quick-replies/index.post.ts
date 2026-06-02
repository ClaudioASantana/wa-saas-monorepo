import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'

const quickReplySchema = z.object({
  shortcut: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Atalho deve conter apenas letras, números, - e _'),
  content: z.string().min(1).max(2000),
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const workspaceId = event.context.params?.id
  if (!workspaceId) {
    throw createError({ statusCode: 400, message: 'Workspace ID is required' })
  }

  const body = await readBody(event)
  const { shortcut, content } = quickReplySchema.parse(body)

  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .from('quick_replies')
    .insert({
      workspace_id: workspaceId,
      shortcut: shortcut.toLowerCase(),
      content,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({ statusCode: 409, message: 'Este atalho já existe neste workspace' })
    }
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
