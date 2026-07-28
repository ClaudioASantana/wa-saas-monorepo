import { useUserStore } from '~/stores/user'
import { useWorkspaceStore } from '~/stores/workspace'
import { useAgentsStore } from '~/stores/agents'

export const useAuth = () => {
  const config = useRuntimeConfig()
  const API_URL = config.public.apiUrl as string
  const loading = ref(false)

  // Store token in cookie for persistence (works with SSR)
  const token = useCookie<string>('auth_token', {
    default: () => '',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  const currentUser = useState<{ id: string; email: string; name: string; workspace?: any } | null>(
    'current_user',
    () => null
  )

  const logout = async () => {
    loading.value = true
    try {
      token.value = ''
      currentUser.value = null
      useUserStore().$reset()
      useWorkspaceStore().$reset()
      useAgentsStore().$reset()
      navigateTo('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      loading.value = false
    }
  }

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    loading.value = true
    try {
      const response = await $fetch<{ token: string; user: any }>(`${API_URL}/auth/login`, {
        method: 'POST',
        body: { email, password },
      })

      if (response.token) {
        token.value = response.token
        currentUser.value = response.user

        // Update stores
        const userStore = useUserStore()
        userStore.setUser(response.user)

        if (response.user.workspace) {
          const workspaceStore = useWorkspaceStore()
          workspaceStore.setWorkspace(response.user.workspace)
        }
      }

      return { error: null }
    } catch (error: any) {
      console.error('Login error:', error)
      if (error?.status === 429 || error?.statusCode === 429) {
        return { error: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.' }
      }
      const message = error?.data?.error || error?.data?.message || error?.message || 'Erro ao fazer login'
      return { error: message }
    } finally {
      loading.value = false
    }
  }

  const register = async (
    email: string,
    password: string,
    name: string,
    tenantName: string,
    tenantSlug: string
  ): Promise<{ error: string | null }> => {
    loading.value = true
    try {
      const response = await $fetch<{ token: string; user: any }>(`${API_URL}/auth/register`, {
        method: 'POST',
        body: { email, password, name, tenantName, tenantSlug },
      })

      if (response.token) {
        token.value = response.token
        currentUser.value = response.user
      }

      return { error: null }
    } catch (error: any) {
      console.error('Register error:', error)
      if (error?.status === 429 || error?.statusCode === 429) {
        return { error: 'Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.' }
      }
      const message = error?.data?.error || error?.data?.message || error?.message || 'Erro ao cadastrar'
      return { error: message }
    } finally {
      loading.value = false
    }
  }

  const fetchUser = async (): Promise<void> => {
    if (!token.value) return

    try {
      const response = await $fetch<{ user: any }>(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
      currentUser.value = response.user
    } catch (error) {
      // Token invalid or expired
      logout()
    }
  }

  // Forgot password - Request password reset email
  const forgotPassword = async (email: string): Promise<{ error: string | null }> => {
    loading.value = true
    try {
      await $fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        body: { email },
      })

      return { error: null }
    } catch (error: any) {
      console.error('Forgot password error:', error)
      if (error?.status === 429 || error?.statusCode === 429) {
        return { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' }
      }
      const message =
        error?.data?.message || error?.message || 'Erro ao solicitar recuperação de senha'
      return { error: message }
    } finally {
      loading.value = false
    }
  }

  // Reset password - Set new password with token
  const resetPassword = async (
    token: string,
    password: string
  ): Promise<{ error: string | null }> => {
    loading.value = true
    try {
      await $fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        body: { token, password },
      })

      return { error: null }
    } catch (error: any) {
      console.error('Reset password error:', error)
      if (error?.status === 429 || error?.statusCode === 429) {
        return { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' }
      }
      const message = error?.data?.error || error?.message || 'Erro ao redefinir senha'
      return { error: message }
    } finally {
      loading.value = false
    }
  }

  return {
    token,
    currentUser,
    loading,
    login,
    register,
    logout,
    fetchUser,
    forgotPassword,
    resetPassword,
  }
}
