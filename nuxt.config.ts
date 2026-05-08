// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/content'],
  content: {
    highlight: {
      theme: 'catppuccin-mocha',
      langs: ['javascript', 'typescript', 'vue', 'bash', 'css', 'html', 'json', 'markdown', 'python', 'ts', 'js'],
    },
  },
})