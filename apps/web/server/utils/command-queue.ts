import { Queue } from 'bullmq'
import { redis } from './redis'

/**
 * Unified queue for sending commands to the whatsapp-engine.
 * This includes sending messages, media, etc.
 */
export const commandQueue = new Queue('whatsapp-commands', {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 1000,
  },
})
