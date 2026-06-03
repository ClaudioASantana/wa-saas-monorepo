import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null, // BullMQ requires this to be null
  retryStrategy: (times) => Math.min(times * 50, 2000),
})

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err)
})
