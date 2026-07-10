export interface PasswordValidationResult {
  valid: boolean
  error?: string
}

export function validatePassword(password: string): PasswordValidationResult {
  if (password.length < 8) {
    return {
      valid: false,
      error: 'Senha deve ter pelo menos 8 caracteres',
    }
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: 'Senha deve conter pelo menos uma letra maiúscula',
    }
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: 'Senha deve conter pelo menos uma letra minúscula',
    }
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      error: 'Senha deve conter pelo menos um número',
    }
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      valid: false,
      error: 'Senha deve conter pelo menos um caractere especial (!@#$%^&*)',
    }
  }

  return { valid: true }
}
