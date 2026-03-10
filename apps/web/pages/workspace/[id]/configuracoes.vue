<template>
  <div class="p-6 space-y-8">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Gerencie as configurações gerais do seu workspace.
      </p>
    </div>

    <!-- Workspace Settings -->
    <UCard>
      <template #header>
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Informações do Workspace
        </h3>
      </template>
      <template #default>
        <form @submit.prevent="saveSettings" class="space-y-4">
          <UFormGroup label="Nome do Workspace">
            <UInput
              v-model="settings.name"
              placeholder="Nome da sua agência"
              icon="i-heroicons-building-office"
            />
          </UFormGroup>
          <div class="flex justify-end">
            <UButton type="submit" color="primary" :loading="saving">Salvar Alterações</UButton>
          </div>
        </form>
      </template>
    </UCard>

    <!-- Webhook URL -->
    <UCard>
      <template #header>
        <div class="flex items-center space-x-2">
          <UIcon name="i-heroicons-bolt" class="w-5 h-5 text-primary-500" />
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">URL do Webhook</h3>
        </div>
      </template>
      <template #default>
        <div class="space-y-3">
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Configure esta URL no painel ou via Postman na sua 
            <a href="https://evolution-api.com" target="_blank" class="text-primary-500 hover:underline font-medium">Evolution API</a>
            para receber mensagens em tempo real.
          </p>
          <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
            <UIcon name="i-heroicons-link" class="w-4 h-4 text-slate-400 shrink-0" />
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
      </template>
    </UCard>

    <!-- Team Members -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <UIcon name="i-heroicons-users" class="w-5 h-5 text-primary-500" />
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Membros da Equipe</h3>
          </div>
          <UBadge color="gray" variant="subtle">{{ members.length }} membro(s)</UBadge>
        </div>
      </template>
      <template #default>
        <div class="space-y-4">
          <!-- Member list -->
          <div v-if="membersPending" class="space-y-3">
            <USkeleton v-for="i in 2" :key="i" class="h-12 w-full" />
          </div>
          <ul v-else class="divide-y divide-slate-100 dark:divide-slate-800">
            <li
              v-for="member in members"
              :key="member.user_id"
              class="flex items-center justify-between py-3"
            >
              <div class="flex items-center space-x-3">
                <UAvatar :alt="member.profile?.email ?? 'M'" size="sm" />
                <div>
                  <p class="text-sm font-medium text-slate-900 dark:text-white">
                    {{ member.profile?.name || member.profile?.email }}
                  </p>
                  <p class="text-xs text-slate-500">{{ member.profile?.email }}</p>
                </div>
              </div>
              <UBadge :color="member.role === 'owner' ? 'primary' : 'gray'" variant="subtle" size="xs">
                {{ member.role === 'owner' ? 'Proprietário' : 'Membro' }}
              </UBadge>
            </li>
          </ul>

          <!-- Invite by email -->
          <UDivider label="Convidar novo membro" />
          <form @submit.prevent="inviteMember" class="flex gap-3">
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
      </template>
    </UCard>

    <!-- Danger Zone -->
    <UCard :ui="{ ring: 'ring-1 ring-red-300 dark:ring-red-800' }">
      <template #header>
        <div class="flex items-center space-x-2">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
          <h3 class="text-base font-semibold text-red-600 dark:text-red-400">Zona de Perigo</h3>
        </div>
      </template>
      <template #default>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-slate-900 dark:text-white">Excluir Workspace</p>
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
      </template>
    </UCard>

    <!-- Delete Confirmation Modal -->
    <UModal v-model="isDeleteModalOpen" :prevent-close="deleting">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center space-x-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Confirmar exclusão</h3>
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
            <UButton color="gray" variant="ghost" @click="isDeleteModalOpen = false" :disabled="deleting">
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
definePageMeta({
  layout: 'workspace',
  middleware: ['auth'],
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const workspaceId = route.params.id as string

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

const { data } = await useAsyncData(`settings-${workspaceId}`, async () => {
  const { data } = await supabase.from('workspaces').select('name').eq('id', workspaceId).single()
  return data
})

if (data.value) {
  settings.value.name = data.value.name
}

const saveSettings = async () => {
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
