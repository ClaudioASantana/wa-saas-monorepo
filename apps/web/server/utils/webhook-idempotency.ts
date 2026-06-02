import { createHash } from 'node:crypto'
import { redis } from './redis'
import { logger } from './logger'

const WEBHOOK_TTL_SECONDS = 86400 // 24 hours

/**
 * Checks if a webhook payload has already been processed using a Redis SET NX pattern.
 * Generates a SHA-256 hash of the payload to use as a key.
 */
export async function isWebhookDuplicate(payload: any): Promise<boolean> {
  try {
    // 1. Generate hash of the payload
    // We stringify the body to create a deterministic hash
    const payloadString = JSON.stringify(payload)
    const hash = createHash('sha256').update(payloadString).digest('hex')
    const key = `webhook:processed:${hash}`

    // 2. Try to set the key with EX (Expiration) and NX (Only if it doesn't exist)
    // ioredis set returns 'OK' if successful, null if failed
    const result = await (redis as any).set(key, '1', 'EX', WEBHOOK_TTL_SECONDS, 'NX')

    if (result === null) {
      logger.debug({ hash }, '[Idempotency] Duplicate webhook detected')
      return true
    }

    logger.debug({ hash }, '[Idempotency] New webhook tracked')
    return false
  } catch (error) {
    // In case of Redis error, we log and allow processing to continue (fail-open)
    // so we don't lose messages if Redis is down
    logger.error({ error }, '[Idempotency] Error checking duplicate')
    return false
  }
}
