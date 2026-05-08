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
  hooks: {
    async 'nitro:config'(nitroConfig) {
      const repos: any[] = await fetch('https://api.github.com/users/shodiqarifin/repos?per_page=100')
        .then(r => r.json()).catch(() => [])
      nitroConfig.prerender = nitroConfig.prerender || {}
      nitroConfig.prerender.routes = [
        ...(nitroConfig.prerender.routes || []),
        ...repos.map(r => `/project/${r.name}`),
      ]
    },
  },
})