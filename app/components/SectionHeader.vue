<script setup lang="ts">
defineProps<{
  label?: string
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="mb-10 flex items-end justify-between gap-4">
    <div>
      <span
        v-if="label"
        class="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400"
      >
        {{ label }}
      </span>
      <h2 :class="['text-3xl font-bold text-white', label ? 'mt-3' : '']">{{ title }}</h2>
      <p v-if="subtitle" class="mt-2 text-sm text-slate-500">{{ subtitle }}</p>
    </div>
    <slot />
  </div>
</template>
