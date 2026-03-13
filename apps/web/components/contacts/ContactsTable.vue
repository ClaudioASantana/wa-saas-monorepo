<!-- apps/web/components/contacts/ContactsTable.vue -->
<template>
  <div class="flex flex-col h-full">
    <!-- Search bar -->
    <div class="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
      <UInput
        v-model="searchQuery"
        icon="i-heroicons-magnifying-glass"
        placeholder="Buscar por nome ou telefone..."
        class="max-w-sm"
      />
    </div>

    <!-- Table -->
    <div class="flex-1 overflow-auto">
      <table class="w-full text-sm">
        <thead class="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th class="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Nome</th>
            <th class="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Telefone</th>
            <th class="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Última Conversa</th>
            <th class="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
            <th class="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Notas</th>
          </tr>
        </thead>
        <tbody>
          <!-- Skeleton loading -->
          <template v-if="loading">
            <tr v-for="i in 5" :key="i" class="border-b border-slate-100 dark:border-slate-800">
              <td class="px-4 py-3"><USkeleton class="h-4 w-32" /></td>
              <td class="px-4 py-3"><USkeleton class="h-4 w-28" /></td>
              <td class="px-4 py-3"><USkeleton class="h-4 w-24" /></td>
              <td class="px-4 py-3"><USkeleton class="h-5 w-14 rounded-full" /></td>
              <td class="px-4 py-3"><USkeleton class="h-4 w-40" /></td>
            </tr>
          </template>

          <!-- Data rows -->
          <template v-else>
            <tr
              v-for="contact in filteredContacts"
              :key="contact.id"
              class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              @click="emit('select', contact)"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <UAvatar :alt="contact.name || contact.phone" size="xs" />
                  <span class="font-medium text-slate-900 dark:text-white">
                    {{ contact.name || '—' }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-400">{{ contact.phone }}</td>
              <td class="px-4 py-3 text-slate-500 dark:text-slate-500 text-xs">
                {{ formatDate(contact.lastConversationAt) }}
              </td>
              <td class="px-4 py-3">
                <UBadge
                  :color="contact.is_active ? 'green' : 'gray'"
                  variant="subtle"
                  size="xs"
                >
                  {{ contact.is_active ? 'Ativo' : 'Inativo' }}
                </UBadge>
              </td>
              <td class="px-4 py-3 text-slate-500 dark:text-slate-500 truncate max-w-[200px] text-xs">
                {{ contact.notes || '—' }}
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-if="filteredContacts.length === 0">
              <td colspan="5" class="px-4 py-12 text-center text-slate-400">
                {{ searchQuery ? 'Nenhum contato encontrado para a busca.' : 'Nenhum contato neste workspace.' }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="!loading && total > PAGE_SIZE"
      class="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex justify-center"
    >
      <UPagination
        :model-value="page"
        :total="total"
        :page-count="PAGE_SIZE"
        @update:model-value="emit('page-change', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const PAGE_SIZE = 50

interface ContactRow {
  id: string
  name: string | null
  phone: string
  notes: string | null
  is_active: boolean
  updated_at: string
  lastConversationAt: string | null
}

const props = defineProps<{
  contacts: ContactRow[]
  loading: boolean
  total: number
  page: number
}>()

const emit = defineEmits<{
  select: [contact: ContactRow]
  'page-change': [page: number]
}>()

// Busca local com debounce 300ms
const searchQuery = ref('')
const debouncedQuery = ref('')
let debounceTimer: ReturnType<typeof setTimeout>

watch(searchQuery, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = val
  }, 300)
})

const filteredContacts = computed(() => {
  if (!debouncedQuery.value) return props.contacts
  const q = debouncedQuery.value.toLowerCase()
  return props.contacts.filter(
    c =>
      (c.name ?? '').toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
  )
})

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
</script>
