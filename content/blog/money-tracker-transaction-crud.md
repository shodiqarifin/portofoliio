---
title: "Money Tracker: Transaction CRUD"
description: "Tambah, Lihat, Edit, Hapus Transaksi dengan Nuxt + Drizzle"
date: "2024-05-15"
tags: ["project","money tracker","nuxt"]
image: "https://sdqstack.in/images/money-tracker-hero.png"
---

## Apa Yang Kita Bangun

Artikel ini yang paling banyak moving parts. Kita build:

- **API routes** — POST, GET, PATCH, DELETE untuk transaksi
- **Auth middleware** — protect semua routes, pastikan user hanya akses data mereka sendiri
- **Server-side validation** — validasi input sebelum masuk database
- **UI** — halaman `/transactions` dengan list, form tambah, edit, dan delete

Setelah artikel ini, kita punya fitur core yang bisa dipakai: catat transaksi, lihat, edit, hapus.

------

## Setup: ID Generation

Schema kita pakai `text` untuk semua ID. Kita perlu cara generate string ID yang unik.

```bash
npm install nanoid
```

Kenapa `nanoid`? Collision-resistant, URL-safe, bundle size kecil (1.3kB), dan sudah widely battle-tested. Ukuran default 21 karakter cukup untuk kebutuhan kita — probabilitas collision-nya secara praktis nol.

Alternatif yang juga valid: `cuid2` (lebih readable, ada timestamp embedded) atau `crypto.randomUUID()` (built-in Node, tidak butuh install). Gua pilih `nanoid` karena familiar dan simple.

------

## Auth Middleware

Sebelum nulis satu API route pun, kita perlu middleware yang verify user sudah login. Kalau tidak ada ini, siapapun bisa hit endpoint kita.

Buat file `server/middleware/auth.ts`:

```typescript
import { auth } from "~~/lib/auth"
import { fromNodeHeaders } from "better-auth/node"

export default defineEventHandler(async (event) => {
  // Skip untuk Better Auth routes sendiri
  if (event.path.startsWith("/api/auth")) return

  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(event.node.req.headers),
    })
    event.context.session = session
  } catch {
    event.context.session = null
  }
})
```

Dua hal penting di sini:

**Guard `/api/auth`** — kalau tidak ada ini, middleware akan jalan saat Better Auth handle route-nya sendiri (login, logout, dll), yang bisa bikin circular issue. Route auth perlu bypass.

**`fromNodeHeaders`** — Nitro event headers tidak selalu dalam format yang Better Auth expect. `fromNodeHeaders` konversi dari Node.js `IncomingHttpHeaders` ke format `Headers` standar. Tanpa ini bisa dapat error parsing headers yang aneh.

Middleware ini jalan di setiap request. Kita tidak langsung reject di sini — kita simpan session ke `event.context` supaya tiap route bisa akses. Pattern ini lebih fleksibel daripada block langsung di middleware — ada beberapa routes yang mungkin public (misalnya health check) yang tidak perlu auth.

Nah, pengecekan auth-nya sendiri ditaruh **di awal setiap route handler yang butuh proteksi**. Bukan file baru — ini baris pertama yang kita tulis di dalam `defineEventHandler` di setiap API route. Contohnya di `index.get.ts`:

```typescript
export default defineEventHandler(async (event) => {
  // ← auth check selalu di sini, paling atas handler
  const session = event.context.session
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized" })
  }
  const userId = session.user.id

  // ... sisa logic route di bawahnya
})
```

Middleware sudah attach session ke `event.context.session` — handler tinggal baca dari sana dan throw 401 kalau kosong (user belum login atau session expired). Nanti di setiap route yang kita tulis, elu bakal lihat pola yang sama ini selalu ada di baris pertama.

------

## Helper: Get Wallet by User

Hampir semua query kita butuh `walletId` dari user yang sedang login. Buat utility kecil di `server/utils/wallet.ts`:

