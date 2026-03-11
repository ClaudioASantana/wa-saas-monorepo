import { Server } from 'socket.io'
import { setIoInstance } from '../utils/socket'
import { logger } from '../utils/logger'
import jwt from 'jsonwebtoken'

export default defineNitroPlugin((nitroApp) => {
  // Nitro plugin only runs on the server
  // We attach to the 'engine' which is the underlying http server in most runtimes
  
  // @ts-ignore - access raw http server
  const httpServer = nitroApp.h3App.node.res.socket?.server || (globalThis as any)._httpServer

  // Note: In Nuxt 3/Nitro, accessing the raw http server can be tricky depending on the provider.
  // For local 'npm run dev', we use nitroApp.hooks.hook('listen') to get the server.
  
  nitroApp.hooks.hook('listen', (server) => {
    logger.info('[Socket.IO] Nuxt listen hook triggered. Initializing Socket.IO...')
    
    const io = new Server(server, {
      cors: {
        origin: '*', // Adjust for production
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    })

    // JWT Middleware
    io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token
      
      if (!token) {
        logger.warn({ socketId: socket.id }, '[Socket.IO] Connection rejected: No token')
        return next(new Error('Authentication error'))
      }

      try {
        // We use the Supabase Service Key or JWT Secret to verify
        // In local dev, Supabase usually uses 'super-secret-jwt-token-with-at-least-32-characters-long' 
        // but we should use the one from config.
        const config = useRuntimeConfig()
        // Supabase JWT secret is often the same as the service key or a specific secret
        // For project 'wnwmkaigcpcvojtdpvug', we'll try to use a generic 'JWT_SECRET' if available
        // but for now, we'll use a placeholder or assume the user has it in .env
        const secret = process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long'
        
        const decoded = jwt.verify(token, secret) as any
        
        // Extrair tenant_id e agent_id do payload do Supabase/JWT
        // O Supabase coloca informacoes no app_metadata ou user_metadata
        socket.data.userId = decoded.sub
        socket.data.tenantId = decoded.app_metadata?.tenant_id || decoded.user_metadata?.tenant_id
        
        if (!socket.data.tenantId) {
          logger.warn({ userId: socket.data.userId }, '[Socket.IO] Connection rejected: No tenant_id in JWT')
          return next(new Error('No tenant access'))
        }

        next()
      } catch (err) {
        logger.error({ err }, '[Socket.IO] JWT Verification failed')
        next(new Error('Authentication error'))
      }
    })

    io.on('connection', (socket) => {
      const { tenantId, userId } = socket.data
      logger.info({ socketId: socket.id, tenantId, userId }, '[Socket.IO] User connected')

      // Join tenant room for isolation
      socket.join(`tenant:${tenantId}`)

      socket.emit('connection:ack', {
        sessionId: socket.id,
        tenantId
      })

      socket.on('disconnect', () => {
        logger.info({ socketId: socket.id }, '[Socket.IO] User disconnected')
      })
    })

    setIoInstance(io)
    logger.info('[Socket.IO] Server initialized and ready')
  })
})
