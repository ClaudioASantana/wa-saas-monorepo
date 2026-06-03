/**
 * Retorna o timestamp atual em UTC.
 * SEMPRE usar esta funcao em vez de `new Date()` diretamente.
 */
export function utcNow(): Date {
  return new Date(new Date().toISOString())
}

/**
 * Adiciona horas a um timestamp.
 */
export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

/**
 * Verifica se um timestamp ja expirou em relação ao tempo atual.
 */
export function isExpired(expiresAt: Date): boolean {
  return utcNow() > expiresAt
}
