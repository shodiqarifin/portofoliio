---
title: "Money Tracker: Autentikasi dengan Better Auth"
description: "Signup, Login, dan Auto-Setup Data User"
date: "2026-05-14"
tags: ["project","money tracker","nuxt"]
image: "https://sdqstack.in/images/money-tracker-hero.png"
playlist: "money-tracker"
playlist_order: 4
---

## Apa Yang Kita Bangun

Di artikel sebelumnya kita sudah install Better Auth dan tulis schema-nya. Tapi belum ada yang bisa dilakukan user — tidak ada halaman login, tidak ada halaman signup, dan tidak ada logic yang jalan saat user baru mendaftar.

Artikel ini melengkapi semua itu:

- **Better Auth client** — setup di sisi Nuxt supaya bisa dipanggil dari Vue component
- **Halaman signup & login** — form yang terhubung ke Better Auth
- **Auto-setup saat signup** — create wallet + Uncategorized category + preset categories otomatis
- **Route middleware** — protect halaman yang butuh login, redirect kalau belum auth

Setelah artikel ini, user bisa signup, login, dan langsung punya wallet dengan kategori siap pakai.

------

## Better Auth Client

Better Auth punya dua sisi: **server** (sudah kita setup di `lib/auth.ts`) dan **client** (yang dipanggil dari Vue component untuk signup, login, logout).

Buat `lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/vue"

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
})

export const { signIn, signUp, signOut, useSession } = authClient
```

Kenapa file terpisah dari `lib/auth.ts`? Karena `lib/auth.ts` adalah server-side config yang import database dan dijalankan di Nitro. `lib/auth-client.ts` adalah client-side yang dijalankan di browser. Kalau dicampur, Nuxt akan error saat bundling karena database driver tidak bisa jalan di browser.

`useSession` adalah composable Vue yang reaktif — dia watch session state dan auto-update kalau user login atau logout.

------

## Auto-Setup Saat User Signup

Ini bagian yang paling krusial dan paling sering tidak dibahas tutorial lain.

Ketika user baru signup, kita perlu otomatis:

1. Buat wallet pribadi untuk user tersebut
2. Buat dua kategori "Uncategorized" (satu per type: income dan expense)
3. Buat preset categories (Gaji, Transportasi, dll)

Tanpa ini, user yang baru signup tidak punya wallet — dan semua API transaksi kita akan gagal karena `getWalletByUserId` tidak menemukan apa-apa.

Better Auth punya hook `after` yang jalan setelah event tertentu. Kita pakai `user.create` untuk trigger setup ini.

Update `lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth"
import { createAuthMiddleware } from "better-auth/api"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../server/utils/db"
import * as schema from "../server/database/schema"
import { nanoid } from "nanoid"
import { eq } from "drizzle-orm"

const PRESET_CATEGORIES = [
  { name: "Gaji / Income", type: "income" as const },
  { name: "Bonus / Extra Income", type: "income" as const },
  { name: "Transportasi", type: "expense" as const },
  { name: "Makan & Minum", type: "expense" as const },
  { name: "Hiburan", type: "expense" as const },
  { name: "Belanja Kebutuhan", type: "expense" as const },
  { name: "Kesehatan", type: "expense" as const },
]

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Hanya jalan saat signup email, dan hanya kalau ada session baru
      if (!ctx.path.startsWith("/sign-up/email")) return
      const userId = ctx.context.newSession?.user?.id
      if (!userId) return

      // Cek apakah wallet sudah ada (idempotent)
      const existingWallet = await db.query.wallets.findFirst({
        where: eq(schema.wallets.userId, userId),
      })
      if (existingWallet) return

      const walletId = nanoid()

      // Semua insert dibungkus db.transaction() — kalau salah satu gagal, semua rollback
      await db.transaction(async (tx) => {
        // 1. Buat wallet
        await tx.insert(schema.wallets).values({
          id: walletId,
          userId,
          name: "My Wallet",
          type: "personal",
        })

        // 2. Buat dua system categories — satu per type
        // Penting: harus income DAN expense, bukan cuma expense.
        // Kalau cuma expense, transaksi income yang categorynya dihapus
        // akan corrupt jadi expense — balance langsung salah total.
        await tx.insert(schema.categories).values([
          { id: nanoid(), walletId, name: "Uncategorized", type: "income", isPreset: false, isSystem: true },
          { id: nanoid(), walletId, name: "Uncategorized", type: "expense", isPreset: false, isSystem: true },
        ])

        // 3. Buat preset categories
        await tx.insert(schema.categories).values(
          PRESET_CATEGORIES.map((cat) => ({
            id: nanoid(),
            walletId,
            name: cat.name,
            type: cat.type,
            isPreset: true,
            isSystem: false,
          }))
        )
      })
    }),
  },
})
```

