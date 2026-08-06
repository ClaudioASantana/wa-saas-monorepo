/**
 * Seed de teste — 2 tenants com dados isolados
 * Uso: npx tsx src/db/seed.ts
 */
import { config } from 'dotenv'
import { Client } from 'pg'
import { join } from 'path'

// Carregar variáveis de ambiente
config({ path: join(__dirname, '../../../../.env') })

async function run() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL nao definida no .env')

  const client = new Client({ connectionString: url })
  await client.connect()

  // Tenant A
  const resA = await client.query<{ id: string }>(`
    INSERT INTO tenants (name, slug, plan)
    VALUES ('Empresa Alpha', 'alpha', 'pro')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `)
  const tenantAId = resA.rows[0]?.id
  if (!tenantAId) throw new Error('Falha ao criar Tenant A')

  const resB = await client.query<{ id: string }>(`
    INSERT INTO tenants (name, slug, plan)
    VALUES ('Empresa Beta', 'beta', 'starter')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `)
  const tenantBId = resB.rows[0]?.id
  if (!tenantBId) throw new Error('Falha ao criar Tenant B')

  await client.query(`
    INSERT INTO contacts (tenant_id, phone, name)
    VALUES ($1, '+5511999990001', 'Cliente Alpha 1')
    ON CONFLICT (tenant_id, phone) DO NOTHING
  `, [tenantAId])

  await client.query(`
    INSERT INTO contacts (tenant_id, phone, name)
    VALUES ($1, '+5511999990002', 'Cliente Beta 1')
    ON CONFLICT (tenant_id, phone) DO NOTHING
  `, [tenantBId])

  console.log(`Seed OK — Tenant A: ${tenantAId} | Tenant B: ${tenantBId}`)
  await client.end()
}

run().catch((err) => {
  console.error('Erro no seed:', err.message)
  process.exit(1)
})
