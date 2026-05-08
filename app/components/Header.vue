<script setup lang="ts">
const route = useRoute()
const isOpen = ref(false)

watch(() => route.path, () => { isOpen.value = false })

const links = [
  { to: '/', label: 'Home' },
  { to: '/project', label: 'Project' },
  { to: '/blog', label: 'Blog' },
]

const isActive = (to: string) =>
  to === '/' ? route.path === '/' : route.path.startsWith(to)
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
    <div class="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 md:px-0">
      <NuxtLink to="/" class="text-xl font-bold sm:text-2xl">Shodiq Arifin</NuxtLink>

      <!-- Desktop nav -->
      <div class="hidden md:block">
        <NavMenu />
      </div>

      <!-- Desktop Trakteer -->
      <a
        href="https://trakteer.id/shodiq_arifin"
        target="_blank"
        rel="noopener noreferrer"
        class="hidden md:block transition opacity-80 hover:opacity-100"
      >
        <img
          src="https://cdn.trakteer.id/images/embed/trbtn-red-1.png"
          alt="Trakteer"
          class="h-8 w-auto"
        />
      </a>

      <!-- Mobile: hamburger -->
      <button
        class="md:hidden flex items-center justify-center rounded-lg p-2 text-slate-400 transition hover:text-white"
        aria-label="Toggle menu"
        @click="isOpen = !isOpen"
      >
        <svg v-if="!isOpen" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile menu -->
    <div v-if="isOpen" class="md:hidden border-t border-slate-800 bg-slate-900/95 px-4 py-3">
      <nav class="flex flex-col gap-1">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :class="[
            'rounded-lg px-3 py-2.5 text-sm font-semibold transition',
            isActive(link.to)
              ? 'bg-indigo-500/10 text-indigo-400'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white',
          ]"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
      <div class="mt-3 border-t border-slate-800 pt-3">
        <a
          href="https://trakteer.id/shodiq_arifin"
          target="_blank"
          rel="noopener noreferrer"
          class="block transition opacity-80 hover:opacity-100"
        >
          <img
            src="https://cdn.trakteer.id/images/embed/trbtn-red-1.png"
            alt="Trakteer"
            class="h-8 w-auto"
          />
        </a>
      </div>
    </div>
  </header>
</template>
