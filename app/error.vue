<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; statusMessage: string } }>()

const is404 = computed(() => props.error.statusCode === 404)

useHead({ title: `${props.error.statusCode} — Shodiq Arifin` })

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-900 text-white">
    <Header />
    <div class="flex flex-1 flex-col items-center justify-center py-32 text-center px-4">
      <p class="text-8xl font-bold text-indigo-500">{{ error.statusCode }}</p>
      <h1 class="mt-4 text-2xl font-semibold text-white">
        {{ is404 ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan' }}
      </h1>
      <p class="mt-3 text-slate-400">
        {{ is404 ? 'URL yang kamu akses tidak ada atau sudah dipindahkan.' : error.statusMessage }}
      </p>
      <button
        class="mt-8 inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
        @click="goHome">
        ← Kembali ke Home
      </button>
    </div>
    <Footer />
  </div>
</template>
