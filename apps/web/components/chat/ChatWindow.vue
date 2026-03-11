<template>
  <div class="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 min-w-0">
    <div
      v-if="!conversation"
      class="flex-1 flex flex-col items-center justify-center text-center p-6"
    >
      <UIcon
        name="i-heroicons-chat-bubble-oval-left-ellipsis"
        class="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4"
      />
      <h3 class="text-base font-semibold text-slate-400">
        Selecione uma conversa
      </h3>
      <p class="text-sm text-slate-400 mt-1">
        Clique em uma conversa ao lado para começar.
      </p>
    </div>

    <template v-else>
      <div class="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur flex items-center justify-between px-6 shrink-0">
        <div class="flex items-center space-x-3">
          <UAvatar
            :alt="conversation.contact?.name || conversation.contact?.phone || '?'"
            size="md"
          />
          <div>
            <h2 class="text-base font-semibold text-slate-900 dark:text-white">
              {{ conversation.contact?.name || conversation.contact?.phone }}
            </h2>
            <p class="text-xs text-slate-500">
              {{ conversation.contact?.phone }}
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <UBadge
            :color="conversation.status === 'open' ? 'green' : 'gray'"
            variant="subtle"
            size="xs"
          >
            {{ conversation.status === 'open' ? 'Aberta' : 'Resolvida' }}
          </UBadge>
          <UButton
            :loading="resolving"
            icon="i-heroicons-check-circle"
            color="gray"
            variant="ghost"
            size="sm"
            @click="$emit('resolve')"
          >
            Resolver
          </UButton>
        </div>
      </div>

      <!-- Messages -->
      <div ref="container" class="flex-1 overflow-y-auto p-6 space-y-3">
        <div v-if="pending" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-primary-400 animate-spin" />
        </div>
        <template v-else>
          <div v-if="!messages.length" class="text-center text-slate-400 text-sm py-8">
            Nenhuma mensagem ainda nesta conversa.
          </div>
          <MessageItem v-for="msg in messages" :key="msg.id" :message="msg" />
        </template>
      </div>

      <!-- Input -->
      <div class="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <form class="flex items-end space-x-2 max-w-4xl mx-auto" @submit.prevent="handleSend">
          <UTextarea
            v-model="input"
            autoresize
            :rows="1"
            :maxrows="5"
            placeholder="Digite uma mensagem... (Enter para enviar)"
            class="flex-1"
            @keydown.enter.exact.prevent="handleSend"
          />
          <UButton type="submit" icon="i-heroicons-paper-airplane" color="primary" class="shrink-0" :loading="sending" :disabled="!input.trim()" />
        </form>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Conversation, Message } from '~/types/chat.types'
import MessageItem from './MessageItem.vue'

const props = defineProps<{
  conversation: Conversation | null
  messages: Message[]
  pending?: boolean
  sending?: boolean
  resolving?: boolean
}>()

const emit = defineEmits(['send', 'resolve'])
const input = ref('')
const container = ref<HTMLElement | null>(null)

const handleSend = () => {
  if (!input.value.trim()) return
  emit('send', input.value)
  input.value = ''
}

// Auto-scroll
watch(() => props.messages, async () => {
  await nextTick()
  if (container.value) {
    container.value.scrollTop = container.value.scrollHeight
  }
}, { deep: true })
</script>
