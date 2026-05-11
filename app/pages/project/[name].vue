<script setup lang="ts">
import { marked } from 'marked'

interface GithubRepo {
  name: string
  description: string | null
  language: string | null
  stargazers_count: number
  topics: string[]
  html_url: string
  homepage: string | null
}

interface ReadmeResponse {
  content: string
  encoding: string
}

interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

const route = useRoute()
const name = route.params.name as string

useSeoMeta({
  title: `${name} — Shodiq Arifin`,
  ogTitle: `${name} — Shodiq Arifin`,
  ogImage: 'https://sdqstack.in/og-image.png',
  ogUrl: `https://sdqstack.in/project/${name}`,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: `${name} — Shodiq Arifin`,
  twitterImage: 'https://sdqstack.in/og-image.png',
})

function slugify(text: string) {
  return text
    .replace(/<[^>]+>/g, '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

marked.use({
  renderer: {
    heading({ text, depth }) {
      if (depth === 2 || depth === 3) {
        const id = slugify(text)
        return `<h${depth} id="${id}">${text}</h${depth}>\n`
      }
      return false
    },
    code({ text, lang }) {
      const language = lang ?? ''
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      const label = language ? `<span class="code-lang">${language}</span>` : ''
      return `<pre class="code-block">${label}<code>${escaped}</code></pre>\n`
    },
  },
})

const { data, error } = await useFetch<{ repo: GithubRepo | null, readme: ReadmeResponse | null }>(
  `/api/github/${name}`,
)

if (error.value || !data.value?.repo) {
  throw createError({ statusCode: 404, statusMessage: 'Project not found', fatal: true })
}

const repo = computed(() => data.value?.repo)

const rawReadme = computed(() => {
  const content = data.value?.readme?.content
  if (!content) return null
  const binary = atob(content.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
})

const toc = computed<TocItem[]>(() => {
  if (!rawReadme.value) return []
  const items: TocItem[] = []
  for (const line of rawReadme.value.split('\n')) {
    const h2 = line.match(/^## (.+)/)
    const h3 = line.match(/^### (.+)/)
    if (h2?.[1]) {
      const text = h2[1].replace(/[*`[\]]/g, '').trim()
      items.push({ id: slugify(text), text, level: 2 })
    }
    else if (h3?.[1]) {
      const text = h3[1].replace(/[*`[\]]/g, '').trim()
      items.push({ id: slugify(text), text, level: 3 })
    }
  }
  return items
})

const readmeHtml = computed(() => {
  if (!rawReadme.value) return null
  return marked.parse(rawReadme.value) as string
})

const activeHeading = ref('')
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!toc.value.length) return
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter(e => e.isIntersecting)
      if (visible.length) activeHeading.value = visible[0]!.target.id
    },
    { rootMargin: '-10% 0% -80% 0%' },
  )
  document.querySelectorAll('.prose h2[id], .prose h3[id]').forEach(el => observer!.observe(el))
})

