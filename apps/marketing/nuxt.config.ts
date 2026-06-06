// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/tailwindcss', '@nuxt/icon'],
  colorMode: {
    preference: 'dark'
  },
  devServer: {
    port: 3001
  },
  devtools: { enabled: false }
})
