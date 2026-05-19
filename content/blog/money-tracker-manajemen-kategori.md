---
title: "Money Tracker: Manajemen Kategori"
description: "CRUD Kategori dengan Logic Delete yang Aman"
date: "2024-05-16"
tags: ["project","money tracker","nuxt"]
image: "https://sdqstack.in/images/money-tracker-hero.png"
playlist: "money-tracker"
playlist_order: 6
---

## Apa Yang Kita Bangun

Kategori adalah tulang punggung Money Tracker. Tanpa ini, semua transaksi cuma angka tanpa konteks. Di artikel ini kita build:

- **API routes** — GET, POST, PATCH, DELETE untuk kategori
- **Logic delete yang aman** — hapus kategori tidak boleh menghapus transaksi, harus reassign ke "Uncategorized"
- **Protection system category** — "Uncategorized" tidak boleh bisa diedit atau dihapus
- **UI** — halaman `/categories` dengan kelompok income/expense, tambah, edit, delete
- **Layout** — navbar yang bisa dipakai di semua halaman

Satu hal yang bikin artikel ini menarik: **delete kategori** punya flow yang tidak trivial. Kalau salah handle, bisa bikin data orphaned — transaksi yang tidak punya kategori, yang akan crash kalau di-query dengan JOIN.

---

## Recap: Kenapa Ada `isSystem`

Di artikel schema kita define dua flag:

```typescript
isPreset: integer("is_preset", { mode: "boolean" })  // preset dari signup
isSystem: integer("is_system", { mode: "boolean" })  // tidak boleh diedit/hapus
```

`isPreset` untuk transparansi — user bisa tahu mana yang sistem kasih, mana yang dia buat sendiri. Tapi user **boleh** edit dan hapus preset.

`isSystem` untuk proteksi — ini khusus "Uncategorized". Kalau user hapus "Transportasi" lalu transaksi-transaksinya tidak punya kategori, kita taruh di "Uncategorized" sebagai safety net. Kalau "Uncategorized" sendiri bisa dihapus... ya berarti safety net-nya bolong.

Itu kenapa dua flag, bukan satu.

---

## API Routes

### GET `/api/categories`

List semua kategori user, grouped-nya kita handle di frontend.

`server/api/categories/index.get.ts`:

```typescript
import { eq } from "drizzle-orm"
import { db } from "~~/server/utils/db"
import { categories } from "~~/server/database/schema"
import { getWalletByUserId } from "~~/server/utils/wallet"

export default defineEventHandler(async (event) => {
  const session = event.context.session
  if (!session?.user?.id) throw createError({ statusCode: 401, message: "Unauthorized" })

  const wallet = await getWalletByUserId(session.user.id)

  return db
    .select()
    .from(categories)
    .where(eq(categories.walletId, wallet.id))
    .orderBy(categories.type, categories.name)
})
```

Simpel. Return semua kolom karena kita butuh `isSystem` dan `isPreset` di UI untuk handle tampilan yang berbeda.

`.orderBy(categories.type, categories.name)` — urutkan berdasarkan type (income/expense) dulu, baru nama. Ini bikin grouping di frontend lebih mudah.

---

### POST `/api/categories`

Tambah kategori baru. User tidak bisa buat `isSystem` category — itu hak server waktu signup.

`server/api/categories/index.post.ts`:

```typescript
import { nanoid } from "nanoid"
import { db } from "~~/server/utils/db"
import { categories } from "~~/server/database/schema"
import { getWalletByUserId } from "~~/server/utils/wallet"

export default defineEventHandler(async (event) => {
  const session = event.context.session
  if (!session?.user?.id) throw createError({ statusCode: 401, message: "Unauthorized" })

  const body = await readBody(event)

  if (!body.name || typeof body.name !== "string" || !body.name.trim())
    throw createError({ statusCode: 400, message: "Nama kategori wajib diisi" })
  if (!body.type || !["income", "expense"].includes(body.type))
    throw createError({ statusCode: 400, message: "Type harus income atau expense" })

  const wallet = await getWalletByUserId(session.user.id)

  const newCategory = {
    id: nanoid(),
    walletId: wallet.id,
    name: body.name.trim(),
    type: body.type as "income" | "expense",
    isPreset: false,
    isSystem: false,
  }

  await db.insert(categories).values(newCategory)
  return { success: true, id: newCategory.id }
})
```

