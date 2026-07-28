/**
 * Migration runner — aplica arquivos .sql em ordem via DATABASE_URL
 * Uso: npx tsx src/db/migrate.ts
 */
import { config } from 'dotenv'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { Client } from 'pg'

// Carregar variáveis de ambiente do .env na raiz do monorepo
config({ path: join(__dirname, '../../../../.env') })

const MIGRATIONS_DIR = join(__dirname, 'migrations')

async function run() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL nao definida no .env')

  const client = new Client({ connectionString: url })
  await client.connect()
  console.log('Conectado ao banco.')

  // Tabela de controle de migrations
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         SERIAL PRIMARY KEY,
      filename   TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  const applied = await client.query<{ filename: string }>('SELECT filename FROM _migrations')
  const appliedSet = new Set(applied.rows.map((r) => r.filename))

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`  skip: ${file} (ja aplicada)`)
      continue
    }

    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
    console.log(`  applying: ${file}`)
    await client.query(sql)
    await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file])
    console.log(`  done: ${file}`)
  }

  await client.end()
  console.log('Migrations concluidas.')
}

run().catch((err) => {
  console.error('Erro na migration:', err.message)
  process.exit(1)
})
