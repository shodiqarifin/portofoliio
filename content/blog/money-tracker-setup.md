---
title: "Money Tracker: Setup"
description: "Setup Nuxt 4 + Tailwind CSS v4 + Drizzle ORM + SQLite + Better Auth"
date: "2024-05-12"
tags: ["project","money tracker","nuxt"]
image: "https://sdqstack.in/images/money-tracker-hero.png"
playlist: "money-tracker"
playlist_order: 2
---

## Apa Yang Kita Setup

Sebelum bisa nulis satu baris code aplikasi, ada infrastruktur yang perlu berdiri dulu. Artikel ini khusus untuk itu — inisialisasi proyek, install semua dependencies, dan organisir struktur folder yang akan kita pakai sepanjang seri ini.

Tidak ada fitur yang dibangun di sini. Tapi keputusan yang dibuat di artikel ini akan terasa dampaknya di setiap artikel berikutnya.

------

## Prerequisites

- **Node.js 20+** — cek dengan `node -v`
- **npm** — sudah bundled bersama Node.js, tidak perlu install terpisah

------

## Inisialisasi Proyek

```bash
npm create nuxt@latest money-tracker
cd money-tracker
```

Saat CLI nanya, pilih `npm` sebagai package manager dan `Yes` untuk git init. Skip bagian modules — kita install manual supaya tahu persis apa yang masuk.

------

## Struktur Folder

Nuxt 4 memperkenalkan satu perubahan yang cukup signifikan dari versi 3: semua application code sekarang tinggal di dalam folder `app/`.

```
money-tracker/
├── app/                  ← semua app code (pages, components, composables)
├── server/               ← API routes, database, utilities
├── lib/                  ← shared config (auth, dsb)
├── data/                 ← SQLite database file (gitignored)
├── public/
├── nuxt.config.ts
└── .env
```

Alasannya praktis: sebelumnya semua file bercampur di root — Vue components, config files, `node_modules`, `.git`. File watcher jadi lambat karena harus scan semua itu. Dengan `app/`, Nuxt tahu persis mana yang application code dan mana yang bukan.

Satu hal yang perlu diingat: di Nuxt 4, alias `~` dan `@` resolve ke dalam `app/`, bukan ke root project. Kalau perlu import sesuatu dari luar `app/` (misalnya `lib/auth.ts`), pakai `~~` atau `@@`.

Di dalam `server/`, strukturnya:

```
server/
├── api/
│   └── auth/
│       └── [...all].ts
├── database/
│   ├── schema.ts
│   └── migrations/
└── utils/
    └── db.ts
```

------

## Tailwind CSS v4

Tailwind v4 setup-nya beda dari v3. Tidak ada lagi `tailwind.config.js` dan tidak ada lagi `@tailwind base; @tailwind components; @tailwind utilities`. Semuanya disederhanakan.

```bash
npm install tailwindcss @tailwindcss/vite
```

Buat file CSS:

```bash
mkdir -p app/assets/css
```

`app/assets/css/main.css`:

```css
@import "tailwindcss";
```

Satu baris itu cukup. Tailwind v4 otomatis scan semua file dalam project untuk utility classes yang dipakai.

`nuxt.config.ts`:

```typescript
import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
})
```

------

## Drizzle ORM + SQLite

Drizzle butuh dua packages: runtime dan CLI untuk migrations.

```bash
npm install drizzle-orm @libsql/client
npm install -D drizzle-kit
```

Kita pakai `@libsql/client` sebagai driver — ini adalah libSQL, fork open-source dari SQLite yang dibuat oleh tim Turso. Alasan kita pilih ini dibanding `better-sqlite3`:

- **Pure JavaScript, tidak ada native binary** — `better-sqlite3` punya native `.node` bindings yang tidak kompatibel dengan ESM bundling Nitro (Nuxt server). Hasilnya error `require is not defined` yang susah di-debug. `@libsql/client` tidak punya masalah ini.
- **Drizzle support natively** — API-nya identik dari sisi developer, tinggal beda import path.
- **Upgrade path ke Turso** — kalau suatu saat mau deploy database ke Turso (edge-hosted SQLite), tinggal ganti URL dan tambah auth token. Tidak ada perubahan code lain.

**Koneksi database** — `server/utils/db.ts`:

```typescript
import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import { resolve } from "node:path"
import * as schema from "../database/schema"

const dbPath = resolve(process.cwd(), "data/money-tracker.db")

const client = createClient({
  url: `file:${dbPath}`,
})

// SQLite tidak enforce FK constraints by default — ini aktifkan cascades dan violation checks
client.execute("PRAGMA foreign_keys = ON")

export const db = drizzle(client, { schema })
```

Ada tiga hal yang perlu diperhatikan di sini:

**`resolve(process.cwd(), ...)`** — kita tidak pakai relative path langsung (`"file:./data/..."`) karena working directory saat Nuxt/Nitro jalan bisa berbeda tergantung bagaimana server di-start. `resolve(process.cwd(), ...)` selalu menghasilkan absolute path dari root project, lebih predictable.

