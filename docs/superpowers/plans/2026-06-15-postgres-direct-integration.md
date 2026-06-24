# Postgres Direct Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix API database integration to use Postgres directly instead of Supabase REST, enabling proper tenant isolation, transactional safety, and performance.

**Architecture:** The API connects directly to the local Postgres instance (`flux-crm` database on port 5433) via the `pg` pool already configured in `db.ts`. Health checks test Postgres connectivity directly instead of relying on Supabase REST. Tenant validation middleware verifies tenant existence before setting context. Startup logs confirm database health on launch.

**Tech Stack:** Node.js/TypeScript + Fastify, PostgreSQL via `pg` driver Pool

---

## File Structure

```
apps/api/src/
├── routes/health.ts        MODIFY — replace Supabase query with Postgres pool SELECT 1
├── config/supabase.ts      DELETE  — no longer needed
├── middleware/tenant.ts    MODIFY  — add tenant existence validation
└── index.ts                MODIFY  — add startup database health log
```

---

## Task 1: Fix Health Check Route

**Files:**
- Modify: `apps/api/src/routes/health.ts`

Replace the entire file with:

```typescript
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
```

- [ ] **Step 1: Rewrite health.ts**

Write the code above to `apps/api/src/routes/health.ts` (full file replace).

- [ ] **Step 2: Run typecheck**

```bash
cd /home/claud/repos/wa-saas-monorepo && npm run typecheck --workspace=apps/api
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /home/claud/repos/wa-saas-monorepo
git add apps/api/src/routes/health.ts
git commit -m "fix: replace Supabase health check with Postgres direct query"
```

---

## Task 2: Delete Supabase Config

**Files:**
- Delete: `apps/api/src/config/supabase.ts`

- [ ] **Step 1: Verify no remaining imports**

```bash
grep -r "from.*config/supabase" /home/claud/repos/wa-saas-monorepo/apps/api/src --include="*.ts"
```

Expected: No output (Task 1 removed the only import in health.ts).

- [ ] **Step 2: Delete the file**

```bash
rm /home/claud/repos/wa-saas-monorepo/apps/api/src/config/supabase.ts
```

- [ ] **Step 3: Run typecheck**

```bash
cd /home/claud/repos/wa-saas-monorepo && npm run typecheck --workspace=apps/api
```

Expected: No errors about missing `supabase` module.

- [ ] **Step 4: Commit**

```bash
cd /home/claud/repos/wa-saas-monorepo
git add -A
git commit -m "chore: remove unused Supabase client config"
```

---

## Task 3: Add Tenant Validation in Middleware

**Files:**
- Modify: `apps/api/src/middleware/tenant.ts`

Replace the entire file with:

```typescript
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

  const client = await pool.connect()

  try {
    // Valida se tenant existe antes de configurar contexto
    const tenantResult = await client.query(
      'SELECT id FROM tenants WHERE id = $1',
      [tenantId]
    )

    if (tenantResult.rows.length === 0) {
      client.release()
      return reply.status(403).send({ error: 'Tenant nao encontrado' })
    }

    await client.query('BEGIN')
    await client.query('SELECT set_tenant_context($1)', [tenantId])

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
  } catch (error) {
    client.release()
    throw error
  }
}
```

- [ ] **Step 1: Rewrite tenant.ts**

Write the code above to `apps/api/src/middleware/tenant.ts` (full file replace).

- [ ] **Step 2: Run typecheck**

```bash
cd /home/claud/repos/wa-saas-monorepo && npm run typecheck --workspace=apps/api
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /home/claud/repos/wa-saas-monorepo
git add apps/api/src/middleware/tenant.ts
git commit -m "feat: add tenant existence validation in middleware"
```

---

## Task 4: Add Startup Health Check Log

**Files:**
- Modify: `apps/api/src/index.ts`

Replace the `start` function (lines 21-33) with:

