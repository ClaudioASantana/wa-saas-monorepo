<template>
  <div class="h-full flex">
    <!-- Left: Conversation List -->
    <ConversationList
      v-model:search="search"
      v-model:filter="filter"
      :conversations="filteredConversations"
      :selected-id="selectedConv?.id"
      :pending="convPending"
      :current-agent-id="currentAgent?.id"
      :typing-agents="typingAgents"
      @select="selectConversation"
    />

    <!-- Center: Chat Area -->
    <ChatWindow
      :conversation="selectedConv"
      :messages="messages || []"
      :pending="msgPending"
      :sending="sending"
      :resolving="resolving"
      :current-agent-id="currentAgent?.id"
      :active-agents="selectedConv ? getActiveAgents(selectedConv.id) : []"
      :typing-agents="selectedConv ? getTypingAgents(selectedConv.id) : []"
      @send="sendMessage"
      @typing="(isTyping) => selectedConv && emit('typing', { conversationId: selectedConv.id, isTyping })"
      @resolve="resolveConversation"
      @assign="assignConversation"
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
import type { Conversation, Message, Agent, AgentPresenceEvent, AgentTypingEvent } from '~/types/chat.types'
import ConversationList from '~/components/chat/ConversationList.vue'
import ChatWindow from '~/components/chat/ChatWindow.vue'
import ContactSidebar from '~/components/chat/ContactSidebar.vue'
import { useWebSocket } from '~/composables/useWebSocket'

definePageMeta({ layout: 'workspace', middleware: ['auth'] })

const { on, off, emit } = useWebSocket()
const route = useRoute()
const workspaceId = route.params.id as string
const supabase = useSupabaseClient()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseRaw = supabase as any

// ── Presence & Typing State ───────────────────────────────────────────────────
// Maps conversationId -> Set of agent names or IDs
const activeAgents = ref<Record<string, Set<string>>>({})
const typingAgents = ref<Record<string, Set<string>>>({})

const getActiveAgents = (conversationId: string) => Array.from(activeAgents.value[conversationId] || [])
const getTypingAgents = (conversationId: string) => Array.from(typingAgents.value[conversationId] || [])

// ── State ─────────────────────────────────────────────────────────────────────
const filter = ref<'all' | 'open' | 'resolved' | 'mine'>('all')
const search = ref('')
const selectedConv = ref<Conversation | null>(null)
const sending = ref(false)
const resolving = ref(false)
const savingNotes = ref(false)

const user = useSupabaseUser()
const currentAgent = ref<Agent | null>(null)

// ── Conversations ─────────────────────────────────────────────────────────────
const {
  data: conversations,
  pending: convPending,
  refresh: refreshConv,
} = await useAsyncData<Conversation[]>(`conv-${workspaceId}`, async () => {
  const { data, error } = await supabase
    .from('conversations')
    .select(
      'id, workspace_id, channel_id, contact_id, agent_id, tenant_id, status, last_message_at, last_message_preview, unread_count, created_at, contact:contacts(id, name, phone, notes), agent:agents(id, name)'
    )
    .eq('workspace_id', workspaceId)
    .order('last_message_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Conversation[]
})

const filteredConversations = computed(() => {
  let list = conversations.value ?? []
  if (filter.value === 'mine') {
    list = list.filter((c) => c.agent_id === currentAgent.value?.id)
  } else if (filter.value !== 'all') {
    list = list.filter((c) => c.status === filter.value)
  }
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
      .select('id, conversation_id, tenant_id, wa_message_id, direction, type, content, media_url, sender_name, is_internal, created_at')
      .eq('conversation_id', convId.value)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as Message[]
  },
  { watch: [convId] }
)

// ── Actions ───────────────────────────────────────────────────────────────────
const selectConversation = async (conv: Conversation) => {
  // Leave previous room if any
  if (selectedConv.value) {
    emit('leave:conversation', selectedConv.value.id)
  }

  selectedConv.value = conv
  
  // Join new room
  emit('join:conversation', conv.id)

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

const sendMessage = async (text: string, isInternal: boolean = false) => {
  if (!selectedConv.value) return
  sending.value = true
  try {
    await $fetch(`/api/messages`, {
      method: 'POST',
      body: {
        conversation_id: selectedConv.value.id,
        message: text,
        is_internal: isInternal
      }
    })
    refreshMessages()
    refreshConv()
  } catch (e: any) {
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

const assignConversation = async (agentId: string | null) => {
  if (!selectedConv.value) return
  try {
    await $fetch('/api/chat/assign', {
      method: 'POST',
      body: { conversationId: selectedConv.value.id, agentId }
    })
    
    // Update local state for immediate feedback
    if (selectedConv.value) {
      selectedConv.value.agent_id = agentId
    }
    
    refreshConv()
    useToast().add({
      title: agentId ? 'Conversa atribuída!' : 'Conversa liberada!',
      icon: 'i-heroicons-check-circle',
      color: 'green'
    })
  } catch (e: any) {
    useToast().add({
      title: 'Erro ao atribuir conversa',
      description: e.message,
      color: 'red'
    })
  }
}

// ── Realtime (Socket.IO) ──────────────────────────────────────────────────────
const handleIncomingMessage = (newMsg: {
  conversationId: string
  messageId: string
  type?: string
  content: string
  from: string
  timestamp?: string
  isInternal?: boolean
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
        sent_at: newMsg.timestamp || new Date().toISOString(),
        is_internal: !!newMsg.isInternal
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

const handleStatusChanged = (event: {
  conversationId: string
  status: string
  agentId?: string | null
}) => {
  if (selectedConv.value?.id === event.conversationId) {
    selectedConv.value.status = event.status as any
    selectedConv.value.agent_id = event.agentId || null
  }
  refreshConv()
}

const handleAgentJoined = (payload: AgentPresenceEvent) => {
  if (payload.conversationId === convId.value) {
    if (!activeAgents.value[payload.conversationId]) {
      activeAgents.value[payload.conversationId] = new Set()
    }
    activeAgents.value[payload.conversationId].add(payload.agentId)
  }
}

const handleAgentLeft = (payload: AgentPresenceEvent) => {
  if (activeAgents.value[payload.conversationId]) {
    activeAgents.value[payload.conversationId].delete(payload.agentId)
  }
}

const handleAgentTyping = (payload: AgentTypingEvent) => {
  const { conversationId, agentId, isTyping } = payload
  
  if (!typingAgents.value[conversationId]) {
    typingAgents.value[conversationId] = new Set()
  }

  if (isTyping) {
    typingAgents.value[conversationId].add(agentId)
  } else {
    typingAgents.value[conversationId].delete(agentId)
  }
}

onMounted(async () => {
  on('message:new', handleIncomingMessage)
  on('message:update', handleMessageUpdate)
  on('conversation:status_changed', handleStatusChanged)
  on('agent:joined', handleAgentJoined)
  on('agent:left', handleAgentLeft)
  on('agent:typing', handleAgentTyping)

  // Fetch current agent record
  if (user.value?.email) {
    const { data } = await supabase
      .from('agents')
      .select('id, name, email, role')
      .eq('email', user.value.email)
      .single()
    if (data) currentAgent.value = data as any
  }
})

onUnmounted(() => {
  if (selectedConv.value) {
    emit('leave:conversation', selectedConv.value.id)
  }
  off('message:new')
  off('message:update')
  off('conversation:status_changed')
  off('agent:joined')
  off('agent:left')
  off('agent:typing')
})
</script>
