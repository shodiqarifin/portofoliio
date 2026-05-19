---
title: "Money Tracker: Dashboard"
description: "Aggregasi SQL, Summary Stats, dan Halaman Dashboard"
date: "2024-05-17"
tags: ["project","money tracker","nuxt"]
image: "https://sdqstack.in/images/money-tracker-hero.png"
playlist: "money-tracker"
playlist_order: 7
---

## Apa Yang Kita Bangun

Ini artikel terakhir. Kita build:

- **API endpoint** — `GET /api/dashboard/summary` yang aggregasi data dari database
- **Query SQL yang kompleks** — total income/expense per bulan, all time, dan top 5 kategori pengeluaran
- **Halaman dashboard** — tampilan ringkasan yang clean, numbers only
- **Recent transactions** — 5 transaksi terbaru langsung di dashboard

Setelah artikel ini, aplikasi Money Tracker selesai dan bisa dipakai end-to-end.

---

## Desain Dashboard: Kenapa Numbers Only

1. **Chart library = dependency baru** — Chart.js, ApexCharts, ECharts semuanya nambah bundle size dan complexity. Untuk MVP yang belum dipakai orang, trade-off itu belum worth it.
2. **Data accuracy dulu** — lebih penting pastikan hitungannya benar sebelum bikin visualisasi yang menipu kalau data salah.
3. **Clean information hierarchy** — numbers dengan label yang jelas seringkali lebih informative daripada pie chart yang perlu hover untuk tahu angkanya.

---

## API: Dashboard Summary

Satu endpoint, beberapa query SQL yang jalan paralel (atau sequential karena SQLite single-threaded, tapi conceptually terpisah).

`server/api/dashboard/summary.get.ts`:

```typescript
import { and, desc, eq, gte, sql } from "drizzle-orm"
import { db } from "~~/server/utils/db"
import { transactions, categories } from "~~/server/database/schema"
import { getWalletByUserId } from "~~/server/utils/wallet"

export default defineEventHandler(async (event) => {
  const session = event.context.session
  if (!session?.user?.id) throw createError({ statusCode: 401, message: "Unauthorized" })

  const wallet = await getWalletByUserId(session.user.id)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Query 1: Totals all time (grouped by type)
  const allTimeTotals = await db
    .select({
      type: categories.type,
      total: sql<number>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.walletId, wallet.id))
    .groupBy(categories.type)

  // Query 2: Totals bulan ini (grouped by type)
  const monthTotals = await db
    .select({
      type: categories.type,
      total: sql<number>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(eq(transactions.walletId, wallet.id), gte(transactions.date, monthStart)))
    .groupBy(categories.type)

  // Query 3: Top 5 kategori pengeluaran bulan ini
  const topCategories = await db
    .select({
      name: categories.name,
      type: categories.type,
      total: sql<number>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.walletId, wallet.id),
        gte(transactions.date, monthStart),
        eq(categories.type, "expense")
      )
    )
    .groupBy(categories.id)
    .orderBy(sql`sum(${transactions.amount}) desc`)
    .limit(5)

  // Query 4: 5 transaksi terbaru
  const recentTransactions = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      description: transactions.description,
      date: transactions.date,
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
    .limit(5)

  // Compute totals dari hasil query
  const allTimeIncome = allTimeTotals.find((r) => r.type === "income")?.total ?? 0
  const allTimeExpense = allTimeTotals.find((r) => r.type === "expense")?.total ?? 0
  const monthIncome = monthTotals.find((r) => r.type === "income")?.total ?? 0
  const monthExpense = monthTotals.find((r) => r.type === "expense")?.total ?? 0

  return {
    allTime: {
      income: allTimeIncome,
      expense: allTimeExpense,
      balance: allTimeIncome - allTimeExpense,
    },
    thisMonth: {
      income: monthIncome,
      expense: monthExpense,
      net: monthIncome - monthExpense,
    },
    topCategories,
    recentTransactions,
  }
})
```

Ada beberapa hal yang menarik di sini:

**`gte(transactions.date, monthStart)`** — `gte` adalah "greater than or equal". Kita filter transaksi yang tanggalnya >= awal bulan ini. `monthStart` di-compute di JavaScript (`new Date(year, month, 1)`) bukan di SQL, supaya lebih readable. Drizzle otomatis convert Date object ke format yang SQLite mengerti.

