# Design: Página de Contatos (Story 1.4)

**Data:** 2026-03-12
**Story:** 1.4
**Status:** Aprovado

---

## Contexto

Implementar a página `/workspace/[id]/contatos` que permite ao agente visualizar, buscar, editar e exportar os contatos do workspace. A tabela `contacts` já existe no banco com os campos `id`, `name`, `phone`, `workspace_id`, `notes`, `metadata`, `created_at`, `updated_at`. Uma migration será adicionada para incluir `is_active boolean`.

---

## Decisões de Design

| Decisão | Escolha | Razão |
|---------|---------|-------|
| Campo "Status" | Migration `is_active boolean DEFAULT true` | Campo explícito, sem lógica derivada |
| Layout de detalhe | Modal centralizado | Padrão já usado no CRM e Configurações |
| Abordagem | Página + 2 componentes | Segue padrão do projeto, sem over-engineering |
| Busca | Filtro local com debounce 300ms | Suficiente para 50 registros por página |
| Exportação CSV | Client-side, sem lib externa | Simples, sem dependência adicional |

---

## Estrutura de Arquivos

### Novos arquivos

```
apps/web/pages/workspace/[id]/contatos.vue
apps/web/components/contacts/ContactsTable.vue
apps/web/components/contacts/ContactModal.vue
apps/web/server/api/contacts/[id].patch.ts
supabase/migrations/20260312000001_add_contact_status.sql
```

### Arquivos modificados

```
apps/web/layouts/workspace.vue   — adicionar link "Contatos" no nav
```

---

## Migration

```sql
-- 20260312000001_add_contact_status.sql
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.contacts.is_active IS 'Indica se o contato está ativo no workspace';
```

---

## Dados e API

### Query principal

```typescript
// contatos.vue — useAsyncData
const { data, pending } = await useAsyncData(`contacts-${workspaceId}`, async () => {
  const { data, error } = await supabase
    .from('contacts')
    .select(`
      id, name, phone, notes, is_active, updated_at,
      conversations(last_message_at)
    `)
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + 49)
  if (error) throw error
  return data
})
```

"Última Conversa" é derivada do `MAX(conversations.last_message_at)` — o campo `conversations` retorna array; a página computa o máximo via `computed`.

### Endpoint PATCH

**Rota:** `PATCH /api/contacts/[id]`

**Schema Zod:**
```typescript
z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().min(1).max(50).optional(),
  notes: z.string().max(5000).optional(),
  is_active: z.boolean().optional(),
})
```

**Resposta:** contato atualizado (200) ou erro 401/400/500.

---

## Componentes

### `contatos.vue` (página)

Responsabilidades:
- Busca dados paginados com `useAsyncData`
- Gerencia estado: `page` (ref), `selectedContact` (ref), `modalOpen` (ref)
- Função `exportCsv()` — converte array de contatos para CSV e dispara download
- Header com título, subtítulo e botão "Exportar CSV"
- Renderiza `<ContactsTable>` e `<ContactModal>`

### `ContactsTable.vue`

Props:
- `contacts: Contact[]`
- `loading: boolean`
- `total: number`
- `page: number`

Emits:
- `select(contact: Contact)`
- `page-change(page: number)`

Funcionalidades:
- Campo de busca com debounce 300ms filtrando `name` e `phone` no array local
- Tabela com colunas: Nome (avatar + nome), Telefone, Última Conversa (formatada), Status (UBadge verde/cinza), Notas (truncado em 40 chars)
- Skeleton rows (5 linhas) durante loading
- `UPagination` no rodapé

### `ContactModal.vue`

Props:
- `contact: Contact | null`
- `open: boolean`

Emits:
- `close`
- `saved(contact: Contact)`

Funcionalidades:
- Campos editáveis: Nome (UInput), Telefone (UInput), Notas (UTextarea), Status (UToggle)
- Botão "Salvar" → `$fetch('PATCH /api/contacts/[id]', body)` → emit `saved` → toast "Contato atualizado"
- Botão "Ver Conversa" → `navigateTo('/workspace/${workspaceId}/chat?contact=${contact.id}')`
- Estado de loading no botão "Salvar" durante a requisição

---

## Navegação

Adicionar no array `links` de `workspace.vue`:

```typescript
{ label: 'Contatos', to: `/workspace/${workspaceId}/contatos`, icon: 'i-heroicons-users' }
```

Posição: entre "Chat (Atendimento)" e "CRM (Kanban)".

---

## Exportação CSV

```typescript
function exportCsv(contacts: Contact[]) {
  const headers = ['Nome', 'Telefone', 'Status', 'Última Conversa', 'Notas']
  const rows = contacts.map(c => [
    c.name ?? '',
    c.phone,
    c.is_active ? 'Ativo' : 'Inativo',
    c.lastConversationAt ? new Date(c.lastConversationAt).toLocaleDateString('pt-BR') : '',
    (c.notes ?? '').replace(/[\n\r,]/g, ' '),
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'contatos.csv'
  a.click()
  URL.revokeObjectURL(url)
}
```

---

## Critérios de Aceitação (rastreabilidade)

| AC | Implementado em |
|----|----------------|
| 1. Listagem paginada | `ContactsTable.vue` + `contatos.vue` |
| 2. Busca em tempo real | `ContactsTable.vue` (filtro local, debounce 300ms) |
| 3. Detalhe / Edição | `ContactModal.vue` |
| 4. Salvar com toast | `ContactModal.vue` → `PATCH /api/contacts/[id]` |
| 5. Ir para Conversa | `ContactModal.vue` → `navigateTo` |
| 6. Exportar CSV | `contatos.vue` → `exportCsv()` |

---

## Fora de Escopo

- Criação de novos contatos (apenas edição)
- Exclusão de contatos
- Filtro por status na listagem (busca só por nome/telefone)
- Paginação server-side da busca
