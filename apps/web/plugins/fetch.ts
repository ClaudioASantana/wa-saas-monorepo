export default defineNuxtPlugin(() => {
  const { token, logout } = useAuth()

  const fetchInterceptor = $fetch.create({
    onRequest({ options }) {
      if (token.value) {
        const headers = new Headers(options.headers)
        headers.set('Authorization', `Bearer ${token.value}`)
        options.headers = headers
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        // Token expiado ou invalido, fazemos logout
        logout()
      }
    }
  })

  // Sobrescreve o $fetch global para usar nosso interceptor
  globalThis.$fetch = fetchInterceptor
})