**`groupBy(categories.id)` bukan `groupBy(categories.name)`** — untuk top categories, kita group by `id` bukan `name`. Kenapa? Karena secara teori bisa ada dua kategori dengan nama sama tapi ID beda. `groupBy` by `id` lebih akurat. Tapi kita tetap select `name` untuk ditampilkan.

**`sql<number>`sum(...)``** — ini raw SQL fragment. Drizzle support ini untuk aggregasi yang belum punya shorthand API-nya. `sql<number>` memberikan TypeScript hint bahwa hasilnya adalah number.

**Kenapa tidak satu query raksasa?** Karena SQLite sangat cepat untuk query sederhana, dan 4 query terpisah lebih mudah dibaca dan di-debug daripada satu monster query dengan subquery berlapis. Untuk data skala personal finance, performance difference-nya tidak meaningful.

---

## Halaman Dashboard

`app/pages/dashboard.vue`:

```vue
<script setup>
definePageMeta({ middleware: "auth" })

const { data: summary, pending, error } = await useFetch("/api/dashboard/summary")

// Format currency
function formatRupiah(amount) {
  if (!amount) return "Rp 0"
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

// Computed: persentase top category untuk progress bar visual sederhana
const topCategoryMax = computed(() => {
  if (!summary.value?.topCategories?.length) return 0
  return Math.max(...summary.value.topCategories.map((c) => c.total))
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Dashboard</h1>

    <div v-if="pending" class="text-center py-12 text-gray-400">Memuat...</div>

    <div v-else-if="error" class="text-red-500 py-4">Gagal memuat data</div>

    <div v-else-if="summary" class="space-y-6">
      <!-- Summary Bulan Ini -->
      <div>
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Bulan Ini
        </h2>
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-white border border-gray-100 rounded-2xl p-4">
            <div class="text-xs text-gray-400 mb-1">Pemasukan</div>
            <div class="text-lg font-bold text-green-600">
              {{ formatRupiah(summary.thisMonth.income) }}
            </div>
          </div>
          <div class="bg-white border border-gray-100 rounded-2xl p-4">
            <div class="text-xs text-gray-400 mb-1">Pengeluaran</div>
            <div class="text-lg font-bold text-gray-900">
              {{ formatRupiah(summary.thisMonth.expense) }}
            </div>
          </div>
          <div class="bg-white border border-gray-100 rounded-2xl p-4">
            <div class="text-xs text-gray-400 mb-1">Selisih</div>
            <div
              class="text-lg font-bold"
              :class="summary.thisMonth.net >= 0 ? 'text-green-600' : 'text-red-500'"
            >
              {{ summary.thisMonth.net >= 0 ? "+" : "" }}{{ formatRupiah(summary.thisMonth.net) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Summary All Time -->
      <div>
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Semua Waktu
        </h2>
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-white border border-gray-100 rounded-2xl p-4">
            <div class="text-xs text-gray-400 mb-1">Total Pemasukan</div>
            <div class="text-base font-semibold text-green-600">
              {{ formatRupiah(summary.allTime.income) }}
            </div>
          </div>
          <div class="bg-white border border-gray-100 rounded-2xl p-4">
            <div class="text-xs text-gray-400 mb-1">Total Pengeluaran</div>
            <div class="text-base font-semibold text-gray-900">
              {{ formatRupiah(summary.allTime.expense) }}
            </div>
          </div>
          <div class="bg-white border border-gray-100 rounded-2xl p-4">
            <div class="text-xs text-gray-400 mb-1">Saldo Bersih</div>
            <div
              class="text-base font-semibold"
              :class="summary.allTime.balance >= 0 ? 'text-green-600' : 'text-red-500'"
            >
              {{ formatRupiah(summary.allTime.balance) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Top Kategori Pengeluaran -->
      <div v-if="summary.topCategories.length > 0">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Top Pengeluaran Bulan Ini
        </h2>
        <div class="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
          <div
            v-for="cat in summary.topCategories"
            :key="cat.name"
            class="flex items-center gap-3"
          >
            <div class="text-sm font-medium w-28 flex-shrink-0 truncate">{{ cat.name }}</div>
            <div class="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                class="bg-gray-800 h-full rounded-full"
                :style="{ width: `${(cat.total / topCategoryMax) * 100}%` }"
              />
            </div>
            <div class="text-sm text-gray-700 font-medium w-28 text-right flex-shrink-0">
              {{ formatRupiah(cat.total) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div v-if="summary.recentTransactions.length > 0">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Transaksi Terbaru
          </h2>
          <NuxtLink to="/transactions" class="text-xs text-gray-400 hover:text-gray-700">
            Lihat semua →
          </NuxtLink>
        </div>
        <div class="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50">
          <div
            v-for="tx in summary.recentTransactions"
            :key="tx.id"
            class="flex items-center justify-between p-4"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-2 h-2 mt-1.5 rounded-full flex-shrink-0"
                :class="tx.category?.type === 'income' ? 'bg-green-500' : 'bg-red-400'"
              />
              <div>
                <div class="text-sm font-medium">
                  {{ tx.category?.name || "Tanpa Kategori" }}
                </div>
                <div v-if="tx.description" class="text-xs text-gray-400 mt-0.5">
                  {{ tx.description }}
                </div>
                <div class="text-xs text-gray-400 mt-0.5">{{ formatDate(tx.date) }}</div>
              </div>
            </div>
            <span
              class="text-sm font-semibold"
              :class="tx.category?.type === 'income' ? 'text-green-600' : 'text-gray-900'"
            >
              {{ tx.category?.type === "income" ? "+" : "-" }}{{ formatRupiah(tx.amount) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="
          summary.recentTransactions.length === 0 &&
          summary.topCategories.length === 0
        "
        class="text-center py-12"
      >
        <p class="text-gray-400 text-sm">Belum ada transaksi.</p>
        <NuxtLink
          to="/transactions"
          class="mt-2 inline-block text-sm text-black font-medium hover:underline"
        >
          Tambah transaksi pertama →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
```