```typescript
import { eq } from "drizzle-orm"
import { db } from "./db"
import { wallets } from "../database/schema"

export async function getWalletByUserId(userId: string) {
  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  })

  if (!wallet) {
    throw createError({ statusCode: 404, message: "Wallet not found" })
  }

  return wallet
}
```

Kenapa di-extract ke utility? Karena kita akan pakai ini di transaction routes, category routes, dan dashboard routes. DRY.

------

## API Routes

### GET `/api/transactions`

List semua transaksi user, newest first.

`server/api/transactions/index.get.ts`:

```typescript
import { desc, eq } from "drizzle-orm"
import { db } from "~~/server/utils/db"
import { transactions, categories } from "~~/server/database/schema"
import { getWalletByUserId } from "~~/server/utils/wallet"

export default defineEventHandler(async (event) => {
  const session = event.context.session
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized" })
  }

  const wallet = await getWalletByUserId(session.user.id)

  const result = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      description: transactions.description,
      date: transactions.date,
      createdAt: transactions.createdAt,
      category: {
        id: categories.id,
        name: categories.name,
        type: categories.type,
      },
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.walletId, wallet.id))
    .orderBy(desc(transactions.date))

  return result
})
```

Beberapa hal yang perlu diperhatikan:

**`leftJoin` bukan `innerJoin`** — secara teori `categoryId` selalu ada (not null di schema), tapi kita defensive. Kalau suatu saat ada data inconsistency, `innerJoin` akan bikin row itu invisible. `leftJoin` lebih aman, kita bisa tahu ada masalah dari response.

**Explicit select** — bukan `select *`. Ini penting karena:

1. Kita tidak mau leak kolom internal yang tidak perlu ke client
2. Drizzle type inference lebih akurat kalau kita explicit
3. Lebih mudah audit apa yang keluar dari API

------

### POST `/api/transactions`

Tambah transaksi baru.

`server/api/transactions/index.post.ts`:

```typescript
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db } from "~~/server/utils/db"
import { transactions, categories } from "~~/server/database/schema"
import { getWalletByUserId } from "~~/server/utils/wallet"

export default defineEventHandler(async (event) => {
  const session = event.context.session
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized" })
  }

  const body = await readBody(event)

  // Validasi manual — kita tidak pakai Zod biar tidak tambah dependency
  if (!body.amount || typeof body.amount !== "number" || body.amount <= 0) {
    throw createError({ statusCode: 400, message: "Amount harus angka positif" })
  }
  if (!body.categoryId || typeof body.categoryId !== "string") {
    throw createError({ statusCode: 400, message: "categoryId wajib diisi" })
  }
  if (!body.date || isNaN(new Date(body.date).getTime())) {
    throw createError({ statusCode: 400, message: "Date tidak valid" })
  }

  // Validasi: tidak boleh future date
  const transactionDate = new Date(body.date + "T00:00:00")
  const today = new Date()
  today.setHours(23, 59, 59, 999) // end of today
  if (transactionDate > today) {
    throw createError({ statusCode: 400, message: "Tanggal transaksi tidak boleh di masa depan" })
  }

  const wallet = await getWalletByUserId(session.user.id)

  // Validasi: categoryId harus milik wallet ini
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, body.categoryId),
  })
  if (!category || category.walletId !== wallet.id) {
    throw createError({ statusCode: 400, message: "Kategori tidak valid" })
  }

  const newTransaction = {
    id: nanoid(),
    walletId: wallet.id,
    categoryId: body.categoryId,
    amount: body.amount,
    description: body.description?.trim() || null,
    date: transactionDate,
  }

  await db.insert(transactions).values(newTransaction)

  return { success: true, id: newTransaction.id }
})
```

**Kenapa validasi `categoryId` ownership?** Ini penting. Tanpa ini, user A bisa insert transaksi dengan `categoryId` milik user B — itu data breach kecil-kecilan. Selalu validasi foreign key ownership di server, bukan cuma cek exist atau tidak.

