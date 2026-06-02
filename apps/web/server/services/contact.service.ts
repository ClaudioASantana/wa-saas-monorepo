import type { SupabaseClient } from '@supabase/supabase-js'
import type { Contact } from '../../types/chat.types'

export class ContactService {
  constructor(private supabase: SupabaseClient) {}

  async upsertContact(params: {
    workspaceId: string
    phone: string
    name: string
    tenantId: string
    remoteJid?: string
  }): Promise<Contact> {
    const { workspaceId, phone, name, tenantId, remoteJid } = params

    // LID check logic (from old worker)
    if (remoteJid?.includes('@lid')) {
      const { data: existingContact } = await this.supabase
        .from('contacts')
        .select('id, workspace_id, phone, name, notes, tenant_id, created_at')
        .eq('workspace_id', workspaceId)
        .eq('name', name)
        .not('phone', 'ilike', '%@lid')
        .limit(1)
        .maybeSingle()
      
      if (existingContact) return existingContact as unknown as Contact
    }

    const { data, error } = await this.supabase
      .from('contacts')
      .upsert(
        { workspace_id: workspaceId, phone, name, tenant_id: tenantId },
        { onConflict: 'workspace_id,phone' }
      )
      .select('id, workspace_id, phone, name, notes, tenant_id, created_at')
      .single()

    if (error || !data) throw error || new Error('Failed to upsert contact')
    return data as unknown as Contact
  }

  async updateNotes(contactId: string, notes: string): Promise<void> {
    const { error } = await this.supabase
      .from('contacts')
      .update({ notes })
      .eq('id', contactId)
    
    if (error) throw error
  }
}
