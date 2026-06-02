export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const loading = ref(false)

  const logout = async () => {
    loading.value = true
    try {
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

  return {
    user,
    loading,
    logout,
    forgotPassword,
    resetPassword,
  }
}
