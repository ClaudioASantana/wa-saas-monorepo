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
        const config = useRuntimeConfig()
        const data = await $fetch<any[]>(`${config.public.apiUrl}/tenant/agents`)

        if (data) {
          this.agents = data.map((item: any) => ({
            id: item.id,
            name: item.full_name || item.email || 'Agente',
            role: item.role,
            avatar_url: item.avatar_url
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
