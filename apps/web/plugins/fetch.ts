export default defineNuxtPlugin(() => {
  const { token, logout } = useAuth()

  const fetchInterceptor = $fetch.create({
    onRequest({ options }) {
      if (token.value) {
        options.headers = options.headers || {}
        // @ts-expect-error Token might not be strictly typed
        options.headers.Authorization = `Bearer ${token.value}`
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
