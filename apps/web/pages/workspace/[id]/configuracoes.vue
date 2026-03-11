<template>
  <div class="p-6 space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
        Configurações
      </h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Gerencie as configurações e ferramentas do seu workspace.
      </p>
    </div>

    <UTabs
      :items="tabs"
      class="w-full"
    >
      <!-- Geral Tab -->
      <template #geral>
        <div class="space-y-6 pt-4">
          <!-- Workspace Settings -->
          <UCard>
            <template #header>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                Informações do Workspace
              </h3>
            </template>
            <form
              class="space-y-4"
              @submit.prevent="saveSettings"
            >
              <UFormGroup label="Nome do Workspace">
                <UInput
                  v-model="settings.name"
                  placeholder="Nome da sua agência"
                  icon="i-heroicons-building-office"
                />
              </UFormGroup>
              <div class="flex justify-end">
                <UButton
                  type="submit"
                  color="primary"
                  :loading="saving"
                >
                  Salvar Alterações
                </UButton>
              </div>
            </form>
          </UCard>

          <!-- Webhook URL -->
          <UCard>
            <template #header>
              <div class="flex items-center space-x-2">
                <UIcon
                  name="i-heroicons-bolt"
                  class="w-5 h-5 text-primary-500"
                />
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  URL do Webhook
                </h3>
              </div>
            </template>
            <div class="space-y-3">
              <p class="text-sm text-slate-500 dark:text-slate-400">
                Configure esta URL no painel da sua Evolution API para receber mensagens.
              </p>
              <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                <UIcon
                  name="i-heroicons-link"
                  class="w-4 h-4 text-slate-400 shrink-0"
                />
                <code class="flex-1 text-sm text-slate-700 dark:text-slate-300 font-mono truncate">
                  {{ webhookUrl }}
                </code>
                <UButton
                  size="xs"
                  variant="soft"
                  color="primary"
                  icon="i-heroicons-clipboard-document"
                  :label="copied ? 'Copiado!' : 'Copiar'"
                  @click="copyWebhook"
                />
              </div>
            </div>
          </UCard>

          <!-- Danger Zone -->
          <UCard :ui="{ ring: 'ring-1 ring-red-300 dark:ring-red-800' }">
            <template #header>
              <div class="flex items-center space-x-2">
                <UIcon
                  name="i-heroicons-exclamation-triangle"
                  class="w-5 h-5 text-red-500"
                />
                <h3 class="text-base font-semibold text-red-600 dark:text-red-400">
                  Zona de Perigo
                </h3>
              </div>
            </template>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-slate-900 dark:text-white">
                  Excluir Workspace
                </p>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  Esta ação é irreversível. Todos os dados serão permanentemente removidos.
                </p>
              </div>
              <UButton
                color="red"
                variant="soft"
                icon="i-heroicons-trash"
                @click="isDeleteModalOpen = true"
              >
                Excluir Workspace
              </UButton>
            </div>
          </UCard>
        </div>
      </template>

      <!-- Equipe Tab -->
      <template #equipe>
        <div class="space-y-6 pt-4">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <UIcon
                    name="i-heroicons-users"
                    class="w-5 h-5 text-primary-500"
                  />
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                    Membros da Equipe
                  </h3>
                </div>
                <UBadge
                  color="gray"
                  variant="subtle"
                >
                  {{ members?.length || 0 }} membro(s)
                </UBadge>
              </div>
            </template>
            <div class="space-y-4">
              <div
                v-if="membersPending"
                class="space-y-3"
              >
                <USkeleton
                  v-for="i in 2"
                  :key="i"
                  class="h-12 w-full"
                />
              </div>
              <ul
                v-else
                class="divide-y divide-slate-100 dark:divide-slate-800"
              >
                <li
                  v-for="member in members"
                  :key="member.user_id"
                  class="flex items-center justify-between py-3"
                >
                  <div class="flex items-center space-x-3">
                    <UAvatar
                      :alt="member.profile?.email ?? 'M'"
                      size="sm"
                    />
                    <div>
                      <p class="text-sm font-medium text-slate-900 dark:text-white">
                        {{ member.profile?.name || member.profile?.email }}
                      </p>
                      <p class="text-xs text-slate-500">
                        {{ member.profile?.email }}
                      </p>
                    </div>
                  </div>
                  <UBadge
                    :color="member.role === 'owner' ? 'primary' : 'gray'"
                    variant="subtle"
                    size="xs"
                  >
                    {{ member.role === 'owner' ? 'Proprietário' : 'Membro' }}
                  </UBadge>
                </li>
              </ul>

              <UDivider label="Convidar novo membro" />
              <form
                class="flex gap-3"
                @submit.prevent="inviteMember"
              >
                <UInput
                  v-model="inviteEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                  icon="i-heroicons-envelope"
                  class="flex-1"
                  :disabled="inviting"
                />
                <UButton
                  type="submit"
                  icon="i-heroicons-paper-airplane"
                  color="primary"
                  :loading="inviting"
                  :disabled="!inviteEmail.trim()"
                >
                  Convidar
                </UButton>
              </form>
            </div>
          </UCard>
        </div>
      </template>

      <!-- Respostas Rápidas Tab -->
      <template #respostas>
        <div class="space-y-6 pt-4">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <UIcon
                    name="i-heroicons-chat-bubble-left-right"
                    class="w-5 h-5 text-primary-500"
                  />
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                    Respostas Rápidas
                  </h3>
                </div>
                <UButton
                  size="sm"
                  variant="soft"
                  icon="i-heroicons-plus"
                  @click="openQuickReplyModal()"
                >
                  Nova Resposta
                </UButton>
              </div>
            </template>
            
            <div
              v-if="repliesPending"
              class="space-y-3 p-4"
            >
              <USkeleton
                v-for="i in 3"
                :key="i"
                class="h-14 w-full"
              />
            </div>
            
            <div
              v-else-if="!replies?.length"
              class="text-center py-10"
            >
              <UIcon
                name="i-heroicons-chat-bubble-bottom-center-text"
                class="w-10 h-10 text-slate-300 mb-2"
              />
              <p class="text-slate-500 text-sm">
                Nenhuma resposta rápida cadastrada.
              </p>
            </div>

            <div
              v-else
              class="divide-y divide-slate-100 dark:divide-slate-800"
            >
              <div
                v-for="reply in replies"
                :key="reply.id"
                class="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 group transition-colors"
              >
                <div class="min-w-0 pr-4">
                  <div class="flex items-center gap-2">
                    <UBadge
                      size="xs"
                      color="gray"
                      variant="soft"
                      class="font-mono"
                    >
                      /{{ reply.shortcut }}
                    </UBadge>
                  </div>
                  <p class="text-sm text-slate-600 dark:text-slate-400 truncate mt-1">
                    {{ reply.content }}
                  </p>
                </div>
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <UButton
                    size="xs"
                    variant="ghost"
                    color="gray"
                    icon="i-heroicons-pencil-square"
                    @click="openQuickReplyModal(reply)"
                  />
                  <UButton
                    size="xs"
                    variant="ghost"
                    color="red"
                    icon="i-heroicons-trash"
                    @click="deleteReply(reply.id)"
                  />
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </template>

      <!-- Tags Tab -->
      <template #tags>
        <div class="space-y-6 pt-4">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <UIcon
                    name="i-heroicons-tag"
                    class="w-5 h-5 text-primary-500"
                  />
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                    Etiquetas (Tags)
                  </h3>
                </div>
                <UButton
                  size="sm"
                  variant="soft"
                  icon="i-heroicons-plus"
                  @click="openTagModal()"
                >
                  Nova Tag
                </UButton>
              </div>
            </template>

            <div
              v-if="tagsPending"
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
            >
              <USkeleton
                v-for="i in 6"
                :key="i"
                class="h-10 w-full"
              />
            </div>

            <div
              v-else-if="!allTags?.length"
              class="text-center py-10"
            >
              <UIcon
                name="i-heroicons-tag"
                class="w-10 h-10 text-slate-300 mb-2"
              />
              <p class="text-slate-500 text-sm">
                Nenhuma etiqueta cadastrada.
              </p>
            </div>

            <div
              v-else
              class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              <div
                v-for="tag in allTags"
                :key="tag.id"
                class="flex items-center justify-between p-2 pl-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-500/50 group transition-all"
              >
                <div class="flex items-center gap-2 overflow-hidden">
                  <div
                    class="w-3 h-3 rounded-full shrink-0"
                    :style="{ backgroundColor: tag.color }"
                  />
                  <span class="text-sm font-medium truncate">{{ tag.name }}</span>
                </div>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <UButton
                    size="xs"
                    variant="ghost"
                    color="gray"
                    icon="i-heroicons-pencil-square"
                    @click="openTagModal(tag)"
                  />
                  <UButton
                    size="xs"
                    variant="ghost"
                    color="red"
                    icon="i-heroicons-trash"
                    @click="deleteTag(tag.id)"
                  />
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </template>
    </UTabs>

    <!-- Modals -->
    <UModal v-model="quickReplyModal.isOpen">
      <UCard>
        <template #header>
          <h3 class="font-bold">
            {{ quickReplyModal.id ? 'Editar' : 'Nova' }} Resposta Rápida
          </h3>
        </template>
        <form
          class="space-y-4"
          @submit.prevent="saveQuickReply"
        >
          <UFormGroup
            label="Atalho"
            help="Ex: ola, preco, tchau (será usado com /)"
          >
            <UInput
              v-model="quickReplyModal.shortcut"
              placeholder="ex: ola"
              icon="i-heroicons-at-symbol"
            />
          </UFormGroup>
          <UFormGroup
            label="Conteúdo"
            help="Use {contato} para o nome do cliente"
          >
            <UTextarea
              v-model="quickReplyModal.content"
              placeholder="Olá {contato}, como posso ajudar?"
            />
          </UFormGroup>
          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              color="gray"
              @click="quickReplyModal.isOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              type="submit"
              :loading="quickReplyModal.loading"
            >
              Salvar
            </UButton>
          </div>
        </form>
      </UCard>
    </UModal>

    <UModal v-model="tagModal.isOpen">
      <UCard>
        <template #header>
          <h3 class="font-bold">
            {{ tagModal.id ? 'Editar' : 'Nova' }} Etiqueta
          </h3>
        </template>
        <form
          class="space-y-4"
          @submit.prevent="saveTag"
        >
          <UFormGroup label="Nome da Tag">
            <UInput
              v-model="tagModal.name"
              placeholder="Ex: Lead Quente"
              icon="i-heroicons-tag"
            />
          </UFormGroup>
          <UFormGroup label="Cor">
            <div class="flex items-center gap-3">
              <UInput
                v-model="tagModal.color"
                type="color"
                class="w-16 h-10 p-0"
                :ui="{ base: 'p-0 h-10 overflow-hidden' }"
              />
              <UInput
                v-model="tagModal.color"
                placeholder="#000000"
                class="flex-1"
              />
            </div>
          </UFormGroup>
          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              color="gray"
              @click="tagModal.isOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              type="submit"
              :loading="tagModal.loading"
            >
              Salvar
            </UButton>
          </div>
        </form>
      </UCard>
    </UModal>

    <!-- Delete Confirmation Modal (Workspace) -->
    <UModal
      v-model="isDeleteModalOpen"
      :prevent-close="deleting"
    >
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center space-x-2">
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="w-5 h-5 text-red-500"
            />
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              Confirmar exclusão
            </h3>
          </div>
        </template>
        <template #default>
          <div class="space-y-4 py-2">
            <p class="text-sm text-slate-600 dark:text-slate-400">
              Para confirmar, digite o nome do workspace:
              <strong class="text-slate-900 dark:text-white">{{ settings.name }}</strong>
            </p>
            <UInput
              v-model="deleteConfirmName"
              :placeholder="settings.name"
              icon="i-heroicons-building-office"
            />
            <div
              class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-100 dark:border-red-800"
            >
              ⚠️ Todas as conversas, mensagens, canais e dados do workspace serão excluídos permanentemente.
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton
              color="gray"
              variant="ghost"
              :disabled="deleting"
              @click="isDeleteModalOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="red"
              icon="i-heroicons-trash"
              :loading="deleting"
              :disabled="deleteConfirmName !== settings.name"
              @click="deleteWorkspace"
            >
              Excluir Definitivamente
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Tag } from '~/types/chat.types'

