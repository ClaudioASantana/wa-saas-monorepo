import { Queue } from 'bullmq'
import { redis } from './redis'

/**
 * Unified queue for processing all Evolution API webhooks.
 * This includes messages, status updates, and connection events.
 */
export const webhookQueue = new Queue('webhook-processing', {
  connection: redis as any, // Type cast to resolve ioredis/bullmq compatibility
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 1000, // Keep failed jobs for a while for debugging
  },
})
