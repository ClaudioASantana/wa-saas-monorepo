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
      <div
        class="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur flex items-center justify-between px-6 shrink-0"
      >
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
          
          <UDivider
            v-if="activeAgents.length > 0"
            orientation="vertical"
            class="h-8 mx-2"
          />
          
          <!-- Presence Avatars -->
          <UAvatarGroup
            v-if="activeAgents.length > 0"
            size="sm"
            :max="3"
            class="flex-row-reverse"
          >
            <UAvatar
              v-for="agentId in activeAgents"
              :key="agentId"
              src="https://github.com/nutritious-code.png"
              :alt="agentId"
              class="border-2 border-white dark:border-slate-900"
            />
          </UAvatarGroup>
        </div>
        <div class="flex items-center space-x-2">
          <!-- Assign Button -->
          <UButton
            v-if="!conversation.agent_id"
            icon="i-heroicons-user-plus"
            color="primary"
            variant="soft"
            size="sm"
            @click="$emit('assign', currentAgentId)"
          >
            Assumir
          </UButton>
          <UButton
            v-else-if="conversation.agent_id === currentAgentId"
            icon="i-heroicons-user-minus"
            color="red"
            variant="ghost"
            size="sm"
            @click="$emit('assign', null)"
          >
            Liberar
          </UButton>
          <UBadge
            v-else
            color="gray"
            variant="subtle"
            size="xs"
            class="flex items-center gap-1"
          >
            <UIcon name="i-heroicons-user" />
            {{ conversation.agent?.name || 'Agente' }}
          </UBadge>

          <UDivider
            orientation="vertical"
          />

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
      <div
        ref="container"
        class="flex-1 overflow-y-auto p-6 space-y-3"
      >
        <div v-if="pending" class="flex justify-center py-8">
          <UIcon
            name="i-heroicons-arrow-path"
            class="w-6 h-6 text-primary-400 animate-spin"
          />
        </div>
        <template v-else>
          <div v-if="!messages.length" class="text-center text-slate-400 text-sm py-8">
            Nenhuma mensagem ainda nesta conversa.
          </div>
          <MessageItem
            v-for="msg in messages"
            :key="msg.id"
            :message="msg"
          />
          <!-- Typing Indicator -->
          <div 
            v-if="typingAgents.length > 0" 
            class="flex items-center space-x-2 text-slate-400 text-xs italic"
          >
            <div class="flex space-x-1">
              <span 
                class="w-1 h-1 bg-slate-300 rounded-full animate-bounce" 
                style="animation-delay: 0ms"
              />
              <span 
                class="w-1 h-1 bg-slate-300 rounded-full animate-bounce" 
                style="animation-delay: 150ms"
              />
              <span 
                class="w-1 h-1 bg-slate-300 rounded-full animate-bounce" 
                style="animation-delay: 300ms"
              />
            </div>
            <span>{{ typingAgents.length === 1 ? 'Alguém está digitando...' : 'Vários agentes estão digitando...' }}</span>
          </div>
        </template>
      </div>

      <!-- Input -->
      <div 
        class="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 relative transition-colors duration-200"
        :class="{ 'bg-amber-50/50 dark:bg-amber-900/10 border-t-amber-200 dark:border-t-amber-800': isInternal }"
      >
        <div v-if="isInternal" class="absolute top-0 left-0 right-0 h-1 bg-amber-400 dark:bg-amber-600" />
        
        <form
          class="flex items-end space-x-2 max-w-4xl mx-auto"
          @submit.prevent="handleSend"
        >
          <div class="flex-1 flex flex-col">
            <div v-if="isInternal" class="flex items-center gap-1.5 mb-2 px-1">
              <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 text-amber-600" />
              <span class="text-xs font-medium text-amber-700 dark:text-amber-400">Nota Interna (não enviada ao cliente)</span>
            </div>
            <UTextarea
              v-model="input"
              autoresize
              :rows="1"
              :maxrows="5"
              :placeholder="isInternal ? 'Escrever nota interna...' : 'Digite uma mensagem... (Enter para enviar)'"
              class="flex-1"
              :ui="{ base: isInternal ? ' ring-amber-400 focus:ring-amber-500' : '' }"
              @keydown.enter.exact.prevent="handleSend"
            />
          </div>
          
          <div class="flex items-center gap-2">
            <UTooltip :text="isInternal ? 'Voltar para Mensagem' : 'Alternar para Nota Interna'">
              <UButton
                type="button"
                :icon="isInternal ? 'i-heroicons-chat-bubble-left-right' : 'i-heroicons-pencil-square'"
                :color="isInternal ? 'amber' : 'gray'"
                variant="ghost"
                class="shrink-0"
                @click="isInternal = !isInternal"
              />
            </UTooltip>
            <UButton
              type="submit"
              icon="i-heroicons-paper-airplane"
              :color="isInternal ? 'amber' : 'primary'"
              class="shrink-0 transition-all"
              :loading="sending"
              :disabled="!input.trim()"
            />
          </div>
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
  currentAgentId?: string
  activeAgents: string[]
  typingAgents: string[]
}>()

const emit = defineEmits(['send', 'resolve', 'assign', 'typing'])
const input = ref('')
const isInternal = ref(false)
const container = ref<HTMLElement | null>(null)

// Typing debounce logic
let typingTimeout: NodeJS.Timeout | null = null
const isCurrentlyTyping = ref(false)

watch(input, (val) => {
  if (!val.trim()) {
    if (isCurrentlyTyping.value) {
      isCurrentlyTyping.value = false
      emit('typing', false)
    }
    return
  }

  if (!isCurrentlyTyping.value) {
    isCurrentlyTyping.value = true
    emit('typing', true)
  }

  if (typingTimeout) clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => {
    isCurrentlyTyping.value = false
    emit('typing', false)
  }, 2000) // Reset after 2 seconds of no input
})

const handleSend = () => {
  if (!input.value.trim()) return
  emit('send', input.value, isInternal.value)
  input.value = ''
  // Keep isInternal as is, or reset it? User might want to send multiple notes.
  // We'll reset it for now to avoid accidental internal messages.
  // Actually, keeping it might be better for "sessions" of notes.
  // Let's reset it to be safe.
  isInternal.value = false
}

// Auto-scroll
watch(() => props.messages, async () => {
  await nextTick()
  if (container.value) {
    container.value.scrollTop = container.value.scrollHeight
  }
}, { deep: true })
</script>
