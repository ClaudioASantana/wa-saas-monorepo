import { createClient } from '@supabase/supabase-js'
import { redis } from '../utils/redis'
import { logger } from '../utils/logger'
import { utcNow } from '../utils/time'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const start = Date.now()

  // 1. Check Supabase DB
  let supabaseOk = false
  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)
    const { error } = await supabase.from('tenants').select('id', { count: 'exact', head: true }).limit(1)
    supabaseOk = !error
  } catch (err) {
    logger.error({ msg: 'Healthcheck: Supabase DB error', error: err })
  }

  // 2. Check Redis
  let redisOk = false
  try {
    const ping = await redis.ping()
    redisOk = ping === 'PONG'
  } catch (err) {
    logger.error({ msg: 'Healthcheck: Redis error', error: err })
  }

  // 3. Check Supabase Storage (S3 equivalent)
  let s3Ok = false
  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)
    const { data, error } = await supabase.storage.listBuckets()
    s3Ok = !error && !!data
  } catch (err) {
    logger.error({ msg: 'Healthcheck: Storage error', error: err })
  }

  const status = supabaseOk && redisOk ? 'ok' : 'degraded'

  return {
    status,
    timestamp: utcNow().toISOString(),
    duration_ms: Date.now() - start,
    services: {
      supabase_db: supabaseOk ? 'up' : 'down',
      redis: redisOk ? 'up' : 'down',
      storage: s3Ok ? 'up' : 'down'
    }
  }
})
