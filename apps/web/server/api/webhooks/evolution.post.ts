import { isWebhookDuplicate } from '../../utils/webhook-idempotency'
import { webhookQueue } from '../../utils/webhook-queue'

// Evolution API webhook payload types
interface EvolutionMessage {
  event: string // e.g., 'messages.upsert', 'connection.update'
  instance: string // The name of the instance we created
  data: any // The actual payload, differs by event
}

export default defineEventHandler(async (event) => {
  let payload: EvolutionMessage
  try {
    payload = await readBody<EvolutionMessage>(event)
  } catch {
    return { ok: false, error: 'Invalid JSON body' }
  }

  // 1. Idempotency Check
  // We check before enqueuing to avoid flooding Redis/BullMQ with duplicates
  const isDuplicate = await isWebhookDuplicate(payload)
  if (isDuplicate) {
    return { ok: true, skipped: 'duplicate_payload' }
  }

  // 2. Enqueue for background processing
  // This allows us to return 200 OK immediately and handle heavy DB/Media logic later
  try {
    await webhookQueue.add('evolution-webhook', { payload })
    return { ok: true, queued: true }
  } catch (error) {
    console.error('[Evolution Webhook] Error enqueuing job:', error)
    // If enqueuing fails, we return 500 so Evolution API retries later
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to enqueue webhook'
    })
  }
})