Beberapa keputusan di UI ini:

**Progress bar dengan `topCategoryMax`** — daripada pakai persentase dari total pengeluaran (yang bikin bar yang kecil kalau ada satu dominan), kita normalize ke nilai terbesar. Kategori terbesar selalu full bar, yang lain proporsional. Lebih mudah dibaca untuk perbandingan relatif.

**`Intl.NumberFormat` dengan `id-ID`** — ini built-in browser API, tidak perlu library tambahan. Format `id-ID` dengan currency `IDR` dan `minimumFractionDigits: 0` otomatis kasih format "Rp 150.000" yang familiar untuk user Indonesia.

**"Lihat semua →" link** — kalau user mau lihat semua transaksi, kita arahkan ke `/transactions`. Dashboard bukan tempat manage data, cuma overview.

---

## Update index.vue

Sekarang dashboard sudah ada, update redirect di `index.vue`:

```vue
<script setup>
const { isLoggedIn } = useAuthClient()

if (isLoggedIn.value) {
  await navigateTo("/dashboard")
} else {
  await navigateTo("/login")
}
</script>

<template>
  <div></div>
</template>
```

---

## Gotcha: `gte` dan SQLite Timestamp Comparison

`gte(transactions.date, monthStart)` — ini filter tanggal yang perlu dicermati.

`transactions.date` disimpan sebagai Unix epoch integer di SQLite. `monthStart` adalah JavaScript `Date` object. Drizzle otomatis konversi `Date` ke epoch seconds saat build query — ini yang bikin comparison-nya benar.

Tapi ada edge case yang perlu diingat: `new Date(year, month, 1)` di JavaScript membuat tanggal di **local timezone**. Kalau server berjalan di timezone berbeda dari user (misalnya server UTC, user WIB), awal bulan yang dihitung bisa beda satu hari.

Untuk deployment lokal atau single timezone, ini tidak jadi masalah. Kalau nanti deploy ke cloud, pertimbangkan untuk selalu compute `monthStart` dalam UTC, atau pass timezone info dari client ke server.

---

## Gotcha: `null` vs `0` dari Aggregasi SQL

```typescript
const allTimeIncome = allTimeTotals.find((r) => r.type === "income")?.total ?? 0
```

