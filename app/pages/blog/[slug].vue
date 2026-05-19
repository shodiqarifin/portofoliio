<script setup lang="ts">
const route = useRoute()
const today = new Date().toISOString().slice(0, 10)

const { data: post } = await useAsyncData(route.path, () =>
  queryCollection('blog').path(route.path).first()
)

if (!post.value || post.value.date > today) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

useSeoMeta({
  title: `${post.value?.title ?? 'Blog'} — Shodiq Arifin`,
  description: post.value?.description ?? '',
  ogTitle: `${post.value?.title ?? 'Blog'} — Shodiq Arifin`,
  ogDescription: post.value?.description ?? '',
  ogImage: post.value?.image ?? 'https://sdqstack.in/og-image.png',
  ogUrl: `https://sdqstack.in${route.path}`,
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: `${post.value?.title ?? 'Blog'} — Shodiq Arifin`,
  twitterDescription: post.value?.description ?? '',
  twitterImage: post.value?.image ?? 'https://sdqstack.in/og-image.png',
})

// Playlist-aware prev/next: if post belongs to a playlist, navigate within playlist order.
// Otherwise fall back to global date order.
const playlistId = post.value?.playlist as string | undefined

const { data: playlistPosts } = playlistId
  ? await useAsyncData(`playlist-nav-${playlistId}`, () =>
      queryCollection('blog')
        .where('playlist', '=', playlistId)
        .where('date', '<=', today)
        .order('playlist_order', 'ASC')
        .select('path', 'title')
        .all()
    )
  : { data: ref(null) }

const { data: allPosts } = !playlistId
  ? await useAsyncData('blog-all', () =>
      queryCollection('blog').order('date', 'DESC').select('path', 'title').all()
    )
  : { data: ref(null) }

const navPosts = computed(() => playlistPosts.value ?? allPosts.value ?? [])

const currentIndex = computed(() =>
  navPosts.value.findIndex(p => p.path === post.value?.path) ?? -1
)

const prevPost = computed(() => {
  if (playlistId) {
    return currentIndex.value > 0 ? navPosts.value[currentIndex.value - 1] : null
  }
  return currentIndex.value < navPosts.value.length - 1
    ? navPosts.value[currentIndex.value + 1]
    : null
})

const nextPost = computed(() => {
  if (playlistId) {
    return currentIndex.value < navPosts.value.length - 1
      ? navPosts.value[currentIndex.value + 1]
      : null
  }
  return currentIndex.value > 0 ? navPosts.value[currentIndex.value - 1] : null
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

const toc = computed(() => (post.value?.body as any)?.toc?.links ?? [])
const activeHeading = ref('')
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!toc.value.length) return
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter(e => e.isIntersecting)
      if (visible.length) activeHeading.value = visible[0]!.target.id
    },
    { rootMargin: '-10% 0% -80% 0%' }
  )
  document.querySelectorAll('.prose h2[id], .prose h3[id]').forEach(el => observer!.observe(el))
})

onUnmounted(() => observer?.disconnect())

function getSlug(path: string) {
  return path.split('/').pop() ?? ''
}

const prevLabel = computed(() => playlistId ? '← Part Sebelumnya' : '← Artikel Sebelumnya')
const nextLabel = computed(() => playlistId ? 'Part Berikutnya →' : 'Artikel Berikutnya →')
</script>

