<template>
  <div class="flex items-center gap-2">
    <!-- Unassigned: Show Take Button -->
    <UButton
      v-if="!conversation.agent_id"
      icon="i-heroicons-user-plus"
      color="primary"
      variant="soft"
      size="sm"
      :loading="loading"
      @click="handleAssign(currentAgentId)"
    >
      Assumir
    </UButton>

    <!-- Assigned to Me: Show Release Button -->
    <template v-else-if="conversation.agent_id === currentAgentId">
      <UButton
        icon="i-heroicons-user-minus"
        color="red"
        variant="ghost"
        size="sm"
        :loading="loading"
        @click="handleAssign(null)"
      >
        Liberar
      </UButton>
      <UBadge
        color="primary"
        variant="subtle"
        size="xs"
        class="flex items-center gap-1"
      >
        <UIcon name="i-heroicons-user-circle" />
        Minha
      </UBadge>
    </template>

    <!-- Assigned to Others: Show Agent Name + Reassign Popover -->
    <template v-else>
      <UPopover :popper="{ placement: 'bottom-end' }">
        <UButton
          color="gray"
          variant="ghost"
          size="sm"
          class="flex items-center gap-1"
        >
          <UAvatar
            :alt="conversation.agent?.name || 'Agente'"
            size="xs"
            class="mr-1"
          />
          <span class="max-w-[100px] truncate text-xs">{{ conversation.agent?.name || 'Agente' }}</span>
          <UIcon name="i-heroicons-chevron-down" class="w-3 h-3 text-slate-400" />
        </UButton>

        <template #panel>
          <div class="p-2 w-48 space-y-2">
            <p class="text-[10px] font-bold text-slate-400 uppercase px-1">
              Atribuir a
            </p>
            <div class="space-y-1">
              <UButton
                block
                size="xs"
                variant="ghost"
                color="primary"
                class="justify-start"
                @click="handleAssign(currentAgentId || null)"
              >
                Assumir para mim
              </UButton>
              <UButton
                block
                size="xs"
                variant="ghost"
                color="red"
                class="justify-start"
                @click="handleAssign(null)"
              >
                Liberar conversa
              </UButton>
            </div>
          </div>
        </template>
      </UPopover>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Conversation } from '~/types/chat.types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
  conversation: Conversation
  currentAgentId?: string
}>()

const emit = defineEmits(['assign'])
const loading = ref(false)

const handleAssign = async (agentId: string | null) => {
  loading.value = true
  try {
    await emit('assign', agentId)
  } finally {
    loading.value = false
  }
}
</script>
