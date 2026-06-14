<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950">
    <!-- Navbar simples -->
    <nav
      class="bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <span
              class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-700"
            >Flux CRM</span>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm font-medium text-slate-700 dark:text-slate-300">{{
              user?.email
            }}</span>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-arrow-right-on-rectangle"
              :loading="loading"
              @click="logout"
            />
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Meus Workspaces
          </h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gerencie suas agências e clientes a partir daqui.
          </p>
        </div>
        <UButton
          icon="i-heroicons-plus"
          color="primary"
          @click="isModalOpen = true"
        >
          Novo Workspace
        </UButton>
      </div>

      <!-- Workspaces Grid -->
      <div
        v-if="pending"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-48 w-full"
        />
      </div>

      <div
        v-else-if="workspaces?.length === 0"
        class="text-center py-24 px-6 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl"
      >
        <UIcon
          name="i-heroicons-building-office-2"
          class="mx-auto h-12 w-12 text-slate-400"
        />
        <h3 class="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
          Nenhum workspace
        </h3>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Comece criando um novo workspace para sua equipe.
        </p>
        <div class="mt-6">
          <UButton
            icon="i-heroicons-plus"
            @click="isModalOpen = true"
          >
            Criar Workspace
          </UButton>
        </div>
      </div>

      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <UCard
          v-for="rel in workspaces"
          :key="rel.workspace_id"
          class="transition-all hover:shadow-lg hover:ring-primary-500/50 cursor-pointer group"
          @click="navigateTo(`/workspace/${rel.workspace_id}/dashboard`)"
        >
          <div class="flex justify-between items-start">
            <div class="flex items-center space-x-3">
              <UAvatar
                :alt="rel.workspaces.name"
                size="lg"
                class="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-bold"
              />
              <div>
                <h3
                  class="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                >
                  {{ rel.workspaces.name }}
                </h3>
                <UBadge
                  :color="rel.role === 'owner' ? 'primary' : 'gray'"
                  variant="subtle"
                  size="xs"
                  class="mt-1 capitalize"
                >
                  {{ rel.role }}
                </UBadge>
              </div>
            </div>
            <UIcon
              name="i-heroicons-chevron-right"
              class="w-5 h-5 text-slate-400 group-hover:text-primary-500 transition-colors"
            />
          </div>
        </UCard>
      </div>
    </div>

    <!-- Create Workspace Modal -->
    <UModal v-model="isModalOpen">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              Criar Novo Workspace
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="isModalOpen = false"
            />
          </div>
        </template>

        <template #default>
          <form
            class="space-y-4"
            @submit.prevent="createWorkspace"
          >
            <UFormGroup
              label="Nome do Workspace"
              required
            >
              <UInput
                v-model="newWorkspaceName"
                placeholder="Ex: Agência Plus"
                icon="i-heroicons-building-office"
              />
            </UFormGroup>
            <div
              v-if="createError"
              class="text-sm text-red-500"
            >
              {{ createError }}
            </div>
          </form>
        </template>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton
              color="gray"
              variant="ghost"
              @click="isModalOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              :loading="creatingWorkspace"
              @click="createWorkspace"
            >
              Salvar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

const { user, logout, loading } = useAuth()
const supabase = useSupabaseClient()

// Modal State
const isModalOpen = ref(false)
const newWorkspaceName = ref('')
const creatingWorkspace = ref(false)
const createError = ref('')

// (useToast removido no root para evitar erro de SSR)

// Busca os workspaces onde o usuário está vinculado
const {
  data: workspaces,
  pending,
  refresh,
} = await useAsyncData('user-workspaces', async () => {
  // Usar getSession() garante o ID mesmo se a reatividade do Vue/Nuxt falhar
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user?.id
  if (!userId) return []

  const { data, error } = await (supabase as any)
    .from('user_workspaces')
    .select(
      `
      workspace_id,
      role,
      workspaces ( name )
    `
    )
    .eq('user_id', userId)

  if (error) throw error
  return data
})

const createWorkspace = async () => {
  if (!newWorkspaceName.value.trim()) return

  let currentUserId = user.value?.id

  // Fallback de segurança caso a reatividade do Vue/Nuxt tenha se perdido na hidratação
  if (!currentUserId) {
    const { data } = await supabase.auth.getSession()
    currentUserId = data.session?.user?.id
  }

  if (!currentUserId) {
    createError.value = 'Você precisa estar logado para criar um workspace.'
    return
  }

  creatingWorkspace.value = true
  createError.value = ''

  try {
    const payload = {
      name: newWorkspaceName.value,
      owner_id: currentUserId,
    }

    console.log('Sending Payload:', payload)

    const { data, error } = await (supabase as any).from('workspaces').insert(payload).select().single()

    if (error) {
      console.error('Supabase Error:', error)
      throw error
    }

    console.log('Workspace Created:', data)

    // Cria explicitamente o vínculo owner em user_workspaces.
    // Não dependemos do trigger on_workspace_created, que pode falhar silenciosamente no ambiente local.
    const { error: linkError } = await (supabase as any).from('user_workspaces').insert({
      user_id: currentUserId,
      workspace_id: data.id,
      role: 'owner',
    })

    if (linkError) {
      console.error('Supabase Link Error:', linkError)
      throw linkError
    }

    // Limpar modal e atualizar lista
    isModalOpen.value = false
    newWorkspaceName.value = ''
    useToast().add({ title: 'Workspace criado com sucesso!', icon: 'i-heroicons-check-circle' })
    refresh()
  } catch (err: any) {
    createError.value = err.message || 'Erro ao criar workspace.'
  } finally {
    creatingWorkspace.value = false
  }
}
</script>
