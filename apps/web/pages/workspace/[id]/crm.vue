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
      <UButton icon="i-heroicons-plus" color="primary" @click="isPromoteModalOpen = true">
        Adicionar ao CRM
      </UButton>
    </div>

    <!-- Kanban Board -->
    <div v-if="pending" class="flex-1 p-6 flex gap-6">
      <div v-for="i in 4" :key="i" class="w-80 shrink-0 space-y-3">
        <USkeleton class="h-6 w-40" />
        <USkeleton v-for="j in 2" :key="j" class="h-24 w-full" />
      </div>
    </div>

    <div v-else class="flex-1 overflow-x-auto p-6 bg-slate-50 dark:bg-slate-950">
      <div class="flex space-x-6 min-w-max h-full items-start">
        <div
          v-for="stage in STAGES"
          :key="stage.key"
          class="w-80 flex flex-col space-y-3"
        >
          <!-- Stage Header -->
          <div class="flex items-center justify-between mb-1">
            <h3 class="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :class="stage.color" />
              {{ stage.label }}
              <UBadge color="gray" variant="subtle" size="xs">
                {{ convsByStage[stage.key]?.length ?? 0 }}
              </UBadge>
            </h3>
          </div>

          <!-- Cards -->
          <div class="space-y-3 min-h-[60px]">
            <UCard
              v-for="conv in convsByStage[stage.key]"
              :key="conv.id"
              class="cursor-pointer hover:ring-1 hover:ring-primary-400 transition-all"
            >
              <div class="space-y-3">
                <div class="flex justify-between items-start">
                  <div class="flex items-center gap-2 min-w-0">
                    <UAvatar :alt="conv.contact?.name || conv.contact?.phone || '?'" size="xs" />
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {{ conv.contact?.name || conv.contact?.phone || 'Desconhecido' }}
                      </p>
                      <p class="text-xs text-slate-400">{{ conv.contact?.phone }}</p>
                    </div>
                  </div>
                  <UButton
                    icon="i-heroicons-x-mark"
                    color="gray"
                    variant="ghost"
                    size="2xs"
                    @click.stop="removeFromCrm(conv)"
                  />
                </div>

                <p v-if="conv.last_message_preview" class="text-xs text-slate-500 line-clamp-2">
                  {{ conv.last_message_preview }}
                </p>

                <!-- Move stage buttons -->
                <div class="flex gap-1 flex-wrap">
                  <UButton
                    v-for="s in STAGES.filter(s => s.key !== stage.key)"
                    :key="s.key"
                    size="2xs"
                    color="gray"
                    variant="ghost"
                    @click="moveStage(conv, s.key)"
                  >
                    → {{ s.label }}
                  </UButton>
                </div>
              </div>
            </UCard>

            <!-- Empty state per column -->
            <div
              v-if="!convsByStage[stage.key]?.length"
              class="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center min-h-[80px]"
            >
              <span class="text-xs text-slate-400">Sem leads nesta fase</span>
            </div>
          </div>
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
              value-attribute="id"
              option-attribute="label"
              placeholder="Selecionar conversa..."
              searchable
              searchable-placeholder="Buscar contato..."
            />
          </UFormGroup>

          <UFormGroup label="Fase inicial">
            <USelectMenu
              v-model="promoteStage"
              :options="STAGES"
              value-attribute="key"
              option-attribute="label"
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
definePageMeta({ layout: 'workspace', middleware: ['auth'] })

const route = useRoute()
const workspaceId = route.params.id as string
const supabase = useSupabaseClient()
const toast = useToast()

// ── Stages ────────────────────────────────────────────────────────────────────
const STAGES = [
  { key: 'lead',       label: 'Novo Lead',    color: 'bg-blue-500' },
  { key: 'contact',    label: 'Em Contato',   color: 'bg-yellow-500' },
  { key: 'proposal',   label: 'Proposta',     color: 'bg-orange-500' },
  { key: 'closed',     label: 'Fechado',      color: 'bg-green-500' },
] as const

