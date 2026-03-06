// Shared TypeScript types for wa-saas monorepo

export type Plan = 'free' | 'starter' | 'pro' | 'enterprise'

export type Tenant = {
  id: string
  name: string
  slug: string
  plan: Plan
  createdAt: string
  updatedAt: string
}

export type HealthCheckResponse = {
  status: 'ok' | 'error'
  timestamp: string
  version?: string
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  perPage: number
}
