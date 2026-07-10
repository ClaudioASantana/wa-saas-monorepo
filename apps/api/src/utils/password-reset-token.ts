import crypto from 'crypto'
import { utcNow, addHours, isExpired } from './time'

/**
 * Gera um token seguro para recuperação de senha
 * @returns Token hexadecimal de 32 bytes (64 caracteres)
 */
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Gera hash do token para armazenamento seguro no banco
 * @param token Token em texto plano
 * @returns Hash SHA256 do token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Calcula data de expiração do token (1 hora a partir de agora)
 * @returns Date object com timestamp de expiração
 */
export function getTokenExpiration(): Date {
  return addHours(utcNow(), 1)
}

/**
 * Verifica se um token expirou
 * @param expiresAt Data de expiração do token
 * @returns true se expirado, false caso contrário
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return isExpired(expiresAt)
}
