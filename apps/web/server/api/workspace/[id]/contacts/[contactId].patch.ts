import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'

const contactSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    phone: z.string().min(1).max(50).optional(),
    notes: z.string().max(5000).optional(),
    is_active: z.boolean().optional(),
    // metadata excluido intencionalmente - gerenciado pelo pipeline de ingestao
  })
  .refine(
    (obj) => Object.values(obj).some((v) => v !== undefined),
    { message: 'At least one field to update is required' }
  )

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { id: workspaceId, contactId } = event.context.params || {}
  if (!workspaceId || !contactId) {
    throw createError({ statusCode: 400, message: 'Workspace ID and Contact ID are required' })
  }

  // Validar contactId como UUID para evitar erro 500 do Postgres com input malformado
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contactId)) {
    throw createError({ statusCode: 400, message: 'Invalid Contact ID format' })
  }

  const body = await readBody(event)
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.errors[0]?.message ?? 'Invalid request body' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .from('contacts')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .eq('workspace_id', workspaceId) // ownership: workspaceId da URL + Supabase RLS
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({ statusCode: 409, message: 'Este telefone ja existe neste workspace' })
    }
    throw createError({ statusCode: 500, message: error.message })
  }
  if (!data) {
    throw createError({ statusCode: 404, message: 'Contact not found or access denied' })
  }

  return data
})
