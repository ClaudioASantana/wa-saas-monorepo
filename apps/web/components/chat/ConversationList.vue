<template>
  <div class="w-80 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col shrink-0">
    <div class="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
      <h2 class="text-lg font-bold text-slate-900 dark:text-white">
        Conversas
      </h2>
      <UInput
        v-model="searchLocal"
        icon="i-heroicons-magnifying-glass-20-solid"
        size="sm"
        color="white"
        :trailing="false"
        placeholder="Pesquisar..."
      />
      <div class="flex space-x-2">
        <UButton
          v-for="btn in filterButtons"
          :key="btn.value"
          size="xs"
          :color="filterLocal === btn.value ? 'primary' : 'gray'"
          :variant="filterLocal === btn.value ? 'soft' : 'ghost'"
          @click="filterLocal = btn.value"
        >
          {{ btn.label }}
        </UButton>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <!-- Loading -->
      <div
        v-if="pending"
        class="p-4 space-y-3"
      >
        <USkeleton
          v-for="i in 4"
          :key="i"
          class="h-16 w-full"
        />
      </div>

      <div
        v-else-if="!conversations.length"
        class="flex flex-col items-center justify-center h-full text-center p-6"
      >
        <UIcon
          name="i-heroicons-chat-bubble-left-right"
          class="w-10 h-10 text-slate-300 mb-3"
        />
        <p class="text-sm text-slate-500">
          Nenhuma conversa ainda.
        </p>
        <p class="text-xs text-slate-400 mt-1">
          As mensagens aparecerão quando chegarem.
        </p>
      </div>

      <!-- List -->
      <div
        v-for="conv in conversations"
        :key="conv.id"
        class="p-4 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors"
        :class="selectedId === conv.id ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'"
        @click="$emit('select', conv)"
      >
        <div class="flex items-start space-x-3">
          <UAvatar
            :alt="conv.contact?.name || conv.contact?.phone || '?'"
            size="md"
          />
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-baseline mb-1">
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {{ conv.contact?.name || conv.contact?.phone }}
              </h3>
              <span class="text-xs text-slate-500 shrink-0 ml-2">
                {{ formatTime(conv.last_message_at) }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <p 
                v-if="typingAgents[conv.id]?.size > 0"
                class="text-sm text-primary-500 font-medium truncate flex-1 mr-2"
              >
                Digitando...
              </p>
              <p 
                v-else
                class="text-sm text-slate-500 dark:text-slate-400 truncate flex-1 mr-2"
              >
                {{ conv.last_message_preview || '...' }}
              </p>
              <UIcon
                v-if="conv.agent_id"
                v-tooltip="conv.agent?.name || 'Atribuído'"
                :name="conv.agent_id === currentAgentId ? 'i-heroicons-user-circle-20-solid' : 'i-heroicons-user-circle'"
                class="w-4 h-4 shrink-0"
                :class="conv.agent_id === currentAgentId ? 'text-primary-500' : 'text-slate-400'"
              />
            </div>
          </div>
          <span
            v-if="conv.unread_count > 0"
            class="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center shrink-0 font-bold"
          >
            {{ conv.unread_count }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Conversation } from '~/types/chat.types'

const props = defineProps<{
  conversations: Conversation[]
  selectedId?: string
  pending?: boolean
  search: string
  filter: string
  currentAgentId?: string
  typingAgents: Record<string, Set<string>>
}>()

const emit = defineEmits(['update:search', 'update:filter', 'select'])

const searchLocal = computed({
  get: () => props.search,
  set: (val) => emit('update:search', val)
})

const filterLocal = computed({
  get: () => props.filter,
  set: (val) => emit('update:filter', val)
})

const filterButtons = [
  { label: 'Todas', value: 'all' },
  { label: 'Minhas', value: 'mine' },
  { label: 'Abertas', value: 'open' },
  { label: 'Resolvidas', value: 'resolved' }
]

const formatTime = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  return isToday
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
</script>
