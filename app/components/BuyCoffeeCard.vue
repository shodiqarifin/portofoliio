<template>
  <!-- Compact: untuk TOC sidebar -->
  <div v-if="compact" class="mt-6 border-t border-slate-800 pt-5">
    <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Support</p>
    <a
      href="https://buymeacoffee.com/shodiqarifin"
      target="_blank"
      rel="noopener noreferrer"
      class="block transition opacity-80 hover:opacity-100"
    >
      <img
        src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
        alt="Buy Me A Coffee"
        class="h-9 w-auto"
      />
    </a>
  </div>

  <!-- Full: untuk bawah konten -->
  <div
    v-else
    class="mt-8 flex flex-col items-center gap-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6 text-center"
  >
    <span class="text-3xl">☕</span>
    <div>
      <p class="font-semibold text-white">{{ label }}</p>
      <p class="mt-1 text-sm text-slate-400">Traktir gue kopi, yuk!</p>
    </div>
    <a
      href="https://buymeacoffee.com/shodiqarifin"
      target="_blank"
      rel="noopener noreferrer"
      class="transition opacity-90 hover:opacity-100"
    >
      <img
        src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
        alt="Buy Me A Coffee"
        class="h-10 w-auto"
      />
    </a>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  compact?: boolean
  label?: string
}>(), {
  compact: false,
  label: 'Konten ini membantu?',
})
</script>
