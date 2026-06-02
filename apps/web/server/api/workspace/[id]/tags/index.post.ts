import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'

const tagSchema = z.object({
  name: z.string().min(1).max(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um hex válido (ex: #3b82f6)'),
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
  const { name, color } = tagSchema.parse(body)

  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .from('tags')
    .insert({
      workspace_id: workspaceId,
      name,
      color,
    })
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
