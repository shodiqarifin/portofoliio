<script setup lang="ts">
const route = useRoute()

const { data: post } = await useAsyncData(route.path, () =>
  queryCollection('blog').path(route.path).first()
)

useHead({
  title: `${post.value?.title ?? 'Blog'} — Shodiq Arifin`,
  meta: [
    { name: 'description', content: post.value?.description ?? '' }
  ]
})

const { data: allPosts } = await useAsyncData('blog-all', () =>
  queryCollection('blog').order('date', 'DESC').select('path', 'title').all()
)

const currentIndex = computed(() =>
  allPosts.value?.findIndex(p => p.path === post.value?.path) ?? -1
)
const prevPost = computed(() =>
  currentIndex.value < (allPosts.value?.length ?? 0) - 1
    ? allPosts.value![currentIndex.value + 1]
    : null
)
const nextPost = computed(() =>
  currentIndex.value > 0
    ? allPosts.value![currentIndex.value - 1]
    : null
)

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
</script>

<template>
  <div class="py-16">
    <div class="max-w-7xl mx-auto px-2 md:px-0">

      <div class="mb-10">
        <NuxtLink
          to="/blog"
          class="flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white w-fit"
        >
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
          <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.18),_transparent_65%)]" />

          <div class="flex flex-wrap gap-1.5 mb-4">
            <span
              v-for="tag in post.tags"
              :key="tag"
              class="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300"
            >
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
          <img :src="post.image" :alt="post.title" class="w-full object-cover max-h-72" />
        </div>

        <div class="flex gap-12">
          <div class="min-w-0 flex-1">
            <div class="rounded-xl border border-slate-800 bg-slate-900/40 p-8">
              <ContentRenderer :value="post" class="prose" />
            </div>

            <div class="mt-10 grid gap-4 sm:grid-cols-2">
              <NuxtLink
                v-if="prevPost"
                :to="`/blog/${getSlug(prevPost.path)}`"
                class="flex flex-col rounded-xl border border-slate-800 p-4 transition hover:border-indigo-500/50 hover:bg-slate-900/60"
              >
                <span class="mb-1 text-xs text-slate-500">← Artikel Sebelumnya</span>
                <span class="text-sm font-medium text-white line-clamp-2">{{ prevPost.title }}</span>
              </NuxtLink>
              <div v-else />

              <NuxtLink
                v-if="nextPost"
                :to="`/blog/${getSlug(nextPost.path)}`"
                class="flex flex-col rounded-xl border border-slate-800 p-4 text-right transition hover:border-indigo-500/50 hover:bg-slate-900/60"
              >
                <span class="mb-1 text-xs text-slate-500">Artikel Berikutnya →</span>
                <span class="text-sm font-medium text-white line-clamp-2">{{ nextPost.title }}</span>
              </NuxtLink>
            </div>
          </div>

          <aside v-if="toc.length" class="hidden xl:block w-52 shrink-0">
            <div class="sticky top-8">
              <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Daftar Isi
              </p>
              <nav class="space-y-0.5">
                <template v-for="item in toc" :key="item.id">
                  <a
                    :href="`#${item.id}`"
                    :class="[
                      'block border-l-2 py-1 pl-3 text-sm transition',
                      activeHeading === item.id
                        ? 'border-indigo-400 text-indigo-400'
                        : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white',
                    ]"
                  >
                    {{ item.text }}
                  </a>
                  <a
                    v-for="child in item.children ?? []"
                    :key="child.id"
                    :href="`#${child.id}`"
                    :class="[
                      'block border-l-2 py-1 pl-5 text-sm transition',
                      activeHeading === child.id
                        ? 'border-indigo-400 text-indigo-400'
                        : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white',
                    ]"
                  >
                    {{ child.text }}
                  </a>
                </template>
              </nav>
            </div>
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
.prose :deep(pre) {
  @apply relative mb-4 overflow-x-auto rounded-lg bg-slate-800 p-4;
}
.prose :deep(pre code) { @apply bg-transparent p-0 text-sm text-slate-300; }
.prose :deep(blockquote) { @apply mb-4 border-l-4 border-indigo-500/40 pl-4 italic text-slate-400; }
.prose :deep(img) { @apply max-w-full rounded-lg; }
.prose :deep(table) { @apply mb-4 w-full text-sm text-slate-300; }
.prose :deep(th) { @apply border border-slate-700 bg-slate-800 px-3 py-2 text-left font-semibold text-white; }
.prose :deep(td) { @apply border border-slate-700 px-3 py-2; }
.prose :deep(hr) { @apply my-6 border-slate-800; }
</style>
