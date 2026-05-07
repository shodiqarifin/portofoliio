<script setup lang="ts">
const posts = [
  {
    slug: 'streamlining-design-process',
    title: 'Streamlining your design process today.',
    excerpt: "In today's fast-paced digital landscape, fostering seamless collaboration among Developers and IT Operations.",
    image: 'https://plus.unsplash.com/premium_photo-1661877737564-3dfd7282efcb?q=80&w=600&auto=format&fit=crop',
  },
  {
    slug: 'nuxt-static-blog',
    title: 'Bikin static blog dengan Nuxt Content.',
    excerpt: 'Nuxt Content bikin kita bisa nulis artikel dalam markdown dan auto-generate halaman tanpa backend.',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop',
  },
  {
    slug: 'tailwind-tips',
    title: 'Tailwind CSS tips yang sering gua pakai.',
    excerpt: 'Beberapa utility class dan pola Tailwind yang bikin kerjaan frontend jauh lebih cepat.',
    image: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?q=80&w=600&auto=format&fit=crop',
  },
]
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

      <div class="grid gap-4 lg:grid-cols-2">
        <article
          v-for="post in posts"
          :key="post.slug"
          class="group flex overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 transition duration-300 hover:border-indigo-500/50 hover:bg-slate-900/70"
        >
          <div class="w-36 shrink-0 overflow-hidden sm:w-44">
            <img
              :src="post.image"
              :alt="post.title"
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
          <div class="flex flex-col justify-between p-5">
            <div>
              <h3 class="text-base font-semibold leading-snug text-white">{{ post.title }}</h3>
              <p class="mt-2 text-sm text-slate-400 line-clamp-3">{{ post.excerpt }}</p>
            </div>
            <NuxtLink
              :to="`/blog/${post.slug}`"
              class="mt-4 inline-flex items-center gap-1 rounded-base border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-indigo-500/50 hover:text-white w-fit"
            >
              Read more
            </NuxtLink>
          </div>
        </article>
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
