<script setup lang="ts">
const { data: posts } = await useAsyncData('blog-featured', () =>
  queryCollection('blog').order('date', 'DESC').limit(2).all()
)

function getSlug(path: string) {
  return path.split('/').pop() ?? ''
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}
</script>

<template>
  <section id="latest-posts" class="relative py-24 border-t border-slate-800">
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.07),_transparent_65%)]" />

    <div class="max-w-7xl mx-auto px-2 md:px-0">
      <SectionHeader title="Latest from blog" subtitle="Catatan, ide, dan hal-hal yang lagi gua pelajari.">
        <NuxtLink
          to="/blog"
          class="hidden text-sm text-indigo-400 transition hover:text-indigo-300 sm:inline"
        >
          View all →
        </NuxtLink>
      </SectionHeader>

      <div class="grid gap-6 md:grid-cols-2">
        <NuxtLink
          v-for="post in posts"
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
                v-for="tag in post.tags.slice(0, 2)"
                :key="tag"
                class="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300"
              >
                {{ tag }}
              </span>
            </div>
            <h3 class="text-base font-semibold text-white line-clamp-2 group-hover:text-indigo-300 transition">
              {{ post.title }}
            </h3>
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

      <div class="mt-8 text-center sm:hidden">
        <NuxtLink
          to="/blog"
          class="inline-flex items-center rounded-base border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-indigo-500/50 hover:text-white"
        >
          View all posts
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
