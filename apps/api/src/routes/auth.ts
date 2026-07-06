import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../config/db'

interface LoginBody {
  email: string
  password: string
}

interface RegisterBody {
  email: string
  password: string
  name?: string
}

interface TokenPayload {
  userId: string
  email: string
}

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/login
  app.post<{ Body: LoginBody }>('/auth/login', async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const { email, password } = request.body || {}

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email e senha são obrigatórios' })
    }

    try {
      const result = await pool.query(
        'SELECT id, email, password_hash, name FROM users WHERE email = $1',
        [email.toLowerCase().trim()]
      )

      if (result.rows.length === 0) {
        return reply.status(401).send({ code: 'invalid_credentials', message: 'Invalid login credentials' })
      }

      const user = result.rows[0]
      const validPassword = await bcrypt.compare(password, user.password_hash)

      if (!validPassword) {
        return reply.status(401).send({ code: 'invalid_credentials', message: 'Invalid login credentials' })
      }

      // Get user's workspace info
      const workspaceResult = await pool.query(`
        SELECT w.id as workspace_id, w.name as workspace_name, w.tenant_id, t.name as tenant_name, uw.role
        FROM user_workspaces uw
        JOIN workspaces w ON w.id = uw.workspace_id
        JOIN tenants t ON t.id = w.tenant_id
        WHERE uw.user_id = $1
        LIMIT 1
      `, [user.id])

      const workspace = workspaceResult.rows[0] || null

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email } as TokenPayload,
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      )

      return reply.send({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          workspace
        }
      })
    } catch (error) {
      app.log.error(error, 'Login error')
      return reply.status(500).send({ error: 'Erro interno do servidor' })
    }
  })

  // POST /auth/register
  app.post<{ Body: RegisterBody }>('/auth/register', async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    const { email, password, name } = request.body || {}

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email e senha são obrigatórios' })
    }

    if (password.length < 6) {
      return reply.status(400).send({ error: 'Senha deve ter pelo menos 6 caracteres' })
    }

    try {
      // Check if user already exists
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()])
      if (existing.rows.length > 0) {
        return reply.status(409).send({ error: 'Email já cadastrado' })
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // Create user
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
        [email.toLowerCase().trim(), passwordHash, name || 'User']
      )

      const user = result.rows[0]

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email } as TokenPayload,
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      )

      return reply.status(201).send({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      })
    } catch (error) {
      app.log.error(error, 'Register error')
      return reply.status(500).send({ error: 'Erro interno do servidor' })
    }
  })

  // GET /auth/me - Get current user info
  app.get('/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Token não fornecido' })
    }

    const token = authHeader.substring(7)

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload

      const result = await pool.query(
        'SELECT id, email, name FROM users WHERE id = $1',
        [decoded.userId]
      )

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Usuário não encontrado' })
      }

      const user = result.rows[0]

      // Get workspace info
      const workspaceResult = await pool.query(`
        SELECT w.id as workspace_id, w.name as workspace_name, w.tenant_id, t.name as tenant_name, uw.role
        FROM user_workspaces uw
        JOIN workspaces w ON w.id = uw.workspace_id
        JOIN tenants t ON t.id = w.tenant_id
        WHERE uw.user_id = $1
        LIMIT 1
      `, [user.id])

      return reply.send({
        user: {
          ...user,
          workspace: workspaceResult.rows[0] || null
        }
      })
    } catch (error) {
      return reply.status(401).send({ error: 'Token inválido ou expirado' })
    }
  })
}