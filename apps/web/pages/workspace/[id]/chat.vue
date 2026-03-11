<template>
  <div class="h-full flex">
    <!-- Left: Conversation List -->
    <ConversationList
      v-model:search="search"
      v-model:filter="filter"
      :conversations="filteredConversations"
      :selected-id="selectedConv?.id"
      :pending="convPending"
      @select="selectConversation"
    />

    <!-- Center: Chat Area -->
    <ChatWindow
      :conversation="selectedConv"
      :messages="messages || []"
      :pending="msgPending"
      :sending="sending"
      :resolving="resolving"
      @send="sendMessage"
      @resolve="resolveConversation"
    />

    <!-- Right: Contact Details -->
    <ContactSidebar
      :contact="selectedConv?.contact || null"
      :created-at="selectedConv?.created_at"
      :saving="savingNotes"
      @save-notes="saveNotes"
    />
  </div>
</template>

<script setup lang="ts">
import type { Conversation, Message } from '~/types/chat.types'
import ConversationList from '~/components/chat/ConversationList.vue'
import ChatWindow from '~/components/chat/ChatWindow.vue'
import ContactSidebar from '~/components/chat/ContactSidebar.vue'
import { useWebSocket } from '~/composables/useWebSocket'

definePageMeta({ layout: 'workspace', middleware: ['auth'] })

const { onEvent, offEvent } = useWebSocket()
const route = useRoute()
const workspaceId = route.params.id as string
const supabase = useSupabaseClient()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseRaw = supabase as any

// ── State ─────────────────────────────────────────────────────────────────────
const filter = ref<'all' | 'open' | 'resolved'>('all')
const search = ref('')
const selectedConv = ref<Conversation | null>(null)
const sending = ref(false)
const resolving = ref(false)
const savingNotes = ref(false)

// ── Conversations ─────────────────────────────────────────────────────────────
const {
  data: conversations,
  pending: convPending,
  refresh: refreshConv,
} = await useAsyncData<Conversation[]>(`conv-${workspaceId}`, async () => {
  const { data, error } = await supabase
    .from('conversations')
    .select(
      'id, workspace_id, channel_id, contact_id, tenant_id, status, last_message_at, last_message_preview, unread_count, created_at, contact:contacts(id, name, phone, notes)'
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
      .select('id, conversation_id, tenant_id, wa_message_id, direction, type, content, media_url, sender_name, created_at')
      .eq('conversation_id', convId.value)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as Message[]
  },
  { watch: [convId] }
)

// ── Actions ───────────────────────────────────────────────────────────────────
const selectConversation = async (conv: Conversation) => {
  selectedConv.value = conv
  
  // Mark as read
  if (conv.unread_count > 0) {
    await supabaseRaw.from('conversations').update({ unread_count: 0 }).eq('id', conv.id)
    refreshConv()
  }
}

const saveNotes = async (notes: string) => {
  if (!selectedConv.value?.contact?.id) return
  savingNotes.value = true
  try {
    const { error } = await supabaseRaw
      .from('contacts')
      .update({ notes })
      .eq('id', selectedConv.value.contact.id)
    
    if (error) throw error
    
    // Update local state
    if (selectedConv.value.contact) {
      selectedConv.value.contact.notes = notes
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

const sendMessage = async (content: string) => {
  if (!selectedConv.value) return
  sending.value = true
  try {
    await $fetch('/api/messages', {
      method: 'POST',
      body: { conversation_id: selectedConv.value.id, message: content },
    })
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

// ── Realtime (Socket.IO) ──────────────────────────────────────────────────────
const handleIncomingMessage = (newMsg: {
  conversationId: string
  messageId: string
  type?: string
  content: string
  from: string
  timestamp?: string
}) => {
  if (selectedConv.value && newMsg.conversationId === selectedConv.value.id) {
    if (messages.value && !messages.value.find((m) => m.id === newMsg.messageId || m.wa_message_id === newMsg.messageId)) {
      const msg: Message = {
        id: newMsg.messageId,
        conversation_id: newMsg.conversationId,
        tenant_id: selectedConv.value.tenant_id,
        wa_message_id: newMsg.messageId,
        direction: 'inbound',
        type: (newMsg.type as any) || 'text',
        content: newMsg.content,
        sender_name: newMsg.from,
        created_at: newMsg.timestamp || new Date().toISOString(),
        sent_at: newMsg.timestamp || new Date().toISOString()
      }
      messages.value = [...messages.value, msg]
    }
  }
  refreshConv()
}

const handleMessageUpdate = (update: {
  messageId: string
  mediaUrl: string
}) => {
  if (messages.value) {
    const index = messages.value.findIndex((m) => m.id === update.messageId || m.wa_message_id === update.messageId)
    if (index !== -1) {
      messages.value[index] = { ...messages.value[index], media_url: update.mediaUrl }
    }
  }
}

onMounted(() => {
  onEvent('message:new', handleIncomingMessage)
  onEvent('message:update', handleMessageUpdate)
})

onUnmounted(() => {
  offEvent('message:new')
  offEvent('message:update')
})
</script>
