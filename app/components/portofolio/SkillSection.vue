<script setup lang="ts">
const groups = [
  {
    title: 'Frontend',
    items: ['Vue 3 / Nuxt', 'React / Next.js', 'TypeScript', 'Tailwind CSS'],
  },
  {
    title: 'Backend',
    items: ['Node.js', 'NestJS', 'PostgreSQL', 'Supabase'],
  },
  {
    title: 'Tooling',
    items: ['Git', 'Docker', 'Vitest / Jest', 'GitHub Actions'],
  },
]
</script>

<template>
  <section id="skills" class="relative py-24">
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.06),_transparent_70%)]" />

    <div class="max-w-7xl mx-auto px-4 md:px-0">
      <SectionHeader title="Skills" subtitle="Tech stack yang sering gua pake" />

      <div class="grid gap-6 md:grid-cols-3">
        <div
          v-for="group in groups"
          :key="group.title"
          class="rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition hover:-translate-y-1 hover:border-indigo-500/50"
        >
          <h3 class="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            {{ group.title }}
          </h3>
          <ul class="mt-4 space-y-2 text-sm text-slate-300">
            <li v-for="item in group.items" :key="item" class="flex items-center gap-2">
              <span class="text-indigo-400">▹</span>
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
