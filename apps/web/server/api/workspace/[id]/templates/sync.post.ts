import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'id')
  if (!workspaceId) {
    throw createError({ statusCode: 400, statusMessage: 'Workspace ID is required' })
  }

  const supabase = await serverSupabaseClient(event)

  // Em uma implementação real, buscaríamos os templates da Cloud API da Meta
  // usando o whatsapp_business_account_id do workspace.
  // Como estamos implementando o mock/base, vamos inserir templates mockados 
  // para simular a sincronização.

  const mockTemplates = [
    {
      name: 'hello_world',
      language: 'en_US',
      category: 'UTILITY',
      status: 'APPROVED',
      components: [
        {
          type: 'BODY',
          text: 'Hello World! Welcome to our service.'
        }
      ]
    },
    {
      name: 'welcome_message',
      language: 'pt_BR',
      category: 'MARKETING',
      status: 'APPROVED',
      components: [
        {
          type: 'BODY',
          text: 'Olá {{1}}! Bem-vindo(a) à nossa plataforma. Em que posso ajudar?'
        }
      ]
    },
    {
      name: 'payment_reminder',
      language: 'pt_BR',
      category: 'UTILITY',
      status: 'PENDING',
      components: [
        {
          type: 'BODY',
          text: 'Lembramos que o vencimento da sua fatura será em {{1}}.'
        }
      ]
    }
  ]

  // Inserir ou atualizar os templates no banco (Upsert)
  const templatesToInsert = mockTemplates.map(t => ({
    workspace_id: workspaceId,
    name: t.name,
    category: t.category,
    language: t.language,
    status: t.status,
    components: t.components
  }))

  const { error } = await supabase
    .from('message_templates')
    .upsert(templatesToInsert, { 
      onConflict: 'workspace_id, name, language'
    })

  if (error) {
    console.error('Error syncing templates:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to sync templates' })
  }

  return { success: true, message: 'Templates synced successfully' }
})