type StageKey = typeof STAGES[number]['key']

interface CrmConv {
  id: string
  crm_stage: string | null
  last_message_at: string | null
  last_message_preview: string | null
  contact: { name: string | null; phone: string } | null
}

// ── Data ──────────────────────────────────────────────────────────────────────
const { data: crmConvs, pending, refresh } = await useAsyncData<CrmConv[]>(
  `crm-${workspaceId}`,
  async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, crm_stage, last_message_at, last_message_preview, contact:contacts(name, phone)')
      .eq('workspace_id', workspaceId)
      .not('crm_stage', 'is', null)
      .order('last_message_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as CrmConv[]
  }
)

const convsByStage = computed(() => {
  const grouped: Record<string, CrmConv[]> = {}
  STAGES.forEach(s => (grouped[s.key] = []))
  for (const conv of crmConvs.value ?? []) {
    if (conv.crm_stage && grouped[conv.crm_stage]) {
      grouped[conv.crm_stage].push(conv)
    }
  }
  return grouped
})

// ── Available conversations for promote modal ──────────────────────────────────
const { data: allConvs } = await useAsyncData(`crm-all-${workspaceId}`, async () => {
  const { data } = await supabase
    .from('conversations')
    .select('id, crm_stage, contact:contacts(name, phone)')
    .eq('workspace_id', workspaceId)
    .is('crm_stage', null)
    .eq('status', 'open')
    .order('last_message_at', { ascending: false })
    .limit(50)
  return (data ?? []) as unknown as Array<{
    id: string
    crm_stage: string | null
    contact: { name: string | null; phone: string } | null
  }>
})

const availableConversations = computed(() =>
  (allConvs.value ?? []).map(c => ({
    id: c.id,
    label: c.contact?.name || c.contact?.phone || c.id,
  }))
)

// ── Actions ───────────────────────────────────────────────────────────────────
const moveStage = async (conv: CrmConv, newStage: StageKey) => {
  const { error } = await supabase
    .from('conversations')
    .update({ crm_stage: newStage })
    .eq('id', conv.id)
  if (error) {
    toast.add({ title: 'Erro ao mover', color: 'red', icon: 'i-heroicons-x-circle' })
    return
  }
  // Optimistic update
  if (crmConvs.value) {
    const idx = crmConvs.value.findIndex(c => c.id === conv.id)
    if (idx !== -1) crmConvs.value[idx].crm_stage = newStage
  }
}

const removeFromCrm = async (conv: CrmConv) => {
  const { error } = await supabase
    .from('conversations')
    .update({ crm_stage: null })
    .eq('id', conv.id)
  if (error) {
    toast.add({ title: 'Erro ao remover', color: 'red', icon: 'i-heroicons-x-circle' })
    return
  }
  await refresh()
  toast.add({ title: 'Removido do CRM', icon: 'i-heroicons-check-circle', color: 'gray' })
}

// ── Promote Modal ─────────────────────────────────────────────────────────────
const isPromoteModalOpen = ref(false)
const promoteTarget = ref<string | undefined>(undefined)
const promoteStage = ref<string | undefined>(undefined)
const promoting = ref(false)

const promoteConversation = async () => {
  if (!promoteTarget.value || !promoteStage.value) return
  promoting.value = true
  const { error } = await supabase
    .from('conversations')
    .update({ crm_stage: promoteStage.value })
    .eq('id', promoteTarget.value)

  if (error) {
    toast.add({ title: 'Erro ao adicionar ao CRM', color: 'red', icon: 'i-heroicons-x-circle' })
  } else {
    toast.add({ title: 'Adicionado ao CRM!', icon: 'i-heroicons-check-circle', color: 'green' })
    isPromoteModalOpen.value = false
    promoteTarget.value = undefined
    promoteStage.value = undefined
    await Promise.all([refresh()])
  }
  promoting.value = false
}
</script>
