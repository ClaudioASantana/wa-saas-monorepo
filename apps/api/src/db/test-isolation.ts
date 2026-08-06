/**
 * Teste de isolamento RLS (AC-06)
 * Uso: npx tsx src/db/test-isolation.ts
 */
import { config } from 'dotenv'
import { join } from 'path'
import { Client } from 'pg'

// Carregar variáveis de ambiente
config({ path: join(__dirname, '../../../../.env') })

async function run() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL nao definida')

  const client = new Client({ connectionString: url })
  await client.connect()

  const { rows: tenants } = await client.query<{ id: string; slug: string }>(
    'SELECT id, slug FROM tenants ORDER BY slug'
  )
  const alpha = tenants.find((t) => t.slug === 'alpha')
  const beta = tenants.find((t) => t.slug === 'beta')

  if (!alpha || !beta) throw new Error('Tenants alpha/beta nao encontrados — rode o seed primeiro')

  console.log(`IDs: alpha(${alpha.id.substring(0, 8)}) beta(${beta.id.substring(0, 8)})`)

  let passed = 0
  let failed = 0

  // Teste 1: contexto Alpha — so deve ver contatos do Alpha
  await client.query('BEGIN')
  await client.query('SET LOCAL ROLE anon')
  await client.query('SELECT set_tenant_context($1)', [alpha.id])
  const { rows: cA } = await client.query<{ phone: string; tenant_id: string }>(
    'SELECT phone, tenant_id FROM contacts'
  )
  await client.query('COMMIT')

  const leakA = cA.some((c) => c.tenant_id === beta.id)
  const t1 = !leakA && cA.length === 1
  console.log(`[${t1 ? 'PASSOU' : 'FALHOU'}] Alpha ve ${cA.length} contato(s), vazamento Beta: ${leakA}`)
  t1 ? passed++ : failed++

  // Teste 2: contexto Beta — so deve ver contatos do Beta
  await client.query('BEGIN')
  await client.query('SET LOCAL ROLE anon')
  await client.query('SELECT set_tenant_context($1)', [beta.id])
  const { rows: cB } = await client.query<{ phone: string; tenant_id: string }>(
    'SELECT phone, tenant_id FROM contacts'
  )
  await client.query('COMMIT')

  const leakB = cB.some((c) => c.tenant_id === alpha.id)
  const t2 = !leakB && cB.length === 1
  console.log(`[${t2 ? 'PASSOU' : 'FALHOU'}] Beta ve ${cB.length} contato(s), vazamento Alpha: ${leakB}`)
  t2 ? passed++ : failed++

  // Teste 3: INSERT sem tenant_id deve falhar (NOT NULL)
  try {
    await client.query("INSERT INTO contacts (phone, name) VALUES ('+000', 'Sem Tenant')")
    console.log('[FALHOU] INSERT sem tenant_id deveria ter sido rejeitado')
    failed++
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message.split('\n')[0] : String(e)
    console.log(`[PASSOU] INSERT sem tenant_id rejeitado: ${msg}`)
    passed++
  }

  await client.end()

  console.log(`\nResultado: ${passed} passaram, ${failed} falharam`)
  if (failed > 0) process.exit(1)
}

run().catch((e) => {
  console.error('ERRO:', e.message)
  process.exit(1)
})
