import { config } from 'dotenv'
import { join } from 'path'
import { Pool } from 'pg'

// Carregar .env se ainda não estiver carregado
if (!process.env.DATABASE_URL) {
  config({ path: join(__dirname, '../../../../.env') })
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL nao definida no .env')
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})
