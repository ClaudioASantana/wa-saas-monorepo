# Fix Chat Input & Attendant Message Flow

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan.

**Goal:** Corrigir a área de digitação do chat (textarea não aceita input), o nome do remetente genérico, e bugs de resolução/atribuição de conversas.

**Architecture:** Correções distribuídas em 5 arquivos: componente ChatWindow (input), endpoint de mensagens (auth + senderName), página chat.vue (resolveConversation), ConversationAssignment (null guard), ConversationList (debug log).

**Tech Stack:** Nuxt 3, Vue 3 (script setup), Nuxt UI (UTextarea), Supabase, TypeScript

---

## Chunk 1: ChatWindow.vue — Textarea & Resolve

### Task 1: Corrigir UTextarea (remover @input conflitante e :ui problemático)

**Files:**
- Modify: `apps/web/components/chat/ChatWindow.vue`

**Problema:** `@input="handleInput"` conflita com `v-model` (dispara antes do ref ser atualizado). `:ui="{ base: '' }"` pode remover classes base do UTextarea.
**Fix:** mover lógica de quick replies para `watch(input, ...)` que já existe; remover `:ui` e `@input` do template.

- [ ] **Step 1: Remover `@input` e `:ui` do UTextarea no template**

Em `apps/web/components/chat/ChatWindow.vue`, linhas 235-246, trocar:
```html
              <UTextarea
                ref="textareaRef"
                v-model="input"
                autoresize
                :rows="1"
                :maxrows="5"
                :placeholder="isInternal ? 'Escrever nota interna...' : 'Digite uma mensagem... (Enter para enviar)'"
                class="w-full"
                :ui="{ base: isInternal ? ' ring-amber-400 focus:ring-amber-500' : '' }"
                @keydown="handleKeyDown"
                @input="handleInput"
              />
```
por:
```html
              <UTextarea
                ref="textareaRef"
                v-model="input"
                autoresize
                :rows="1"
                :placeholder="isInternal ? 'Escrever nota interna...' : 'Digite uma mensagem... (Enter para enviar)'"
                class="w-full"
                @keydown="handleKeyDown"
              />
```

- [ ] **Step 2: Adicionar lógica de quick replies no `watch(input, ...)`**

No script, trocar:
```js
watch(input, (val) => {
  if (!val.trim()) {
```
por:
```js
watch(input, (val) => {
  // Quick replies panel toggle
  showQuickReplies.value = val.startsWith('/')

  if (!val.trim()) {
```

- [ ] **Step 3: Remover função `handleInput`**

Remover o bloco completo:
```js
const handleInput = () => {
  if (input.value.startsWith('/')) {
    showQuickReplies.value = true
  } else {
    showQuickReplies.value = false
  }
}
```

### Task 2: Corrigir emits do botão Resolver/Reabrir

**Problema:** `$emit('resolve')` sem args → `resolveConversation(undefined)` → crash em `undefined.conversationId`.
**Fix:** o chat.vue já tem `selectedConv.value.id`. Basta mudar a assinatura de `resolveConversation` para receber `status` diretamente.

- [ ] **Step 4: Verificar que os emits já passam o status correto**

Em `ChatWindow.vue`, o botão Resolver emite `$emit('resolve')` (sem args) e Reabrir emite `$emit('resolve', 'open')`. Isso é compatível com a nova assinatura `(status = 'resolved')` em chat.vue. Nenhuma mudança necessária no template.

---

## Chunk 2: chat.vue — resolveConversation & debug logs

### Task 3: Corrigir resolveConversation

**Files:**
- Modify: `apps/web/pages/workspace/[id]/chat.vue`

**Problema:** função usa `data.conversationId` mas recebe `undefined` quando Resolver é clicado.
**Fix:** usar `selectedConv.value.id` diretamente, aceitar apenas `status` como parâmetro.

- [ ] **Step 5: Substituir função resolveConversation**

Trocar:
```js
const resolveConversation = async (data: { conversationId: string } | string, status: ConversationStatus = 'resolved') => {
  const finalId = typeof data === 'string' ? data : data.conversationId
  resolving.value = true
  try {
    await $fetch(`/api/chat/conversations/${finalId}/status`, {
      method: 'PATCH',
      body: { status }
    })
    await refreshConv()
    useToast().add({
      title: status === 'resolved' ? 'Conversa resolvida!' : 'Conversa reaberta!',
      icon: 'i-heroicons-check-circle',
      color: 'green'
    })
  } catch (err: unknown) {
    const error = err as Error
    console.error('Error changing conversation status:', error)
    useToast().add({
      title: 'Erro ao alterar status',
      description: error.message,
      color: 'red'
    })
  } finally {
    resolving.value = false
  }
}
```
por:
```js
const resolveConversation = async (status: ConversationStatus = 'resolved') => {
  if (!selectedConv.value) return
  resolving.value = true
  try {
    await $fetch(`/api/chat/conversations/${selectedConv.value.id}/status`, {
      method: 'PATCH',
      body: { status }
    })
    await refreshConv()
    useToast().add({
      title: status === 'resolved' ? 'Conversa resolvida!' : 'Conversa reaberta!',
      icon: 'i-heroicons-check-circle',
      color: 'green'
    })
  } catch (err: unknown) {
    const error = err as Error
    useToast().add({
      title: 'Erro ao alterar status',
      description: error.message,
      color: 'red'
    })
  } finally {
    resolving.value = false
  }
}
```

