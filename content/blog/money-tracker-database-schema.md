---
title: "Money Tracker: Database Schema"
description: "Design Tabel dengan Drizzle ORM + SQLite"
date: "2024-05-13"
tags: ["project","money tracker","nuxt"]
image: "https://sdqstack.in/images/money-tracker-hero.png"
---

## Apa Yang Kita Bangun

Di artikel ini kita design semua tabel yang Money Tracker butuhkan — users, wallets, categories, transactions — dan tulis schema-nya dengan Drizzle ORM.

Ini bukan sekedar "tulis schema, lanjut". Di sini kita juga bahas *kenapa* setiap kolom ada, trade-off yang diambil, dan satu gotcha besar soal Better Auth yang kalau gak tahu bisa makan waktu berjam-jam.

------

## Better Auth Punya Tabel Sendiri

Ini hal pertama yang perlu dipahami sebelum nulis satu baris schema pun.

Better Auth **generate tabel `users`-nya sendiri**. Bukan berarti kita gak bisa extend — bisa — tapi kita harus *ikuti strukturnya*, bukan define ulang dari scratch.

Kalau define `users` table sendiri tanpa mengikuti format Better Auth, ada dua kemungkinan: auth tidak jalan, atau ada konflik kolom yang susah di-debug.

Cara yang benar: pakai `additionalFields` di Better Auth config untuk extend kolom `users`, dan biarkan Better Auth generate tabel inti.

Schema yang Better Auth generate secara default:

```
users         → id, name, email, emailVerified, image, createdAt, updatedAt
sessions      → id, userId, token, expiresAt, ipAddress, userAgent, createdAt, updatedAt
accounts      → id, userId, accountId, providerId, accessToken, refreshToken, ...
verifications → id, identifier, value, expiresAt, createdAt, updatedAt
```

Karena Money Tracker hanya pakai email + password, kita tidak butuh banyak kolom `accounts`. Tapi schema tetap harus ada — Better Auth perlu tabel itu exist meskipun kosong.

------

## Strategi: Satu File Schema

Semua tabel (termasuk yang Better Auth generate) kita tulis di satu file: `server/database/schema.ts`.

Kenapa satu file? Supaya Drizzle bisa resolve foreign key references antar tabel tanpa circular import, dan supaya `drizzle.config.ts` cukup point ke satu lokasi.

------

## Schema Lengkap

`server/database/schema.ts`:

```typescript
import { sql } from "drizzle-orm"
import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core"

// ============================================================
// BETTER AUTH TABLES
// Generate otomatis oleh Better Auth — jangan diubah strukturnya
// ============================================================

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
})

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
})

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
})

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
})

// ============================================================
// APPLICATION TABLES
// ============================================================

export const wallets = sqliteTable("wallets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("My Wallet"),
  type: text("type", { enum: ["personal", "family"] }).notNull().default("personal"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
})

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  walletId: text("wallet_id")
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  isPreset: integer("is_preset", { mode: "boolean" }).notNull().default(false),
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
})

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  walletId: text("wallet_id")
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade" }),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  amount: real("amount").notNull(),
  description: text("description"),
  date: integer("date", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
})
```

------

## Kenapa Begini?

### ID: `text` bukan `integer`

```typescript
id: text("id").primaryKey(),
```

Kita pakai string ID (nanoid / cuid / UUID), bukan auto-increment integer.

Alasannya:

- **Better Auth generate ID sebagai string** — kalau kita pakai integer di tabel application, foreign key ke `users.id` jadi type mismatch
- **Distributed-friendly** — kalau suatu saat migrate ke PostgreSQL atau multi-instance, string ID tidak ada konflik
- **Predictable length** — integer auto-increment bisa dibaca orang ("user 1", "user 2") yang sedikit expose internals

Trade-off: sedikit lebih besar storage. Untuk aplikasi seperti ini, gak ada artinya.

------

### Timestamp: `integer` dengan `mode: "timestamp"`

```typescript
createdAt: integer("created_at", { mode: "timestamp" })
  .notNull()
  .default(sql`(unixepoch())`)
```

