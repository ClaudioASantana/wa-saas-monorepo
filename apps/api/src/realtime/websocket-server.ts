import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import { verifyToken } from '../config/jwt'
import { pool } from '../config/db'

let io: Server

export function setupWebSocketServer(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ["GET", "POST"]
    },
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Authentication error: Missing token'))
      }

      // Validar JWT
      try {
        const payload = verifyToken(token) as any
        const agentId = payload.agentId

        if (!agentId) {
          return next(new Error('Authentication error: Invalid token payload'))
        }

        const tenantId = socket.handshake.auth.tenantId || socket.handshake.headers['x-tenant-id'] || payload.tenantId

        if (!tenantId) {
           return next(new Error('Authentication error: Missing tenantId'))
        }

        // Verificar se agente pertence ao tenant
        const result = await pool.query(
          `SELECT id FROM agents WHERE id = $1 AND tenant_id = $2`,
          [agentId, tenantId]
        )

        if (result.rows.length === 0) {
           return next(new Error('Authentication error: Unauthorized tenant access'))
        }

        socket.data = { tenantId, agentId }
        next()
      } catch (tokenError) {
        return next(new Error(`Authentication error: ${tokenError instanceof Error ? tokenError.message : 'Invalid token'}`))
      }
    } catch (err) {
      next(new Error('Authentication error: Server error'))
    }
  })

  io.on('connection', (socket) => {
    const { tenantId } = socket.data

    socket.join(`tenant:${tenantId}`)
    
    socket.emit('connection:ack', {
      sessionId: socket.id,
      tenantId,
    })

    socket.on('disconnect', () => {
      // Cleanup if needed
    })
  })
}

export function emitToTenant(tenantId: string, event: string, data: unknown) {
  if (io) {
    io.to(`tenant:${tenantId}`).emit(event, data)
  }
}

export function getIO() {
  return io
}
