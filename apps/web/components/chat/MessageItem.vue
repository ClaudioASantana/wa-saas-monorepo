<template>
  <div
    class="flex flex-col"
    :class="[
      message.type === 'system' ? 'items-center my-4' : (isOutbound ? 'items-end' : 'items-start')
    ]"
  >
    <!-- System Message -->
    <template v-if="message.type === 'system'">
      <div class="px-3 py-1 bg-slate-100 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700">
        <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <UIcon name="i-heroicons-information-circle" class="w-3.5 h-3.5" />
          {{ message.content }}
        </p>
      </div>
    </template>

    <!-- Normal Message / Internal Note -->
    <template v-else>
      <div
        class="rounded-lg p-3 max-w-xs lg:max-w-md shadow-sm relative group"
        :class="[
          isOutbound 
            ? 'bg-primary-500 text-white rounded-tr-none' 
            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none',
          message.is_internal ? '!bg-amber-100 dark:!bg-amber-900/30 !border-amber-200 dark:!border-amber-800 !text-amber-900 dark:!text-amber-100 !rounded-lg' : ''
        ]"
      >
        <div v-if="message.is_internal" class="flex items-center gap-1 mb-1 opacity-70 underline decoration-amber-300 dark:decoration-amber-700 underline-offset-2">
          <UIcon name="i-heroicons-lock-closed" class="w-3 h-3" />
          <span class="text-[10px] font-bold uppercase">Nota Interna</span>
        </div>

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
    </template>
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
