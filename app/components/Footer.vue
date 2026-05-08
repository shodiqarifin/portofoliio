<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-24 border-t border-slate-800/60 py-8">
    <div class="max-w-7xl mx-auto flex flex-col items-center justify-between gap-2 text-xs text-slate-500 md:flex-row">
      <p>&copy; {{ year }} Shodiq Arifin. Built with Nuxt &amp; Tailwind.</p>
      <p class="flex items-center gap-2">
        Made with too much coffee.
      </p>
    </div>
  </footer>
</template>
