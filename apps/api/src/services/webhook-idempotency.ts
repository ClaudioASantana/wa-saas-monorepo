import { createHash } from 'crypto'
import { redis } from '../config/redis'
import stringify from 'fast-json-stable-stringify'

const WEBHOOK_TTL_SECONDS = 86400 // 24 horas

export async function isWebhookDuplicate(payload: object): Promise<boolean> {
  const hash = createHash('sha256')
    .update(stringify(payload))
    .digest('hex')

  const key = `webhook:processed:${hash}`

  // SET key value NX EX ttl
  // Retorna null se a chave JÁ existe (duplicata)
  // Retorna "OK" se a chave foi CRIADA (novo)
  const result = await redis.set(key, '1', 'EX', WEBHOOK_TTL_SECONDS, 'NX')

  return result === null // true = duplicata
}
