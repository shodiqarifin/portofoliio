<script setup lang="ts">
interface GithubRepo {
  id: number
  name: string
  description: string | null
  language: string | null
  stargazers_count: number
  topics: string[]
  html_url: string
  homepage: string | null
  fork: boolean
}

const { data: repos } = await useFetch<GithubRepo[]>(
  'https://api.github.com/users/shodiqarifin/repos?sort=updated&per_page=30',
)

const projects = computed(() =>
  repos.value
    ?.filter(r => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 3) ?? []
)

const languageColors: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Vue: '#41b883',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Blade: '#F05340',
}

const getLangColor = (lang: string | null) =>
  lang ? (languageColors[lang] ?? '#94a3b8') : '#94a3b8'
</script>

<template>
  <section id="projects" class="relative py-24 border-b border-slate-800">
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.07),_transparent_65%)]" />

    <div class="max-w-7xl mx-auto px-4 md:px-0">
      <SectionHeader title="Projects" subtitle="Beberapa hal yang gua bikin.">
        <NuxtLink to="/project" class="hidden text-sm text-indigo-400 transition hover:text-indigo-300 sm:inline">
          View all →
        </NuxtLink>
      </SectionHeader>

      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="repo in projects"
          :key="repo.id"
          class="group flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:bg-slate-900/70"
        >
          <div class="mb-4 flex items-center justify-between">
            <div v-if="repo.language" class="flex items-center gap-1.5">
              <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: getLangColor(repo.language) }" />
              <span class="text-xs text-slate-400">{{ repo.language }}</span>
            </div>
            <div v-else />
            <div class="flex items-center gap-1 text-xs text-slate-500">
              <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {{ repo.stargazers_count }}
            </div>
          </div>

          <div class="flex-1">
            <h3 class="text-base font-semibold text-white transition group-hover:text-indigo-300">{{ repo.name }}</h3>
            <p class="mt-1.5 text-sm text-slate-400 line-clamp-2">{{ repo.description }}</p>
          </div>

          <div v-if="repo.topics?.length" class="mt-4 flex flex-wrap gap-1.5">
            <span
              v-for="topic in repo.topics.slice(0, 3)"
              :key="topic"
              class="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300"
            >
              {{ topic }}
            </span>
          </div>

          <div class="mt-4 flex items-center justify-between text-xs text-slate-500">
            <a
              v-if="repo.homepage"
              :href="repo.homepage"
              target="_blank"
              rel="noopener noreferrer"
              class="transition hover:text-white"
            >
              Live Demo
            </a>
            <span v-else />
            <NuxtLink
              :to="`/project/${repo.name}`"
              class="text-indigo-400 group-hover:underline"
            >
              Lihat →
            </NuxtLink>
          </div>
        </article>
      </div>

      <div class="mt-8 text-center sm:hidden">
        <NuxtLink
          to="/project"
          class="inline-flex items-center rounded-base border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-indigo-500/50 hover:text-white"
        >
          View all projects
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