Perhatikan `isPreset: false, isSystem: false` selalu di-hardcode di sini. Tidak ada cara user bisa inject `isSystem: true` via request body — server yang control ini.

---

### PATCH `/api/categories/[id]`

Edit nama kategori. Tidak bisa edit `type` — kalau user mau ubah kategori dari expense ke income, lebih masuk akal hapus dan buat baru (ini keputusan UX yang disengaja, biar sederhana).

`server/api/categories/[id].patch.ts`:

```typescript
import { and, eq } from "drizzle-orm"
import { db } from "~~/server/utils/db"
import { categories } from "~~/server/database/schema"
import { getWalletByUserId } from "~~/server/utils/wallet"

export default defineEventHandler(async (event) => {
  const session = event.context.session
  if (!session?.user?.id) throw createError({ statusCode: 401, message: "Unauthorized" })

  const id = getRouterParam(event, "id")
  if (!id) throw createError({ statusCode: 400, message: "Category ID wajib diisi" })

  const body = await readBody(event)
  const wallet = await getWalletByUserId(session.user.id)

  const existing = await db.query.categories.findFirst({
    where: and(eq(categories.id, id), eq(categories.walletId, wallet.id)),
  })
  if (!existing) throw createError({ statusCode: 404, message: "Kategori tidak ditemukan" })

  // Cek: system category tidak boleh diedit
  if (existing.isSystem)
    throw createError({ statusCode: 403, message: "Kategori sistem tidak bisa diubah" })

  if (!body.name || typeof body.name !== "string" || !body.name.trim())
    throw createError({ statusCode: 400, message: "Nama kategori wajib diisi" })

  await db
    .update(categories)
    .set({ name: body.name.trim() })
    .where(eq(categories.id, id))

  return { success: true }
})
```

Kenapa tidak update `type`? Karena kalau user bisa ganti kategori "Transportasi" dari expense ke income, semua transaksi lama di bawah kategori itu tiba-tiba jadi "pemasukan" — itu data corruption dari sisi user. Lebih aman restrict.

---

### DELETE `/api/categories/[id]`

Ini bagian yang paling krusial. Flow-nya:

1. Cek ownership
2. Cek bukan system category
3. Cari "Uncategorized" di wallet yang sama
4. Reassign semua transaksi ke Uncategorized
5. Baru delete kategori

Urutan langkah 4 dan 5 **tidak boleh dibalik**. Kalau delete dulu baru reassign, foreign key constraint akan error karena transaksi masih nunjuk ke `categoryId` yang sudah tidak ada.

`server/api/categories/[id].delete.ts`:

```typescript
import { and, eq } from "drizzle-orm"
import { db } from "~~/server/utils/db"
import { categories, transactions } from "~~/server/database/schema"
import { getWalletByUserId } from "~~/server/utils/wallet"

export default defineEventHandler(async (event) => {
  const session = event.context.session
  if (!session?.user?.id) throw createError({ statusCode: 401, message: "Unauthorized" })

  const id = getRouterParam(event, "id")
  if (!id) throw createError({ statusCode: 400, message: "Category ID wajib diisi" })

  const wallet = await getWalletByUserId(session.user.id)

  // Cek ownership
  const existing = await db.query.categories.findFirst({
    where: and(eq(categories.id, id), eq(categories.walletId, wallet.id)),
  })
  if (!existing) throw createError({ statusCode: 404, message: "Kategori tidak ditemukan" })

  // Proteksi system category
  if (existing.isSystem)
    throw createError({ statusCode: 403, message: "Kategori sistem tidak bisa dihapus" })

  // Cari Uncategorized sebagai target reassign
  const uncategorized = await db.query.categories.findFirst({
    where: and(eq(categories.walletId, wallet.id), eq(categories.isSystem, true)),
  })
  if (!uncategorized)
    throw createError({ statusCode: 500, message: "System category tidak ditemukan" })

  // Reassign dulu, baru delete — urutan ini PENTING
  await db
    .update(transactions)
    .set({ categoryId: uncategorized.id })
    .where(and(eq(transactions.walletId, wallet.id), eq(transactions.categoryId, id)))

  await db.delete(categories).where(eq(categories.id, id))

  return { success: true }
})
```

