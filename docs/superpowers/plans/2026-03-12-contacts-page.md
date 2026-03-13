# Contacts Page (Story 1.4) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a página `/workspace/[id]/contatos` com listagem paginada, busca, edição via modal e exportação CSV.

**Architecture:** Página Vue (`contatos.vue`) orquestra os dados via `useAsyncData` direto ao Supabase. Dois componentes filhos — `ContactsTable.vue` (tabela + busca) e `ContactModal.vue` (modal de edição) — com interfaces claras via props/emits. Endpoint server-side `PATCH /api/workspace/[id]/contacts/[contactId]` autentica via `serverSupabaseUser` e valida com Zod, seguindo o padrão já existente em `/api/workspace/[id]/quick-replies/`.

**Tech Stack:** Nuxt 3, Vue 3 Composition API (`<script setup lang="ts">`), Nuxt UI (UButton, UModal, UInput, UTextarea, UToggle, UBadge, UPagination, USkeleton, useToast), Supabase JS client, Zod, TypeScript.

**Spec:** `docs/superpowers/specs/2026-03-12-contacts-page-design.md`

---

## Chunk 1: Migration e Endpoint PATCH

### Task 1: Migration — adicionar `is_active` à tabela `contacts`

**Files:**
- Create: `supabase/migrations/20260312000001_add_contact_status.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- supabase/migrations/20260312000001_add_contact_status.sql
-- Migration: Adiciona campo is_active a tabela contacts
-- Story 1.4 - Pagina de Contatos

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.contacts.is_active IS 'Indica se o contato esta ativo no workspace';
```

- [ ] **Step 2: Aplicar a migration localmente**

```bash
cd wa-saas-monorepo
npx supabase db push --local
```

> Para producao: use sem `--local` apos validar localmente.

Saida esperada: `Applying migration 20260312000001_add_contact_status.sql... done`

- [ ] **Step 3: Verificar que a migration foi aplicada**

```bash
npx supabase migration list
```

Saida esperada: `20260312000001_add_contact_status` com status `Applied`.

- [ ] **Step 4: Verificar RLS existente na tabela contacts**

No Supabase dashboard, verifique as politicas da tabela `contacts`. Para esta story, `is_active` e apenas um campo editavel, nao um filtro de acesso - policies existentes permanecem validas.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260312000001_add_contact_status.sql
git commit -m "feat(db): adiciona is_active a tabela contacts [Story 1.4]"
```

---

### Task 2: Endpoint `PATCH /api/workspace/[id]/contacts/[contactId]`

**Files:**
- Create: `apps/web/server/api/workspace/[id]/contacts/[contactId].patch.ts`

Segue o padrão de `/api/workspace/[id]/quick-replies/`. O `workspaceId` vem da URL, nao do body, consistente com todos os outros endpoints. O filtro `.eq('workspace_id', workspaceId)` + RLS do Supabase e suficiente para ownership sem membership check explicito.

- [ ] **Step 1: Criar o endpoint**

```typescript
// apps/web/server/api/workspace/[id]/contacts/[contactId].patch.ts
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'

const contactSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    phone: z.string().min(1).max(50).optional(),
    notes: z.string().max(5000).optional(),
    is_active: z.boolean().optional(),
    // metadata excluido intencionalmente - gerenciado pelo pipeline de ingestao
  })
  .refine(
    (obj) => Object.values(obj).some((v) => v !== undefined),
    { message: 'At least one field to update is required' }
  )

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { id: workspaceId, contactId } = event.context.params || {}
  if (!workspaceId || !contactId) {
    throw createError({ statusCode: 400, message: 'Workspace ID and Contact ID are required' })
  }

  // Validar contactId como UUID para evitar erro 500 do Postgres com input malformado
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contactId)) {
    throw createError({ statusCode: 400, message: 'Invalid Contact ID format' })
  }

  const body = await readBody(event)
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.errors[0]?.message ?? 'Invalid request body' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .from('contacts')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .eq('workspace_id', workspaceId) // ownership: workspaceId da URL + Supabase RLS
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({ statusCode: 409, message: 'Este telefone ja existe neste workspace' })
    }
    throw createError({ statusCode: 500, message: error.message })
  }
  if (!data) {
    throw createError({ statusCode: 404, message: 'Contact not found or access denied' })
  }

  return data
})
```

> **Seguranca:** `workspaceId` vem da URL (nao do body). Filtro `.eq('workspace_id', workspaceId)` + RLS garante ownership. `contactId` validado como UUID.

- [ ] **Step 2: Verificar que o TypeScript compila**

```bash
cd apps/web
npm run typecheck
```

Saida esperada: sem erros de tipo.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/server/api/workspace/[id]/contacts/[contactId].patch.ts"
git commit -m "feat(api): cria endpoint PATCH /api/workspace/[id]/contacts/[contactId] [Story 1.4]"
```

---

## Chunk 2: Componente ContactsTable

### Task 3: `ContactsTable.vue`

**Files:**
- Create: `apps/web/components/contacts/ContactsTable.vue`

