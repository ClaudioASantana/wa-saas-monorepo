<template>
  <div class="p-6 space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Canais de WhatsApp
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Conecte e gerencie seus números de WhatsApp via Evolution API.
        </p>
      </div>
      <UButton
        icon="i-heroicons-plus"
        color="primary"
        @click="openAddModal"
      >
        Conectar Canal
      </UButton>
    </div>

    <!-- Loading -->
    <div
      v-if="pending"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <USkeleton
        v-for="i in 3"
        :key="i"
        class="h-28 w-full"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!channels?.length"
      class="text-center py-24 px-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl"
    >
      <UIcon
        name="i-heroicons-device-phone-mobile"
        class="mx-auto h-12 w-12 text-slate-400"
      />
      <h3 class="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
        Nenhum canal conectado
      </h3>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Conecte um número de WhatsApp para começar a receber mensagens.
      </p>
      <UButton
        icon="i-heroicons-plus"
        class="mt-6"
        @click="openAddModal"
      >
        Conectar Primeiro Canal
      </UButton>
    </div>

    <!-- Channels Grid -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <UCard
        v-for="channel in channels"
        :key="channel.id"
        class="transition-all hover:shadow-md"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-3">
            <div
              class="p-2 rounded-lg"
              :class="
                channel.status === 'connected'
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-slate-100 dark:bg-slate-800'
              "
            >
              <UIcon
                name="i-heroicons-device-phone-mobile"
                class="w-5 h-5"
                :class="
                  channel.status === 'connected'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-slate-500'
                "
              />
            </div>
            <div>
              <p class="font-semibold text-slate-900 dark:text-white">
                {{ channel.name }}
              </p>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ channel.phone_number || channel.provider_instance_id }}
              </p>
            </div>
          </div>
          <UBadge
            :color="
              channel.status === 'connected'
                ? 'green'
                : channel.status === 'qr_pending'
                  ? 'yellow'
                  : 'red'
            "
            variant="subtle"
            size="xs"
          >
            {{
              channel.status === 'connected'
                ? 'Conectado'
                : channel.status === 'qr_pending'
                  ? 'Aguardando QR'
                  : 'Desconectado'
            }}
          </UBadge>
        </div>
        <!-- Webhook URL (only when connected) -->
        <div
          v-if="channel.status === 'connected'"
          class="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
        >
          <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            URL do Webhook (Evolution API)
          </p>
          <div class="flex items-center gap-2">
            <code class="flex-1 text-[11px] text-slate-600 dark:text-slate-300 truncate font-mono">
              {{ webhookUrl }}
            </code>
            <UButton
              size="xs"
              variant="ghost"
              color="gray"
              icon="i-heroicons-clipboard-document"
              @click="copyWebhook"
            />
          </div>
          <p class="text-[10px] text-slate-500 mt-2">
            Configure esta URL no painel ou via Postman na sua
            <a
              href="https://evolution-api.com"
              target="_blank"
              class="text-primary-500 hover:underline"
            >Evolution API</a>
          </p>
        </div>

        <div class="mt-3 flex space-x-2">
          <UButton
            v-if="channel.status !== 'connected'"
            size="xs"
            variant="soft"
            icon="i-heroicons-qr-code"
            @click="showQrCode(channel)"
          >
            Conectar via QR
          </UButton>
          <UButton
            size="xs"
            color="red"
            variant="ghost"
            icon="i-heroicons-trash"
            @click="deleteChannel(channel.id)"
          >
            Remover
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Modal: Add Channel (Step 1 - Credentials) -->
    <UModal
      v-model="isAddModalOpen"
      :prevent-close="saving"
    >
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              Conectar Canal de WhatsApp
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              @click="isAddModalOpen = false"
            />
          </div>
        </template>

        <template #default>
          <div class="space-y-4 py-2">
            <UFormGroup
              label="Nome do Canal"
              required
              hint="Ex: Vendas, Suporte, SAC"
            >
              <UInput
                v-model="form.name"
                placeholder="Suporte ao Cliente"
                icon="i-heroicons-tag"
              />
            </UFormGroup>
            <UFormGroup
              label="Instance Name (Evolution API)"
              required
            >
              <UInput
                v-model="form.instanceId"
                placeholder="Ex: MinhaInstancia"
                icon="i-heroicons-key"
              />
            </UFormGroup>
            <UFormGroup
              label="API Token (Evolution API)"
              required
            >
              <UInput
                v-model="form.token"
                type="password"
                placeholder="Seu token Global da Evolution"
                icon="i-heroicons-lock-closed"
              />
            </UFormGroup>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              O Token é a `AUTHENTICATION_API_KEY` configurada no seu arquivo 
              <span class="font-mono text-primary-500">docker-compose.yml</span>
            </p>
            <div
              v-if="formError"
              class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-100 dark:border-red-800"
            >
              {{ formError }}
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton
              color="gray"
              variant="ghost"
              @click="isAddModalOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              :loading="saving"
              icon="i-heroicons-qr-code"
              @click="saveAndGetQr"
            >
              Salvar e Gerar QR Code
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: QR Code (Step 2 - Scan) -->
    <UModal
      v-model="isQrModalOpen"
      :prevent-close="pollingActive"
    >
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              Escanear QR Code
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              @click="closeQrModal"
            />
          </div>
        </template>

        <template #default>
          <div class="flex flex-col items-center space-y-4 py-4 min-h-[280px] justify-center">
            <!-- Loading spinner -->
            <template v-if="loadingQr">
              <UIcon
                name="i-heroicons-arrow-path"
                class="w-10 h-10 text-primary-500 animate-spin"
              />
              <p class="text-sm text-slate-500">
                Gerando QR Code...
              </p>
            </template>

            <!-- QR Code image -->
            <template v-else-if="qrCodeData">
              <img
                :src="qrCodeData"
                class="w-56 h-56 rounded-xl border-4 border-white dark:border-slate-700 shadow-lg"
                alt="QR Code WhatsApp"
              >
              <div class="text-center space-y-1 px-4">
                <p class="font-semibold text-slate-900 dark:text-white">
                  Abra o WhatsApp no seu celular
                </p>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  Vá em <strong>Configurações → Aparelhos conectados → Conectar aparelho</strong> e
                  escaneie o QR Code acima.
                </p>
              </div>
              <div class="flex items-center space-x-2 text-sm text-slate-500">
                <UIcon
                  name="i-heroicons-arrow-path"
                  class="w-4 h-4 animate-spin text-primary-500"
                />
                <span>Aguardando confirmação...</span>
              </div>
            </template>

            <!-- Error / no data -->
            <template v-else>
              <UIcon
                name="i-heroicons-x-circle"
                class="w-10 h-10 text-red-400"
              />
              <p class="text-sm text-slate-500 text-center">
                Não foi possível carregar o QR Code.<br>Clique em "Novo QR Code" abaixo.
              </p>
            </template>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-between items-center">
            <UButton
              size="sm"
              variant="ghost"
              color="gray"
              icon="i-heroicons-arrow-path"
              :loading="loadingQr"
              @click="refreshQr"
            >
              Novo QR Code
            </UButton>
            <UButton
              color="gray"
              @click="closeQrModal"
            >
              Fechar
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
const workspaceId = route.params.id as string
const { token } = useAuth()
const config = useRuntimeConfig()
const API_URL = config.public.apiUrl as string