**Kenapa tidak pakai database transaction (BEGIN/COMMIT)?** Untuk SQLite via libsql, setiap statement dieksekusi secara synchronous dan sequential. Kalau reassign berhasil tapi delete gagal, kita punya transaksi yang nunjuk ke kategori yang masih ada — itu fine, tidak ada data loss. Sebaliknya, kalau delete berhasil tapi reassign tidak jalan (yang mustahil di sini karena delete setelah reassign), baru ada masalah. Jadi untuk use case ini, urutan yang benar sudah cukup tanpa wrapping di database transaction.

---

## Layout: Navbar

Sebelum ke halaman categories, kita butuh navbar yang bisa dipakai di semua halaman yang butuh auth. Kita bikin default layout.

`app/layouts/default.vue`:

```vue
<script setup>
const { signOut, user } = useAuthClient()

async function handleLogout() {
  await signOut()
  await navigateTo("/login")
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white border-b border-gray-100">
      <div class="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <span class="font-bold text-sm">Money Tracker</span>
          <div class="flex gap-4">
            <NuxtLink
              to="/dashboard"
              class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              active-class="text-gray-900 font-medium"
            >
              Dashboard
            </NuxtLink>
            <NuxtLink
              to="/transactions"
              class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              active-class="text-gray-900 font-medium"
            >
              Transaksi
            </NuxtLink>
            <NuxtLink
              to="/categories"
              class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              active-class="text-gray-900 font-medium"
            >
              Kategori
            </NuxtLink>
          </div>
        </div>
        <button
          @click="handleLogout"
          class="text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>

    <main class="max-w-3xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>
```

**Kenapa `active-class` bukan `exact-active-class`?** Di sini kita mau `/categories` aktif hanya saat di route itu persis. `active-class` di Vue Router akan aktif juga untuk nested routes seperti `/categories/123`. Untuk nav sederhana seperti ini tidak ada nested routes, jadi keduanya sama aja — tapi `active-class` lebih straightforward tanpa perlu pikir.

Update `app/app.vue` untuk pakai layout:

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

---

## UI: Halaman Kategori

`app/pages/categories.vue`:

