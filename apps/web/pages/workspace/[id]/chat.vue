<template>
  <div class="h-full flex">
    <!-- ── Left: Conversation List ──────────────────────────────────── -->
    <div
      class="w-80 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col shrink-0"
    >
      <div class="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">
          Conversas
        </h2>
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass-20-solid"
          size="sm"
          color="white"
          :trailing="false"
          placeholder="Pesquisar..."
        />
        <div class="flex space-x-2">
          <UButton
            size="xs"
            :color="filter === 'all' ? 'primary' : 'gray'"
            :variant="filter === 'all' ? 'soft' : 'ghost'"
            @click="filter = 'all'"
          >
            Todas
          </UButton>
          <UButton
            size="xs"
            :color="filter === 'open' ? 'primary' : 'gray'"
            :variant="filter === 'open' ? 'soft' : 'ghost'"
            @click="filter = 'open'"
          >
            Abertas
          </UButton>
          <UButton
            size="xs"
            :color="filter === 'resolved' ? 'primary' : 'gray'"
            :variant="filter === 'resolved' ? 'soft' : 'ghost'"
            @click="filter = 'resolved'"
          >
            Resolvidas
          </UButton>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <!-- Loading -->
        <div
          v-if="convPending"
          class="p-4 space-y-3"
        >
          <USkeleton
            v-for="i in 4"
            :key="i"
            class="h-16 w-full"
          />
        </div>

        <!-- Empty -->
        <div
          v-else-if="!filteredConversations.length"
          class="flex flex-col items-center justify-center h-full text-center p-6"
        >
          <UIcon
            name="i-heroicons-chat-bubble-left-right"
            class="w-10 h-10 text-slate-300 mb-3"
          />
          <p class="text-sm text-slate-500">
            Nenhuma conversa ainda.
          </p>
          <p class="text-xs text-slate-400 mt-1">
            As mensagens aparecerão aqui quando chegarem via Evolution API.
          </p>
        </div>

        <!-- List -->
        <div
          v-for="conv in filteredConversations"
          :key="conv.id"
          class="p-4 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors"
          :class="
            selectedConv?.id === conv.id
              ? 'bg-primary-50 dark:bg-primary-900/20'
              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
          "
          @click="selectConversation(conv)"
        >
          <div class="flex items-start space-x-3">
            <UAvatar :alt="conv.contact?.name || conv.contact?.phone || '?'" size="md" />
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-baseline mb-1">
                <h3 class="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {{ conv.contact?.name || conv.contact?.phone }}
                </h3>
                <span class="text-xs text-slate-500 shrink-0 ml-2">
                  {{ formatTime(conv.last_message_at) }}
                </span>
              </div>
              <p class="text-sm text-slate-500 dark:text-slate-400 truncate">
                {{ conv.last_message_preview || '...' }}
              </p>
            </div>
            <span
              v-if="conv.unread_count > 0"
              class="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center shrink-0 font-bold"
            >
              {{ conv.unread_count }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Center: Chat Area ───────────────────────────────────────── -->
    <div class="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 min-w-0">
      <!-- No conversation selected -->
      <div
        v-if="!selectedConv"
        class="flex-1 flex flex-col items-center justify-center text-center p-6"
      >
        <UIcon
          name="i-heroicons-chat-bubble-oval-left-ellipsis"
          class="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4"
        />
        <h3 class="text-base font-semibold text-slate-400">
          Selecione uma conversa
        </h3>
        <p class="text-sm text-slate-400 mt-1">
          Clique em uma conversa ao lado para começar.
        </p>
      </div>

      <template v-else>
        <!-- Chat Header -->
        <div
          class="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur flex items-center justify-between px-6 shrink-0"
        >
          <div class="flex items-center space-x-3">
            <UAvatar
              :alt="selectedConv.contact?.name || selectedConv.contact?.phone || '?'"
              size="md"
            />
            <div>
              <h2 class="text-base font-semibold text-slate-900 dark:text-white">
                {{ selectedConv.contact?.name || selectedConv.contact?.phone }}
              </h2>
              <p class="text-xs text-slate-500">
                {{ selectedConv.contact?.phone }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <UBadge
              :color="selectedConv.status === 'open' ? 'green' : 'gray'"
              variant="subtle"
              size="xs"
            >
              {{ selectedConv.status === 'open' ? 'Aberta' : 'Resolvida' }}
            </UBadge>
            <UButton
              :loading="resolving"
              icon="i-heroicons-check-circle"
              color="gray"
              variant="ghost"
              size="sm"
              @click="resolveConversation"
            >
              Resolver
            </UButton>
          </div>
        </div>

        <!-- Messages -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-6 space-y-3"
        >
          <div
            v-if="msgPending"
            class="flex justify-center py-8"
          >
            <UIcon
              name="i-heroicons-arrow-path"
              class="w-6 h-6 text-primary-400 animate-spin"
            />
          </div>
          <template v-else>
            <div
              v-if="!messages?.length"
              class="text-center text-slate-400 text-sm py-8"
            >
              Nenhuma mensagem ainda nesta conversa.
            </div>
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="flex"
              :class="msg.direction === 'outbound' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="rounded-lg p-3 max-w-xs lg:max-w-md shadow-sm"
                :class="
                  msg.direction === 'outbound'
                    ? 'bg-primary-500 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none'
                "
              >
                <!-- Audio -->
                <audio
                  v-if="msg.type === 'audio' && msg.media_url"
                  :src="msg.media_url"
                  controls
                  class="max-w-full"
                />
                <!-- Image -->
                <img
                  v-else-if="msg.type === 'image' && msg.media_url"
                  :src="msg.media_url"
                  class="rounded-md max-w-full mb-1"
                >
                <!-- Text -->
                <p class="text-sm whitespace-pre-wrap break-words">
                  {{ msg.body || msg.content }}
                </p>
                <span class="text-[10px] mt-1 block text-right opacity-60">{{
                  formatTime(msg.created_at)
                }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- Input -->
        <div
          class="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0"
        >
          <form @submit.prevent="sendMessage" class="flex items-end space-x-2 max-w-4xl mx-auto">
            <UTextarea
              v-model="newMessage"
              autoresize
              :rows="1"
              :maxrows="5"
              placeholder="Digite uma mensagem... (Enter para enviar)"
              class="flex-1"
              @keydown.enter.exact.prevent="sendMessage"
            />
            <UButton
              type="submit"
              icon="i-heroicons-paper-airplane"
              color="primary"
              class="shrink-0"
              :loading="sending"
              :disabled="!newMessage.trim()"
            />
          </form>
        </div>
      </template>
    </div>

    <!-- ── Right: Contact Details ───────────────────────────────────── -->
    <div
      class="hidden lg:flex w-64 border-l border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex-col shrink-0"
    >
      <div class="p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 class="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Detalhes do Contato
        </h2>
      </div>
      <div class="p-4 space-y-4">
        <template v-if="selectedConv">
          <div class="text-center">
            <UAvatar :alt="selectedConv.contact?.name || '?'" size="xl" class="mx-auto" />
            <p class="mt-2 font-semibold text-slate-900 dark:text-white text-sm">
              {{ selectedConv.contact?.name || 'Desconhecido' }}
            </p>
            <p class="text-xs text-slate-500">{{ selectedConv.contact?.phone }}</p>
          </div>
          <UDivider />
          <div class="space-y-2">
            <div class="flex items-center space-x-2 text-xs text-slate-500">
              <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
              <span>Desde {{ formatDate(selectedConv.created_at) }}</span>
            </div>
          </div>
          <div>
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-medium text-slate-500">Anotações</p>
              <UButton
                v-if="currentNotes !== selectedConv.contact?.notes"
                size="xs"
                variant="ghost"
                color="primary"
                :loading="savingNotes"
                @click="saveNotes"
              >
                Salvar
              </UButton>
            </div>
            <UTextarea
              v-model="currentNotes"
              placeholder="Notas sobre este contato..."
              :rows="4"
              class="text-sm"
              :disabled="savingNotes"
            />
          </div>
        </template>
        <div v-else class="flex flex-col items-center justify-center h-full text-center">
          <UIcon name="i-heroicons-user" class="w-8 h-8 text-slate-200 mb-2" />
          <p class="text-xs text-slate-400">Selecione uma conversa</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RealtimeChannel } from '@supabase/supabase-js'

definePageMeta({ layout: 'workspace', middleware: ['auth'] })

const route = useRoute()
const workspaceId = route.params.id as string
const supabase = useSupabaseClient()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseRaw = supabase as any

// ── Types ─────────────────────────────────────────────────────────────────────
interface Contact {
  id: string
  name: string | null
  phone: string
  notes: string | null
}
interface Conversation {
  id: string
  status: string
  last_message_at: string
  last_message_preview: string | null
  unread_count: number
  created_at: string
  contact: Contact | null
}
interface Message {
  id: string
  direction: string
  type: string
  content: string | null
  body: string | null         // coluna gerada = content
  media_url: string | null
  sender_name: string | null
  created_at: string
}

// ── State ─────────────────────────────────────────────────────────────────────
const filter = ref<'all' | 'open' | 'resolved'>('all')
const search = ref('')
const selectedConv = ref<Conversation | null>(null)
const newMessage = ref('')
const sending = ref(false)
const resolving = ref(false)
const savingNotes = ref(false)
const currentNotes = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

// ── Conversations ─────────────────────────────────────────────────────────────
const {
  data: conversations,
  pending: convPending,
  refresh: refreshConv,
} = await useAsyncData<Conversation[]>(`conv-${workspaceId}`, async () => {
  const { data, error } = await supabase
    .from('conversations')
    .select(
      'id, status, last_message_at, last_message_preview, unread_count, created_at, contact:contacts(id, name, phone, notes)'
    )
    .eq('workspace_id', workspaceId)
    .order('last_message_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Conversation[]
})

const filteredConversations = computed(() => {
  let list = conversations.value ?? []
  if (filter.value !== 'all') list = list.filter((c) => c.status === filter.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(
      (c) => c.contact?.name?.toLowerCase().includes(q) || c.contact?.phone?.includes(q)
    )
  }
  return list
})

// ── Messages ──────────────────────────────────────────────────────────────────
const convId = computed(() => selectedConv.value?.id ?? null)

const {
  data: messages,
  pending: msgPending,
  refresh: refreshMessages,
} = useAsyncData<Message[]>(
  () => `msgs-${convId.value}`,
  async () => {
    if (!convId.value) return [] as Message[]
    const { data, error } = await supabase
      .from('messages')
      .select('id, direction, type, content, media_url, sender_name, created_at')
      .eq('conversation_id', convId.value)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as Message[]
  },
  { watch: [convId] }
)

// Auto-scroll to bottom when messages load
watch(messages, async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
})

// ── Actions ───────────────────────────────────────────────────────────────────
const selectConversation = async (conv: Conversation) => {
  selectedConv.value = conv
  currentNotes.value = conv.contact?.notes || ''
  
  // Mark as read
  if (conv.unread_count > 0) {
    await supabaseRaw.from('conversations').update({ unread_count: 0 }).eq('id', conv.id)
    refreshConv()
  }
}

const saveNotes = async () => {
  if (!selectedConv.value?.contact?.id) return
  savingNotes.value = true
  try {
    const { error } = await supabaseRaw
      .from('contacts')
      .update({ notes: currentNotes.value })
      .eq('id', selectedConv.value.contact.id)
    
    if (error) throw error
    
    // Update local state
    if (selectedConv.value.contact) {
      selectedConv.value.contact.notes = currentNotes.value
    }
    
    useToast().add({
      title: 'Anotações salvas!',
      icon: 'i-heroicons-check-circle',
      color: 'green'
    })
  } catch (e: any) {
    useToast().add({
      title: 'Erro ao salvar notas',
      description: e.message,
      color: 'red'
    })
  } finally {
    savingNotes.value = false
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedConv.value) return
  sending.value = true
  try {
    await $fetch('/api/messages', {
      method: 'POST',
      body: { conversation_id: selectedConv.value.id, message: newMessage.value },
    })
    newMessage.value = ''
    refreshMessages()
    refreshConv()
  } catch (e: unknown) {
    const err = e as { statusMessage?: string }
    useToast().add({
      title: 'Erro ao enviar mensagem',
      description: err.statusMessage,
      color: 'red',
    })
  } finally {
    sending.value = false
  }
}

const resolveConversation = async () => {
  if (!selectedConv.value) return
  resolving.value = true
  await supabaseRaw
    .from('conversations')
    .update({ status: 'resolved' })
    .eq('id', selectedConv.value.id)
  selectedConv.value.status = 'resolved'
  resolving.value = false
  useToast().add({ title: 'Conversa resolvida!', icon: 'i-heroicons-check-circle', color: 'green' })
  refreshConv()
}

// ── Realtime ──────────────────────────────────────────────────────────────────
let msgChannel: RealtimeChannel | null = null

const subscribeToConversations = () => {
  supabase
    .channel(`workspace-convs-${workspaceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      () => refreshConv()
    )
    .subscribe()
}

const subscribeToMessages = (conversationId: string) => {
  if (msgChannel) supabase.removeChannel(msgChannel)
  msgChannel = supabase
    .channel(`conv-msgs-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const newMsg = payload.new as Message
        if (messages.value && !messages.value.find((m) => m.id === newMsg.id)) {
          messages.value = [...messages.value, newMsg]
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const updatedMsg = payload.new as Message
        if (messages.value) {
          const index = messages.value.findIndex((m) => m.id === updatedMsg.id)
          if (index !== -1) {
            messages.value[index] = { ...messages.value[index], ...updatedMsg }
          }
        }
      }
    )
    .subscribe()
}

onMounted(() => {
  subscribeToConversations()
})

watch(convId, (id) => {
  if (id) subscribeToMessages(id)
  else if (msgChannel) supabase.removeChannel(msgChannel)
})

onUnmounted(() => {
  supabase.removeAllChannels()
})

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTime = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  return isToday
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')
</script>
