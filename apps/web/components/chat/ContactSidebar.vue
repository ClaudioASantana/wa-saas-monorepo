<template>
  <div class="hidden lg:flex w-64 border-l border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex-col shrink-0">
    <div class="p-4 border-b border-slate-200 dark:border-slate-800">
      <h2 class="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Detalhes do Contato
      </h2>
    </div>
    <div class="p-4 space-y-4 flex-1 overflow-y-auto">
      <template v-if="contact">
        <div class="text-center">
          <UAvatar
            :alt="contact.name || '?'"
            size="xl"
            class="mx-auto"
          />
          <p class="mt-2 font-semibold text-slate-900 dark:text-white text-sm">
            {{ contact.name || 'Desconhecido' }}
          </p>
          <p class="text-xs text-slate-500">
            {{ contact.phone }}
          </p>
        </div>
        <UDivider />
        <div class="space-y-2">
          <div class="flex items-center space-x-2 text-xs text-slate-500">
            <UIcon
              name="i-heroicons-calendar"
              class="w-4 h-4"
            />
            <span>Desde {{ formatDate(createdAt || '') }}</span>
          </div>
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-medium text-slate-500">
              Anotações
            </p>
            <UButton
              v-if="notes !== contact.notes"
              size="xs"
              variant="ghost"
              color="primary"
              :loading="saving"
              @click="$emit('save-notes', notes)"
            >
              Salvar
            </UButton>
          </div>
          <UTextarea
            v-model="notes"
            placeholder="Notas sobre este contato..."
            :rows="4"
            class="text-sm"
            :disabled="saving"
          />
        </div>
      </template>
      <div
        v-else
        class="flex flex-col items-center justify-center h-full text-center"
      >
        <UIcon
          name="i-heroicons-user"
          class="w-8 h-8 text-slate-200 mb-2"
        />
        <p class="text-xs text-slate-400">
          Selecione uma conversa
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Contact } from '~/types/chat.types'

const props = defineProps<{
  contact: Contact | null
  createdAt?: string
  saving?: boolean
}>()

defineEmits(['save-notes'])
const notes = ref(props.contact?.notes || '')

watch(() => props.contact?.notes, (newNotes) => {
  notes.value = newNotes || ''
})

const formatDate = (iso: string) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR')
}
</script>
