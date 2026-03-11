import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/1'

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
  retryStrategy: (times) => Math.min(times * 50, 2000),
})

redis.on('error', (err) => {
  console.error('[Redis Error]', err)
})

redis.on('connect', () => {
  console.log('[Redis] Connected to', redisUrl)
})
