import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres').optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url('A URL do avatar deve ser válida').optional(),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres').optional(),
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Não autorizado',
    })
  }

  const body = await readBody(event)
  const parsed = profileSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Dados inválidos',
      data: parsed.error.format(),
    })
  }

  const data = parsed.data
  const supabase = await serverSupabaseClient(event)

  try {
    // 1. Atualizar a senha, se fornecida
    if (data.password) {
      const { error: authError } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (authError) {
        throw createError({
          statusCode: 400,
          message: authError.message,
        })
      }
    }

    // 2. Atualizar perfil público, se houver dados
    const profileUpdate: Record<string, string> = {}
    if (data.name) profileUpdate.name = data.name
    if (data.phone !== undefined) profileUpdate.phone = data.phone
    if (data.avatar_url) profileUpdate.avatar_url = data.avatar_url

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id)

      if (profileError) {
        throw createError({
          statusCode: 500,
          message: 'Erro ao atualizar o perfil: ' + profileError.message,
        })
      }
    }

    return { success: true, message: 'Perfil atualizado com sucesso' }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro interno do servidor',
    })
  }
})