**`PRAGMA foreign_keys = ON`** — ini yang paling sering kelewat. SQLite secara default tidak enforce foreign key constraints sama sekali — `onDelete: "cascade"` di schema Drizzle hanya menghasilkan SQL yang benar di migration file, tapi tidak dieksekusi di runtime tanpa pragma ini. Tanpa baris ini, hapus user tidak akan cascade hapus wallets dan transactions miliknya.

Kenapa tidak perlu `await`? libsql mengantri operasi secara berurutan — pragma pasti selesai sebelum query apapun dieksekusi setelahnya.

**prefix `file:`** sebelum path database tetap wajib untuk libsql — tanpa prefix ini, libsql default ke in-memory database yang data-nya hilang setiap kali server restart.

**Drizzle config** — `drizzle.config.ts` di root:

```typescript
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  schema: "./server/database/schema.ts",
  out: "./server/database/migrations",
  dbCredentials: {
    url: "file:./data/money-tracker.db",
  },
})
```

**Scripts** di `package.json`:

```json
{
  "scripts": {
      ...
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

`db:push` langsung apply schema ke database tanpa bikin migration file — berguna saat masih iterasi schema di development. `db:generate` + `db:migrate` adalah flow yang proper untuk perubahan yang perlu di-track.

Untuk sekarang, buat placeholder dulu:

```bash
mkdir -p server/database data
touch server/database/schema.ts
echo "data/*.db" >> .gitignore
```

`server/database/schema.ts` cukup diisi:

```typescript
// Schema diisi di artikel berikutnya
export {}
```

------

## Better Auth

```bash
npm install better-auth --legacy-peer-deps
```

Generate secret key:

```bash
npx @better-auth/cli secret
```

`.env`:

```
BETTER_AUTH_SECRET=hasil_generate_tadi
BETTER_AUTH_URL=http://localhost:3000
```

Tambahkan `.env` ke `.gitignore`.

**Auth instance** — `lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../server/utils/db"
import * as schema from "../server/database/schema"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { ...schema },
  }),
  emailAndPassword: {
    enabled: true,
  },
})
```

**API handler** — `server/api/auth/[...all].ts`:

```typescript
import { auth } from "~~/lib/auth"

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event))
})
```

`~~` di sini bukan typo. Karena `lib/auth.ts` ada di root project (bukan di dalam `app/`), kita perlu `~~` supaya Nuxt resolve ke root, bukan ke dalam `app/`.

------

## nuxt.config.ts Final

```typescript
import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    betterAuthUrl: process.env.BETTER_AUTH_URL,
  },
})
```

------

## Setup app.vue dan Halaman Placeholder

Ini langkah yang sering kelewat di tutorial lain, tapi kalau tidak dilakukan Nuxt akan throw warning di setiap request:

```
[Vue Router warn]: No match found for location with path "/"
[nuxt] Your project has pages but the <NuxtPage /> component has not been used.
```

Root cause-nya: begitu ada folder `app/pages/`, Nuxt aktifkan vue-router. Tapi `app.vue` default yang di-generate Nuxt tidak pakai `<NuxtPage />` — masih ada boilerplate lama. Kita perlu update manual.

**Update `app/app.vue`:**

```vue
<template>
  <NuxtPage />
</template>
```

Ini yang memberitahu Nuxt "render halaman aktif di sini". Tanpa ini, semua pages yang kita buat tidak akan pernah ditampilkan meskipun route-nya terdaftar.

**Buat `app/pages/index.vue` sebagai placeholder:**

```bash
mkdir -p app/pages
```

`app/pages/index.vue`:

```vue
<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold">Money Tracker</h1>
    <p class="text-gray-500 mt-2">Dashboard coming soon.</p>
  </div>
</template>
```

Halaman ini bersifat sementara — nanti di artikel Dashboard akan diganti dengan konten yang proper. Tapi keberadaannya sekarang mencegah warning dan memastikan routing sudah berjalan benar.

------

## Jalankan

```bash
npm run dev
```

`localhost:3000` harusnya muncul tanpa warning router. Kalau muncul tulisan "Money Tracker — Dashboard coming soon", setup selesai.

------

## Langkah Selanjutnya

Artikel selanjutnya: **Database Schema**

Kita design semua tabel — users, wallets, categories, transactions — langsung dengan keputusan yang sudah dibuat di planning. Termasuk kenapa `Uncategorized` perlu ada sebagai system category dan gimana kita modelkan relasi antar tabel.

------

## Resources

- [Nuxt 4 Docs](https://nuxt.com/docs/4.x)
- [Tailwind CSS v4 — Install with Nuxt](https://tailwindcss.com/docs/installation/framework-guides/nuxt)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Better Auth — Nuxt Integration](https://better-auth.com/docs/integrations/nuxt)

------

**Status:** ✅ Siap 

**Artikel Selanjutnya:** [Database Schema](https://sdqstack.in/blog/money-tracker-database-schema)