Beberapa hal yang perlu diperhatikan:

**Format `hooks.after`** — harus berupa single `createAuthMiddleware`, bukan array. Di dalam satu middleware itu kita branch pakai `if (ctx.path.startsWith(...))`. Ini yang bikin banyak orang salah karena format array dengan `matcher` + `handler` itu hanya untuk internal plugin, bukan untuk top-level `hooks` config.

**Kenapa ada cek `existingWallet`?** Hook ini bisa terpanggil lebih dari sekali dalam kondisi tertentu (misalnya retry). Dengan cek ini, setup tidak akan duplikat meskipun hook jalan dua kali — ini disebut idempotent.

**`ctx.context.newSession?.user?.id`** — ini cara akses user ID dari dalam hook after. `newSession` adalah session yang baru dibuat Better Auth setelah signup berhasil.

**Kenapa tidak pakai `databaseHooks.user.create.after`?** Karena `databaseHooks` jalan di dalam database transaction Better Auth yang belum commit. Kalau kita insert wallet di sana, ada risiko foreign key constraint error karena user belum benar-benar tersimpan. `hooks.after` jalan setelah response dikirim, jadi lebih aman.

**Kenapa dibungkus `db.transaction()`?** Kalau proses terganggu di tengah — misalnya server crash setelah wallet dibuat tapi sebelum categories selesai — wallet akan ada tapi tidak punya system categories. User bisa login tapi semua operasi kategori akan error. Dengan `db.transaction()`, kalau salah satu step gagal, semua otomatis di-rollback.

------

## Halaman Signup

Buat `app/pages/signup.vue`:

```vue
<script setup>
definePageMeta({ auth: false })

const { signUp } = useAuthClient()

const form = reactive({
  name: "",
  email: "",
  password: "",
})
const error = ref("")
const loading = ref(false)

async function handleSignup() {
  error.value = ""

  if (!form.name || !form.email || !form.password) {
    error.value = "Semua field wajib diisi"
    return
  }
  if (form.password.length < 8) {
    error.value = "Password minimal 8 karakter"
    return
  }

  loading.value = true
  const { error: authError } = await signUp.email({
    name: form.name,
    email: form.email,
    password: form.password,
  })
  loading.value = false

  if (authError) {
    error.value = authError.message || "Signup gagal, coba lagi"
    return
  }

  await navigateTo("/")
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <h1 class="text-xl font-bold mb-6">Buat Akun</h1>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Nama kamu"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="email@kamu.com"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="Minimal 8 karakter"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <button
          @click="handleSignup"
          :disabled="loading"
          class="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {{ loading ? "Memproses..." : "Daftar" }}
        </button>
      </div>

      <p class="text-center text-sm text-gray-500 mt-6">
        Sudah punya akun?
        <NuxtLink to="/login" class="text-black font-medium hover:underline">Login</NuxtLink>
      </p>
    </div>
  </div>
</template>
```

------

## Halaman Login

Buat `app/pages/login.vue`:

