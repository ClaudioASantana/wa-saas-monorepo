<template>
  <div
    class="flex"
    :class="isOutbound ? 'justify-end' : 'justify-start'"
  >
    <div
      class="rounded-lg p-3 max-w-xs lg:max-w-md shadow-sm"
      :class="isOutbound 
        ? 'bg-primary-500 text-white rounded-tr-none' 
        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none'"
    >
      <!-- Audio -->
      <audio
        v-if="message.type === 'audio' && message.media_url"
        :src="message.media_url"
        controls
        class="max-w-full"
      />
      <!-- Image -->
      <img
        v-else-if="message.type === 'image' && message.media_url"
        :src="message.media_url"
        class="rounded-md max-w-full mb-1"
      >
      <!-- Text -->
      <p class="text-sm whitespace-pre-wrap break-words">
        {{ message.body || message.content }}
      </p>
      <span class="text-[10px] mt-1 block text-right opacity-60">
        {{ formatTime(message.created_at || message.sent_at) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Message } from '~/types/chat.types'

const props = defineProps<{
  message: Message
}>()

const isOutbound = computed(() => props.message.direction === 'outbound')

const formatTime = (iso: string) => {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
</script>
