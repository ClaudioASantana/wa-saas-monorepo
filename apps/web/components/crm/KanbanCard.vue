<template>
  <div 
    class="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 cursor-move relative hover:border-primary-500 transition-colors"
    @click="$emit('open-chat', card.conversation_id)"
  >
    <div class="flex justify-between items-start mb-2">
      <div class="font-medium text-sm text-gray-900 dark:text-white truncate pr-6">
        {{ card.conversation?.contact?.name || 'Desconhecido' }}
      </div>
      <UButton
        icon="i-heroicons-x-mark"
        color="gray"
        variant="ghost"
        size="2xs"
        class="absolute top-2 right-2"
        @click="$emit('remove', card.id)"
      />
    </div>
    <div class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
      {{ card.conversation?.last_message_preview || 'Nenhuma mensagem' }}
    </div>
    <div class="flex justify-between items-center mt-2">
      <span class="text-[10px] text-gray-400">
        {{ card.conversation?.last_message_at ? new Date(card.conversation.last_message_at).toLocaleDateString() : '' }}
      </span>
      <UBadge
        v-if="hasNewMessages"
        color="red"
        size="xs"
      >
        Nova Mensagem
      </UBadge>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  card: {
    type: Object,
    required: true
  },
  hasNewMessages: {
    type: Boolean,
    default: false
  }
})

defineEmits(['remove', 'open-chat'])
</script>
