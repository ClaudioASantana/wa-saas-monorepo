import { FastifyInstance } from 'fastify'
import { utcNow } from '../utils/time'

export async function healthRoute(app: FastifyInstance) {
  app.get('/health', async () => {
    let redisOk = false
    let supabaseOk = false
    let s3Ok = false

    try {
      const { redis } = await import('../config/redis')
      redisOk = (await redis.ping()) === 'PONG'
    } catch (e) {
      // Ignored
    }

    try {
      const { supabase } = await import('../config/supabase')
      const { data } = await supabase.from('user_workspaces').select('id').limit(1)
      if (data) supabaseOk = true
    } catch (e) {
      // Ignored
    }

    try {
      const { s3 } = await import('../config/s3')
      const { ListBucketsCommand } = await import('@aws-sdk/client-s3')
      await s3.send(new ListBucketsCommand({}))
      s3Ok = true
    } catch (e) {
      // Ignored
    }

    const isOk = redisOk && supabaseOk && s3Ok

    return {
      status: isOk ? 'ok' : 'degraded',
      timestamp: utcNow().toISOString(),
      version: process.env.npm_package_version ?? '0.0.1',
      services: {
        redis: redisOk ? 'up' : 'down',
        supabase: supabaseOk ? 'up' : 'down',
        s3: s3Ok ? 'up' : 'down'
      }
    }
  })
}
