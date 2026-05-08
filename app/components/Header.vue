<template>
    <header class="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 px-2 py-4 backdrop-blur-sm md:px-0">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <NuxtLink to="/" class="text-2xl font-bold">Shodiq Arifin</NuxtLink>
            <NavMenu />
            <a
                href="https://buymeacoffee.com/shodiqarifin"
                target="_blank"
                rel="noopener noreferrer"
                class="transition opacity-80 hover:opacity-100"
            >
                <img
                    src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                    alt="Buy Me A Coffee"
                    class="h-8 w-auto"
                />
            </a>
        </div>
    </header>
</template>