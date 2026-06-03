import { defineStore } from 'pinia'

export interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null as UserProfile | null,
    loading: false
  }),
  actions: {
    async init() {
      if (this.profile) return

      const user = useSupabaseUser()
      if (!user.value) return

      this.loading = true
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.value.id)
          .single()

        if (!error && data) {
          this.profile = data as UserProfile
        }
      } catch (err) {
        console.error('Failed to load user profile:', err)
      } finally {
        this.loading = false
      }
    }
  }
})
