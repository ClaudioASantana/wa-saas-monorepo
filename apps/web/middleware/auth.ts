export default defineNuxtRouteMiddleware(() => {
  const { token } = useAuth()

  // If no token, redirect to login
  if (!token.value) {
    return navigateTo('/login')
  }

  // Optionally validate token on protected routes
  // fetchUser() is async, so for now we just check token existence
})