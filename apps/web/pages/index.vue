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
            Meu Workspace
          </h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gerencie sua agência e clientes a partir daqui.
          </p>
        </div>
      </div>

      <div
        v-if="!user?.tenant"
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
          Você não está vinculado a nenhum workspace.
        </p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <UCard
          class="transition-all hover:shadow-lg hover:ring-primary-500/50 cursor-pointer group"
          @click="navigateTo(`/workspace/${user.tenant.id}/dashboard`)"
        >
          <div class="flex justify-between items-start">
            <div class="flex items-center space-x-3">
              <UAvatar
                :alt="user.tenant.name"
                size="lg"
                class="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-bold"
              />
              <div>
                <h3
                  class="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                >
                  {{ user.tenant.name }}
                </h3>
                <UBadge
                  color="primary"
                  variant="subtle"
                  size="xs"
                  class="mt-1 capitalize"
                >
                  {{ user.role || 'Agent' }}
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

const { user, logout, loading } = useAuth()
</script>
