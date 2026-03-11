import { Server } from 'socket.io'
import { logger } from './logger'

let io: Server | null = null

/**
 * Sets the global Socket.IO instance.
 * Called by the Nitro plugin during initialization.
 */
export function setIoInstance(instance: Server) {
  io = instance
}

/**
 * Gets the global Socket.IO instance.
 * Used by workers and background processes to emit events.
 */
export function getIoInstance(): Server | null {
  return io
}

/**
 * Emits an event to a specific tenant room.
 */
export function emitToTenant(tenantId: string, event: string, data: any) {
  if (!io) {
    logger.error({ tenantId, event }, '[SocketUtils] Cannot emit: io instance not initialized')
    return
  }
  
  logger.debug({ tenantId, event }, '[SocketUtils] Emitting event to tenant room')
  io.to(`tenant:${tenantId}`).emit(event, data)
}
