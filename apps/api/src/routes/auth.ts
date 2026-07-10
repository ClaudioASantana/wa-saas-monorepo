import { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../config/db'
import { JWT_SECRET } from '../config/jwt'
import { validatePassword } from '../utils/validate-password'
import {
  generatePasswordResetToken,
  hashToken,
  getTokenExpiration,
  isTokenExpired,
} from '../utils/password-reset-token'
import { sendPasswordResetEmail } from '../services/email.service'

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
  app.post<{ Body: LoginBody }>(
    '/auth/login',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
        },
      },
    },
    async (request, reply) => {
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
          app.log.warn(
            {
              event: 'login_failed',
              reason: 'invalid_password',
              email: email.toLowerCase().trim(),
              ip: request.ip,
              userAgent: request.headers['user-agent'],
            },
            'Login attempt failed: invalid password'
          )
          return reply
            .status(401)
            .send({ code: 'invalid_credentials', message: 'Credenciais inválidas' })
        }

        if (agent.status !== 'active') {
          app.log.warn(
            {
              event: 'login_failed',
              reason: 'inactive_account',
              agentId: agent.id,
              email: agent.email,
              ip: request.ip,
              userAgent: request.headers['user-agent'],
            },
            'Login attempt failed: inactive account'
          )
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

        app.log.info(
          {
            event: 'login_success',
            agentId: agent.id,
            tenantId: agent.tenant_id,
            email: agent.email,
            role: agent.role,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
          },
          'User login successful'
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
    }
  )

  // POST /auth/register
  app.post<{ Body: RegisterBody }>(
    '/auth/register',
    {
      config: {
        rateLimit: {
          max: 3,
          timeWindow: '1 hour',
        },
      },
    },
    async (request, reply) => {
      const { email, password, name, tenantName, tenantSlug } = request.body || {}

      if (!email || !password || !name || !tenantName || !tenantSlug) {
        return reply.status(400).send({ error: 'Todos os campos são obrigatórios' })
      }

      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        return reply.status(400).send({ error: passwordValidation.error })
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

        app.log.info(
          {
            event: 'register_success',
            agentId: agent.id,
            tenantId: tenant.id,
            email: agent.email,
            tenantName: tenant.name,
            tenantSlug: tenant.slug,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
          },
          'User registration successful'
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
    }
  )

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

  // POST /auth/forgot-password - Solicitar recuperação de senha
  app.post<{ Body: { email: string } }>(
    '/auth/forgot-password',
    {
      config: {
        rateLimit: {
          max: 3,
          timeWindow: '15 minutes',
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body || {}

      if (!email) {
        return reply.status(400).send({ error: 'Email é obrigatório' })
      }

      try {
        // Buscar agente pelo email
        const result = await pool.query(
          'SELECT id, email, name FROM agents WHERE email = $1 AND status = $2',
          [email.toLowerCase().trim(), 'active']
        )

        // Por segurança, sempre retornar sucesso mesmo se email não existir
        // Isso evita enumeration attacks
        if (result.rows.length === 0) {
          app.log.info({ email }, 'Password reset requested for non-existent email')
          return reply.send({ message: 'Se o email existir, você receberá instruções em breve' })
        }

        const agent = result.rows[0]

        // Gerar token seguro
        const plainToken = generatePasswordResetToken()
        const hashedToken = hashToken(plainToken)
        const expiresAt = getTokenExpiration()

        // Salvar token no banco
        await pool.query(
          `INSERT INTO password_reset_tokens (agent_id, token, expires_at)
           VALUES ($1, $2, $3)`,
          [agent.id, hashedToken, expiresAt]
        )

        // Gerar link de recuperação
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/redefinir-senha?token=${plainToken}`

        // Enviar email de recuperação
        try {
          await sendPasswordResetEmail(agent.email, resetLink, agent.name, app.log)
        } catch (emailError) {
          // Não falhar a requisição se o email falhar
          // O token já foi salvo no banco
          app.log.error(
            {
              event: 'password_reset_email_failed',
              agentId: agent.id,
              email: agent.email,
              error: emailError,
            },
            'Failed to send password reset email, but token was saved'
          )
        }

        // Log de auditoria
        app.log.info(
          {
            event: 'password_reset_requested',
            agentId: agent.id,
            email: agent.email,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
          },
          'Password reset process initiated'
        )

        return reply.send({ message: 'Se o email existir, você receberá instruções em breve' })
      } catch (error) {
        app.log.error(error, 'Forgot password error')
        return reply.status(500).send({ error: 'Erro ao processar solicitação' })
      }
    }
  )

  // POST /auth/reset-password - Redefinir senha com token
  app.post<{ Body: { token: string; password: string } }>(
    '/auth/reset-password',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
        },
      },
    },
    async (request, reply) => {
      const { token, password } = request.body || {}

      if (!token || !password) {
        return reply.status(400).send({ error: 'Token e senha são obrigatórios' })
      }

      // Validar força da senha
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        return reply.status(400).send({ error: passwordValidation.error })
      }

      try {
        // Hash do token para buscar no banco
        const hashedToken = hashToken(token)

        // Buscar token no banco
        const tokenResult = await pool.query(
          `SELECT id, agent_id, expires_at, used_at
           FROM password_reset_tokens
           WHERE token = $1`,
          [hashedToken]
        )

        if (tokenResult.rows.length === 0) {
          return reply.status(400).send({ error: 'Token inválido ou expirado' })
        }

        const resetToken = tokenResult.rows[0]

        // Verificar se já foi usado
        if (resetToken.used_at) {
          return reply.status(400).send({ error: 'Token já foi utilizado' })
        }

        // Verificar se expirou
        if (isTokenExpired(resetToken.expires_at)) {
          return reply.status(400).send({ error: 'Token expirado' })
        }

        // Hash da nova senha
        const passwordHash = await bcrypt.hash(password, 10)

        // Atualizar senha e marcar token como usado em uma transação
        await pool.query('BEGIN')

        try {
          // Atualizar senha do agente
          await pool.query('UPDATE agents SET password_hash = $1 WHERE id = $2', [
            passwordHash,
            resetToken.agent_id,
          ])

          // Marcar token como usado
          await pool.query(
            'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1',
            [resetToken.id]
          )

          await pool.query('COMMIT')

          // Buscar dados do agente para log
          const agentResult = await pool.query(
            'SELECT id, email, tenant_id FROM agents WHERE id = $1',
            [resetToken.agent_id]
          )

          const agent = agentResult.rows[0]

          // Log de auditoria
          app.log.info(
            {
              event: 'password_reset_success',
              agentId: agent.id,
              tenantId: agent.tenant_id,
              email: agent.email,
              ip: request.ip,
              userAgent: request.headers['user-agent'],
            },
            'Password reset successful'
          )

          return reply.send({ message: 'Senha redefinida com sucesso' })
        } catch (error) {
          await pool.query('ROLLBACK')
          throw error
        }
      } catch (error) {
        app.log.error(error, 'Reset password error')
        return reply.status(500).send({ error: 'Erro ao redefinir senha' })
      }
    }
  )
}
