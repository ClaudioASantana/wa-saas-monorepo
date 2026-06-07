<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-lg font-medium">
          Templates (Meta HSM)
        </h3>
        <p class="text-sm text-slate-500">
          Gerencie seus modelos de mensagem pré-aprovados pela Meta.
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          icon="i-heroicons-arrow-path"
          size="sm"
          color="white"
          :loading="syncing"
          @click="syncTemplates"
        >
          Sincronizar da Meta
        </UButton>
      </div>
    </div>

    <div
      v-if="loading"
      class="flex justify-center py-12"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-8 h-8 animate-spin text-gray-400"
      />
    </div>

    <div
      v-else-if="templates.length === 0"
      class="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
    >
      <UIcon
        name="i-heroicons-document-text"
        class="w-12 h-12 text-gray-400 mx-auto mb-4"
      />
      <h3 class="text-lg font-medium">
        Nenhum template encontrado
      </h3>
      <p class="text-gray-500 mt-1">
        Clique em "Sincronizar da Meta" para buscar os templates da sua conta do WhatsApp Business.
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <UCard
        v-for="template in templates"
        :key="template.id"
        class="flex flex-col"
      >
        <template #header>
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-bold text-gray-900 dark:text-white">
                {{ template.name }}
              </h4>
              <span class="text-xs text-gray-500">{{ template.language }} • {{ template.category }}</span>
            </div>
            <UBadge :color="getStatusColor(template.status)">
              {{ template.status }}
            </UBadge>
          </div>
        </template>

        <div class="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm text-gray-700 dark:text-gray-300 min-h-[100px] whitespace-pre-wrap">
          {{ getTemplateBody(template) }}
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  workspaceId: string
}>()

const toast = useToast()
const templates = ref<any[]>([])
const loading = ref(false)
const syncing = ref(false)

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'APPROVED': return 'green'
    case 'PENDING': return 'yellow'
    case 'REJECTED': return 'red'
    default: return 'gray'
  }
}

const getTemplateBody = (template: any) => {
  if (!template.components) return ''
  const bodyComponent = template.components.find((c: any) => c.type === 'BODY')
  return bodyComponent ? bodyComponent.text : ''
}

const fetchTemplates = async () => {
  loading.value = true
  try {
    const data = await $fetch(`/api/workspace/${props.workspaceId}/templates`)
    templates.value = data
  } catch (err: any) {
    console.error('Error fetching templates:', err)
    toast.add({ title: 'Erro ao carregar templates', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

const syncTemplates = async () => {
  syncing.value = true
  try {
    await $fetch(`/api/workspace/${props.workspaceId}/templates/sync`, {
      method: 'POST'
    })
    toast.add({ title: 'Templates sincronizados com sucesso!', color: 'green' })
    await fetchTemplates()
  } catch (err: any) {
    console.error('Error syncing templates:', err)
    toast.add({ title: 'Erro ao sincronizar', description: err.message, color: 'red' })
  } finally {
    syncing.value = false
  }
}

onMounted(fetchTemplates)
</script>