Kenapa ada `?? 0`?

Kalau user baru signup dan belum ada transaksi sama sekali, query `SUM()` tidak akan return row untuk income atau expense — karena tidak ada row yang di-group. Bukan return `{ type: 'income', total: 0 }`, tapi benar-benar tidak return apapun.

`.find(...)?.total` akan return `undefined` untuk case ini. `?? 0` mengubahnya jadi `0` yang aman untuk ditampilkan dan dihitung.

Ini yang bikin `?? 0` penting — kalau pakai `|| 0`, angka `0` yang valid dari database juga akan di-replace (karena `0 || 0 = 0`, oke dalam hal ini, tapi semantically kurang tepat). `??` lebih tepat karena hanya replace `null` dan `undefined`.

---

## End-to-End Testing

Ini saat yang tepat untuk test keseluruhan flow sebelum declare selesai:

**Signup flow:**

1. Buka `localhost:3000` → redirect ke `/login`
2. Klik "Daftar" → ke `/signup`
3. Isi form signup → submit
4. Harusnya redirect ke `/dashboard` dengan empty state

**Transaction flow:**

5. Klik "Tambah transaksi pertama →"
6. Tambah beberapa transaksi dengan kategori berbeda
7. Balik ke dashboard → cek angka berubah
8. Cek "Transaksi Terbaru" muncul

**Category flow:**

9. Buka `/categories`
10. Tambah kategori custom
11. Edit nama preset category
12. Hapus satu kategori → cek transaksi pindah ke Uncategorized di Drizzle Studio

**Auth flow:**

13. Logout
14. Akses `/dashboard` langsung → harusnya redirect ke `/login`
15. Login → back to dashboard

Kalau semua test pass, selesai.

---

## Struktur File Final (Semua Artikel)

Ini gambaran lengkap semua file yang kita buat sepanjang seri:

```
money-tracker/
├── app/
│   ├── assets/css/
│   │   └── main.css
│   ├── composables/
│   │   ├── useAuthClient.ts
│   │   └── useTransaction.ts
│   ├── layouts/
│   │   └── default.vue         
│   ├── middleware/
│   │   └── auth.ts
│   ├── pages/
│   │   ├── index.vue           
│   │   ├── login.vue
│   │   ├── signup.vue
│   │   ├── dashboard.vue       
│   │   ├── transactions.vue
│   │   └── categories.vue      
│   ├── types/
│   │   └── transaction.ts
│   └── app.vue
├── lib/
│   ├── auth.ts
│   └── auth-client.ts
├── server/
│   ├── api/
│   │   ├── auth/[...all].ts
│   │   ├── dashboard/
│   │   │   └── summary.get.ts  
│   │   ├── transactions/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].patch.ts
│   │   │   └── [id].delete.ts
│   │   └── categories/
│   │       ├── index.get.ts   
│   │       ├── index.post.ts  
│   │       ├── [id].patch.ts  
│   │       └── [id].delete.ts 
│   ├── database/
│   │   └── schema.ts
│   ├── middleware/
│   │   └── auth.ts
│   └── utils/
│       ├── db.ts
│       └── wallet.ts
├── data/
│   └── money-tracker.db
├── drizzle.config.ts
├── nuxt.config.ts
└── package.json
```

---

## Selesai

Ini yang sudah kita build dari artikel 01 sampai 07:

- **Auth** — signup, login, logout, session management, route protection
- **Auto-setup** — wallet + kategori preset langsung ada waktu signup
- **Transaction CRUD** — tambah, lihat, edit, hapus dengan validasi lengkap
- **Category management** — CRUD dengan protection system category dan safe delete
- **Dashboard** — summary stats real-time dari database

Semua dengan satu codebase, satu server, satu database file. Tidak ada microservice, tidak ada external service yang perlu dibayar, tidak ada cloud yang perlu dikonfigurasi. Deploy ke VPS kecil bisa jalan.

---

## Resources

- [Drizzle ORM — Aggregation](https://orm.drizzle.team/docs/select#aggregations)
- [MDN — Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [Nuxt — useFetch](https://nuxt.com/docs/api/composables/use-fetch)

---

**Status:** ✅ Selesai 