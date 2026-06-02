<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div
      class="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex justify-between items-center"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">CRM Kanban</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Gerencie seus leads a partir das conversas do WhatsApp.
        </p>
      </div>
      <UButton icon="i-heroicons-plus" color="primary" @click="openPromoteModal()">
        Adicionar ao CRM
      </UButton>
    </div>

    <!-- Kanban Board -->
    <div v-if="pendingStages" class="flex-1 p-6 flex gap-6">
      <div v-for="i in 4" :key="i" class="w-80 shrink-0 space-y-3">
        <USkeleton class="h-6 w-40" />
        <USkeleton v-for="j in 2" :key="j" class="h-24 w-full" />
      </div>
    </div>

    <div v-else class="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950 p-4">
      <KanbanBoard
        v-if="stages && stages.length > 0"
        :stages="stages"
        @update-card-stage="handleUpdateCardStage"
        @remove-card="handleRemoveCard"
        @add-conversation="openPromoteModal"
        @open-chat="handleOpenChat"
      />
      <div v-else class="flex items-center justify-center h-full">
        <div class="text-center">
          <UIcon name="i-heroicons-clipboard-document-list" class="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-slate-900 dark:text-white">Nenhum funil configurado</h3>
          <p class="text-slate-500 dark:text-slate-400 mb-4">Crie um funil para começar a gerenciar seus leads.</p>
          <UButton @click="initializeFunnel" :loading="initializing">Criar Funil Padrão</UButton>
        </div>
      </div>
    </div>

    <!-- Promote Modal -->
    <UModal v-model="isPromoteModalOpen">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">Adicionar conversa ao CRM</h3>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Conversa">
            <USelectMenu
              v-model="promoteTarget"
              :options="availableConversations"
              placeholder="Selecionar conversa..."
              searchable
              searchable-placeholder="Buscar contato..."
            >
              <template #label>
                <span v-if="promoteTarget">{{ promoteTarget.label }}</span>
                <span v-else class="text-gray-400 dark:text-gray-500">Selecionar conversa...</span>
              </template>
            </USelectMenu>
          </UFormGroup>

          <UFormGroup label="Fase inicial">
            <USelectMenu
              v-model="promoteStage"
              :options="stages || []"
              value-attribute="id"
              option-attribute="name"
              placeholder="Selecionar fase..."
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="isPromoteModalOpen = false">Cancelar</UButton>
            <UButton
              color="primary"
              icon="i-heroicons-arrow-up-circle"
              :loading="promoting"
              :disabled="!promoteTarget || !promoteStage"
              @click="promoteConversation"
            >
              Adicionar ao CRM
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import KanbanBoard from '~/components/crm/KanbanBoard.vue'
import { useWebSocket } from '~/composables/useWebSocket'

definePageMeta({ layout: 'workspace', middleware: ['auth'] })

const route = useRoute()
const workspaceId = route.params.id as string
const supabase = useSupabaseClient()
const toast = useToast()
const { on, off } = useWebSocket()

// ── Funnels & Stages ──────────────────────────────────────────────────────────
const activeFunnelId = ref<string | null>(null)
const initializing = ref(false)

const { data: funnels, refresh: refreshFunnels } = await useAsyncData(`funnels-${workspaceId}`, async () => {
  const list = await $fetch<any[]>('/api/crm/funnels', { query: { workspaceId } })
  if (list && list.length > 0) {
    activeFunnelId.value = list[0].id
  }
  return list
})

const initializeFunnel = async () => {
  initializing.value = true
  try {
    const { data: workspace } = await supabase.from('workspaces').select('tenant_id').eq('id', workspaceId).single()
    if (workspace) {
      const newFunnel = await $fetch('/api/crm/funnels', {
        method: 'POST',
        body: { workspace_id: workspaceId, tenant_id: (workspace as any).tenant_id, name: 'Pipeline Principal' }
      })
      await refreshFunnels()
      activeFunnelId.value = newFunnel.id
    }
  } catch (e: any) {
    toast.add({ title: 'Erro ao criar funil', description: e.message, color: 'red' })
  } finally {
    initializing.value = false
  }
}

// Auto-initialize if no funnels exist
if (!funnels.value || funnels.value.length === 0) {
  await initializeFunnel()
}

