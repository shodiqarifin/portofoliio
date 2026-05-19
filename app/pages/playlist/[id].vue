<script setup lang="ts">
import { findPlaylist } from '~/data/playlists'

const route = useRoute()
const id = route.params.id as string
const today = new Date().toISOString().slice(0, 10)

const playlist = findPlaylist(id)
if (!playlist) {
  throw createError({ statusCode: 404, statusMessage: 'Playlist not found', fatal: true })
}

useSeoMeta({
  title: `${playlist.title} — Playlist — Shodiq Arifin`,
  description: playlist.description,
  ogTitle: `${playlist.title} — Playlist — Shodiq Arifin`,
  ogDescription: playlist.description,
  ogUrl: `https://sdqstack.in/playlist/${id}`,
})

const { data: posts } = await useAsyncData(`playlist-page-${id}`, () =>
  queryCollection('blog')
    .where('playlist', '=', id)
    .order('playlist_order', 'ASC')
    .all()
)

const publishedCount = computed(() =>
  posts.value?.filter(p => p.date <= today).length ?? 0
)

const progressPct = computed(() =>
  posts.value?.length ? (publishedCount.value / posts.value.length) * 100 : 0
)

function getSlug(path: string) {
  return path.split('/').pop() ?? ''
}

function isPublished(date: string) {
  return date <= today
}
</script>

<template>
  <div class="py-16">
    <div class="max-w-7xl mx-auto px-4 md:px-0">

      <div class="mb-10">
        <NuxtLink to="/playlist" class="flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white w-fit">
          ← Semua Playlist
        </NuxtLink>
      </div>

      <div class="relative mb-10 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-8">
        <div
          class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.18),_transparent_65%)]"
        />

        <div class="mb-4">
          <h1 class="text-3xl font-bold text-white">{{ playlist.title }}</h1>
          <p class="mt-1 text-slate-400 text-sm">{{ playlist.tags }}</p>
        </div>

        <p class="text-slate-300 max-w-2xl mb-6">{{ playlist.description }}</p>

        <div class="flex items-center gap-3">
          <div class="flex-1 max-w-xs h-2 rounded-full bg-slate-800">
            <div
              class="h-2 rounded-full bg-indigo-500 transition-all"
              :style="{ width: `${progressPct}%` }"
            />
          </div>
          <span class="text-sm text-slate-400">
            {{ publishedCount }} / {{ posts?.length }} post ditulis
          </span>
        </div>
      </div>

      <div class="space-y-3">
        <template v-for="(post, i) in posts" :key="post.path">
          <NuxtLink
            v-if="isPublished(post.date)"
            :to="`/blog/${getSlug(post.path)}`"
            class="group flex items-start gap-5 rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition duration-200 hover:border-indigo-500/50 hover:bg-slate-900/70"
          >
            <span class="shrink-0 font-mono text-lg font-bold text-slate-700 group-hover:text-indigo-500 transition w-8 text-right pt-0.5">
              {{ String(i + 1).padStart(2, '0') }}
            </span>
            <div class="flex-1 min-w-0">
              <h2 class="text-base font-semibold text-white group-hover:text-indigo-300 transition line-clamp-2">
                {{ post.title }}
              </h2>
              <p class="mt-1 text-sm text-slate-400 line-clamp-2">{{ post.description }}</p>
            </div>
            <span class="shrink-0 self-center text-xs text-indigo-400 group-hover:underline">Baca →</span>
          </NuxtLink>

          <div
            v-else
            class="flex items-start gap-5 rounded-xl border border-slate-800 bg-slate-900/40 p-5 opacity-40 cursor-default select-none"
          >
            <span class="shrink-0 font-mono text-lg font-bold text-slate-700 w-8 text-right pt-0.5">
              {{ String(i + 1).padStart(2, '0') }}
            </span>
            <div class="flex-1 min-w-0">
              <h2 class="text-base font-semibold text-slate-400 line-clamp-2">{{ post.title }}</h2>
              <p class="mt-1 text-sm text-slate-500 line-clamp-2">{{ post.description }}</p>
            </div>
            <span class="shrink-0 self-center rounded px-2 py-1 text-xs bg-slate-800 text-slate-500">
              belum ditulis
            </span>
          </div>
        </template>
      </div>

    </div>
  </div>
</template>
