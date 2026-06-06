<template>
  <div class="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950">
    <!-- Sidebar -->
    <aside
      class="w-64 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
    >
      <!-- Logo / Header -->
      <div
        class="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 shrink-0"
      >
        <span
          class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-700 truncate"
        >
          {{ workspaceName }}
        </span>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <UButton
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          variant="ghost"
          color="gray"
          class="w-full justify-start text-sm"
          :icon="link.icon"
          active-class="bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400 font-medium"
        >
          {{ link.label }}
        </UButton>
      </nav>

      <!-- Footer / Switch Workspace -->
      <div class="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <UButton
          to="/"
          variant="ghost"
          color="gray"
          class="w-full justify-start text-sm"
          icon="i-heroicons-arrow-left-on-rectangle"
        >
          Trocar Workspace
        </UButton>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Topbar Header -->
      <header
        class="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur z-10 shrink-0"
      >
        <div class="flex items-center space-x-4">
          <UBadge 
            :color="hasConnectedChannel ? 'green' : 'red'" 
            variant="subtle" 
            size="sm"
          >
            WhatsApp {{ hasConnectedChannel ? 'Conectado' : 'Desconectado' }}
          </UBadge>
        </div>
        <div class="flex items-center space-x-3">
          <UDropdown
            :items="userMenuItems"
            :popper="{ placement: 'bottom-end' }"
          >
            <UButton
              color="gray"
              variant="ghost"
              class="flex items-center gap-2"
            >
              <UAvatar
                :src="avatarPublicUrl || undefined"
                :alt="user?.email"
                size="sm"
              />
              <span class="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                {{ userProfile?.name || user?.email }}
              </span>
              <UIcon
                name="i-heroicons-chevron-down-20-solid"
                class="w-4 h-4 text-slate-400"
              />
            </UButton>
          </UDropdown>
        </div>
      </header>

      <!-- Subscription Alert -->
      <div
        v-if="workspaceDetails?.subscription_status === 'canceled' || workspaceDetails?.subscription_status === 'past_due' || workspaceDetails?.subscription_status === 'unpaid'"
        class="bg-red-500 text-white px-4 py-2 text-sm text-center font-medium shrink-0"
      >
        A assinatura deste workspace está pendente ou cancelada. O acesso a algumas funcionalidades pode estar restrito.
        <NuxtLink
          :to="`/workspace/${workspaceId}/assinatura`"
          class="underline ml-2"
        >
          Regularizar Assinatura
        </NuxtLink>
      </div>

      <!-- Dynamic Page Content -->
      <main class="flex-1 overflow-auto relative">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const workspaceId = route.params.id as string

const { user, logout } = useAuth()
const supabase = useSupabaseClient()

const workspaceName = ref('Carregando...')
const hasConnectedChannel = ref(false)
const workspaceDetails = ref<any>(null)

// Busca nome do banco para a UI do menu
useAsyncData(`workspace-name-${workspaceId}`, async () => {
  const { data } = await supabase.from('workspaces').select('name, subscription_status').eq('id', workspaceId).single() as any

  if (data) {
    workspaceName.value = data.name
    workspaceDetails.value = data
  }
  return data
})

// Verifica se há canais conectados
useAsyncData(`workspace-status-${workspaceId}`, async () => {
  const { count } = await supabase
    .from('channels')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', 'connected')

  hasConnectedChannel.value = (count ?? 0) > 0
  return count
})

const links = [
  { label: 'Dashboard', to: `/workspace/${workspaceId}/dashboard`, icon: 'i-heroicons-home' },
  {
    label: 'Chat (Atendimento)',
    to: `/workspace/${workspaceId}/chat`,
    icon: 'i-heroicons-chat-bubble-left-right',
  },
  { label: 'CRM (Kanban)', to: `/workspace/${workspaceId}/crm`, icon: 'i-heroicons-view-columns' },
  {
    label: 'Canais',
    to: `/workspace/${workspaceId}/canais`,
    icon: 'i-heroicons-device-phone-mobile',
  },
  {
    label: 'Configurações',
    to: `/workspace/${workspaceId}/configuracoes`,
    icon: 'i-heroicons-cog-8-tooth',
  },
  {
    label: 'Assinatura',
    to: `/workspace/${workspaceId}/assinatura`,
    icon: 'i-heroicons-credit-card',
  },
]

// ----------------------------------------------------------------------------
// User Profile & Menu
// ----------------------------------------------------------------------------
const userProfile = ref<{ name?: string, avatar_url?: string | null } | null>(null)

useAsyncData('user-profile', async () => {
  if (!user.value) return null
  const { data } = (await supabase.from('profiles').select('name, avatar_url').eq('id', user.value.id).single()) as any
  userProfile.value = data
  return data
})

const avatarPublicUrl = computed(() => {
  if (!userProfile.value?.avatar_url) return null
  const { data } = supabase.storage.from('avatars').getPublicUrl(userProfile.value.avatar_url)
  return data.publicUrl
})

const userMenuItems = [
  [{
    label: 'Meu Perfil',
    icon: 'i-heroicons-user-circle',
    to: '/perfil'
  }],
  [{
    label: 'Sair',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    click: logout
  }]
]
</script>