// ── Webhook URL ──────────────────────────────────────────────────────────────
const requestUrl = useRequestURL()
const webhookUrl = computed(() => `${requestUrl.origin}/api/webhooks/evolution`)

const copyWebhook = () => {
  navigator.clipboard.writeText(webhookUrl.value)
  useToast().add({
    title: 'URL copiada!',
    description: 'Cole no painel da sua API → Webhook.',
    icon: 'i-heroicons-clipboard-document-check',
    color: 'green',
    timeout: 3000,
  })
}

interface Channel {
  id: string
  name: string
  status: string
  phone_number: string | null
  provider_instance_id: string
  created_at: string
}

// ── State ────────────────────────────────────────────────────────────────────
const isAddModalOpen = ref(false)
const isQrModalOpen = ref(false)
const saving = ref(false)
const loadingQr = ref(false)
const pollingActive = ref(false)
const qrCodeData = ref('')
const formError = ref('')
const activeChannelId = ref<string | null>(null)

const form = ref({ name: '', instanceId: '', token: '' })

const {
  data: channels,
  pending,
  refresh,
} = await useAsyncData<Channel[]>(`channels-${workspaceId}`, () =>
  $fetch<Channel[]>(`${API_URL}/channels?workspace_id=${workspaceId}`, {
    headers: { Authorization: `Bearer ${token.value}` }
  })
)

