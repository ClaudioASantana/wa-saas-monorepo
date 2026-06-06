import { useUserStore } from '~/stores/user'
import { useWorkspaceStore } from '~/stores/workspace'
import { useAgentsStore } from '~/stores/agents'

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const loading = ref(false)

  const logout = async () => {
    loading.value = true
    try {
      useUserStore().$reset()
      useWorkspaceStore().$reset()
      useAgentsStore().$reset()
      await supabase.auth.signOut()
      navigateTo('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      loading.value = false
    }
  }

  const forgotPassword = async (email: string): Promise<{ error: string | null }> => {
    loading.value = true
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })
      if (error) return { error: error.message }
      return { error: null }
    } finally {
      loading.value = false
    }
  }

  const resetPassword = async (newPassword: string): Promise<{ error: string | null }> => {
    loading.value = true
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) return { error: error.message }
      return { error: null }
    } finally {
      loading.value = false
    }
  }

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    loading.value = true
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      return { error: null }
    } finally {
      loading.value = false
    }
  }

  const signup = async (email: string, password: string, options?: Record<string, unknown>): Promise<{ error: string | null }> => {
    loading.value = true
    try {
      const { error } = await supabase.auth.signUp({ email, password, options })
      if (error) return { error: error.message }
      return { error: null }
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
  }
}
