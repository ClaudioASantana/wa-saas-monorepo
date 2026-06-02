import { Queue } from 'bullmq'
import { redis } from './redis'

export const mediaQueue = new Queue('media-uploads', {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: 1000,
  }
})
