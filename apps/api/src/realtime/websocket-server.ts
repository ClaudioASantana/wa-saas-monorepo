import { Server } from 'socket.io'
import { supabase } from '../config/supabase'

let io: Server

export function setupWebSocketServer(httpServer: any) {
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
      const { data, error } = await supabase.auth.getUser(token)
      if (error || !data.user) {
        return next(new Error('Authentication error: Invalid token'))
      }
      
      const agentId = data.user.id
      const tenantId = socket.handshake.auth.tenantId || socket.handshake.headers['x-tenant-id']
      
      if (!tenantId) {
         return next(new Error('Authentication error: Missing tenantId'))
      }

      // Verificar se agente pertence ao tenant
      const { data: access, error: accessError } = await supabase
        .from('user_workspaces')
        .select('id')
        .eq('profile_id', agentId)
        .eq('workspace_id', tenantId)
        .maybeSingle()
        
      if (accessError || !access) {
         return next(new Error('Authentication error: Unauthorized tenant access'))
      }

      socket.data = { tenantId, agentId }
      next()
    } catch (err) {
      next(new Error('Authentication error: Server error'))
    }
  })

  io.on('connection', (socket) => {
    const { tenantId, agentId } = socket.data

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
