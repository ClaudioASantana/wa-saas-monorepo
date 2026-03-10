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
          <!-- TODO: Evolution API Connection Status Widget -->
          <UBadge color="red" variant="subtle" size="sm">WhatsApp Desconectado</UBadge>
        </div>
        <div class="flex items-center space-x-3">
          <span class="text-sm font-medium text-slate-700 dark:text-slate-300">{{
            user?.email
          }}</span>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-arrow-right-on-rectangle"
            @click="logout"
          />
        </div>
      </header>

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

// Busca nome do banco para a UI do menu
useAsyncData(`workspace-name-${workspaceId}`, async () => {
  const { data } = await supabase.from('workspaces').select('name').eq('id', workspaceId).single()

  if (data) {
    workspaceName.value = data.name
  }
  return data
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
]
</script>
