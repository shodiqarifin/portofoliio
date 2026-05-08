<template>
  <section id="about" class="relative py-24">
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(99,102,241,0.07),_transparent_65%)]" />

    <div class="max-w-7xl mx-auto px-4 md:px-0">
      <div class="grid gap-12 md:grid-cols-2 md:items-center">

        <div>
          <SectionHeader label="About" title="Shodiq Arifin" />
          <div class="space-y-4 text-slate-400 leading-relaxed">
            <p>
              Gua software engineer yang fokus di web — dari bikin antarmuka yang rapi sampai
              ngatur backend dan database-nya. Suka bangun tools yang beneran kepake, bukan
              sekadar kelihatan keren.
            </p>
            <p>
              Sekarang lagi deep dive ke ekosistem Vue/Nuxt dan Node.js, sambil eksplor
              cara deploy yang efisien dan arsitektur yang gak bikin pusing di kemudian hari.
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <p class="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">Temuin gua di</p>
          <div class="flex flex-col gap-3">
            <a
              href="https://github.com/shodiqarifin"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4 text-sm text-slate-300 transition hover:border-indigo-500/50 hover:text-white"
            >
              <svg class="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.3-5.467-1.332-5.467-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              GitHub — shodiqarifin
            </a>
            <a
              href="mailto:shodiq.arifin03@gmail.com"
              class="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4 text-sm text-slate-300 transition hover:border-indigo-500/50 hover:text-white"
            >
              <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
              </svg>
              shodiq.arifin03@gmail.com
            </a>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>