definePageMeta({
  layout: 'workspace',
  middleware: ['auth'],
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const workspaceId = route.params.id as string

const tabs = [
  { label: 'Geral', slot: 'geral', icon: 'i-heroicons-cog-6-tooth' },
  { label: 'Equipe', slot: 'equipe', icon: 'i-heroicons-users' },
  { label: 'Respostas Rápidas', slot: 'respostas', icon: 'i-heroicons-chat-bubble-left-right' },
  { label: 'Etiquetas', slot: 'tags', icon: 'i-heroicons-tag' }
]

// ── Webhook URL ───────────────────────────────────────────────────────────────
const requestUrl = useRequestURL()
const webhookUrl = computed(() => `${requestUrl.origin}/api/webhooks/evolution`)
const copied = ref(false)

const copyWebhook = () => {
  navigator.clipboard.writeText(webhookUrl.value)
  copied.value = true
  useToast().add({
    title: 'URL copiada!',
    description: 'URL pronta para usar no Webhook.',
    icon: 'i-heroicons-clipboard-document-check',
    color: 'green',
    timeout: 3000,
  })
  setTimeout(() => (copied.value = false), 3000)
}

// ── Workspace Settings ────────────────────────────────────────────────────────
const saving = ref(false)
const settings = ref({ name: '' })

const { data: workspaceData } = await useAsyncData(`settings-${workspaceId}`, async () => {
  const { data } = await supabase.from('workspaces').select('name').eq('id', workspaceId).single()
  return data
})

if (workspaceData.value) {
  settings.value.name = workspaceData.value.name
}

const saveSettings = async () => {
  if (!settings.value.name.trim()) return
  saving.value = true
  const { error } = await supabase
    .from('workspaces')
    .update({ name: settings.value.name })
    .eq('id', workspaceId)

  if (error) {
    useToast().add({ title: 'Erro ao salvar', color: 'red', icon: 'i-heroicons-x-circle' })
  } else {
    useToast().add({ title: 'Salvo com sucesso!', icon: 'i-heroicons-check-circle' })
  }
  saving.value = false
}

// ── Team Members ──────────────────────────────────────────────────────────────
interface Member {
  user_id: string
  role: string
  profile: { email: string | null; name: string | null } | null
}

const inviteEmail = ref('')
const inviting = ref(false)

const {
  data: members,
  pending: membersPending,
  refresh: refreshMembers,
} = await useAsyncData<Member[]>(`members-${workspaceId}`, async () => {
  const { data, error } = await supabase
    .from('user_workspaces')
    .select('user_id, role, profile:profiles(email, name)')
    .eq('workspace_id', workspaceId)
  if (error) throw error
  return (data ?? []) as unknown as Member[]
})

const inviteMember = async () => {
  if (!inviteEmail.value.trim()) return
  inviting.value = true
  try {
    await $fetch(`/api/workspace/${workspaceId}/invite`, {
      method: 'POST',
      body: { email: inviteEmail.value.trim() },
    })
    inviteEmail.value = ''
    refreshMembers()
    useToast().add({
      title: 'Convite enviado!',
      description: 'O usuário receberá um email para aceitar o convite.',
      icon: 'i-heroicons-envelope',
      color: 'green',
    })
  } catch (e: unknown) {
    const err = e as { statusMessage?: string }
    useToast().add({
      title: 'Erro ao convidar',
      description: err.statusMessage ?? 'Tente novamente.',
      color: 'red',
      icon: 'i-heroicons-x-circle',
    })
  } finally {
    inviting.value = false
  }
}

// ── Quick Replies ─────────────────────────────────────────────────────────────
interface QuickReply {
  id: string
  shortcut: string
  content: string
}

const { data: replies, pending: repliesPending, refresh: refreshReplies } = await useAsyncData(
  `quick-replies-${workspaceId}`,
  () => $fetch<QuickReply[]>(`/api/workspace/${workspaceId}/quick-replies`)
)

const quickReplyModal = ref({
  isOpen: false,
  loading: false,
  id: '',
  shortcut: '',
  content: ''
})

const openQuickReplyModal = (reply?: QuickReply) => {
  quickReplyModal.value = {
    isOpen: true,
    loading: false,
    id: reply?.id || '',
    shortcut: reply?.shortcut || '',
    content: reply?.content || ''
  }
}

const saveQuickReply = async () => {
  if (!quickReplyModal.value.shortcut || !quickReplyModal.value.content) return
  quickReplyModal.value.loading = true
  try {
    const url = quickReplyModal.value.id 
      ? `/api/workspace/${workspaceId}/quick-replies/${quickReplyModal.value.id}`
      : `/api/workspace/${workspaceId}/quick-replies`
    
    await $fetch(url, {
      method: quickReplyModal.value.id ? 'PATCH' : 'POST',
      body: {
        shortcut: quickReplyModal.value.shortcut,
        content: quickReplyModal.value.content
      }
    })
    
    useToast().add({ title: 'Resposta rápida salva!', icon: 'i-heroicons-check-circle' })
    quickReplyModal.value.isOpen = false
    refreshReplies()
  } catch (e: any) {
    useToast().add({ title: 'Erro ao salvar', description: e.statusMessage, color: 'red' })
  } finally {
    quickReplyModal.value.loading = false
  }
}

const deleteReply = async (id: string) => {
  if (!confirm('Excluir esta resposta rápida?')) return
  try {
    await $fetch(`/api/workspace/${workspaceId}/quick-replies/${id}`, { method: 'DELETE' })
    useToast().add({ title: 'Resposta excluída', icon: 'i-heroicons-trash' })
    refreshReplies()
  } catch (e: any) {
    useToast().add({ title: 'Erro ao excluir', description: e.statusMessage, color: 'red' })
  }
}

// ── Tags ──────────────────────────────────────────────────────────────────────
const { data: allTags, pending: tagsPending, refresh: refreshTags } = await useAsyncData(
  `tags-${workspaceId}`,
  () => $fetch<Tag[]>(`/api/workspace/${workspaceId}/tags`)
)

const tagModal = ref({
  isOpen: false,
  loading: false,
  id: '',
  name: '',
  color: '#3b82f6'
})

const openTagModal = (tag?: Tag) => {
  tagModal.value = {
    isOpen: true,
    loading: false,
    id: tag?.id || '',
    name: tag?.name || '',
    color: tag?.color || '#3b82f6'
  }
}

const saveTag = async () => {
  if (!tagModal.value.name) return
  tagModal.value.loading = true
  try {
    const url = tagModal.value.id 
      ? `/api/workspace/${workspaceId}/tags/${tagModal.value.id}`
      : `/api/workspace/${workspaceId}/tags`
    
    await $fetch(url, {
      method: tagModal.value.id ? 'PATCH' : 'POST',
      body: {
        name: tagModal.value.name,
        color: tagModal.value.color
      }
    })
    
    useToast().add({ title: 'Etiqueta salva!', icon: 'i-heroicons-check-circle' })
    tagModal.value.isOpen = false
    refreshTags()
  } catch (e: any) {
    useToast().add({ title: 'Erro ao salvar', description: e.statusMessage, color: 'red' })
  } finally {
    tagModal.value.loading = false
  }
}

const deleteTag = async (id: string) => {
  if (!confirm('Excluir esta etiqueta?')) return
  try {
    await $fetch(`/api/workspace/${workspaceId}/tags/${id}`, { method: 'DELETE' })
    useToast().add({ title: 'Etiqueta excluída', icon: 'i-heroicons-trash' })
    refreshTags()
  } catch (e: any) {
    useToast().add({ title: 'Erro ao excluir', description: e.statusMessage, color: 'red' })
  }
}

// ── Delete Workspace ──────────────────────────────────────────────────────────
const isDeleteModalOpen = ref(false)
const deleteConfirmName = ref('')
const deleting = ref(false)

const deleteWorkspace = async () => {
  if (deleteConfirmName.value !== settings.value.name) return
  deleting.value = true
  const { error } = await supabase.from('workspaces').delete().eq('id', workspaceId)
  deleting.value = false

  if (error) {
    useToast().add({ title: 'Erro ao excluir workspace', color: 'red', icon: 'i-heroicons-x-circle' })
  } else {
    isDeleteModalOpen.value = false
    useToast().add({
      title: 'Workspace excluído',
      description: 'Todos os dados foram removidos permanentemente.',
      icon: 'i-heroicons-trash',
      color: 'gray',
    })
    await router.push('/')
  }
}
</script>