```vue
<script setup>
definePageMeta({ middleware: "auth" })

// Fetch dan state
const { data: categoriesData, refresh } = await useFetch("/api/categories")

const showAddModal = ref(false)
const editingCategory = ref(null)

const form = reactive({
  name: "",
  type: "expense",
})
const formError = ref("")
const submitting = ref(false)

// Computed: group by type
const incomeCategories = computed(
  () => categoriesData.value?.filter((c) => c.type === "income") ?? []
)
const expenseCategories = computed(
  () => categoriesData.value?.filter((c) => c.type === "expense") ?? []
)

function openAddModal(defaultType = "expense") {
  editingCategory.value = null
  form.name = ""
  form.type = defaultType
  formError.value = ""
  showAddModal.value = true
}

function openEditModal(category) {
  editingCategory.value = category
  form.name = category.name
  form.type = category.type
  formError.value = ""
  showAddModal.value = true
}

async function handleSubmit() {
  formError.value = ""
  if (!form.name.trim()) {
    formError.value = "Nama kategori wajib diisi"
    return
  }

  submitting.value = true
  try {
    if (editingCategory.value) {
      await $fetch(`/api/categories/${editingCategory.value.id}`, {
        method: "PATCH",
        body: { name: form.name },
      })
    } else {
      await $fetch("/api/categories", {
        method: "POST",
        body: { name: form.name, type: form.type },
      })
    }
    await refresh()
    showAddModal.value = false
  } catch (e) {
    formError.value = e?.data?.message || "Terjadi kesalahan"
  } finally {
    submitting.value = false
  }
}

async function handleDelete(category) {
  if (!confirm(`Hapus kategori "${category.name}"?\n\nSemua transaksi di kategori ini akan dipindah ke "Uncategorized".`))
    return

  try {
    await $fetch(`/api/categories/${category.id}`, { method: "DELETE" })
    await refresh()
  } catch (e) {
    alert(e?.data?.message || "Gagal hapus kategori")
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Kategori</h1>
      <button
        @click="openAddModal()"
        class="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        + Tambah
      </button>
    </div>

    <!-- Pemasukan -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pemasukan</h2>
        <button
          @click="openAddModal('income')"
          class="text-xs text-gray-400 hover:text-gray-700"
        >
          + Tambah
        </button>
      </div>
      <div class="space-y-2">
        <div
          v-for="cat in incomeCategories"
          :key="cat.id"
          class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl"
        >
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-green-500" />
            <span class="text-sm font-medium">{{ cat.name }}</span>
            <span
              v-if="cat.isSystem"
              class="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"
            >
              System
            </span>
            <span
              v-else-if="cat.isPreset"
              class="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded"
            >
              Preset
            </span>
          </div>
          <div v-if="!cat.isSystem" class="flex gap-1">
            <button
              @click="openEditModal(cat)"
              class="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              @click="handleDelete(cat)"
              class="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
            >
              Hapus
            </button>
          </div>
        </div>

        <div
          v-if="incomeCategories.length === 0"
          class="text-sm text-gray-400 py-3 text-center"
        >
          Belum ada kategori pemasukan
        </div>
      </div>
    </div>

    <!-- Pengeluaran -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pengeluaran</h2>
        <button
          @click="openAddModal('expense')"
          class="text-xs text-gray-400 hover:text-gray-700"
        >
          + Tambah
        </button>
      </div>
      <div class="space-y-2">
        <div
          v-for="cat in expenseCategories"
          :key="cat.id"
          class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl"
        >
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-red-400" />
            <span class="text-sm font-medium">{{ cat.name }}</span>
            <span
              v-if="cat.isSystem"
              class="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"
            >
              System
            </span>
            <span
              v-else-if="cat.isPreset"
              class="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded"
            >
              Preset
            </span>
          </div>
          <div v-if="!cat.isSystem" class="flex gap-1">
            <button
              @click="openEditModal(cat)"
              class="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              @click="handleDelete(cat)"
              class="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
            >
              Hapus
            </button>
          </div>
        </div>

        <div
          v-if="expenseCategories.length === 0"
          class="text-sm text-gray-400 py-3 text-center"
        >
          Belum ada kategori pengeluaran
        </div>
      </div>
    </div>

    <!-- Modal Tambah/Edit -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showAddModal = false"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm mx-4">
        <h2 class="text-lg font-semibold mb-4">
          {{ editingCategory ? "Edit Kategori" : "Tambah Kategori" }}
        </h2>

        <div class="space-y-4">
          <!-- Type selector (hanya saat tambah baru) -->
          <div v-if="!editingCategory">
            <label class="block text-sm font-medium text-gray-700 mb-2">Tipe</label>
            <div class="flex gap-2">
              <button
                @click="form.type = 'income'"
                :class="[
                  'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                  form.type === 'income'
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-white border-gray-200 text-gray-500',
                ]"
              >
                Pemasukan
              </button>
              <button
                @click="form.type = 'expense'"
                :class="[
                  'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                  form.type === 'expense'
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : 'bg-white border-gray-200 text-gray-500',
                ]"
              >
                Pengeluaran
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Contoh: Langganan, Investasi, dll"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              @keyup.enter="handleSubmit"
            />
          </div>

          <p v-if="formError" class="text-sm text-red-500">{{ formError }}</p>
        </div>

        <div class="flex gap-2 mt-6">
          <button
            @click="showAddModal = false"
            class="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            @click="handleSubmit"
            :disabled="submitting"
            class="flex-1 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {{ submitting ? "Menyimpan..." : editingCategory ? "Simpan" : "Tambah" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

Beberapa keputusan UI yang perlu diperhatikan:

**`useFetch` + `refresh()`** — di sini kita pakai `useFetch` karena data kategori perlu di-load saat SSR dan kita butuh fungsi `refresh()` untuk re-fetch setelah mutasi. Berbeda dengan artikel sebelumnya yang pakai `$fetch` manual untuk list transaksi.

**Type selector disabled saat edit** — kalau user edit, type selector tidak ditampilkan. Kita tidak support ganti type via edit karena itu bisa bikin data inkonsisten (semua transaksi lama tiba-tiba pindah kelompok).

**Confirm dialog dengan pesan informatif** — bukan cuma "Yakin hapus?", tapi kasih tahu juga konsekuensinya: transaksi akan dipindah ke Uncategorized. Ini penting biar user tidak kaget.

---

## Gotcha: `useFetch` refresh() vs `$fetch` manual

Di artikel transaksi, kita pakai pattern `$fetch` + fetch ulang manual di composable. Di sini kita pakai `useFetch` + `refresh()`. Dua-duanya valid, kapan pakai yang mana?

**`useFetch` + `refresh()`** cocok kalau:
- Data butuh di-SSR (load di server sebelum kirim ke browser)
- Data tidak perlu state management yang complex
- Mutasi simple: setelah berhasil, cukup refresh seluruh list

**`$fetch` + manual state management** cocok kalau:
- Data tidak perlu SSR, bisa client-only
- Perlu optimistic update (update UI sebelum server response)
- Perlu kontrol lebih detail atas loading state per action

Untuk kategori, `useFetch` lebih simple dan cukup.

---

## Gotcha: Kenapa Tidak Pakai `watch` untuk Auto-Refresh

Mungkin terpikirkan: "kenapa tidak watch route dan auto-refresh kalau kembali ke halaman ini?" Itu over-engineering untuk Phase 1. Refresh manual setelah mutasi sudah cukup — kita tidak perlu real-time sync di fase ini.

---

## Testing Flow

Checklist sebelum lanjut ke artikel dashboard:

1. **Lihat daftar kategori** — buka `/categories`, harusnya ada preset + Uncategorized
2. **Tambah kategori** — klik tambah, isi nama + pilih tipe, submit. Cek muncul di list.
3. **Edit kategori** — klik edit, ubah nama, simpan. Cek terupdate.
4. **Edit system category** — coba klik edit "Uncategorized" — tombol tidak ada, tidak bisa
5. **Hapus kategori** — hapus salah satu preset. Cek hilang dari list.
6. **Validasi reassign** — masuk Drizzle Studio, cek transaksi yang pakai kategori yang dihapus sudah pindah ke Uncategorized
7. **Hapus system category via API langsung** — `DELETE /api/categories/{id-uncategorized}` harusnya return 403

---

## Struktur File Setelah Artikel Ini

```
server/
└── api/
    └── categories/
        ├── index.get.ts    ← baru
        ├── index.post.ts   ← baru
        ├── [id].patch.ts   ← baru
        └── [id].delete.ts  ← baru

app/
├── layouts/
│   └── default.vue         ← baru (navbar)
├── pages/
│   └── categories.vue      ← baru
└── app.vue                 ← update (NuxtLayout wrapper)
```

---

## Langkah Selanjutnya

Artikel selanjutnya: **Dashboard**

Transaksi ada. Kategori ada. Sekarang kita build halaman yang bikin semua ini berguna: dashboard dengan aggregasi SQL, summary stats bulan ini vs semua waktu, dan top 5 kategori pengeluaran.

---

## Resources

- [Drizzle ORM — Update](https://orm.drizzle.team/docs/update)
- [Nuxt — useFetch](https://nuxt.com/docs/api/composables/use-fetch)
- [Nuxt — Layouts](https://nuxt.com/docs/guide/directory-structure/layouts)

---

**Status:** ✅ Siap  

**Artikel Selanjutnya:** [Dashboard](https://sdqstack.in/blog/money-tracker-dashboard)