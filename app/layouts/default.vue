<template>
    <div class="flex min-h-screen flex-col bg-slate-900 text-white">
        <Header />
        <main class="flex-1">
            <slot />
        </main>
        <Footer />
    </div>
</template>