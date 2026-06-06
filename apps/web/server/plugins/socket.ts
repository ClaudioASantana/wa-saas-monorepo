import { Server } from 'socket.io'
import { setIoInstance } from '../utils/socket'
import { logger } from '../utils/logger'
import { createClient } from '@supabase/supabase-js'

export default defineNitroPlugin((nitroApp) => {
  const GLOBAL_KEY = '__wa_saas_socket_io_initialized__'
  const global = globalThis as any
  
  if (global[GLOBAL_KEY]) {
    logger.debug('[Socket.IO] Plugin already initialized, skipping')
    return
  }

  // Initialize Supabase admin client for verification
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_KEY || ''
  )

  const initSocketIo = (server: any) => {
    if (global[GLOBAL_KEY]) return
    
    logger.info('[Socket.IO] Initializing Server with provided HTTP server instance...')
    
    try {
      const io = new Server(server, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000
      })

      // JWT Middleware (using Supabase API for verification)
      io.use(async (socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.query.token
        
        if (!token) {
          logger.warn({ socketId: socket.id }, '[Socket.IO] Connection rejected: No token')
          return next(new Error('Authentication error'))
        }

        try {
          // Verify token against Supabase API
          const { data: { user }, error } = await supabase.auth.getUser(token)

          if (error || !user) {
            logger.error({ 
              err: error?.message, 
              token: token.substring(0, 20) + '...' 
            }, '[Socket.IO] Supabase auth failed')
            return next(new Error('Authentication error'))
          }
          
          socket.data.userId = user.id
          socket.data.tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
          
          if (!socket.data.tenantId) {
            logger.warn({ userId: socket.data.userId, metadata: user.app_metadata }, '[Socket.IO] Connection rejected: No tenant_id in user metadata')
            return next(new Error('No tenant access'))
          }

          next()
        } catch (err: any) {
          logger.error({ 
            err: err.message,
            token: token.substring(0, 20) + '...'
          }, '[Socket.IO] Unexpected auth error')
          next(new Error('Authentication error'))
        }
      })

      io.on('connection', (socket) => {
        const { tenantId, userId } = socket.data
        logger.info({ socketId: socket.id, tenantId, userId }, '[Socket.IO] User connected')
        socket.join(`tenant:${tenantId}`)
        socket.emit('connection:ack', { sessionId: socket.id, tenantId })

        socket.on('join:conversation', (conversationId: string) => {
          socket.join(`conversation:${conversationId}`)
        })

        socket.on('leave:conversation', (conversationId: string) => {
          socket.leave(`conversation:${conversationId}`)
        })

        socket.on('typing', (data: { conversationId: string, isTyping: boolean }) => {
          socket.to(`conversation:${data.conversationId}`).emit('agent:typing', {
            agentId: userId,
            conversationId: data.conversationId,
            isTyping: data.isTyping
          })
        })

        socket.on('disconnect', (reason) => {
          logger.info({ socketId: socket.id, reason }, '[Socket.IO] User disconnected')
        })
      })

      setIoInstance(io)
      global[GLOBAL_KEY] = true
      logger.info('[Socket.IO] Server initialized and ready')
    } catch (err) {
      logger.error({ err }, '[Socket.IO] Critical initialization failure')
    }
  }

  // Hook 1: Standard Nitro listen (Works in production and some dev setups)
  ;(nitroApp.hooks as any).hook('listen', (server: any) => {
    logger.info('[Socket.IO] listen hook triggered')
    initSocketIo(server)
  })

  // Hook 2: Fallback for Dev mode (Capture server from first request)
  if (process.dev) {
    (nitroApp.hooks as any).hook('request', (event: any) => {
      if (!global[GLOBAL_KEY]) {
        const server = event.node?.res?.socket?.server
        if (server) {
          logger.info('[Socket.IO] server instance captured from request')
          initSocketIo(server)
        }
      }
    })
  }
})
