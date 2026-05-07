<template>
  <section id="hero" class="relative overflow-hidden border-b border-slate-800">
    <div class="pointer-events-none absolute inset-0 -z-10">
      <div class="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-3xl" />
    </div>

    <div class="max-w-7xl mx-auto flex min-h-[80vh] flex-col justify-center px-2 py-24 md:px-0">
      <div class="animate-fade-up" style="animation-delay: 0ms">
        <span class="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
          Hi, I'm
        </span>
      </div>

      <h1
        class="animate-fade-up mt-4 text-5xl font-bold tracking-tight sm:text-7xl bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-transparent"
        style="animation-delay: 120ms"
      >
        Shodiq Arifin.
      </h1>

      <p
        class="animate-fade-up mt-4 max-w-2xl text-xl text-slate-400 sm:text-2xl"
        style="animation-delay: 240ms"
      >
        Software engineer yang suka ngulik web, backend, dan tools yang bikin idup gampang.
      </p>

      <div
        class="animate-fade-up mt-8 flex flex-wrap gap-3"
        style="animation-delay: 360ms"
      >
        <a
          href="#projects"
          class="rounded-base bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Lihat project
        </a>
        <a
          href="#about"
          class="rounded-base border border-white/10 px-5 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:text-white"
        >
          Kontak gua
        </a>
      </div>
    </div>
  </section>
</template>
