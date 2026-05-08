<script setup lang="ts">
useHead({
  title: 'Blog — Shodiq Arifin',
  meta: [
    { name: 'description', content: 'Artikel tentang web development, tips coding, dan pengalaman belajar.' }
  ]
})

const { data: posts } = await useAsyncData('blog-list', () =>
  queryCollection('blog').order('date', 'DESC').all()
)

const searchQuery = ref('')
const selectedTag = ref('')

const allTags = computed(() => {
  const tags = posts.value?.flatMap(p => p.tags) ?? []
  return [...new Set(tags)].sort()
})

const filteredPosts = computed(() => {
  return posts.value?.filter(post => {
    const matchSearch = searchQuery.value === ''
      || post.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      || post.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchTag = selectedTag.value === '' || post.tags.includes(selectedTag.value)
    return matchSearch && matchTag
  }) ?? []
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

function getSlug(path: string) {
  return path.split('/').pop() ?? ''
}
</script>

<template>
  <div class="py-24">
    <div class="max-w-7xl mx-auto px-2 md:px-0">
      <SectionHeader
        label="Writing"
        title="Blog"
        subtitle="Artikel tentang web development, tips coding, dan hal-hal yang gua pelajari."
      />

      <div class="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div class="relative flex-1">
          <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari artikel..."
            class="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 transition"
          />
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            class="rounded-full px-3 py-1 text-xs transition"
            :class="selectedTag === '' ? 'bg-indigo-600 text-white' : 'border border-slate-700 text-slate-400 hover:border-indigo-500/50 hover:text-white'"
            @click="selectedTag = ''"
          >
            Semua
          </button>
          <button
            v-for="tag in allTags"
            :key="tag"
            class="rounded-full px-3 py-1 text-xs transition"
            :class="selectedTag === tag ? 'bg-indigo-600 text-white' : 'border border-slate-700 text-slate-400 hover:border-indigo-500/50 hover:text-white'"
            @click="selectedTag = selectedTag === tag ? '' : tag"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <div v-if="filteredPosts.length === 0" class="py-16 text-center text-slate-400">
        Tidak ada artikel yang sesuai.
      </div>

      <div v-else class="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="post in filteredPosts"
          :key="post.path"
          :to="`/blog/${getSlug(post.path)}`"
          class="group flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:bg-slate-900/70"
        >
          <div v-if="post.image" class="aspect-video overflow-hidden">
            <img
              :src="post.image"
              :alt="post.title"
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </div>

          <div class="flex flex-1 flex-col p-5">
            <div class="flex flex-wrap gap-1.5 mb-3">
              <span
                v-for="tag in post.tags"
                :key="tag"
                class="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300"
              >
                {{ tag }}
              </span>
            </div>

            <h2 class="text-base font-semibold text-white line-clamp-2 group-hover:text-indigo-300 transition">
              {{ post.title }}
            </h2>
            <p class="mt-2 text-sm text-slate-400 line-clamp-3 flex-1">
              {{ post.description }}
            </p>

            <div class="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>{{ formatDate(post.date) }}</span>
              <span class="text-indigo-400 group-hover:underline">Baca →</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
