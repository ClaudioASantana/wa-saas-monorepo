import { defineStore } from 'pinia'

export interface Workspace {
  id: string
  name: string
  tenant_id: string
  stripe_customer_id: string | null
  plan: string
}

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    activeWorkspace: null as Workspace | null,
    loading: false
  }),
  actions: {
    setWorkspace(workspace: { workspace_id: string; workspace_name: string; tenant_id: string; tenant_name?: string; role?: string }) {
      this.activeWorkspace = {
        id: workspace.workspace_id,
        name: workspace.workspace_name,
        tenant_id: workspace.tenant_id,
        stripe_customer_id: null,
        plan: 'pro'
      }
    },

    async load(workspaceId: string) {
      if (this.activeWorkspace?.id === workspaceId) return

      this.loading = true
      try {
        const config = useRuntimeConfig()
        const data = await $fetch<Workspace>(`${config.public.apiUrl}/tenant/${workspaceId}`)
        if (data) {
          this.activeWorkspace = data
        }
      } catch (err) {
        console.error('Failed to load workspace:', err)
      } finally {
        this.loading = false
      }
    }
  }
})