### Task 4: Remover console.logs de debug

- [ ] **Step 6: Remover console.log em fetchMessages**

Trocar:
```js
  async () => {
    console.log('[Chat] Fetching messages for:', convId.value)
    if (!convId.value) return [] as Message[]
```
por:
```js
  async () => {
    if (!convId.value) return [] as Message[]
```

- [ ] **Step 7: Remover console.log em selectConversation**

Trocar:
```js
const selectConversation = async (conv: Conversation) => {
  console.log('[Chat] Selecting conversation:', conv.id)
  // Leave previous room if any
```
por:
```js
const selectConversation = async (conv: Conversation) => {
  // Leave previous room if any
```

- [ ] **Step 8: Remover watch blocks de debug**

Remover os dois blocos:
```js
watch(messages, (newMsgs) => {
  console.log('[Chat] Messages updated. Count:', newMsgs?.length || 0)
}, { immediate: true })

watch(selectedConv, (newConv) => {
  console.log('[Chat] selectedConv updated:', !!newConv)
}, { immediate: true })
```

---

## Chunk 3: messages/index.post.ts — Auth & senderName real

### Task 5: Adicionar autenticação e nome real do agente

**Files:**
- Modify: `apps/web/server/api/messages/index.post.ts`

**Problemas:**
- Qualquer requisição não autenticada pode enviar mensagens
- `senderName: 'Agente'` hardcoded
- Conflict de variável `message` no catch block

- [ ] **Step 9: Adicionar import serverSupabaseUser**

Trocar:
```ts
import { createClient } from '@supabase/supabase-js'
```
por:
```ts
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
```

- [ ] **Step 10: Adicionar auth check no início do handler**

Trocar:
```ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { conversation_id, message, is_internal } = body
```
por:
```ts
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { conversation_id, message, is_internal } = body
```

- [ ] **Step 11: Resolver nome real do agente antes de insertMessage**

Trocar:
```ts
  try {
    const msg = await chatService.insertMessage({
      conversationId: conversation_id,
      tenantId: conv.tenant_id,
      waMessageId: null,
      direction: 'outbound',
      type: 'text',
      content: message,
      senderName: 'Agente',
      isInternal: !!is_internal
    })
```
por:
```ts
  // Resolve real agent name
  let senderName = user.user_metadata?.full_name || user.email!.split('@')[0]
  try {
    const agent = await chatService.getOrCreateAgent(user.email!, conv.tenant_id, senderName)
    if (agent?.name) senderName = agent.name
  } catch {
    // Fallback to user metadata name
  }

  try {
    const msg = await chatService.insertMessage({
      conversationId: conversation_id,
      tenantId: conv.tenant_id,
      waMessageId: null,
      direction: 'outbound',
      type: 'text',
      content: message,
      senderName,
      isInternal: !!is_internal
    })
```

- [ ] **Step 12: Corrigir conflito de variável no catch**

Trocar:
```ts
  } catch (error) {
    console.error(`[Message API] Error:`, error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({ statusCode: 500, statusMessage: message })
  }
```
por:
```ts
  } catch (error) {
    console.error(`[Message API] Error:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw createError({ statusCode: 500, statusMessage: errorMessage })
  }
```

---

## Chunk 4: ConversationAssignment.vue & ConversationList.vue

### Task 6: Corrigir guard de agentId em ConversationAssignment

**Files:**
- Modify: `apps/web/components/chat/ConversationAssignment.vue`

**Problema:** `if (!agentId)` bloqueia `null` que é um valor válido (desatribuir conversa).
**Fix:** verificar `agentId === undefined` para distinguir "ainda carregando" de "desatribuir".

- [ ] **Step 13: Corrigir a condição de guarda**

Trocar:
```js
const handleAssign = async (agentId: string | null | undefined) => {
  if (!agentId) {
    useToast().add({
      title: 'Ação não permitida',
      description: 'Seu perfil de agente ainda está sendo carregado.',
      color: 'yellow'
    })
    return
  }
```
por:
```js
const handleAssign = async (agentId: string | null | undefined) => {
  if (agentId === undefined) {
    useToast().add({
      title: 'Ação não permitida',
      description: 'Seu perfil de agente ainda está sendo carregado.',
      color: 'yellow'
    })
    return
  }
```

### Task 7: Remover console.log de debug em ConversationList

**Files:**
- Modify: `apps/web/components/chat/ConversationList.vue`

- [ ] **Step 14: Remover console.log do @click**

Trocar:
```html
        @click="console.log('[ConversationList] Clicked:', conv.id); $emit('select', conv)"
```
por:
```html
        @click="$emit('select', conv)"
```

---

## Commit Final

- [ ] **Step 15: Commit todas as correções**

```bash
git add apps/web/components/chat/ChatWindow.vue
git add apps/web/components/chat/ConversationAssignment.vue
git add apps/web/components/chat/ConversationList.vue
git add apps/web/pages/workspace/[id]/chat.vue
git add apps/web/server/api/messages/index.post.ts
git commit -m "fix: corrige área de digitação do chat e fluxo de mensagens do atendente

- Remove @input conflitante do UTextarea (race com v-model)
- Move lógica de quick replies para watch(input)
- Remove :ui problemático do UTextarea
- Corrige resolveConversation para usar selectedConv.value.id
- Adiciona auth em POST /api/messages e resolve nome real do agente
- Corrige guard !agentId → === undefined em ConversationAssignment
- Remove console.logs de debug"
```
