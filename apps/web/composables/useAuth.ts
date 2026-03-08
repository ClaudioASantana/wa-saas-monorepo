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

  return {
    user,
    loading,
    logout
  }
}
