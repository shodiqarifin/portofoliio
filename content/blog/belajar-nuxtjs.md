---
title: "Belajar NuxtJS dari Nol: Panduan Lengkap untuk Pemula"
description: "NuxtJS adalah framework Vue yang powerful untuk membangun aplikasi web modern. Pelajari cara memulai dari instalasi hingga deployment."
date: "2024-03-15"
tags: ["nuxtjs", "vue", "javascript"]
image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80"
---

## Apa itu NuxtJS?

NuxtJS adalah framework berbasis Vue.js yang dirancang untuk membuat pengembangan aplikasi web lebih mudah dan efisien. Framework ini menyediakan struktur yang terorganisir dan berbagai fitur built-in seperti Server-Side Rendering (SSR), Static Site Generation (SSG), dan file-based routing.

## Mengapa Memilih NuxtJS?

Ada beberapa alasan kuat untuk memilih NuxtJS sebagai framework utama:

### 1. File-Based Routing

NuxtJS secara otomatis membuat routes berdasarkan struktur folder di direktori `pages/`. Tidak perlu konfigurasi manual:

```
pages/
├── index.vue      → /
├── about.vue      → /about
└── blog/
    ├── index.vue  → /blog
    └── [slug].vue → /blog/:slug
```

### 2. Server-Side Rendering (SSR)

SSR memungkinkan halaman di-render di server sebelum dikirim ke browser. Manfaatnya:
- **SEO lebih baik** — mesin pencari bisa membaca konten dengan mudah
- **Performa awal lebih cepat** — user melihat konten lebih cepat
- **User experience lebih baik** — tidak ada blank screen saat loading

### 3. Auto Import

NuxtJS secara otomatis mengimport komponen, composables, dan utilities. Tidak perlu menulis import statement secara manual:

```vue
<script setup>
// Tidak perlu: import { ref } from 'vue'
// Tidak perlu: import MyComponent from '~/components/MyComponent.vue'

const count = ref(0)
</script>

<template>
  <MyComponent />
</template>
```

## Instalasi NuxtJS

Untuk memulai project NuxtJS baru:

```bash
npx nuxi@latest init my-project
cd my-project
npm install
npm run dev
```

## Struktur Folder NuxtJS

```
my-project/
├── app/
│   ├── pages/          # Halaman-halaman aplikasi
│   ├── components/     # Komponen reusable
│   ├── layouts/        # Layout wrapper
│   └── composables/    # Logic reusable
├── content/            # File konten (markdown, json)
├── public/             # File statis
└── nuxt.config.ts      # Konfigurasi NuxtJS
```

## Membuat Halaman Pertama

Buat file `app/pages/index.vue`:

```vue
<script setup lang="ts">
useHead({
  title: 'Halaman Utama',
  meta: [
    { name: 'description', content: 'Selamat datang di aplikasi NuxtJS saya' }
  ]
})
</script>

<template>
  <div>
    <h1>Selamat Datang!</h1>
    <p>Ini adalah halaman pertama NuxtJS saya.</p>
  </div>
</template>
```

## Kesimpulan

NuxtJS adalah pilihan excellent untuk membangun aplikasi Vue yang modern. Dengan fitur-fitur seperti SSR, auto-import, dan file-based routing, produktivitas pengembangan meningkat secara signifikan. Mulailah dengan project kecil dan secara bertahap eksplorasi fitur-fitur yang lebih advanced.
