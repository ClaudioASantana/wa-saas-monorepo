// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt'
  ],
  typescript: {
    strict: true,
    typeCheck: false,
  },
  devServer: {
    host: '0.0.0.0'
  },
  runtimeConfig: {
    // Private (server-side only) - never exposed to the client
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    stripePriceStarter: process.env.STRIPE_PRICE_STARTER || '',
    stripePricePro: process.env.STRIPE_PRICE_PRO || '',
    // WhatsApp Engine configuration
    whatsappEngineUrl: process.env.WHATSAPP_ENGINE_URL || 'http://localhost:3001',
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || '/api',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  },
  routeRules: {
    '/api/**': { proxy: 'http://api:4005/**' }
  },
})