```vue
<script setup>
definePageMeta({ auth: false })

const { signIn } = useAuthClient()

const form = reactive({
  email: "",
  password: "",
})
const error = ref("")
const loading = ref(false)

async function handleLogin() {
  error.value = ""

  if (!form.email || !form.password) {
    error.value = "Email dan password wajib diisi"
    return
  }

  loading.value = true
  const { error: authError } = await signIn.email({
    email: form.email,
    password: form.password,
  })
  loading.value = false

  if (authError) {
    error.value = "Email atau password salah"
    return
  }

  await navigateTo("/")
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <h1 class="text-xl font-bold mb-6">Login</h1>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="email@kamu.com"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="Password kamu"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            @keyup.enter="handleLogin"
          />
        </div>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <button
          @click="handleLogin"
          :disabled="loading"
          class="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {{ loading ? "Memproses..." : "Login" }}
        </button>
      </div>

      <p class="text-center text-sm text-gray-500 mt-6">
        Belum punya akun?
        <NuxtLink to="/signup" class="text-black font-medium hover:underline">Daftar</NuxtLink>
      </p>
    </div>
  </div>
</template>
```

------

## Composable: useAuthClient

Kedua halaman di atas pakai `useAuthClient()` — tapi composable ini belum ada. Kita buat supaya bisa dipakai di semua component tanpa import manual.

Buat `app/composables/useAuthClient.ts`:

```typescript
import { signIn, signOut, signUp, useSession } from "~~/lib/auth-client"

export function useAuthClient() {
  const session = useSession()

  return {
    signIn,
    signUp,
    signOut,
    session,
    user: computed(() => session.value?.data?.user ?? null),
    isLoggedIn: computed(() => !!session.value?.data?.user),
  }
}
```

`~~` lagi karena `lib/auth-client.ts` ada di root, bukan di dalam `app/`.

`user` dan `isLoggedIn` adalah computed yang derived dari session — berguna untuk kondisional di template (`v-if="isLoggedIn"`).

------

## Route Middleware: Auth Guard

Sekarang halaman signup dan login sudah ada, tapi halaman `/transactions` masih bisa diakses tanpa login (akan dapat "Unauthorized" dari API, tapi halamannya tetap render). Kita perlu redirect user yang belum login.

Buat `app/middleware/auth.ts`:

```typescript
export default defineNuxtRouteMiddleware(async () => {
  const { isLoggedIn } = useAuthClient()

  if (!isLoggedIn.value) {
    return navigateTo("/login")
  }
})
```

Middleware ini belum otomatis jalan di semua halaman. Ada dua cara pakainya:

**Cara 1 — Per halaman** (lebih explicit, kita pakai ini):

```vue
<script setup>
definePageMeta({
  middleware: "auth",
})
</script>
```

**Cara 2 — Global** (semua halaman protected kecuali yang di-exclude):

Ganti nama file jadi `app/middleware/auth.global.ts` — Nuxt akan otomatis jalankan di setiap navigasi.

Untuk Money Tracker, kita pakai Cara 1 karena `/login` dan `/signup` memang harus bisa diakses tanpa login. Kalau pakai global, kita perlu logic tambahan untuk exclude kedua halaman itu.

Tambahkan middleware di `app/pages/transactions.vue` (dan semua halaman protected lainnya nanti):

```vue
<script setup>
definePageMeta({
  middleware: "auth",
})

// ... sisa script
</script>
```

------

## Update index.vue — Redirect Berdasarkan Auth State

Placeholder `index.vue` kita perlu diupdate supaya redirect user ke tempat yang tepat:

```vue
<script setup>
const { isLoggedIn } = useAuthClient()

// Kalau sudah login → ke dashboard (nanti diganti dengan dashboard proper)
// Kalau belum login → ke login
if (isLoggedIn.value) {
  await navigateTo("/transactions")
} else {
  await navigateTo("/login")
}
</script>

<template>
  <div></div>
</template>
```

Ini bersifat sementara — di artikel Dashboard nanti, `/` akan jadi halaman dashboard yang proper, bukan redirect.

------

## Gotcha: Better Auth Client Tidak Throw Error

Ini yang paling sering bikin bug diam-diam, dan kode kita di atas sudah menggunakan pola yang benar — tapi penting untuk dipahami kenapa.

