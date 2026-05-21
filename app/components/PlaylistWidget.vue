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

const progress = computed(() =>
  posts.value?.length ? Math.round((publishedCount.value / posts.value.length) * 100) : 0
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
  <div v-if="playlist && posts?.length"
    class="rounded-xl border border-slate-700/60 bg-slate-900/80 overflow-hidden shadow-lg">

    <button class="w-full flex items-center justify-between px-4 py-3.5 text-left transition hover:bg-slate-800/50"
      @click="isOpen = !isOpen">

      <span class="text-sm font-semibold text-white truncate">{{ playlist.title }}</span>
      <svg class="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200" :class="isOpen ? 'rotate-180' : ''"
        fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <div v-show="isOpen">
      <div class="px-4 py-3 border-t border-slate-800/60">
        <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>{{ publishedCount }} / {{ posts.length }} artikel</span>
          <span v-if="currentIndex >= 0" class="text-indigo-400 font-medium">Part {{ currentIndex + 1 }}</span>
        </div>
        <div class="h-1.5 w-full rounded-full bg-slate-800">
          <div class="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            :style="{ width: `${progress}%` }" />
        </div>
      </div>

      <nav class="px-2 pb-3 space-y-0.5">
        <template v-for="(post, i) in posts" :key="post.path">
          <NuxtLink v-if="isPublished(post.date)" :to="`/blog/${getSlug(post.path)}`" :class="[
            'flex items-start gap-3 rounded-lg px-3 py-2.5 text-xs transition group',
            post.path === currentPath
              ? 'bg-indigo-500/15 border border-indigo-500/25'
              : 'hover:bg-slate-800/60',
          ]">
            <span :class="[
              'shrink-0 mt-0.5 font-mono text-[11px] font-medium',
              post.path === currentPath ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'
            ]">
              {{ String(i + 1).padStart(2, '0') }}
            </span>
            <span :class="[
              'leading-snug line-clamp-2',
              post.path === currentPath ? 'text-indigo-300 font-medium' : 'text-slate-400 group-hover:text-white'
            ]">
              {{ post.title }}
            </span>
            <svg v-if="post.path === currentPath" class="shrink-0 ml-auto mt-0.5 w-3 h-3 text-indigo-400"
              fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5" />
            </svg>
          </NuxtLink>

          <div v-else
            class="flex items-start gap-3 rounded-lg px-3 py-2.5 text-xs opacity-35 cursor-default select-none">
            <span class="shrink-0 mt-0.5 font-mono text-[11px] font-medium text-slate-600">
              {{ String(i + 1).padStart(2, '0') }}
            </span>
            <span class="leading-snug line-clamp-2 text-slate-500 flex-1">{{ post.title }}</span>
            <span
              class="shrink-0 ml-auto rounded px-1.5 py-0.5 text-[9px] bg-slate-800 text-slate-500 whitespace-nowrap">
              segera
            </span>
          </div>
        </template>
      </nav>
    </div>
  </div>
</template>
