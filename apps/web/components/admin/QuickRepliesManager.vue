<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-lg font-medium">Quick Replies</h3>
        <p class="text-sm text-slate-500">Respostas rápidas para agilizar o atendimento.</p>
      </div>
      <UButton
        icon="i-heroicons-plus"
        size="sm"
        @click="openModal()"
      >
        Nova Resposta
      </UButton>
    </div>

    <UTable
      :rows="items"
      :columns="columns"
      :loading="loading"
    >
      <template #shortcut-data="{ row }">
        <UKbd>{{ row.shortcut }}</UKbd>
      </template>
      <template #content-data="{ row }">
        <span class="truncate max-w-xs block">{{ row.content }}</span>
      </template>
      <template #actions-data="{ row }">
        <div class="flex items-center gap-2">
          <UButton
            icon="i-heroicons-pencil-square"
            size="xs"
            color="gray"
            variant="ghost"
            @click="openModal(row)"
          />
          <UButton
            icon="i-heroicons-trash"
            size="xs"
            color="red"
            variant="ghost"
            @click="deleteItem(row.id)"
          />
        </div>
      </template>
    </UTable>

    <!-- Modal Form -->
    <UModal v-model="isModalOpen">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              {{ form.id ? 'Editar Resposta' : 'Nova Resposta' }}
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isModalOpen = false" />
          </div>
        </template>

        <form @submit.prevent="saveItem" class="space-y-4">
          <UFormGroup label="Nome/Atalho" name="shortcut" required help="Use /nome no chat para acionar">
            <UInput v-model="form.shortcut" placeholder="ex: saudacao" />
          </UFormGroup>

          <UFormGroup label="Conteúdo" name="content" required>
            <UTextarea v-model="form.content" placeholder="Olá {contato}, como posso ajudar?" rows="4" />
            <p class="mt-1 text-xs text-slate-400">Dica: use {contato} para o nome do cliente.</p>
          </UFormGroup>

          <div class="flex justify-end gap-3 pt-4">
            <UButton color="gray" variant="ghost" @click="isModalOpen = false">Cancelar</UButton>
            <UButton type="submit" color="primary" :loading="saving">Salvar</UButton>
          </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  workspaceId: string
}>()

const items = ref([])
const loading = ref(false)
const saving = ref(false)
const isModalOpen = ref(false)

const form = ref({
  id: '',
  shortcut: '',
  content: ''
})

const columns = [
  { key: 'shortcut', label: 'Atalho' },
  { key: 'content', label: 'Conteúdo' },
  { key: 'actions', label: '' }
]

const fetchItems = async () => {
  loading.value = true
  try {
    items.value = await $fetch(`/api/workspace/${props.workspaceId}/quick-replies`)
  } catch (err) {
    console.error('Error fetching quick replies:', err)
  } finally {
    loading.value = false
  }
}

const openModal = (item?: any) => {
  if (item) {
    form.value = { ...item }
  } else {
    form.value = { id: '', shortcut: '', content: '' }
  }
  isModalOpen.value = true
}

const saveItem = async () => {
  if (!form.value.shortcut || !form.value.content) return
  
  saving.value = true
  try {
    const method = form.value.id ? 'PATCH' : 'POST'
    const url = form.value.id 
      ? `/api/workspace/${props.workspaceId}/quick-replies/${form.value.id}`
      : `/api/workspace/${props.workspaceId}/quick-replies`

    await $fetch(url, {
      method,
      body: form.value
    })
    
    await fetchItems()
    isModalOpen.value = false
    useToast().add({ title: 'Sucesso!', color: 'green' })
  } catch (err) {
    console.error('Error saving quick reply:', err)
    useToast().add({ title: 'Erro ao salvar', color: 'red' })
  } finally {
    saving.value = false
  }
}

const deleteItem = async (id: string) => {
  if (!confirm('Deseja excluir esta resposta?')) return
  
  try {
    await $fetch(`/api/workspace/${props.workspaceId}/quick-replies/${id}`, {
      method: 'DELETE'
    })
    await fetchItems()
    useToast().add({ title: 'Excluído!', color: 'green' })
  } catch (err) {
    console.error('Error deleting quick reply:', err)
  }
}

onMounted(fetchItems)
</script>