Este componente recebe a lista de contatos e exibe tabela com busca e paginação. Não faz fetch — só renderiza. O pattern de skeleton é o mesmo do CRM (`v-if="loading"` com `USkeleton`).

- [ ] **Step 1: Criar o componente**

```vue
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
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/web
npm run typecheck
```

Saída esperada: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/contacts/ContactsTable.vue
git commit -m "feat(ui): cria ContactsTable com busca debounce e paginação [Story 1.4]"
```

---

## Chunk 3: Componente ContactModal

### Task 4: `ContactModal.vue`

**Files:**
- Create: `apps/web/components/contacts/ContactModal.vue`

Modal de edição. Segue o padrão do modal do CRM (`UModal` + `UCard`). Faz o fetch PATCH diretamente (sem store), emite `saved` com o contato atualizado para o pai atualizar o estado local.

- [ ] **Step 1: Criar o componente**

```vue
<!-- apps/web/components/contacts/ContactModal.vue -->
<template>
  <UModal :model-value="open" @update:model-value="!$event && emit('close')">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">
            {{ contact?.name || contact?.phone || 'Contato' }}
          </h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            size="sm"
            @click="emit('close')"
          />
        </div>
      </template>

      <div v-if="contact" class="space-y-4 py-2">
        <UFormGroup label="Nome">
          <UInput v-model="form.name" placeholder="Nome do contato" />
        </UFormGroup>

        <UFormGroup label="Telefone">
          <UInput v-model="form.phone" placeholder="+55 11 99999-9999" />
        </UFormGroup>

        <UFormGroup label="Notas">
          <UTextarea
            v-model="form.notes"
            placeholder="Observações sobre o contato..."
            :rows="4"
          />
        </UFormGroup>

        <UFormGroup label="Status">
          <div class="flex items-center gap-3">
            <UToggle v-model="form.is_active" />
            <span class="text-sm text-slate-700 dark:text-slate-300">
              {{ form.is_active ? 'Ativo' : 'Inativo' }}
            </span>
          </div>
        </UFormGroup>
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-chat-bubble-left-right"
            @click="goToConversation"
          >
            Ver Conversa
          </UButton>
          <div class="flex gap-3">
            <UButton color="gray" variant="ghost" @click="emit('close')">
              Cancelar
            </UButton>
            <UButton
              color="primary"
              icon="i-heroicons-check"
              :loading="saving"
              :disabled="!contact"
              @click="save"
            >
              Salvar
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
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
  contact: ContactRow | null
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  saved: [contact: ContactRow]
}>()

const route = useRoute()
const workspaceId = route.params.id as string
const toast = useToast()
const saving = ref(false)

// Form state — reinitializes when contact changes
const form = reactive({
  name: '',
  phone: '',
  notes: '',
  is_active: true,
})

watch(
  () => props.contact,
  (c) => {
    if (c) {
      form.name = c.name ?? ''
      form.phone = c.phone
      form.notes = c.notes ?? ''
      form.is_active = c.is_active
    }
  },
  { immediate: true }
)

async function save() {
  if (!props.contact) return
  saving.value = true
  try {
    const updated = await $fetch<ContactRow>(`/api/workspace/${workspaceId}/contacts/${props.contact.id}`, {
      method: 'PATCH',
      body: {
        name: form.name || undefined,
        phone: form.phone || undefined,
        notes: form.notes || undefined,
        is_active: form.is_active,
      },
    })
    toast.add({
      title: 'Contato atualizado',
      icon: 'i-heroicons-check-circle',
      color: 'green',
    })
    emit('saved', { ...props.contact, ...updated })
  } catch {
    toast.add({
      title: 'Erro ao salvar contato',
      icon: 'i-heroicons-x-circle',
      color: 'red',
    })
  } finally {
    saving.value = false
  }
}

function goToConversation() {
  if (!props.contact) return
  navigateTo(`/workspace/${workspaceId}/chat?contactId=${props.contact.id}`)
  emit('close')
}
</script>
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/web
npm run typecheck
```

Saída esperada: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/contacts/ContactModal.vue
git commit -m "feat(ui): cria ContactModal com edição e navegação para chat [Story 1.4]"
```

---

## Chunk 4: Página contatos.vue e Navegação

### Task 5: Página `contatos.vue`

**Files:**
- Create: `apps/web/pages/workspace/[id]/contatos.vue`

Página orquestradora. Faz o fetch, gerencia estado do modal, e contém `exportCsv()`. Note o RFC 4180 no CSV: campos com vírgula são envolvidos em aspas duplas.

- [ ] **Step 1: Criar a página**