<template>
  <div class="py-16">
    <div class="max-w-7xl mx-auto px-4 md:px-0">

      <div class="mb-10">
        <NuxtLink to="/blog" class="flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white w-fit">
          ← Kembali ke Blog
        </NuxtLink>
      </div>

      <div v-if="!post" class="py-24 text-center text-slate-400">
        Artikel tidak ditemukan.
        <NuxtLink to="/blog" class="block mt-4 text-indigo-400 hover:text-indigo-300">
          Lihat semua artikel →
        </NuxtLink>
      </div>

      <template v-else>
        <div class="relative mb-10 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-8">
          <div
            class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.18),_transparent_65%)]" />

          <div class="flex flex-wrap gap-1.5 mb-4">
            <span v-for="tag in post.tags" :key="tag"
              class="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300">
              {{ tag }}
            </span>
          </div>

          <h1 class="text-3xl font-bold text-white">{{ post.title }}</h1>
          <p class="mt-2 text-slate-400">{{ post.description }}</p>

          <div class="mt-4 text-sm text-slate-500">
            {{ formatDate(post.date) }}
          </div>
        </div>

        <div v-if="post.image" class="mb-8 overflow-hidden rounded-xl border border-slate-800">
          <img :src="post.image" :alt="post.title" class="w-full object-cover max-h-[650px]" />
        </div>

        <div class="flex gap-12">
          <div class="min-w-0 flex-1">
            <div class="rounded-xl border border-slate-800 bg-slate-900/40 p-8">
              <ContentRenderer :value="post" class="prose" />
            </div>

            <BuyCoffeeCard label="Artikel ini membantu?" />

            <div class="mt-10 grid gap-4 sm:grid-cols-2">
              <NuxtLink v-if="prevPost" :to="`/blog/${getSlug(prevPost.path)}`"
                class="flex flex-col rounded-xl border border-slate-800 p-4 transition hover:border-indigo-500/50 hover:bg-slate-900/60">
                <span class="mb-1 text-xs text-slate-500">{{ prevLabel }}</span>
                <span class="text-sm font-medium text-white line-clamp-2">{{ prevPost.title }}</span>
              </NuxtLink>
              <div v-else />

              <NuxtLink v-if="nextPost" :to="`/blog/${getSlug(nextPost.path)}`"
                class="flex flex-col rounded-xl border border-slate-800 p-4 text-right transition hover:border-indigo-500/50 hover:bg-slate-900/60">
                <span class="mb-1 text-xs text-slate-500">{{ nextLabel }}</span>
                <span class="text-sm font-medium text-white line-clamp-2">{{ nextPost.title }}</span>
              </NuxtLink>
            </div>
          </div>

          <aside v-if="toc.length || post.playlist"
            class="hidden xl:block w-80 shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">

            <PlaylistWidget
              v-if="post.playlist"
              :playlist-id="post.playlist"
              :current-path="post.path"
            />

            <div v-if="toc.length">
              <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Daftar Isi
              </p>
              <nav class="space-y-0.5">
                <template v-for="item in toc" :key="item.id">
                  <a :href="`#${item.id}`" :class="[
                    'block border-l-2 py-1 pl-3 text-sm transition',
                    activeHeading === item.id
                      ? 'border-indigo-400 text-indigo-400'
                      : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white',
                  ]">
                    {{ item.text }}
                  </a>
                  <a v-for="child in item.children ?? []" :key="child.id" :href="`#${child.id}`" :class="[
                    'block border-l-2 py-1 pl-5 text-sm transition',
                    activeHeading === child.id
                      ? 'border-indigo-400 text-indigo-400'
                      : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white',
                  ]">
                    {{ child.text }}
                  </a>
                </template>
              </nav>
            </div>

            <BuyCoffeeCard :compact="true" />
          </aside>
        </div>
      </template>
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

.prose :deep(h1) {
  @apply text-2xl;
}

.prose :deep(h2) {
  @apply text-xl border-b border-slate-800 pb-2;
}

.prose :deep(h3) {
  @apply text-lg;
}

.prose :deep(p) {
  @apply text-slate-300 leading-relaxed mb-4;
}

.prose :deep(a) {
  @apply text-indigo-400 underline hover:text-indigo-300;
}

.prose :deep(ul),
.prose :deep(ol) {
  @apply mb-4 pl-6 text-slate-300;
}

.prose :deep(ul) {
  @apply list-disc;
}

.prose :deep(ol) {
  @apply list-decimal;
}

.prose :deep(li) {
  @apply mb-1;
}

/* inline code (bukan di dalam pre) */
.prose :deep(:not(pre) > code) {
  @apply rounded-md px-1.5 py-0.5 font-mono text-sm text-indigo-300;
}

/* wrapper pre — beri border + shadow supaya terasa seperti "card" terpisah */
.prose :deep(pre) {
  @apply relative mb-6 overflow-hidden rounded-xl p-0;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.prose :deep(.shiki) {
  @apply p-5 overflow-x-auto text-sm leading-7;
  background-color: var(--shiki-dark-bg, #1e1e2e) !important;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
}

/* INI ROOT CAUSE-NYA — Shiki generate --shiki-dark tapi tidak ada yang pakai */
.prose :deep(.shiki) span {
  color: var(--shiki-dark) !important;
}

/* baris kosong tetap punya tinggi supaya tidak kolaps */
.prose :deep(.shiki .line) {
  display: block;
  min-height: 1.5rem;
}

.prose :deep(blockquote) {
  @apply mb-4 border-l-4 border-indigo-500/40 pl-4 italic text-white;
}

.prose :deep(img) {
  @apply max-w-full rounded-lg;
}

.prose :deep(table) {
  @apply mb-4 w-full text-sm text-slate-300;
}

.prose :deep(th) {
  @apply border border-slate-700 bg-slate-800 px-3 py-2 text-left font-semibold text-white;
}

.prose :deep(td) {
  @apply border border-slate-700 px-3 py-2;
}

.prose :deep(hr) {
  @apply my-6 border-slate-800;
}
</style>
