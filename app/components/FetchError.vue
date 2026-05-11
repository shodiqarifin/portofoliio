<script setup lang="ts">
defineProps<{ message?: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="py-20 text-center">
    <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
      <svg class="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    </div>
    <p class="mt-4 text-base font-medium text-white">Gagal memuat data</p>
    <p class="mt-1.5 text-sm text-slate-400">{{ message ?? 'Terjadi kesalahan. Coba refresh halaman.' }}</p>
    <button
      class="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-indigo-500/50 hover:text-white"
      @click="$emit('retry')"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
      Coba lagi
    </button>
  </div>
</template>
