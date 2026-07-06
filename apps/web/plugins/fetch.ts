export default defineNuxtPlugin((nuxtApp) => {
  const { token, logout } = useAuth()

  const fetchInterceptor = $fetch.create({
    onRequest({ request, options }) {
      if (token.value) {
        options.headers = options.headers || {}
        // @ts-ignore
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
