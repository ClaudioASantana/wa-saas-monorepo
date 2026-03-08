<template>
  <div class="p-6 space-y-8">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Gerencie as configurações gerais do seu workspace.
      </p>
    </div>

    <!-- Workspace Settings -->
    <UCard>
      <template #header>
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Informações do Workspace
        </h3>
      </template>
      <template #default>
        <form @submit.prevent="saveSettings" class="space-y-4">
          <UFormGroup label="Nome do Workspace">
            <UInput
              v-model="settings.name"
              placeholder="Nome da sua agência"
              icon="i-heroicons-building-office"
            />
          </UFormGroup>
          <div class="flex justify-end">
            <UButton type="submit" color="primary" :loading="saving">Salvar Alterações</UButton>
          </div>
        </form>
      </template>
    </UCard>

    <!-- Danger Zone -->
    <UCard :ui="{ ring: 'ring-1 ring-red-300 dark:ring-red-800' }">
      <template #header>
        <h3 class="text-base font-semibold text-red-600 dark:text-red-400">Zona de Perigo</h3>
      </template>
      <template #default>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-slate-900 dark:text-white">Excluir Workspace</p>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Esta ação é irreversível. Todos os dados serão permanentemente removidos.
            </p>
          </div>
          <UButton color="red" variant="soft" icon="i-heroicons-trash"> Excluir Workspace </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'workspace',
  middleware: ['auth'],
})

const route = useRoute()
const supabase = useSupabaseClient()
const workspaceId = route.params.id as string

const saving = ref(false)
const settings = ref({ name: '' })

// Load workspace name
const { data } = await useAsyncData(`settings-${workspaceId}`, async () => {
  const { data } = await supabase.from('workspaces').select('name').eq('id', workspaceId).single()
  return data
})

if (data.value) {
  settings.value.name = data.value.name
}

const saveSettings = async () => {
  saving.value = true
  const { error } = await supabase
    .from('workspaces')
    .update({ name: settings.value.name })
    .eq('id', workspaceId)

  if (error) {
    useToast().add({ title: 'Erro ao salvar', color: 'red', icon: 'i-heroicons-x-circle' })
  } else {
    useToast().add({ title: 'Salvo com sucesso!', icon: 'i-heroicons-check-circle' })
  }
  saving.value = false
}
</script>
