import { defineStore } from 'pinia'

export interface Agent {
  id: string
  name: string
  role: string
  avatar_url: string | null
}

export const useAgentsStore = defineStore('agents', {
  state: () => ({
    agents: [] as Agent[],
    workspaceIdLoaded: null as string | null,
    loading: false
  }),
  actions: {
    async load(workspaceId: string) {
      if (this.workspaceIdLoaded === workspaceId) return

      this.loading = true
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('user_workspaces')
          .select(`
            role,
            profiles:profile_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('workspace_id', workspaceId)

        if (!error && data) {
          this.agents = data.map((item: any) => ({
            id: item.profiles.id,
            name: item.profiles.full_name || 'Agente',
            role: item.role,
            avatar_url: item.profiles.avatar_url
          }))
          this.workspaceIdLoaded = workspaceId
        }
      } catch (err) {
        console.error('Failed to load agents:', err)
      } finally {
        this.loading = false
      }
    }
  }
})
