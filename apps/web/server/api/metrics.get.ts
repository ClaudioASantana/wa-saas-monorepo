import { redis } from '../utils/redis'
import { Queue } from 'bullmq'

export default defineEventHandler(async () => {
  const webhookQueue = new Queue('webhook-processing', { connection: redis as any })
  const mediaQueue = new Queue('media-uploads', { connection: redis as any })

  const [
    webhookWait,
    webhookActive,
    mediaWait,
    mediaActive,
    redisInfo
  ] = await Promise.all([
    webhookQueue.getWaitingCount(),
    webhookQueue.getActiveCount(),
    mediaQueue.getWaitingCount(),
    mediaQueue.getActiveCount(),
    redis.info('stats')
  ])

  // Simple parser for redis info
  const extractStat = (name: string) => {
    const match = redisInfo.match(new RegExp(`^${name}:(\\d+)`, 'm'))
    return match ? parseInt(match[1], 10) : 0
  }

  return {
    queues: {
      webhook: {
        waiting: webhookWait,
        active: webhookActive
      },
      media: {
        waiting: mediaWait,
        active: mediaActive
      }
    },
    redis: {
      total_connections_received: extractStat('total_connections_received'),
      total_commands_processed: extractStat('total_commands_processed'),
      instantaneous_ops_per_sec: extractStat('instantaneous_ops_per_sec')
    },
    timestamp: new Date().toISOString()
  }
})
