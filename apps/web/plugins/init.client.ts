import { useUserStore } from '~/stores/user'

export default defineNuxtPlugin((nuxtApp) => {
  const user = useSupabaseUser()
  
  // Trigger initialization right away if session exists
  if (user.value) {
    const userStore = useUserStore()
    userStore.init()
  }

  // React to auth state changes actively
  watch(user, (newUser) => {
    if (newUser) {
      useUserStore().init()
    } else {
      // Clean up when user logs out or session expires
      useUserStore().$reset()
    }
  })
})
