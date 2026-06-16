import { FastifyInstance } from 'fastify'
import { utcNow } from '../utils/time'
import { pool } from '../config/db'

export async function healthRoute(app: FastifyInstance) {
  app.get('/health', async () => {
    let redisOk = false
    let postgresOk = false
    let s3Ok = false

    try {
      const { redis } = await import('../config/redis')
      redisOk = (await redis.ping()) === 'PONG'
    } catch (e) {
      // Ignored
    }

    try {
      await pool.query('SELECT 1')
      postgresOk = true
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

    const isOk = redisOk && postgresOk && s3Ok

    return {
      status: isOk ? 'ok' : 'degraded',
      timestamp: utcNow().toISOString(),
      version: process.env.npm_package_version ?? '0.0.1',
      services: {
        redis: redisOk ? 'up' : 'down',
        postgres: postgresOk ? 'up' : 'down',
        s3: s3Ok ? 'up' : 'down'
      }
    }
  })
}
