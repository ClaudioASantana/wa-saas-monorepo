import { FastifyInstance } from 'fastify'
import type { HealthCheckResponse } from '@wa-saas/shared'

export async function healthRoute(app: FastifyInstance) {
  app.get('/health', async (): Promise<HealthCheckResponse> => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.1',
    }
  })
}