`signIn.email()` dan `signUp.email()` dari Better Auth client **tidak pernah throw exception**. Mereka selalu return `{ data, error }`. Kalau elu wrap dengan `try/catch`, block `catch` tidak akan pernah jalan — error ditelan diam-diam, user gak dapat feedback apapun.

```typescript
// ❌ SALAH — catch tidak pernah jalan
try {
  await signIn.email({ email, password })
  await navigateTo("/")
} catch (e) {
  error.value = "Email atau password salah" // ini tidak pernah jalan
}

// ✅ BENAR — destructure dan cek error
const { error: authError } = await signIn.email({ email, password })
if (authError) {
  error.value = "Email atau password salah"
  return
}
await navigateTo("/")
```

------

## Gotcha: Session Timing di Middleware

Ada satu masalah yang mungkin elu temui: setelah signup atau login, redirect ke `/` jalan, tapi middleware langsung redirect balik ke `/login` karena session belum ter-load.

Root cause-nya: `useSession` dari Better Auth butuh satu network request untuk fetch session dari server. Kalau middleware jalan sebelum request itu selesai, `isLoggedIn` masih `false`.

Fix-nya adalah tunggu session selesai di-fetch sebelum check. Kita pakai `until()` dari `@vueuse/core`:

```typescript
// app/middleware/auth.ts
import { until } from "@vueuse/core"

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const { session } = useAuthClient()

  await until(session).toMatch((s) => !!s && !s.isPending, {
    timeout: 5000,
    throwOnTimeout: false,
  })

  if (!session.value?.data?.user) {
    return navigateTo("/login")
  }
})
```

`until` tunggu sampai kondisi terpenuhi atau timeout. `throwOnTimeout: false` penting — kalau session tidak resolve dalam 5 detik (misalnya network lambat), kita tetap lanjutkan dan cek session state yang ada, bukan crash.

------

## Testing Flow

Sekarang baru bisa test end-to-end:

1. **Buka `localhost:3000`** → harusnya redirect ke `/login`

2. **Klik "Daftar"** → ke halaman signup

3. **Isi form signup** → submit → redirect ke `/transactions`

4. **Cek database** via `npm run db:studio` → tabel `users`, `wallets`, `categories` harusnya sudah ada data. Di tabel `categories`, harusnya ada 9 baris: 2 system categories (`Uncategorized` income + expense) + 7 preset categories

5. **Logout** (belum ada tombol logout — bisa test via console):

   ```javascript
   // Di browser consoleawait $fetch("/api/auth/sign-out", { method: "POST" })
   ```

6. **Refresh** → harusnya redirect ke `/login` lagi

7. **Login** dengan akun yang tadi dibuat → redirect ke `/transactions`

Kalau semua flow jalan, autentikasi sudah solid.

------

## Struktur File Setelah Artikel Ini

```
lib/
├── auth.ts           ← updated (tambah hooks)
└── auth-client.ts    ← baru

app/
├── composables/
│   └── useAuthClient.ts  ← baru
├── middleware/
│   └── auth.ts           ← baru
└── pages/
    ├── index.vue         ← updated (redirect logic)
    ├── login.vue         ← baru
    ├── signup.vue        ← baru
    └── transactions.vue  ← updated (tambah middleware)
```

------

## Langkah Selanjutnya

Artikel selanjutnya: **Transaction CRUD**

Auth sudah jalan, wallet sudah ada, kategori sudah ada. Sekarang kita build fitur inti: tambah, lihat, edit, dan hapus transaksi.

------

## Resources

- [Better Auth — Vue Integration](https://better-auth.com/docs/integrations/vue)
- [Better Auth — Hooks](https://better-auth.com/docs/concepts/hooks)
- [Nuxt — Route Middleware](https://nuxt.com/docs/guide/directory-structure/middleware)
- [VueUse — until](https://vueuse.org/shared/until/)

------

**Status:** ✅ Siap 

**Artikel Selanjutnya:** [Transaction CRUD](https://sdqstack.in/blog/money-tracker-transaction-crud)