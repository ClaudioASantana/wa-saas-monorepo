import { FastifyRequest, FastifyReply } from 'fastify'
import { PoolClient } from 'pg'
import { pool } from '../config/db'

declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string
    db: PoolClient
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function tenantMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const tenantId = req.headers['x-tenant-id'] as string | undefined

  if (!tenantId) {
    return reply.status(400).send({ error: 'Header x-tenant-id obrigatorio' })
  }

  if (!UUID_RE.test(tenantId)) {
    return reply.status(400).send({ error: 'x-tenant-id invalido' })
  }

  // Adquire conexao dedicada e valida existencia do tenant
  const client = await pool.connect()

  try {
    const tenantResult = await client.query(
      'SELECT id FROM public.tenants WHERE id = $1',
      [tenantId]
    )

    if (tenantResult.rows.length === 0) {
      client.release()
      return reply.status(403).send({ error: 'Tenant nao encontrado' })
    }

    await client.query('BEGIN')
    await client.query('SELECT set_tenant_context($1)', [tenantId])
  } catch (error) {
    client.release()
    throw error
  }

  req.tenantId = tenantId
  req.db = client

  // Garante commit/rollback e release ao final de cada request
  reply.raw.on('finish', async () => {
    try {
      if (!reply.raw.writableEnded || reply.statusCode < 500) {
        await client.query('COMMIT')
      } else {
        await client.query('ROLLBACK')
      }
    } finally {
      client.release()
    }
  })
}
