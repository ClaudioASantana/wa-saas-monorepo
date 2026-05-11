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
    redirect: false, // Redirecionamentos customizados serão feitos via middleware ou rota
    types: './types/database.types.ts',
  },
  typescript: {
    strict: true,
    typeCheck: false,
  },
  devServer: {
    host: '0.0.0.0'
  },
  runtimeConfig: {
    // Private (server-side only) - never exposed to the client
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    // WhatsApp Engine configuration
    whatsappEngineUrl: process.env.WHATSAPP_ENGINE_URL || 'http://localhost:3001',
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:4000',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  },
})
