<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Visão geral do workspace.
        </p>
      </div>
      <UButton
        icon="i-heroicons-arrow-path"
        color="gray"
        variant="ghost"
        size="sm"
        :loading="pending"
        @click="refresh"
      >
        Atualizar
      </UButton>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
              Conversas Abertas
            </p>
            <p class="text-3xl font-bold text-slate-900 dark:text-white mt-1">
              <span v-if="pending"><USkeleton class="h-8 w-12" /></span>
              <span v-else>{{ metrics?.openConversations ?? 0 }}</span>
            </p>
          </div>
          <div class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <UIcon
              name="i-heroicons-chat-bubble-left-right"
              class="w-5 h-5 text-blue-500"
            />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
              Mensagens Hoje
            </p>
            <p class="text-3xl font-bold text-slate-900 dark:text-white mt-1">
              <span v-if="pending"><USkeleton class="h-8 w-12" /></span>
              <span v-else>{{ metrics?.messagesToday ?? 0 }}</span>
            </p>
          </div>
          <div class="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
            <UIcon
              name="i-heroicons-chat-bubble-oval-left-ellipsis"
              class="w-5 h-5 text-green-500"
            />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total de Contatos
            </p>
            <p class="text-3xl font-bold text-slate-900 dark:text-white mt-1">
              <span v-if="pending"><USkeleton class="h-8 w-12" /></span>
              <span v-else>{{ metrics?.totalContacts ?? 0 }}</span>
            </p>
          </div>
          <div class="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
            <UIcon
              name="i-heroicons-users"
              class="w-5 h-5 text-violet-500"
            />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
              Resolvidas Hoje
            </p>
            <p class="text-3xl font-bold text-slate-900 dark:text-white mt-1">
              <span v-if="pending"><USkeleton class="h-8 w-12" /></span>
              <span v-else>{{ metrics?.resolvedToday ?? 0 }}</span>
            </p>
          </div>
          <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <UIcon
              name="i-heroicons-check-circle"
              class="w-5 h-5 text-emerald-500"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Recent Conversations -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-slate-900 dark:text-white">
            Conversas Recentes
          </h2>
          <UButton
            :to="`/workspace/${workspaceId}/chat`"
            size="xs"
            color="gray"
            variant="ghost"
            icon="i-heroicons-arrow-right"
            trailing
          >
            Ver todas
          </UButton>
        </div>
      </template>

      <div
        v-if="pending"
        class="space-y-3"
      >
        <USkeleton
          v-for="i in 5"
          :key="i"
          class="h-14 w-full"
        />
      </div>

      <div
        v-else-if="!recentConversations?.length"
        class="text-center py-8"
      >
        <UIcon
          name="i-heroicons-chat-bubble-left-right"
          class="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3"
        />
        <p class="text-sm text-slate-500">
          Nenhuma conversa ainda.
        </p>
        <p class="text-xs text-slate-400 mt-1">
          As mensagens aparecerão aqui quando chegarem via Evolution API.
        </p>
      </div>

      <ul
        v-else
        class="divide-y divide-slate-100 dark:divide-slate-800"
      >
        <li
          v-for="conv in recentConversations"
          :key="conv.id"
          class="flex items-center justify-between py-3 gap-4"
        >
          <div class="flex items-center gap-3 min-w-0">
            <UAvatar
              :alt="conv.contact?.name || conv.contact?.phone || '?'"
              size="sm"
            />
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {{ conv.contact?.name || conv.contact?.phone || 'Desconhecido' }}
              </p>
              <p class="text-xs text-slate-500 truncate">
                {{ conv.last_message_preview || '—' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <UBadge
              :color="conv.status === 'open' ? 'green' : 'gray'"
              variant="subtle"
              size="xs"
            >
              {{ conv.status === 'open' ? 'Aberta' : 'Resolvida' }}
            </UBadge>
            <span class="text-xs text-slate-400">{{ formatTime(conv.last_message_at) }}</span>
          </div>
        </li>
      </ul>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'workspace', middleware: ['auth'] })

const route = useRoute()
const workspaceId = route.params.id as string
const { token } = useAuth()
const config = useRuntimeConfig()
const API_URL = config.public.apiUrl as string

interface Metrics {
  openConversations: number
  messagesToday: number
  totalContacts: number
  resolvedToday: number
}

interface RecentConv {
  id: string
  status: string
  last_message_at: string | null
  last_message_preview: string | null
  contact: { name: string | null; phone: string } | null
}

const todayStart = new Date()
todayStart.setHours(0, 0, 0, 0)

const {
  data,
  pending,
  refresh,
} = await useAsyncData(`dashboard-${workspaceId}`, async () => {
  try {
    const result = await $fetch<{ metrics: Metrics, recentConversations: RecentConv[] }>(`${API_URL}/workspace/${workspaceId}/dashboard`, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    return result
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      metrics: {
        openConversations: 0,
        messagesToday: 0,
        totalContacts: 0,
        resolvedToday: 0
      },
      recentConversations: []
    }
  }
})

const metrics = computed(() => data.value?.metrics)
const recentConversations = computed(() => data.value?.recentConversations)

const formatTime = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  return isToday
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
</script>
