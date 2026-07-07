import { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../config/db'
import { JWT_SECRET } from '../config/jwt'

interface LoginBody {
  email: string
  password: string
}

interface RegisterBody {
  email: string
  password: string
  name: string
  tenantName: string
  tenantSlug: string
}

interface TokenPayload {
  agentId: string
  tenantId: string
  email: string
  role: string
}

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/login
  app.post<{ Body: LoginBody }>('/auth/login', async (request, reply) => {
    const { email, password } = request.body || {}

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email e senha são obrigatórios' })
    }

    try {
      const result = await pool.query(
        'SELECT id, tenant_id, email, password_hash, name, role, status FROM agents WHERE email = $1',
        [email.toLowerCase().trim()]
      )

      if (result.rows.length === 0) {
        return reply
          .status(401)
          .send({ code: 'invalid_credentials', message: 'Credenciais inválidas' })
      }

      const agent = result.rows[0]

      if (!agent.password_hash) {
        return reply
          .status(401)
          .send({ code: 'invalid_credentials', message: 'Senha não configurada' })
      }

      const validPassword = await bcrypt.compare(password, agent.password_hash)

      if (!validPassword) {
        return reply
          .status(401)
          .send({ code: 'invalid_credentials', message: 'Credenciais inválidas' })
      }

      if (agent.status !== 'active') {
        return reply.status(403).send({ code: 'inactive_account', message: 'Conta inativa' })
      }

      // Obter informações do tenant
      const tenantResult = await pool.query(
        'SELECT id, name, slug, plan, status FROM tenants WHERE id = $1',
        [agent.tenant_id]
      )

      const tenant = tenantResult.rows[0] || null

      // Gerar JWT
      const token = jwt.sign(
        {
          agentId: agent.id,
          tenantId: agent.tenant_id,
          email: agent.email,
          role: agent.role,
        } as TokenPayload,
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      return reply.send({
        token,
        user: {
          id: agent.id,
          email: agent.email,
          name: agent.name,
          role: agent.role,
          tenant,
        },
      })
    } catch (error) {
      app.log.error(error, 'Login error')
      return reply.status(500).send({ error: 'Erro interno do servidor' })
    }
  })

  // POST /auth/register
  app.post<{ Body: RegisterBody }>('/auth/register', async (request, reply) => {
    const { email, password, name, tenantName, tenantSlug } = request.body || {}

    if (!email || !password || !name || !tenantName || !tenantSlug) {
      return reply.status(400).send({ error: 'Todos os campos são obrigatórios' })
    }

    if (password.length < 6) {
      return reply.status(400).send({ error: 'Senha deve ter pelo menos 6 caracteres' })
    }

    try {
      // Iniciar transação
      await pool.query('BEGIN')

      // Verificar se email já existe
      const existingAgent = await pool.query('SELECT id FROM agents WHERE email = $1', [
        email.toLowerCase().trim(),
      ])
      if (existingAgent.rows.length > 0) {
        await pool.query('ROLLBACK')
        return reply.status(409).send({ error: 'Email já cadastrado' })
      }

      // Verificar se slug de tenant já existe
      const existingTenant = await pool.query('SELECT id FROM tenants WHERE slug = $1', [
        tenantSlug.toLowerCase().trim(),
      ])
      if (existingTenant.rows.length > 0) {
        await pool.query('ROLLBACK')
        return reply.status(409).send({ error: 'Slug já está em uso' })
      }

      // 1. Criar tenant
      const tenantResult = await pool.query(
        'INSERT INTO tenants (name, slug, plan) VALUES ($1, $2, $3) RETURNING id, name, slug, plan',
        [tenantName, tenantSlug.toLowerCase().trim(), 'free']
      )
      const tenant = tenantResult.rows[0]

      // 2. Hash da senha
      const passwordHash = await bcrypt.hash(password, 10)

      // 3. Criar agent admin
      const agentResult = await pool.query(
        'INSERT INTO agents (tenant_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role',
        [tenant.id, email.toLowerCase().trim(), passwordHash, name, 'admin']
      )
      const agent = agentResult.rows[0]

      await pool.query('COMMIT')

      // Gerar JWT
      const token = jwt.sign(
        {
          agentId: agent.id,
          tenantId: tenant.id,
          email: agent.email,
          role: agent.role,
        } as TokenPayload,
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      return reply.status(201).send({
        token,
        user: {
          id: agent.id,
          email: agent.email,
          name: agent.name,
          role: agent.role,
          tenant,
        },
      })
    } catch (error) {
      await pool.query('ROLLBACK')
      app.log.error(error, 'Register error')
      return reply.status(500).send({ error: 'Erro interno do servidor' })
    }
  })

  // GET /auth/me - Obter info do usuário atual
  app.get('/auth/me', async (request, reply) => {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Token não fornecido' })
    }

    const token = authHeader.substring(7)

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload

      const result = await pool.query(
        'SELECT id, tenant_id, email, name, role, status FROM agents WHERE id = $1',
        [decoded.agentId]
      )

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Usuário não encontrado' })
      }

      const agent = result.rows[0]

      if (agent.status !== 'active') {
        return reply.status(403).send({ error: 'Conta inativa' })
      }

      const tenantResult = await pool.query(
        'SELECT id, name, slug, plan, status FROM tenants WHERE id = $1',
        [agent.tenant_id]
      )

      return reply.send({
        user: {
          id: agent.id,
          email: agent.email,
          name: agent.name,
          role: agent.role,
          tenant: tenantResult.rows[0] || null,
        },
      })
    } catch (error) {
      return reply.status(401).send({ error: 'Token inválido ou expirado' })
    }
  })
}
