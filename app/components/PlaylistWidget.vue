<script setup lang="ts">
import { findPlaylist } from '~/data/playlists'

const props = defineProps<{
  playlistId: string
  currentPath: string
}>()

const today = new Date().toISOString().slice(0, 10)

const playlist = computed(() => findPlaylist(props.playlistId))

const { data: posts } = await useAsyncData(`playlist-${props.playlistId}`, () =>
  queryCollection('blog')
    .where('playlist', '=', props.playlistId)
    .order('playlist_order', 'ASC')
    .all()
)

const publishedCount = computed(() =>
  posts.value?.filter(p => p.date <= today).length ?? 0
)

const currentIndex = computed(() =>
  posts.value?.findIndex(p => p.path === props.currentPath) ?? -1
)

const isOpen = ref(true)

function getSlug(path: string) {
  return path.split('/').pop() ?? ''
}

function isPublished(date: string) {
  return date <= today
}
</script>

<template>
  <div v-if="playlist && posts?.length" class="mb-4 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
    <button
      class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/40 transition"
      @click="isOpen = !isOpen"
    >
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-sm font-semibold text-white truncate">{{ playlist.title }}</span>
      </div>
      <svg
        class="w-4 h-4 text-slate-400 shrink-0 transition-transform"
        :class="isOpen ? 'rotate-180' : ''"
        fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <div v-show="isOpen">
      <div class="px-4 pb-3 pt-1">
        <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>{{ publishedCount }} / {{ posts.length }} ditulis</span>
          <span v-if="currentIndex >= 0">Part {{ currentIndex + 1 }}</span>
        </div>
        <div class="h-1 w-full rounded-full bg-slate-800">
          <div
            class="h-1 rounded-full bg-indigo-500 transition-all"
            :style="{ width: `${(publishedCount / posts.length) * 100}%` }"
          />
        </div>
      </div>

      <nav class="px-2 pb-3 space-y-0.5">
        <template v-for="(post, i) in posts" :key="post.path">
          <NuxtLink
            v-if="isPublished(post.date)"
            :to="`/blog/${getSlug(post.path)}`"
            :class="[
              'flex items-start gap-2.5 rounded-lg px-2 py-2 text-xs transition',
              post.path === currentPath
                ? 'bg-indigo-500/15 text-indigo-300'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white',
            ]"
          >
            <span class="shrink-0 mt-0.5 font-mono text-slate-600">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="leading-snug line-clamp-2">{{ post.title }}</span>
          </NuxtLink>

          <div
            v-else
            class="flex items-start gap-2.5 rounded-lg px-2 py-2 text-xs opacity-40 cursor-default select-none"
          >
            <span class="shrink-0 mt-0.5 font-mono text-slate-600">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="leading-snug line-clamp-2 text-slate-400">{{ post.title }}</span>
            <span class="shrink-0 ml-auto rounded px-1 py-0.5 text-[10px] bg-slate-800 text-slate-500 whitespace-nowrap">belum ditulis</span>
          </div>
        </template>
      </nav>
    </div>
  </div>
</template>