onUnmounted(() => observer?.disconnect())

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
  <div class="py-16">
    <div v-if="repo" class="max-w-7xl mx-auto px-4 md:px-0">

      <!-- Top nav -->
      <div class="mb-10 flex items-center justify-between">
        <NuxtLink
          to="/project"
          class="flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Projects
        </NuxtLink>
        <div class="flex gap-2">
          <a
            :href="repo!.html_url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center rounded-base border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:bg-indigo-500/50 hover:text-white"
          >
            GitHub
          </a>
          <a
            v-if="repo!.homepage"
            :href="repo!.homepage"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center rounded-base border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:bg-indigo-500/50 hover:text-white"
          >
            Live Demo →
          </a>
        </div>
      </div>

      <!-- Project header with gradient glow -->
      <div class="relative mb-10 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-8">
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.18),_transparent_65%)]" />
        <div class="mb-3 flex items-center gap-4">
          <div v-if="repo!.language" class="flex items-center gap-1.5">
            <span
              class="h-3 w-3 rounded-full"
              :style="{ backgroundColor: getLangColor(repo!.language) }"
            />
            <span class="text-xs text-slate-400">{{ repo!.language }}</span>
          </div>
          <div class="flex items-center gap-1 text-xs text-slate-500">
            <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {{ repo!.stargazers_count }}
          </div>
        </div>
        <h1 class="text-3xl font-bold text-white">{{ repo!.name }}</h1>
        <p v-if="repo!.description" class="mt-2 text-slate-400">{{ repo!.description }}</p>
        <div v-if="repo!.topics?.length" class="mt-4 flex flex-wrap gap-1.5">
          <span
            v-for="topic in repo!.topics"
            :key="topic"
            class="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300"
          >
            {{ topic }}
          </span>
        </div>
      </div>

      <!-- Content + TOC -->
      <div class="flex gap-12">

        <!-- README -->
        <div class="min-w-0 flex-1">
          <div class="rounded-xl border border-slate-800 bg-slate-900/40 p-8">
            <div v-if="readmeHtml" class="prose" v-html="readmeHtml" />
            <p v-else class="text-sm text-slate-500">Repo ini belum punya README.</p>
          </div>

          <BuyCoffeeCard label="Project ini berguna?" />
        </div>

        <!-- TOC sidebar -->
        <aside v-if="toc.length" class="hidden xl:block w-52 shrink-0">
          <div class="sticky top-20">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              On this page
            </p>
            <nav class="space-y-0.5">
              <a
                v-for="item in toc"
                :key="item.id"
                :href="`#${item.id}`"
                :class="[
                  'block border-l-2 py-1 text-sm transition',
                  item.level === 3 ? 'pl-5' : 'pl-3',
                  activeHeading === item.id
                    ? 'border-indigo-400 text-indigo-400'
                    : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white',
                ]"
              >
                {{ item.text }}
              </a>
            </nav>
            <BuyCoffeeCard :compact="true" />
          </div>
        </aside>

      </div>
    </div>
  </div>
</template>

<style scoped>
.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4) {
  @apply font-bold text-white mt-8 mb-3;
  scroll-margin-top: 5rem;
}
.prose :deep(h1) { @apply text-2xl; }
.prose :deep(h2) { @apply text-xl border-b border-slate-800 pb-2; }
.prose :deep(h3) { @apply text-lg; }
.prose :deep(p) { @apply text-slate-300 leading-relaxed mb-4; }
.prose :deep(a) { @apply text-indigo-400 underline hover:text-indigo-300; }
.prose :deep(ul),
.prose :deep(ol) { @apply mb-4 pl-6 text-slate-300; }
.prose :deep(ul) { @apply list-disc; }
.prose :deep(ol) { @apply list-decimal; }
.prose :deep(li) { @apply mb-1; }
.prose :deep(code) { @apply rounded bg-slate-800 px-1.5 py-0.5 font-mono text-sm text-indigo-300; }
.prose :deep(.code-block) {
  @apply relative mb-4 overflow-x-auto rounded-lg bg-slate-800 pb-4 pl-4 pr-4 pt-8;
}
.prose :deep(.code-block .code-lang) {
  @apply absolute right-3 top-2 font-mono text-xs text-slate-500;
}
.prose :deep(.code-block code) { @apply bg-transparent p-0 text-sm text-slate-300; }
.prose :deep(blockquote) { @apply mb-4 border-l-4 border-indigo-500/40 pl-4 italic text-slate-400; }
.prose :deep(img) { @apply max-w-full rounded-lg; }
.prose :deep(table) { @apply mb-4 w-full text-sm text-slate-300; }
.prose :deep(th) { @apply border border-slate-700 bg-slate-800 px-3 py-2 text-left font-semibold text-white; }
.prose :deep(td) { @apply border border-slate-700 px-3 py-2; }
.prose :deep(hr) { @apply my-6 border-slate-800; }
</style>