```vue
<!-- apps/web/pages/workspace/[id]/contatos.vue -->
<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div
      class="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex justify-between items-center"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Contatos</h1>
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
const supabase = useSupabaseClient()

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

const { data: rawData, pending, refresh } = await useAsyncData<{ rows: ContactRaw[]; count: number }>(
  `contacts-${workspaceId}`,
  async () => {
    const { data, error, count } = await supabase
      .from('contacts')
      .select(
        'id, name, phone, notes, is_active, updated_at, conversations(last_message_at)',
        { count: 'exact' }
      )
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .range(offset.value, offset.value + PAGE_SIZE - 1)
    if (error) throw error
    return { rows: (data ?? []) as unknown as ContactRaw[], count: count ?? 0 }
  },
  { watch: [offset] }
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
```

> **Nota:** O CSV usa `\uFEFF` (BOM UTF-8) para garantir que Excel/LibreOffice abra corretamente com acentos. Campos com vírgulas ou aspas são envolvidos em aspas duplas (RFC 4180).

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/web
npm run typecheck
```

Saída esperada: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/web/pages/workspace/[id]/contatos.vue
git commit -m "feat(page): cria página de Contatos com listagem paginada e exportação CSV [Story 1.4]"
```

---

### Task 6: Adicionar link "Contatos" na sidebar de navegação

**Files:**
- Modify: `apps/web/layouts/workspace.vue`

Adicionar entre "Chat (Atendimento)" e "CRM (Kanban)" no array `links`.

- [ ] **Step 1: Editar `workspace.vue`**

Localize o array `links` (linha ~116) e adicione o item de Contatos:

```typescript
// ANTES:
const links = [
  { label: 'Dashboard', to: `/workspace/${workspaceId}/dashboard`, icon: 'i-heroicons-home' },
  {
    label: 'Chat (Atendimento)',
    to: `/workspace/${workspaceId}/chat`,
    icon: 'i-heroicons-chat-bubble-left-right',
  },
  { label: 'CRM (Kanban)', to: `/workspace/${workspaceId}/crm`, icon: 'i-heroicons-view-columns' },
  // ...
]

// DEPOIS — adicionar entrada de Contatos entre Chat e CRM:
const links = [
  { label: 'Dashboard', to: `/workspace/${workspaceId}/dashboard`, icon: 'i-heroicons-home' },
  {
    label: 'Chat (Atendimento)',
    to: `/workspace/${workspaceId}/chat`,
    icon: 'i-heroicons-chat-bubble-left-right',
  },
  {
    label: 'Contatos',
    to: `/workspace/${workspaceId}/contatos`,
    icon: 'i-heroicons-users',
  },
  { label: 'CRM (Kanban)', to: `/workspace/${workspaceId}/crm`, icon: 'i-heroicons-view-columns' },
  {
    label: 'Canais',
    to: `/workspace/${workspaceId}/canais`,
    icon: 'i-heroicons-device-phone-mobile',
  },
  {
    label: 'Configurações',
    to: `/workspace/${workspaceId}/configuracoes`,
    icon: 'i-heroicons-cog-8-tooth',
  },
]
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/web
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/layouts/workspace.vue
git commit -m "feat(nav): adiciona link Contatos na sidebar do workspace [Story 1.4]"
```

---

## Chunk 5: Atualizar Story e Verificação Final

### Task 7: Atualizar story e verificação lint

**Files:**
- Modify: `docs/stories/1.4.story.md`

- [ ] **Step 1: Marcar todos os checkboxes da story como concluídos**

Editar `docs/stories/1.4.story.md` e alterar todos os `- [ ]` para `- [x]`. Também alterar o Status de `Ready` para `Done`.

- [ ] **Step 2: Rodar lint**

```bash
cd apps/web
npm run lint
```

Saída esperada: sem erros ou avisos de lint.

- [ ] **Step 3: Testar manualmente no browser**

Inicie o app:
```bash
cd apps/web
npm run dev
```

Fluxo de verificação:
1. Navegue para `/workspace/[seu-id]/contatos`
2. Verifique que a tabela carrega com skeleton e depois mostra os contatos
3. Digite algo no campo de busca — verifique filtro com ~300ms de delay
4. Clique em um contato — verifique que o modal abre com os dados preenchidos
5. Edite o nome e clique "Salvar" — verifique toast verde e atualização na tabela
6. Clique "Ver Conversa" — verifique redirecionamento para `/workspace/[id]/chat?contactId=...`
7. Clique "Exportar CSV" — verifique download do arquivo `contatos.csv`
8. Verifique que o link "Contatos" aparece na sidebar entre "Chat" e "CRM"

- [ ] **Step 4: Commit final da story**

```bash
git add docs/stories/1.4.story.md
git commit -m "feat: conclui Story 1.4 — Página de Contatos completa"
```

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/20260312000001_add_contact_status.sql` | Criar |
| `apps/web/server/api/workspace/[id]/contacts/[contactId].patch.ts` | Criar |
| `apps/web/components/contacts/ContactsTable.vue` | Criar |
| `apps/web/components/contacts/ContactModal.vue` | Criar |
| `apps/web/pages/workspace/[id]/contatos.vue` | Criar |
| `apps/web/layouts/workspace.vue` | Modificar (adicionar link nav) |
| `docs/stories/1.4.story.md` | Modificar (marcar concluído) |
