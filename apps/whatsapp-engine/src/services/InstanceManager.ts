import { SupabaseClient } from '@supabase/supabase-js';
import { QueueService } from './QueueService';
import { WhatsAppService } from './WhatsAppService';

export class InstanceManager {
  private instances: Map<string, WhatsAppService> = new Map();
  private supabase: SupabaseClient;
  private queueService: QueueService;

  constructor(supabase: SupabaseClient, queueService: QueueService) {
    this.supabase = supabase;
    this.queueService = queueService;
  }

  public async startInstance(instanceId: string): Promise<WhatsAppService> {
    if (this.instances.has(instanceId)) {
      const instance = this.instances.get(instanceId)!;
      if (instance.connectionStatus === 'disconnected') {
        await instance.init();
      }
      return instance;
    }

    const instance = new WhatsAppService(this.supabase, this.queueService, instanceId);
    this.instances.set(instanceId, instance);
    
    // Start connection asynchronously
    instance.init().catch(err => {
      console.error(`[${instanceId}] Failed to initialize instance:`, err);
    });

    return instance;
  }

  public async stopInstance(instanceId: string): Promise<boolean> {
    const instance = this.instances.get(instanceId);
    if (instance) {
      await instance.logout();
      this.instances.delete(instanceId);
      return true;
    }
    return false;
  }

  public getInstance(instanceId: string): WhatsAppService | undefined {
    return this.instances.get(instanceId);
  }

  public getAllInstances() {
    return Array.from(this.instances.entries()).map(([id, instance]) => ({
      id,
      status: instance.connectionStatus
    }));
  }
}
