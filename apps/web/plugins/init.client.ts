import { useUserStore } from '~/stores/user'

export default defineNuxtPlugin(async () => {
  const { currentUser: user, token, fetchUser } = useAuth()
  
  // If we have a token but no user, we just hard-refreshed. Fetch the user.
  if (token.value && !user.value) {
    await fetchUser()
  }
  
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
