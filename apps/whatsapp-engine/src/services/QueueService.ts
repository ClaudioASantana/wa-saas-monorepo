import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import pino from 'pino';
import { InstanceManager } from './InstanceManager';

const logger = pino({ name: 'QueueService' });

export class QueueService {
  private queue: Queue;
  private redisConnection: Redis;
  private commandWorker: Worker | null = null;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/1';
    
    this.redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null, // Required by BullMQ
    });

    this.redisConnection.on('error', (err) => {
      logger.error({ err }, '[Redis] Connection Error');
    });

    this.redisConnection.on('connect', () => {
      logger.info(`[Redis] Connected to ${redisUrl}`);
    });

    // Use the exact same queue name as the web worker
    this.queue = new Queue('webhook-processing', {
      connection: this.redisConnection as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 1000,
      },
    });
  }

  /**
   * Starts listening to commands (like sendMessage) sent from the main backend
   */
  public startCommandWorker(instanceManager: InstanceManager) {
    if (this.commandWorker) return;

    logger.info('[QueueService] Starting WhatsApp command worker...');
    
    this.commandWorker = new Worker('whatsapp-commands', async (job) => {
      const { action, instanceId, data } = job.data;
      
      logger.info({ action, instanceId }, `[QueueService] Processing command`);

      if (action === 'sendMessage') {
        const instance = instanceManager.getInstance(instanceId);
        if (!instance) {
          throw new Error(`Instance ${instanceId} not found or not connected`);
        }
        await instance.sendMessage(data.to, data.text);
      } else {
        logger.warn({ action }, `[QueueService] Unknown command action`);
      }
    }, { connection: this.redisConnection as any });

    this.commandWorker.on('failed', (job, err) => {
      logger.error({ err, job: job?.id }, '[QueueService] Job failed');
    });
  }

  /**
   * Publishes an event to the background worker processing queue
   * Bypassing HTTP directly into Redis for maximum performance
   */
  public async publishWebhookEvent(event: string, instance: string, data: any) {
    try {
      const payload = { event, instance, data };
      await this.queue.add('evolution-webhook', { payload });
      logger.info({ event, instance }, `[QueueService] Published event to webhook-processing`);
    } catch (error) {
      logger.error({ error, event, instance }, '[QueueService] Failed to enqueue webhook');
    }
  }
}
