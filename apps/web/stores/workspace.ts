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
    async load(workspaceId: string) {
      if (this.activeWorkspace?.id === workspaceId) return

      this.loading = true
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', workspaceId)
          .single()

        if (!error && data) {
          this.activeWorkspace = data as Workspace
        }
      } catch (err) {
        console.error('Failed to load workspace:', err)
      } finally {
        this.loading = false
      }
    }
  }
})
