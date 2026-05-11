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
      if (nitroConfig.dev) return
      const token = process.env.GITHUB_TOKEN
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const repos = await fetch('https://api.github.com/users/shodiqarifin/repos?per_page=100', { headers })
        .then(r => r.json()).catch(() => [])
      if (!Array.isArray(repos)) return
      nitroConfig.prerender = nitroConfig.prerender || {}
      nitroConfig.prerender.routes = [
        ...(nitroConfig.prerender.routes || []),
        ...repos.map((r: any) => `/project/${r.name}`),
      ]
    },
  },
})