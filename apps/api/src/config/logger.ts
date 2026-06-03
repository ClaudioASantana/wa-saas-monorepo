import pino from 'pino'
import { utcNow } from '../utils/time'

const isDev = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  // Ensure timestamps are strictly UTC ISO-8601
  timestamp: () => `,"time":"${utcNow().toISOString()}"`,
  transport: isDev ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      // For local development readability, pino-pretty handles the display
      translateTime: 'UTC:yyyy-mm-dd HH:MM:ss.l o',
    }
  } : undefined,
})
