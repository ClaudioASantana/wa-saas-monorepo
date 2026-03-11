import type { SupabaseClient } from '@supabase/supabase-js'
import type { 
  Conversation, 
  Message, 
  MessageType, 
  ConversationStatus,
  MessageNewEvent,
} from '../../types/chat.types'
import { emitToTenant } from '../utils/socket'

export class ChatService {
  constructor(private supabase: SupabaseClient) {}

  async upsertConversation(params: {
    workspaceId: string
    channelId: string
    contactId: string
    tenantId: string
    lastMessagePreview: string
    status?: ConversationStatus
  }): Promise<Conversation> {
    const now = new Date().toISOString()
    const { data, error } = await this.supabase
      .from('conversations')
      .upsert(
        {
          workspace_id: params.workspaceId,
          channel_id: params.channelId,
          contact_id: params.contactId,
          tenant_id: params.tenantId,
          last_message_at: now,
          last_message_preview: params.lastMessagePreview.substring(0, 100),
          status: params.status || 'open',
        },
        { onConflict: 'channel_id,contact_id' }
      )
      .select('id, workspace_id, channel_id, contact_id, tenant_id, status, unread_count, last_message_at, last_message_preview, created_at')
      .single()

    if (error || !data) throw error || new Error('Failed to upsert conversation')
    
    // Notify status change
    this.notifyStatusChanged(params.tenantId, data.id, data.status as ConversationStatus, now)
    
    return data as unknown as Conversation
  }

  async insertMessage(params: {
    conversationId: string
    tenantId: string
    waMessageId: string | null
    direction: 'inbound' | 'outbound'
    type: MessageType
    content: string
    senderName?: string
    sentAt?: string
  }): Promise<Message> {
    const now = params.sentAt || new Date().toISOString()
    const { data, error } = await this.supabase.from('messages').insert({
      conversation_id: params.conversationId,
      tenant_id: params.tenantId,
      wa_message_id: params.waMessageId,
      direction: params.direction,
      type: params.type,
      content: params.content,
      sender_name: params.senderName || null,
      sent_at: now,
    }).select().single()

    if (error || !data) throw error || new Error('Failed to insert message')

    // Notify new message
    this.notifyNewMessage(params.tenantId, {
      conversationId: params.conversationId,
      messageId: params.waMessageId || data.id,
      type: params.type,
      content: params.content,
      from: params.senderName || 'System',
      timestamp: now
    })

    return data as unknown as Message
  }

  async setConversationStatus(conversationId: string, tenantId: string, status: ConversationStatus): Promise<void> {
    const { error } = await this.supabase
      .from('conversations')
      .update({ status })
      .eq('id', conversationId)
    
    if (error) throw error

    this.notifyStatusChanged(tenantId, conversationId, status, new Date().toISOString())
  }

  private notifyNewMessage(tenantId: string, event: MessageNewEvent) {
    emitToTenant(tenantId, 'message:new', event)
  }

  private notifyStatusChanged(tenantId: string, conversationId: string, status: ConversationStatus, lastMessageAt: string) {
    emitToTenant(tenantId, 'conversation:status_changed', {
      conversationId,
      status,
      lastMessageAt
    })
  }
}
