import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/jwt'

interface TokenPayload {
  agentId: string
  tenantId: string
  email: string
  role: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Não autorizado: Token não fornecido' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload

    // Anexa os dados do usuário na requisição
    request.user = decoded
  } catch (error) {
    return reply.status(401).send({ error: 'Não autorizado: Token inválido ou expirado' })
  }
}
