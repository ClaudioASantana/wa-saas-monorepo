import { pool } from '../config/db'
import pino from 'pino'
import { redis } from '../config/redis'

const logger = pino({ name: 'RoutingService' })

export class RoutingService {
  /**
   * Obtém a configuração de roteamento de um tenant
   */
  async getConfig(tenantId: string) {
    const result = await pool.query('SELECT * FROM routing_config WHERE tenant_id = $1', [tenantId])
    if (result.rows.length === 0) {
      // Cria config padrão se não existir
      const insert = await pool.query(
        'INSERT INTO routing_config (tenant_id, round_robin_enabled, retention_days, tag_routing) VALUES ($1, false, 0, $2) RETURNING *',
        [tenantId, JSON.stringify([])]
      )
      return insert.rows[0]
    }
    return result.rows[0]
  }

  /**
   * Atualiza a configuração de roteamento
   */
  async updateConfig(tenantId: string, data: { round_robin_enabled?: boolean, retention_days?: number, tag_routing?: any }) {
    const config = await this.getConfig(tenantId) // Garante que existe

    const updates: string[] = []
    const values: any[] = []
    let i = 1

    if (data.round_robin_enabled !== undefined) {
      updates.push(`round_robin_enabled = $${i++}`)
      values.push(data.round_robin_enabled)
    }
    if (data.retention_days !== undefined) {
      updates.push(`retention_days = $${i++}`)
      values.push(data.retention_days)
    }
    if (data.tag_routing !== undefined) {
      updates.push(`tag_routing = $${i++}`)
      values.push(data.tag_routing)
    }

    if (updates.length === 0) return config

    updates.push(`updated_at = NOW()`)
    values.push(tenantId)

    const query = `UPDATE routing_config SET ${updates.join(', ')} WHERE tenant_id = $${i} RETURNING *`
    const result = await pool.query(query, values)
    return result.rows[0]
  }

  /**
   * Encontra o próximo agente disponível via Round Robin
   */
  async findAgentByRoundRobin(tenantId: string): Promise<string | null> {
    try {
      // 1. Pega todos os agentes (role = agent, supervisor ou admin)
      // Em um cenário real, poderíamos ter uma flag "is_online" ou "is_active_for_routing"
      const result = await pool.query('SELECT id FROM agents WHERE tenant_id = $1 ORDER BY created_at ASC', [tenantId])
      const agents = result.rows.map(r => r.id)
      
      if (agents.length === 0) return null

      // 2. Incrementa o cursor no Redis
      const key = `routing:rr:${tenantId}`
      const currentIndex = await redis.incr(key)
      
      // 3. Pega o agente
      const agentId = agents[(currentIndex - 1) % agents.length]
      return agentId
    } catch (err) {
      logger.error({ err, tenantId }, 'Erro no round robin')
      return null
    }
  }

  /**
   * Verifica se houve conversa recente com um agente (Retenção)
   */
  async findLastAgentForContact(tenantId: string, contactId: string, retentionDays: number): Promise<string | null> {
    if (retentionDays <= 0) return null

    try {
      const result = await pool.query(`
        SELECT agent_id 
        FROM conversations 
        WHERE tenant_id = $1 AND contact_id = $2 AND agent_id IS NOT NULL 
          AND updated_at >= NOW() - INTERVAL '${retentionDays} days'
        ORDER BY updated_at DESC LIMIT 1
      `, [tenantId, contactId])

      if (result.rows.length > 0) {
        return result.rows[0].agent_id
      }
      return null
    } catch (err) {
      logger.error({ err, tenantId, contactId }, 'Erro na retenção')
      return null
    }
  }

  /**
   * Processa o roteamento de uma conversa nova ou que acabou de receber mensagem
   */
  async routeConversation(tenantId: string, conversationId: string, contactId: string) {
    try {
      const config = await this.getConfig(tenantId)
      
      let assignedAgentId: string | null = null

      // 1. Tenta retenção primeiro
      if (config.retention_days > 0) {
        assignedAgentId = await this.findLastAgentForContact(tenantId, contactId, config.retention_days)
      }

      // 2. Fallback pro Round Robin se retenção não achou ngm e RR tá ativado
      if (!assignedAgentId && config.round_robin_enabled) {
        assignedAgentId = await this.findAgentByRoundRobin(tenantId)
      }

      // 3. Se achou alguém, atribui a conversa
      if (assignedAgentId) {
        await pool.query('UPDATE conversations SET agent_id = $1 WHERE id = $2', [assignedAgentId, conversationId])
        
        // Log sistema
        await pool.query(`
          INSERT INTO messages (conversation_id, tenant_id, direction, type, content, is_internal)
          VALUES ($1, $2, 'outbound', 'system', 'Conversa atribuída automaticamente', true)
        `, [conversationId, tenantId])
        
        logger.info({ conversationId, assignedAgentId }, 'Conversa atribuída via Smart Routing')
      }

      return assignedAgentId
    } catch (err) {
      logger.error({ err, tenantId, conversationId }, 'Erro no processo de roteamento')
      return null
    }
  }
}

export const routingService = new RoutingService()
