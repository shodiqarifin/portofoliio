<script setup lang="ts">
const route = useRoute()

const links = [
  { to: '/', label: 'Home' },
  { to: '/project', label: 'Project' },
  { to: '/blog', label: 'Blog' },
  { to: '/playlist', label: 'Playlist' },
]

const isActive = (to: string) =>
  to === '/' ? route.path === '/' : route.path.startsWith(to)
</script>

<template>
  <nav class="flex gap-8">
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      :class="[
        'text-sm font-semibold transition',
        isActive(link.to) ? 'text-indigo-400' : 'text-slate-400 hover:text-white',
      ]"
    >
      {{ link.label }}
    </NuxtLink>
  </nav>
</template>