**Kenapa tidak pakai Zod?** Pertimbangan: artikel ini sudah cukup banyak moving parts. Zod bagus, tapi tambah satu library lagi dan satu layer abstraksi yang perlu dipahami. Untuk MVP Phase 1 dengan validasi sederhana, manual validation lebih transparent. Kalau mau migrate ke Zod nanti, strukturnya tetap sama.

------

### PATCH `/api/transactions/[id]`

Update transaksi. User hanya bisa update transaksi miliknya sendiri.

`server/api/transactions/[id].patch.ts`:

```typescript
import { and, eq } from "drizzle-orm"
import { db } from "~~/server/utils/db"
import { transactions, categories } from "~~/server/database/schema"
import { getWalletByUserId } from "~~/server/utils/wallet"

export default defineEventHandler(async (event) => {
  const session = event.context.session
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized" })
  }

  const id = getRouterParam(event, "id")
  if (!id) {
    throw createError({ statusCode: 400, message: "Transaction ID wajib diisi" })
  }

  const body = await readBody(event)
  const wallet = await getWalletByUserId(session.user.id)

  // Verifikasi transaksi milik user ini
  const existing = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.id, id),
      eq(transactions.walletId, wallet.id)
    ),
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: "Transaksi tidak ditemukan" })
  }

  // Build update object — hanya update field yang dikirim
  const updates: Partial<typeof existing> = {
    updatedAt: new Date(),
  }

  if (body.amount !== undefined) {
    if (typeof body.amount !== "number" || body.amount <= 0) {
      throw createError({ statusCode: 400, message: "Amount harus angka positif" })
    }
    updates.amount = body.amount
  }

  if (body.description !== undefined) {
    updates.description = body.description?.trim() || null
  }

  if (body.date !== undefined) {
    if (isNaN(new Date(body.date).getTime())) {
      throw createError({ statusCode: 400, message: "Date tidak valid" })
    }
    const transactionDate = new Date(body.date + "T00:00:00")
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (transactionDate > today) {
      throw createError({ statusCode: 400, message: "Tanggal transaksi tidak boleh di masa depan" })
    }
    updates.date = transactionDate
  }

  if (body.categoryId !== undefined) {
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, body.categoryId),
    })
    if (!category || category.walletId !== wallet.id) {
      throw createError({ statusCode: 400, message: "Kategori tidak valid" })
    }
    updates.categoryId = body.categoryId
  }

  await db
    .update(transactions)
    .set(updates)
    .where(eq(transactions.id, id))

  return { success: true }
})
```

**Pattern partial update** — kita tidak require semua field. User bisa send hanya field yang berubah. Ini lebih UX-friendly dan lebih efisien (tidak perlu fetch data existing di client dulu untuk re-send semua field).

------

### DELETE `/api/transactions/[id]`

`server/api/transactions/[id].delete.ts`:

```typescript
import { and, eq } from "drizzle-orm"
import { db } from "~~/server/utils/db"
import { transactions } from "~~/server/database/schema"
import { getWalletByUserId } from "~~/server/utils/wallet"

export default defineEventHandler(async (event) => {
  const session = event.context.session
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized" })
  }

  const id = getRouterParam(event, "id")
  if (!id) {
    throw createError({ statusCode: 400, message: "Transaction ID wajib diisi" })
  }

  const wallet = await getWalletByUserId(session.user.id)

  // Verify ownership sebelum delete
  const existing = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.id, id),
      eq(transactions.walletId, wallet.id)
    ),
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: "Transaksi tidak ditemukan" })
  }

  await db.delete(transactions).where(eq(transactions.id, id))

  return { success: true }
})
```

**Kenapa check ownership sebelum delete?** Bukan hanya security — ini juga user experience. 404 lebih informatif daripada silent fail. Dan kalau suatu saat ada bug di client yang kirim ID salah, server kasih feedback yang jelas.

