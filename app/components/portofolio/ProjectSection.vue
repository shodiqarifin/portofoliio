<template>
  <section id="projects" class="relative py-24 border-b border-slate-800">
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.07),_transparent_65%)]" />

    <div class="max-w-7xl mx-auto px-2 md:px-0">
      <SectionHeader title="Projects" subtitle="Beberapa hal yang gua bikin">
        <NuxtLink to="/project" class="hidden text-sm text-indigo-400 transition hover:text-indigo-300 sm:inline">
          View all →
        </NuxtLink>
      </SectionHeader>

      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <article
          class="group flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 transition duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:bg-slate-900/70">
          <a href="#">
            <img class="rounded-t-xl"
              src="https://plus.unsplash.com/premium_photo-1661877737564-3dfd7282efcb?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="" />
          </a>
          <div class="p-6">
            <h3 class="mb-2 text-xl font-semibold tracking-tight text-white">Streamlining your design process today.</h3>
            <p class="mb-6 text-sm text-slate-400">In today's fast-paced digital landscape, fostering seamless collaboration among Developers and IT Operations.</p>
            <a href="#"
              class="inline-flex items-center rounded-base border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-indigo-500/50 hover:text-white">
              Read more
            </a>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