// ── Add Modal ─────────────────────────────────────────────────────────────────
const openAddModal = () => {
  form.value = { name: '', instanceId: '', token: '' }
  formError.value = ''
  isAddModalOpen.value = true
}

const saveAndGetQr = async () => {
  if (!form.value.name || !form.value.instanceId || !form.value.token) {
    formError.value = 'Todos os campos são obrigatórios.'
    return
  }
  saving.value = true
  formError.value = ''

  try {
    const channel = await $fetch<Channel>(`${API_URL}/channels`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        workspace_id: workspaceId,
        name: form.value.name,
        provider_instance_id: form.value.instanceId,
        provider_token: form.value.token,
      },
    })
    isAddModalOpen.value = false
    refresh()

    try {
      const statusRes = await $fetch<{ status: string; phone: string }>(
        `${API_URL}/channels/${channel.id}/status`, {
          headers: { Authorization: `Bearer ${token.value}` }
        }
      )
      if (statusRes.status === 'connected') {
        refresh()
        useToast().add({
          title: '✅ Canal conectado!',
          description: `Número: ${statusRes.phone ?? 'registrado'}`,
          icon: 'i-heroicons-check-circle',
          color: 'green',
        })
        return
      }
    } catch {
      // Status check failed — fall through to QR flow
    }

    // Not connected yet — show QR code
    await showQrCode(channel)
  } catch (e: unknown) {
    const err = e as { statusMessage?: string; message?: string }
    formError.value = err.statusMessage || err.message || 'Erro ao salvar canal.'
  } finally {
    saving.value = false
  }
}

// ── QR Code Flow ──────────────────────────────────────────────────────────────
const showQrCode = async (channel: Channel) => {
  activeChannelId.value = channel.id
  isQrModalOpen.value = true
  await refreshQr()
  startPolling()
}

const refreshQr = async () => {
  if (!activeChannelId.value) return
  loadingQr.value = true
  qrCodeData.value = ''
  try {
    const res = await $fetch<{ qrcode: string }>(`${API_URL}/channels/${activeChannelId.value}/qrcode`, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    qrCodeData.value = res.qrcode
  } catch (e) {
    useToast().add({ title: 'Erro ao gerar QR Code', color: 'red', icon: 'i-heroicons-x-circle' })
  } finally {
    loadingQr.value = false
  }
}

let pollingInterval: ReturnType<typeof setInterval> | null = null

const startPolling = () => {
  pollingActive.value = true
  pollingInterval = setInterval(async () => {
    if (!activeChannelId.value) return
    try {
      const res = await $fetch<{ status: string; phone: string }>(
        `${API_URL}/channels/${activeChannelId.value}/status`, {
          headers: { Authorization: `Bearer ${token.value}` }
        }
      )
      if (res.status === 'connected') {
        stopPolling()
        isQrModalOpen.value = false
        refresh()
        useToast().add({
          title: '✅ WhatsApp Conectado!',
          description: `Número: ${res.phone ?? 'registrado'}`,
          icon: 'i-heroicons-check-circle',
          color: 'green',
        })
      }
    } catch {
      // Silently ignore polling errors
    }
  }, 3000)
}

const stopPolling = () => {
  if (pollingInterval) clearInterval(pollingInterval)
  pollingInterval = null
  pollingActive.value = false
}

const closeQrModal = () => {
  stopPolling()
  isQrModalOpen.value = false
  activeChannelId.value = null
  qrCodeData.value = ''
  refresh()
}

// ── Delete Channel ────────────────────────────────────────────────────────────
const deleteChannel = async (channelId: string) => {
  try {
    await $fetch(`${API_URL}/channels/${channelId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.value}` }
    })
    useToast().add({ title: 'Canal removido', icon: 'i-heroicons-check-circle' })
    refresh()
  } catch (error) {
    useToast().add({ title: 'Erro ao remover canal', color: 'red' })
  }
}

onUnmounted(() => stopPolling())
</script>