------

## UI: Halaman Transaksi

Nuxt pakai file-based routing. Buat `app/pages/transactions.vue`.

Struktur halaman:

1. Tombol "Tambah Transaksi" → buka modal
2. List transaksi (tabel atau card list)
3. Per item: tombol edit dan delete

### Composable: useTransactions

Sebelum nulis page, extract logic ke composable supaya bersih.

`app/composables/useTransaction.ts`:

```typescript
export function useTransactions() {
  const transactions = ref<Transaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTransactions() {
    loading.value = true
    error.value = null
    try {
      transactions.value = await $fetch("/api/transactions")
    } catch (e: any) {
      error.value = e?.data?.message || "Gagal memuat transaksi"
    } finally {
      loading.value = false
    }
  }

  async function createTransaction(data: CreateTransactionInput) {
    await $fetch("/api/transactions", {
      method: "POST",
      body: data,
    })
    await fetchTransactions()
  }

  async function updateTransaction(id: string, data: Partial<CreateTransactionInput>) {
    await $fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      body: data,
    })
    await fetchTransactions()
  }

  async function deleteTransaction(id: string) {
    await $fetch(`/api/transactions/${id}`, {
      method: "DELETE",
    })
    await fetchTransactions()
  }

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  }
}
```

**Kenapa `$fetch` bukan `useFetch`?** `useFetch` untuk data yang perlu di-SSR (server-side render) dan auto-hydrate. Untuk action (POST, PATCH, DELETE) yang dipicu user interaction, `$fetch` lebih straightforward. Untuk initial load transaksi, `useFetch` sebenarnya lebih tepat, tapi karena kita perlu refresh setelah setiap mutation, `$fetch` lebih mudah dikontrol di sini. Trade-off yang valid untuk MVP.

### Type Definitions

Buat `app/types/transaction.ts`:

```typescript
export interface Transaction {
  id: string
  amount: number
  description: string | null
  date: string
  createdAt: string
  category: {
    id: string
    name: string
    type: "income" | "expense"
  } | null
}

export interface CreateTransactionInput {
  amount: number
  categoryId: string
  description?: string
  date: string
}
```

------

### Page: transactions.vue

`app/pages/transactions.vue`:

