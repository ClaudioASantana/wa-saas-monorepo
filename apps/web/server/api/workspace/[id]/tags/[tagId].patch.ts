import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'

const tagSchema = z.object({
  name: z.string().min(1).max(30).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um hex válido (ex: #3b82f6)').optional(),
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { id: workspaceId, tagId } = event.context.params || {}
  if (!workspaceId || !tagId) {
    throw createError({ statusCode: 400, message: 'Workspace ID and Tag ID are required' })
  }

  const body = await readBody(event)
  const updates = tagSchema.parse(body)

  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .from('tags')
    .update(updates)
    .eq('id', tagId)
    .eq('workspace_id', workspaceId)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({ statusCode: 409, message: 'Esta etiqueta já existe neste workspace' })
    }
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
