<script setup lang="ts">
import { playlists } from '~/data/playlists'

useHead({
  title: 'Playlist — Shodiq Arifin',
  meta: [
    { name: 'description', content: 'Kumpulan seri artikel tentang membangun proyek dari nol.' }
  ]
})

const today = new Date().toISOString().slice(0, 10)

const playlistStats = await Promise.all(
  playlists.map(async (pl) => {
    const posts = await queryCollection('blog')
      .where('playlist', '=', pl.id)
      .order('playlist_order', 'ASC')
      .all()
    const published = posts.filter(p => p.date <= today).length
    return { ...pl, total: posts.length, published }
  })
)
</script>

<template>
  <div class="py-24">
    <div class="max-w-7xl mx-auto px-4 md:px-0">
      <SectionHeader
        title="Playlist"
        subtitle="Seri artikel yang gua tulis sambil ngerjain proyek nyata — ikut dari awal, bukan cuma baca satu-satu."
      />

      <div class="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="pl in playlistStats"
          :key="pl.id"
          :to="`/playlist/${pl.id}`"
          class="group flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:bg-slate-900/70"
        >
          <div class="flex items-center gap-3 mb-4">
            <h2 class="text-lg font-bold text-white group-hover:text-indigo-300 transition">
              {{ pl.title }}
            </h2>
          </div>

          <p class="text-sm text-slate-400 leading-relaxed flex-1 mb-4">
            {{ pl.description }}
          </p>

          <div class="text-xs text-slate-500 mb-3">{{ pl.tags }}</div>

          <div>
            <div class="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>{{ pl.published }} / {{ pl.total }} post ditulis</span>
              <span class="text-indigo-400 group-hover:underline">Lihat seri →</span>
            </div>
            <div class="h-1.5 w-full rounded-full bg-slate-800">
              <div
                class="h-1.5 rounded-full bg-indigo-500 transition-all"
                :style="{ width: pl.total > 0 ? `${(pl.published / pl.total) * 100}%` : '0%' }"
              />
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