SQLite tidak punya native timestamp type. Ada dua opsi umum: simpan sebagai teks (`"2025-01-15T10:30:00Z"`) atau sebagai integer Unix epoch.

Kita pilih integer karena:

- **Lebih efisien** — integer 4 atau 8 byte vs string 20+ karakter
- **Mudah di-compare dan di-sort** di query SQL (`WHERE date > 1700000000`)
- **`mode: "timestamp"`** bikin Drizzle otomatis konversi ke JavaScript `Date` object saat query

`sql`(unixepoch())`` adalah SQLite function untuk current Unix timestamp. Ini dieksekusi di database level, bukan di JavaScript level — artinya konsisten meskipun server timezone berbeda.

------

### Enum di SQLite: `text` dengan `{ enum: [...] }`

```typescript
type: text("type", { enum: ["personal", "family"] }).notNull().default("personal"),
```

SQLite tidak punya native `ENUM` type seperti PostgreSQL. Drizzle handle ini dengan `text()` + option `enum` — yang artinya Drizzle akan:

1. Memberikan TypeScript type `"personal" | "family"` saat query
2. **Tidak** enforce di database level (tidak ada check constraint otomatis)

Ini berarti validasi enum harus kita handle di application layer (di API handler) sebelum insert. Di Drizzle v0.30+, ada `.$type<>()` untuk type casting, tapi `{ enum: [...] }` tetap cara yang paling straightforward untuk kolom seperti ini.

------

### `isPreset` vs `isSystem`: Dua Flag yang Beda Fungsi

Ini keputusan yang perlu dipikirkan baik-baik.

```typescript
isPreset: integer("is_preset", { mode: "boolean" }).notNull().default(false),
isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
```

**`isPreset`**: kategori yang di-seed otomatis saat signup (Gaji, Transportasi, dll). User *boleh* edit dan hapus. Flag ini hanya untuk transparency — user bisa tahu mana yang preset dan mana yang dia buat sendiri.

**`isSystem`**: kategori fallback "Uncategorized". User *tidak boleh* edit atau hapus. Ini safety net — saat user hapus kategori lain, transactions yang orphaned reassign ke sini.

Satu hal penting yang sering kelewat: **system category harus dibuat dua, satu per type** (`income` dan `expense`). Kalau cuma buat satu dengan `type: "expense"`, transaksi income yang categorynya dihapus akan di-reassign ke category expense — hasilnya income itu tiba-tiba dihitung sebagai pengeluaran, balance langsung salah total. Bug silent yang susah ketahuan.

Jadi saat signup, kita buat:

```typescript
// Dua system categories — satu per type
{ name: "Uncategorized", type: "income", isSystem: true }
{ name: "Uncategorized", type: "expense", isSystem: true }
```

Dan saat delete category, kita cari system category yang **type-nya sama** dengan category yang dihapus. Detail implementasinya di artikel 04.

Kalau cuma pakai satu flag `isPreset`, kita butuh logic tambahan untuk membedakan "preset yang bisa dihapus" vs "preset yang tidak boleh dihapus". Lebih clean pisah dari awal.

------

### `categoryId` di Transactions: Tanpa `onDelete`

```typescript
categoryId: text("category_id")
  .notNull()
  .references(() => categories.id),
```

Perhatikan tidak ada `{ onDelete: "cascade" }` atau `{ onDelete: "set null" }` di sini.

Kenapa? Karena kita handle delete kategori secara manual di application layer:

1. User klik hapus kategori
2. Server: reassign semua transactions dengan `categoryId` tersebut ke Uncategorized
3. Server: baru delete kategori

Kalau kita pakai `onDelete: "cascade"`, begitu kategori dihapus, semua transactions-nya ikut hilang — itu bukan yang kita mau.

Kalau kita pakai `onDelete: "set null"`, kita harus ubah `categoryId` jadi nullable, yang berarti ada transaksi tanpa kategori — inconsistent data.

Solusi: handle di aplikasi, bukan di database constraint. Lebih verbose, tapi lebih predictable.

