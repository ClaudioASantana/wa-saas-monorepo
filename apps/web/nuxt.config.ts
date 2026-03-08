// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxtjs/supabase'
  ],
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    redirect: false // Redirecionamentos customizados serão feitos via middleware ou rota
  },
  typescript: {
    strict: true,
    typeCheck: false,
  },
  runtimeConfig: {
    // Private (server-side only) - never exposed to the client
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    zapiClientToken: process.env.ZAPI_CLIENT_TOKEN || '',
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:4000',
    },
  },
})