const { data: stages, pending: pendingStages, refresh: refreshStages } = await useAsyncData(`stages-${activeFunnelId.value}`, async () => {
  if (!activeFunnelId.value) return []
  const data = await $fetch<any[]>(`/api/crm/funnels/${activeFunnelId.value}/stages`)
  // initialize hasNewMessages to false
  data.forEach(stage => {
    stage.crm_cards?.forEach((card: any) => {
      card.hasNewMessages = card.conversation?.unread_count > 0
    })
  })
  return data
}, { watch: [activeFunnelId] })

// ── Conversations ────────────────────────────────────────────────────────────
const { data: allOpenConvs } = await useAsyncData(`open-convs-${workspaceId}`, async () => {
  const { data } = await supabase
    .from('conversations')
    .select('id, contact:contacts(name, phone), tenant_id')
    .eq('workspace_id', workspaceId)
    .eq('status', 'open')
    .order('last_message_at', { ascending: false })
    .limit(100)
  return data || []
})

const availableConversations = computed(() => {
  const inCrmIds = new Set()
  if (stages.value) {
    stages.value.forEach(stage => {
      stage.crm_cards?.forEach((card: any) => inCrmIds.add(card.conversation_id))
    })
  }
  return (allOpenConvs.value || [])
    .filter((c: any) => !inCrmIds.has(c.id))
    .map((c: any) => ({
      ...c,
      label: c.contact?.name || c.contact?.phone || c.id,
    }))
})

// ── Board Actions ────────────────────────────────────────────────────────────
const handleUpdateCardStage = async ({ cardId, stageId, position }: { cardId: string, stageId: string, position: number }) => {
  try {
    await $fetch(`/api/crm/cards/${cardId}`, {
      method: 'PATCH',
      body: { stage_id: stageId, position }
    })
    // Background refresh
    refreshStages()
  } catch (e: any) {
    toast.add({ title: 'Erro ao mover card', description: e.message, color: 'red' })
    await refreshStages()
  }
}

const handleRemoveCard = async (cardId: string) => {
  try {
    await $fetch(`/api/crm/cards/${cardId}`, { method: 'DELETE' })
    toast.add({ title: 'Removido do CRM', icon: 'i-heroicons-check-circle', color: 'gray' })
    await refreshStages()
  } catch (e: any) {
    toast.add({ title: 'Erro ao remover', description: e.message, color: 'red' })
  }
}

const handleOpenChat = (conversationId: string) => {
  navigateTo(`/workspace/${workspaceId}/chat?c=${conversationId}`)
}

// ── Promote Modal ────────────────────────────────────────────────────────────
const isPromoteModalOpen = ref(false)
const promoteTarget = ref<any>(null)
const promoteStage = ref<string | undefined>(undefined)
const promoting = ref(false)

const openPromoteModal = (stageId?: string) => {
  promoteStage.value = stageId || stages.value?.[0]?.id
  promoteTarget.value = null
  isPromoteModalOpen.value = true
}

const promoteConversation = async () => {
  if (!promoteTarget.value || !promoteStage.value) return
  promoting.value = true
  try {
    await $fetch('/api/crm/cards', {
      method: 'POST',
      body: {
        stage_id: promoteStage.value,
        conversation_id: promoteTarget.value.id,
        tenant_id: promoteTarget.value.tenant_id
      }
    })
    toast.add({ title: 'Adicionado ao CRM!', icon: 'i-heroicons-check-circle', color: 'green' })
    isPromoteModalOpen.value = false
    promoteTarget.value = null
    promoteStage.value = undefined
    await refreshStages()
  } catch (e: any) {
    toast.add({ title: 'Erro ao adicionar ao CRM', description: e.message, color: 'red', icon: 'i-heroicons-x-circle' })
  } finally {
    promoting.value = false
  }
}

// ── Realtime (Socket.IO) ─────────────────────────────────────────────────────
const handleIncomingMessage = (newMsg: any) => {
  if (stages.value) {
    for (const stage of stages.value) {
      const card = stage.crm_cards?.find((c: any) => c.conversation_id === newMsg.conversationId)
      if (card) {
        card.hasNewMessages = true
        if (card.conversation) {
          card.conversation.last_message_preview = newMsg.content
          card.conversation.last_message_at = newMsg.timestamp || new Date().toISOString()
        }
      }
    }
  }
}

onMounted(() => {
  on('message:new', handleIncomingMessage)
})

onUnmounted(() => {
  off('message:new')
})
</script>
