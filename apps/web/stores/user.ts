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
    setUser(user: { id: string; email: string; name?: string; avatar_url?: string }) {
      this.profile = {
        id: user.id,
        full_name: user.name || null,
        avatar_url: user.avatar_url || null,
        created_at: new Date().toISOString()
      }
    },

    async init() {
      if (this.profile) return

      // Try custom auth first
      const { currentUser, fetchUser } = useAuth()
      if (currentUser.value) {
        this.setUser(currentUser.value)
        return
      }

      // Supabase is removed, we only rely on the custom auth now
      if (!this.profile) {
        this.loading = true
        try {
          await fetchUser()
          if (currentUser.value) {
            this.setUser(currentUser.value)
          }
        } catch (e) {
          console.error(e)
        } finally {
          this.loading = false
        }
      }
    }
  }
})
