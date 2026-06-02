/**
 * Retorna o timestamp atual em UTC.
 * SEMPRE usar esta funcao em vez de `new Date()` diretamente no código de negócio.
 */
export function utcNow(): Date {
  return new Date(new Date().toISOString())
}

/**
 * Adiciona horas a um timestamp UTC.
 */
export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

/**
 * Verifica se um timestamp UTC ja expirou.
 */
export function isExpired(expiresAt: Date): boolean {
  return utcNow() > expiresAt
}

export function formatDateUTC(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return d.toISOString()
}
