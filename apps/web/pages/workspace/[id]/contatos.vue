<!-- apps/web/pages/workspace/[id]/contatos.vue -->
<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div
      class="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex justify-between items-center"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Contatos
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Gerencie os contatos do workspace.
        </p>
      </div>
      <UButton
        icon="i-heroicons-arrow-down-tray"
        color="gray"
        variant="outline"
        :disabled="!contacts.length"
        @click="exportCsv"
      >
        Exportar CSV
      </UButton>
    </div>

    <!-- Table -->
    <div class="flex-1 overflow-hidden">
      <ContactsTable
        :contacts="contacts"
        :loading="pending"
        :total="total"
        :page="page"
        @select="openModal"
        @page-change="changePage"
      />
    </div>

    <!-- Edit Modal -->
    <ContactModal
      :contact="selectedContact"
      :open="modalOpen"
      @close="closeModal"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'workspace', middleware: ['auth'] })

const route = useRoute()
const workspaceId = route.params.id as string
const { token } = useAuth()
const config = useRuntimeConfig()
const API_URL = config.public.apiUrl as string

const PAGE_SIZE = 50
const page = ref(1)
const selectedContact = ref<ContactRow | null>(null)
const modalOpen = ref(false)

interface ConversationRef {
  last_message_at: string | null
}

interface ContactRaw {
  id: string
  name: string | null
  phone: string
  notes: string | null
  is_active: boolean
  updated_at: string
  conversations: ConversationRef[]
}

interface ContactRow {
  id: string
  name: string | null
  phone: string
  notes: string | null
  is_active: boolean
  updated_at: string
  lastConversationAt: string | null
}

const offset = computed(() => (page.value - 1) * PAGE_SIZE)

const { data: rawData, pending } = await useAsyncData<{ rows: ContactRaw[]; count: number }>(
  `contacts-${workspaceId}`,
  async () => {
    try {
      const result = await $fetch<{ rows: ContactRaw[], count: number }>(`${API_URL}/contacts`, {
        query: { tenant_id: workspaceId, page: page.value, limit: PAGE_SIZE },
        headers: { Authorization: `Bearer ${token.value}` }
      })
      // Rename last_conversation_at to match frontend structure (which uses conversations array originally)
      return {
        rows: result.rows.map(r => ({
          ...r,
          conversations: r.last_conversation_at ? [{ last_message_at: r.last_conversation_at }] : []
        })) as unknown as ContactRaw[],
        count: result.count
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
      return { rows: [], count: 0 }
    }
  },
  { watch: [page] }
)

const total = computed(() => rawData.value?.count ?? 0)

const contacts = computed<ContactRow[]>(() =>
  (rawData.value?.rows ?? []).map((c) => ({
    ...c,
    lastConversationAt:
      c.conversations.length > 0
        ? c.conversations.reduce((max, conv) => {
            if (!conv.last_message_at) return max
            if (!max) return conv.last_message_at
            return conv.last_message_at > max ? conv.last_message_at : max
          }, null as string | null)
        : null,
  }))
)

function openModal(contact: ContactRow) {
  selectedContact.value = contact
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  selectedContact.value = null
}

function onSaved(updated: ContactRow) {
  // Optimistic update: replace in-place so the table reflects changes instantly
  if (rawData.value) {
    const idx = rawData.value.rows.findIndex((c) => c.id === updated.id)
    if (idx !== -1) {
      rawData.value.rows[idx] = {
        ...rawData.value.rows[idx],
        name: updated.name,
        phone: updated.phone,
        notes: updated.notes,
        is_active: updated.is_active,
      }
    }
  }
  closeModal()
}

function changePage(newPage: number) {
  page.value = newPage
}

// RFC 4180 compliant CSV export
function csvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function exportCsv() {
  const headers = ['Nome', 'Telefone', 'Status', 'Última Conversa', 'Notas']
  const rows = contacts.value.map((c) => [
    csvField(c.name ?? ''),
    csvField(c.phone),
    c.is_active ? 'Ativo' : 'Inativo',
    c.lastConversationAt
      ? new Date(c.lastConversationAt).toLocaleDateString('pt-BR')
      : '',
    csvField(c.notes ?? ''),
  ])
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'contatos.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>
