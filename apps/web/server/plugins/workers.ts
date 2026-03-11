import { createMediaWorker } from '../utils/media-worker'
import { createWebhookWorker } from '../utils/webhook-worker'
import { logger } from '../utils/logger'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()

  logger.info('[Workers] Initializing background workers...')

  // 1. Media Upload Worker (from Story 0.5)
  try {
    createMediaWorker(
      config.supabaseUrl as string,
      config.supabaseServiceKey as string
    )
    logger.info('[Workers] Media Worker initialized')
  } catch (error) {
    logger.error({ error }, '[Workers] Failed to initialize Media Worker')
  }

  // 2. Webhook Processor Worker (from Story 0.3)
  try {
    createWebhookWorker(
      config.supabaseUrl as string,
      config.supabaseServiceKey as string
    )
    logger.info('[Workers] Webhook Worker initialized')
  } catch (error) {
    logger.error({ error }, '[Workers] Failed to initialize Webhook Worker')
  }
})
