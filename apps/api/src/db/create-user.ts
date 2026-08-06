/**
 * Cria um usuário admin
 * Uso: npx tsx src/db/create-user.ts <email> <senha> [tenant-slug]
 */
import { config } from 'dotenv'
import { join } from 'path'
import { Client } from 'pg'
import * as bcrypt from 'bcrypt'

// Carregar variáveis de ambiente
config({ path: join(__dirname, '../../../../.env') })

async function run() {
  const [email, password, tenantSlug = 'alpha'] = process.argv.slice(2)

  if (!email || !password) {
    console.error('Uso: npx tsx create-user.ts <email> <senha> [tenant-slug]')
    console.error('Exemplo: npx tsx create-user.ts admin@alpha.com senha123 alpha')
    process.exit(1)
  }

  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL não definida')

  const client = new Client({ connectionString: url })
  await client.connect()

  // Buscar tenant
  const { rows: tenants } = await client.query<{ id: string; name: string }>(
    'SELECT id, name FROM tenants WHERE slug = $1',
    [tenantSlug]
  )

  if (tenants.length === 0) {
    console.error(`❌ Tenant '${tenantSlug}' não encontrado`)
    await client.end()
    process.exit(1)
  }

  const tenant = tenants[0]
  console.log(`📍 Tenant: ${tenant.name} (${tenantSlug})`)

  // Hash da senha
  const passwordHash = await bcrypt.hash(password, 10)

  // Inserir usuário
  try {
    const { rows } = await client.query<{ id: string; name: string }>(
      `INSERT INTO agents (tenant_id, email, name, role, password_hash)
       VALUES ($1, $2, $3, 'admin', $4)
       ON CONFLICT (tenant_id, email) 
       DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'
       RETURNING id, name`,
      [tenant.id, email, email.split('@')[0], passwordHash]
    )

    console.log(`✅ Usuário criado/atualizado:`)
    console.log(`   ID: ${rows[0].id}`)
    console.log(`   Email: ${email}`)
    console.log(`   Role: admin`)
    console.log(`   Tenant: ${tenant.name}`)
  } catch (err: any) {
    console.error('❌ Erro ao criar usuário:', err.message)
    await client.end()
    process.exit(1)
  }

  await client.end()
}

run().catch((err) => {
  console.error('ERRO:', err.message)
  process.exit(1)
})