```typescript
import { pool } from './config/db'

// ... (keep existing imports above)

const start = async () => {
  try {
    const port = parseInt(process.env.API_PORT ?? '4000', 10)

    await app.ready()

    // Verifica conectividade com o banco antes de aceitar requests
    try {
      await pool.query('SELECT 1')
      app.log.info('✓ Postgres database connected (flux-crm)')
    } catch (err) {
      app.log.error('✗ Postgres database connection failed — aborting startup')
      throw err
    }

    setupWebSocketServer(app.server)

    await app.listen({ port, host: '0.0.0.0' })
    app.log.info(`Server listening at http://0.0.0.0:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}
```

- [ ] **Step 1: Add pool import to index.ts**

Add this line after the existing imports (after line 8):

```typescript
import { pool } from './config/db'
```

- [ ] **Step 2: Replace the start() function body**

Replace lines 21-33 of `apps/api/src/index.ts` with the new start function body shown above (without the import line — that was added in step 1).

- [ ] **Step 3: Run typecheck**

```bash
cd /home/claud/repos/wa-saas-monorepo && npm run typecheck --workspace=apps/api
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd /home/claud/repos/wa-saas-monorepo
git add apps/api/src/index.ts
git commit -m "feat: add database health check on startup"
```

---

## Task 5: Remove @supabase/supabase-js Dependency

**Files:**
- Modify: `apps/api/package.json` (via npm)

- [ ] **Step 1: Verify dependency exists**

```bash
grep supabase /home/claud/repos/wa-saas-monorepo/apps/api/package.json
```

- [ ] **Step 2: Uninstall**

```bash
cd /home/claud/repos/wa-saas-monorepo/apps/api && npm uninstall @supabase/supabase-js
```

- [ ] **Step 3: Verify removed**

```bash
grep supabase /home/claud/repos/wa-saas-monorepo/apps/api/package.json
```

Expected: No output.

- [ ] **Step 4: Run typecheck one final time**

```bash
cd /home/claud/repos/wa-saas-monorepo && npm run typecheck --workspace=apps/api
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
cd /home/claud/repos/wa-saas-monorepo
git add apps/api/package.json package-lock.json
git commit -m "chore: remove unused @supabase/supabase-js dependency"
```

---

## Task 6: Full Integration Test

- [ ] **Step 1: Start API**

```bash
cd /home/claud/repos/wa-saas-monorepo/apps/api && npm run dev
```

Expected logs include:
```
✓ Postgres database connected (flux-crm)
Server listening at http://0.0.0.0:4000
```

- [ ] **Step 2: Test health endpoint**

```bash
curl -s http://localhost:4000/health | jq .services
```

Expected: `{ "redis": "down", "postgres": "up", "s3": "down" }`

- [ ] **Step 3: Test tenant validation — invalid format**

```bash
curl -s -H "x-tenant-id: not-a-uuid" http://localhost:4000/health
```

Expected: `{"error":"x-tenant-id invalido"}` with HTTP 400

- [ ] **Step 4: Test tenant validation — unknown UUID**

```bash
curl -s -H "x-tenant-id: 00000000-0000-0000-0000-000000000000" http://localhost:4000/health
```

Expected: `{"error":"Tenant nao encontrado"}` with HTTP 403

- [ ] **Step 5: Test with valid tenant (from seed data)**

Get a real tenant ID:

```bash
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT id FROM tenants LIMIT 1').then(r => { console.log(r.rows[0].id); pool.end(); });
"
```

Then test:

```bash
curl -s -H "x-tenant-id: <TENANT_ID_FROM_ABOVE>" http://localhost:4000/health | jq .services
```

Expected: `{ "redis": "down", "postgres": "up", "s3": "down" }` (postgres must be up)

---

## Success Criteria

- [ ] API starts without errors on `localhost:4000`
- [ ] Startup log shows `✓ Postgres database connected (flux-crm)`
- [ ] `GET /health` returns `services.postgres: "up"`
- [ ] Tenant middleware returns 400 for invalid UUID format
- [ ] Tenant middleware returns 403 for unknown but valid UUID
- [ ] No `@supabase/supabase-js` imports remain in `apps/api/src/`
- [ ] TypeScript typecheck passes with zero errors