```vue
<script setup>
const {
  transactions,
  loading,
  error,
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = useTransactions()

// Fetch categories untuk dropdown
const { data: categories } = await useFetch("/api/categories")

const showModal = ref(false)
const editingTransaction = ref(null)
const deleteConfirmId = ref(null)

// Form state
const form = reactive({
  amount: "",
  categoryId: "",
  description: "",
  date: new Date().toISOString().split("T")[0], // default: today
})

function openAddModal() {
  editingTransaction.value = null
  Object.assign(form, {
    amount: "",
    categoryId: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  })
  showModal.value = true
}

function openEditModal(transaction) {
  editingTransaction.value = transaction
  Object.assign(form, {
    amount: transaction.amount,
    categoryId: transaction.category?.id || "",
    description: transaction.description || "",
    date: new Date(transaction.date).toISOString().split("T")[0],
  })
  showModal.value = true
}

async function handleSubmit() {
  const data = {
    amount: parseFloat(form.amount),
    categoryId: form.categoryId,
    description: form.description,
    date: form.date,
  }

  try {
    if (editingTransaction.value) {
      await updateTransaction(editingTransaction.value.id, data)
    } else {
      await createTransaction(data)
    }
    showModal.value = false
  } catch (e) {
    alert(e?.data?.message || "Terjadi kesalahan")
  }
}

async function handleDelete(id) {
  if (!confirm("Yakin mau hapus transaksi ini?")) return
  try {
    await deleteTransaction(id)
  } catch (e) {
    alert(e?.data?.message || "Gagal hapus transaksi")
  }
}

// Format currency
function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

await fetchTransactions()
</script>

<template>
  <div class="max-w-3xl mx-auto p-4">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Transaksi</h1>
      <button
        @click="openAddModal"
        class="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        + Tambah
      </button>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-500">Memuat...</div>

    <div v-else-if="error" class="text-red-500 py-4">{{ error }}</div>

    <div v-else-if="transactions.length === 0" class="text-center py-12 text-gray-400">
      Belum ada transaksi. Tambah yang pertama!
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="tx in transactions"
        :key="tx.id"
        class="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
      >
        <div class="flex items-start gap-3">
          <div
            class="w-2 h-2 mt-2 rounded-full flex-shrink-0"
            :class="tx.category?.type === 'income' ? 'bg-green-500' : 'bg-red-400'"
          />
          <div>
            <div class="font-medium text-sm">
              {{ tx.category?.name || "Tanpa Kategori" }}
            </div>
            <div v-if="tx.description" class="text-xs text-gray-400 mt-0.5">
              {{ tx.description }}
            </div>
            <div class="text-xs text-gray-400 mt-0.5">{{ formatDate(tx.date) }}</div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span
            class="font-semibold text-sm"
            :class="tx.category?.type === 'income' ? 'text-green-600' : 'text-gray-900'"
          >
            {{ tx.category?.type === "income" ? "+" : "-" }}{{ formatRupiah(tx.amount) }}
          </span>
          <div class="flex gap-1">
            <button
              @click="openEditModal(tx)"
              class="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              @click="handleDelete(tx.id)"
              class="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showModal = false"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <h2 class="text-lg font-semibold mb-4">
          {{ editingTransaction ? "Edit Transaksi" : "Tambah Transaksi" }}
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
            <input
              v-model="form.amount"
              type="number"
              min="0"
              step="any"
              placeholder="50000"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              v-model="form.categoryId"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            >
              <option value="" disabled>Pilih kategori</option>
              <optgroup label="Pemasukan">
                <option
                  v-for="cat in categories?.filter((c) => c.type === 'income')"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.name }}
                </option>
              </optgroup>
              <optgroup label="Pengeluaran">
                <option
                  v-for="cat in categories?.filter((c) => c.type === 'expense')"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.name }}
                </option>
              </optgroup>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
            <input
              v-model="form.date"
              type="date"
              :max="new Date().toISOString().split('T')[0]"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Keterangan <span class="text-gray-400 font-normal">(opsional)</span>
            </label>
            <input
              v-model="form.description"
              type="text"
              placeholder="Makan siang, bensin, dll"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>

        <div class="flex gap-2 mt-6">
          <button
            @click="showModal = false"
            class="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            @click="handleSubmit"
            class="flex-1 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            {{ editingTransaction ? "Simpan" : "Tambah" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

------

## Gotcha Yang Makan Waktu

### 1. Date Timezone Mismatch

Ini yang paling sering nyebelin. Di client kita punya:

```javascript
new Date().toISOString().split("T")[0] // "2025-07-15"
```

Di server, kita parse:

```typescript
const transactionDate = new Date(body.date) // "2025-07-15"
```

Masalahnya: `new Date("2025-07-15")` di JavaScript di-parse sebagai **UTC midnight**, bukan local time. Jadi kalau kita di UTC+7 (Jakarta), `new Date("2025-07-15")` sebenarnya adalah `2025-07-14T17:00:00Z` — yang kalau di-display balik bisa jadi "14 Juli" bukan "15 Juli".

Solusi paling praktis: tambahkan `T00:00:00` saat parse di server:

```typescript
const transactionDate = new Date(body.date + "T00:00:00")
```

Ini force parse sebagai local time, bukan UTC. Alternatif yang lebih robust: selalu kirim full ISO string dari client (`datetime-local` input atau append timezone offset). Tapi untuk Phase 1 dengan user yang majoritasnya WIB, solusi sederhana ini cukup.

### 2. Nuxt `useFetch` vs `$fetch` — Kapan Pakai Yang Mana

Ini bukan bug, tapi keputusan yang kalau salah bikin code berantakan:

- **`useFetch`** — gunakan untuk data yang butuh SSR (server-side render) atau perlu reactive auto-refresh. Hasilnya `{ data, error, pending, refresh }`.
- **`$fetch`** — gunakan untuk action yang dipicu user (form submit, delete button). Ini regular async function yang throw error.

Kesalahan umum: pakai `useFetch` untuk POST request. Ini tidak error, tapi `useFetch` di-designed untuk GET dan akan re-execute saat route berubah — perilaku yang tidak diinginkan untuk form submit.

### 3. Kenapa Kita Tidak Pakai `better-sqlite3`

Kalau elu baca tutorial lain tentang Drizzle + Nuxt, kemungkinan besar mereka pakai `better-sqlite3` sebagai driver. Kita tidak, dan ada alasan yang solid.

`better-sqlite3` punya native `.node` bindings — artinya dia adalah paket C++ yang di-compile untuk platform tertentu. Masalahnya: Nitro (server Nuxt) bundling output-nya sebagai ESM (`.mjs`), dan di ESM scope tidak ada `require`. Hasilnya error seperti ini:

```
require$$4 is not a function
// atau
require is not defined in ES module scope
```

Ada berbagai workaround yang beredar di internet (`nitro.externals`, `createRequire`, dsb), tapi semua itu tidak reliable dan tergantung versi Nitro.

Solusi yang bersih: pakai `@libsql/client`. Ini pure JavaScript, tidak ada native binary, fully ESM-compatible, dan Drizzle support natively dengan API yang identik. Dari sisi developer tidak ada yang berubah — query tetap sama, schema tetap sama, cuma import path yang berbeda di `db.ts`.

------

## Testing Manual

Sebelum lanjut ke artikel berikutnya, pastikan semua flow jalan:

1. **Tambah transaksi** — isi form, submit, cek muncul di list
2. **Edit transaksi** — klik edit, ubah amount atau kategori, simpan, cek update
3. **Hapus transaksi** — klik hapus, confirm, cek hilang dari list
4. **Validasi date** — coba set tanggal besok via DevTools, harusnya rejected
5. **Auth** — akses `/api/transactions` langsung di browser (tanpa login), harusnya 401

Kalau semua pass, fitur transaksi sudah solid.

------

## Struktur File Setelah Artikel Ini

```
server/
├── api/
│   ├── auth/
│   │   └── [...all].ts
│   ├── transactions/
│   │   ├── index.get.ts
│   │   ├── index.post.ts
│   │   ├── [id].patch.ts
│   │   └── [id].delete.ts
│   └── categories/        ← artikel berikutnya
├── database/
│   └── schema.ts
├── middleware/
│   └── auth.ts            ← baru
└── utils/
    ├── db.ts
    └── wallet.ts          ← baru

app/
├── composables/
│   └── useTransaction.ts ← baru
├── pages/
│   └── transactions.vue   ← baru
└── types/
    └── transaction.ts     ← baru
```

------

## Langkah Selanjutnya

Artikel selanjutnya: **Category Management**

Transaksi butuh kategori. Di artikel berikutnya kita build:

- Seed preset categories saat user sign up
- API untuk view, create, edit, delete kategori
- Logic khusus: delete kategori → reassign transactions ke Uncategorized
- UI halaman `/categories`

------

## Resources

- [Nuxt — Server Routes](https://nuxt.com/docs/guide/directory-structure/server)
- [Drizzle ORM — Joins](https://orm.drizzle.team/docs/joins)
- [Nuxt — useFetch vs $fetch](https://nuxt.com/docs/getting-started/data-fetching)
- [nanoid](https://github.com/ai/nanoid)

------

**Status:** ✅ Siap

 **Artikel Selanjutnya:** [Manajemen Kategori](https://sdqstack.in/blog/money-tracker-manajemen-kategori)