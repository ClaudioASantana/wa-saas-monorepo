import { createClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'
import { utcNow } from '../utils/time'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const start = Date.now()

  // 1. Check Supabase
  let supabaseOk = false
  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)
    const { error } = await supabase.from('tenants').select('id', { count: 'exact', head: true }).limit(1)
    supabaseOk = !error
  } catch (err) {
    logger.error({ msg: 'Healthcheck: Supabase error', error: err })
  }

  // 2. Redis & S3 (Placeholders for now, as they are being implemented in Stories 0.3/0.5)
  const redisOk = false // Pending Redis setup in web app
  const s3Ok = false    // Pending Story 0.5

  const status = supabaseOk ? 'ok' : 'degraded'

  return {
    status,
    timestamp: utcNow().toISOString(),
    duration_ms: Date.now() - start,
    services: {
      supabase: supabaseOk ? 'up' : 'down',
      redis: redisOk ? 'up' : 'down',
      s3: s3Ok ? 'up' : 'down'
    }
  }
})
