import { verify, JwtPayload } from 'jsonwebtoken'

const JWT_SECRET_RAW = process.env.JWT_SECRET

if (!JWT_SECRET_RAW) {
  throw new Error('FATAL: JWT_SECRET environment variable is required')
}

export const JWT_SECRET: string = JWT_SECRET_RAW

export interface TokenPayload extends JwtPayload {
  sub?: string
  user_id?: string
  id?: string
  role?: string
  iss?: string
}

/**
 * Verify a JWT token and return the decoded payload
 * Used for authenticating WebSocket connections and API requests
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = verify(token, JWT_SECRET as string, {
      algorithms: ['HS256'],
    }) as TokenPayload
    return decoded
  } catch (error) {
    throw new Error(`Invalid token: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract user ID from token payload
 * Handles both Supabase format (sub) and custom format (user_id, id)
 */
export function extractUserId(payload: TokenPayload): string {
  return payload.sub || payload.user_id || payload.id || ''
}
