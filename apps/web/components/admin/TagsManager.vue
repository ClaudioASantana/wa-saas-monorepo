<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-lg font-medium">Tags</h3>
        <p class="text-sm text-slate-500">Tags coloridas para organizar suas conversas.</p>
      </div>
      <UButton
        icon="i-heroicons-plus"
        size="sm"
        @click="openModal()"
      >
        Nova Tag
      </UButton>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <div
        v-for="tag in items"
        :key="tag.id"
        class="p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between group"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-4 h-4 rounded-full"
            :style="{ backgroundColor: tag.color }"
          />
          <span class="font-medium">{{ tag.name }}</span>
        </div>
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <UButton
            icon="i-heroicons-pencil-square"
            size="xs"
            color="gray"
            variant="ghost"
            @click="openModal(tag)"
          />
          <UButton
            icon="i-heroicons-trash"
            size="xs"
            color="red"
            variant="ghost"
            @click="deleteItem(tag.id)"
          />
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <UModal v-model="isModalOpen">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              {{ form.id ? 'Editar Tag' : 'Nova Tag' }}
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isModalOpen = false" />
          </div>
        </template>

        <form @submit.prevent="saveItem" class="space-y-4">
          <UFormGroup label="Nome" name="name" required>
            <UInput v-model="form.name" placeholder="ex: Urgente" />
          </UFormGroup>

          <UFormGroup label="Cor" name="color" required>
            <div class="flex items-center gap-3">
              <UInput v-model="form.color" type="color" class="w-12 h-10 p-1" />
              <UInput v-model="form.color" placeholder="#000000" class="flex-1" />
            </div>
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

interface Tag {
  id: string
  name: string
  color: string
}

const items = ref<Tag[]>([])
const loading = ref(false)
const saving = ref(false)
const isModalOpen = ref(false)

const form = ref<Tag>({
  id: '',
  name: '',
  color: '#3b82f6'
})

const fetchItems = async () => {
  loading.value = true
  try {
    items.value = await $fetch(`/api/workspace/${props.workspaceId}/tags`)
  } catch (err) {
    console.error('Error fetching tags:', err)
  } finally {
    loading.value = false
  }
}

const openModal = (item?: any) => {
  if (item) {
    form.value = { ...item }
  } else {
    form.value = { id: '', name: '', color: '#3b82f6' }
  }
  isModalOpen.value = true
}

const saveItem = async () => {
  if (!form.value.name) return
  
  saving.value = true
  try {
    const method = form.value.id ? 'PATCH' : 'POST'
    const url = form.value.id 
      ? `/api/workspace/${props.workspaceId}/tags/${form.value.id}`
      : `/api/workspace/${props.workspaceId}/tags`

    await $fetch(url, {
      method,
      body: form.value
    })
    
    await fetchItems()
    isModalOpen.value = false
    useToast().add({ title: 'Tag salva!', color: 'green' })
  } catch (err) {
    console.error('Error saving tag:', err)
    useToast().add({ title: 'Erro ao salvar', color: 'red' })
  } finally {
    saving.value = false
  }
}

const deleteItem = async (id: string) => {
  if (!confirm('Deseja excluir esta tag?')) return
  
  try {
    await $fetch(`/api/workspace/${props.workspaceId}/tags/${id}`, {
      method: 'DELETE'
    })
    await fetchItems()
    useToast().add({ title: 'Tag excluída!', color: 'green' })
  } catch (err) {
    console.error('Error deleting tag:', err)
  }
}

onMounted(fetchItems)
</script>
