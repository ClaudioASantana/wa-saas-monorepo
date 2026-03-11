export type MessageDirection = 'inbound' | 'outbound'
export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'vcard' | 'location'
export type ConversationStatus = 'open' | 'pending' | 'resolved' | 'closed'

export interface Contact {
  id: string
  workspace_id: string
  tenant_id: string
  phone: string
  name: string | null
  notes: string | null
  avatar_url?: string | null
  created_at: string
}

export interface Conversation {
  id: string
  workspace_id: string
  channel_id: string
  contact_id: string
  tenant_id: string
  status: ConversationStatus
  unread_count: number
  last_message_at: string
  last_message_preview: string | null
  created_at: string
  contact?: Contact
}

export interface Message {
  id: string
  conversation_id: string
  tenant_id: string
  wa_message_id: string | null
  direction: MessageDirection
  type: MessageType
  content: string | null
  body?: string | null // Virtual/generated column in DB
  media_url?: string | null
  mime_type?: string | null
  sender_name?: string | null
  sent_at: string
  created_at: string
}

// Socket Events Payload
export interface MessageNewEvent {
  conversationId: string
  messageId: string
  type: MessageType
  content: string
  from: string
  timestamp: string
}

export interface MessageUpdateEvent {
  messageId: string
  mediaUrl?: string
  status?: string
}

export interface ConversationStatusChangedEvent {
  conversationId: string
  status: ConversationStatus
  lastMessageAt: string
}
