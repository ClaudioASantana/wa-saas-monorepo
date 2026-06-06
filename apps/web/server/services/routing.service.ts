import type { SupabaseClient } from '@supabase/supabase-js'
import { ChatService } from './chat.service'
import { redis } from '../utils/redis'

export class RoutingService {
  constructor(private supabase: SupabaseClient, private chatService: ChatService) {}

  async findAgentByRoundRobin(workspaceId: string): Promise<string | null> {
    const { data: agents, error } = await this.supabase
      .from('user_workspaces')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .order('user_id')
    
    if (error || !agents || agents.length === 0) return null

    const redisKey = `rr:${workspaceId}`
    const currentIndex = await redis.incr(redisKey)

    const agentIndex = (currentIndex - 1) % agents.length
    return agents[agentIndex].user_id
  }

  async findLastAgentForContact(contactId: string, tenantId: string, retentionDays: number): Promise<string | null> {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - retentionDays)

    const { data, error } = await this.supabase
      .from('conversations')
      .select('agent_id, created_at')
      .eq('contact_id', contactId)
      .eq('tenant_id', tenantId)
      .not('agent_id', 'is', null)
      .gte('created_at', thresholdDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) return null

    const agentId = data[0].agent_id
    
    const { data: activeCheck } = await this.supabase
      .from('user_workspaces')
      .select('user_id')
      .eq('user_id', agentId)
      .eq('status', 'active')
      .single()

    if (!activeCheck) return null

    return agentId
  }

  async findAgentByTag(/* tagId: string, tenantId: string */): Promise<string | null> {
    return null
  }

  async routeConversation(params: {
    workspaceId: string
    tenantId: string
    contactId: string
    conversationId: string
  }): Promise<void> {
    const { data: config } = await this.supabase
      .from('routing_config')
      .select('*')
      .eq('workspace_id', params.workspaceId)
      .single()

    if (!config || !config.round_robin_enabled) {
      return
    }

    let assignedAgentId: string | null = null

    if (config.retention_days && config.retention_days > 0) {
      assignedAgentId = await this.findLastAgentForContact(params.contactId, params.tenantId, config.retention_days)
    }

    if (!assignedAgentId) {
      assignedAgentId = await this.findAgentByRoundRobin(params.workspaceId)
    }

    if (assignedAgentId) {
      await this.chatService.assignConversation(params.conversationId, params.tenantId, assignedAgentId)
      
      await this.chatService.insertMessage({
        conversationId: params.conversationId,
        tenantId: params.tenantId,
        waMessageId: null,
        direction: 'outbound',
        type: 'system',
        content: `Conversa atribuída automaticamente via sistema de roteamento.`,
        isInternal: true
      })
    }
  }
}