> **Catatan penting soal FK constraints di libsql:** SQLite secara default tidak menjalankan FK constraints sama sekali — termasuk `onDelete: "cascade"`. Ini berlaku untuk semua driver, termasuk `@libsql/client`. Kita perlu aktifkan manual dengan `PRAGMA foreign_keys = ON` di `server/utils/db.ts` saat init client. Tanpa pragma ini, hapus user tidak akan cascade hapus wallets dan transactions miliknya. Detail setup-nya ada di artikel 02.

------

### `transactions.amount`: `real` bukan `integer`

```typescript
amount: real("amount").notNull(),
```

`real` di SQLite adalah 8-byte IEEE 754 floating point. Ini untuk handle nilai seperti `15000.50` (lima belas ribu lima ratus rupiah).

Kalau semua transaksi dalam satuan rupiah bulat, sebenarnya `integer` juga oke dan lebih presisi (floating point punya precision issue). Tapi karena kita tidak tahu use case semua user, `real` lebih fleksibel.

Trade-off: untuk operasi SUM di dashboard, ada kemungkinan kecil rounding error. Untuk mayoritas kasus keuangan sehari-hari dengan nilai rupiah, ini tidak significant.

------

## Generate & Apply Migration

Schema sudah ditulis. Sekarang apply ke database:

```bash
npm run db:generate
npm run db:migrate
```

`db:generate` bikin migration file di `server/database/migrations/`. Cek file ini — Drizzle generate SQL yang akan dieksekusi. Pastikan semua tabel ada dan tidak ada yang aneh.

`db:migrate` eksekusi migration ke SQLite file di `data/money-tracker.db`.

Untuk development yang masih sering iterasi schema, bisa pakai:

```bash
npm run db:push
```

Ini skip migration file dan langsung push schema ke database. Lebih cepat saat masih eksperimen, tapi tidak ada migration history. Jangan pakai ini untuk production.

------

## Update `lib/auth.ts`

Better Auth perlu tahu mapping antara schema kita dan internal field-nya. Update config:

```typescript
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../server/utils/db"
import * as schema from "../server/database/schema"

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
})
```

Perhatikan key mapping: `user` (bukan `users`), `session` (bukan `sessions`), dst. Better Auth internal pakai singular. Kalau salah mapping di sini, auth bakal gagal dengan error yang tidak langsung obvious.

------

## Verifikasi dengan Drizzle Studio

```bash
npm run db:studio
```

Buka browser ke URL yang muncul di terminal. Semua tabel harusnya sudah ada. Cek:

- Semua kolom ada dengan tipe yang benar
- Foreign key references terlihat
- Tabel Better Auth (`users`, `sessions`, `accounts`, `verifications`) ada

Kalau ada tabel yang hilang atau kolom yang salah, ini saatnya fix sebelum lanjut ke artikel berikutnya.

------

## Relasi Antar Tabel

Untuk gambaran besar:

```
users (Better Auth)
  └── wallets (1 user → 1 wallet)
        ├── categories (tiap wallet punya kategori sendiri)
        └── transactions → categories (tiap transaksi punya 1 kategori)
```

Setiap delete cascade sudah setup:

- Delete user → cascade delete wallet
- Delete wallet → cascade delete categories + transactions
- Delete category → **tidak** cascade ke transactions (handle manual via reassign)

------

## Langkah Selanjutnya

Artikel selanjutnya: **Autentikasi dengan Better Auth**

Schema sudah ada. Sekarang kita setup autentikasi — Better Auth client, halaman signup & login, auto-setup wallet + kategori saat user baru mendaftar, dan route middleware untuk protect halaman yang butuh login.

------

## Resources

- [Drizzle ORM — SQLite Column Types](https://orm.drizzle.team/docs/column-types/sqlite)
- [Better Auth — Drizzle Adapter](https://www.better-auth.com/docs/adapters/drizzle)
- [SQLite — Datatypes](https://www.sqlite.org/datatype3.html)

------

**Status:** ✅ Siap
 **Artikel Selanjutnya:** [Autentikasi dengan Better Auth](https://sdqstack.in/blog/money-tracker-better-auth)