---
title: "Money Tracker: Pengenalan"
description: "Membangun Aplikasi Pencatat Keuangan dengan JavaScript Modern"
date: "2024-05-11"
tags: ["project","money tracker","nuxt"]
image: "https://sdqstack.in/images/money-tracker-hero.png"
---

## Apa Sih Money Tracker Ini?

Money Tracker adalah aplikasi web untuk mencatat keuangan pribadi—catat setiap transaksi (pemasukan dan pengeluaran), kelompokkan dengan kategori, dan pahami kemana uang sebenarnya pergi.

---

## Kenapa Proyek Ini?

### Kompleksitas Real-World

Tidak seperti "hello world", Money Tracker punya:

- Autentikasi pengguna dan isolasi data
- Relasi database (user → wallet → transaksi → kategori)
- Business logic (hitung ringkasan, pengelompokan data, validasi)

### Belajar Full Stack dalam Konteks

Alih-alih terisolasi ("cara pakai Drizzle" atau "setup Better Auth sendiri-sendiri"), semuanya terintegrasi dalam satu aplikasi yang kohesif. Ini gimana pengembangan software sebenarnya bekerja.

**Fitur Utama:**

- **Autentikasi** — Signup/login dengan email + password
- **Multi-user** — Setiap pengguna punya data terisolasi
- **Transaksi** — Tambah, lihat, edit, hapus transaksi pemasukan dan pengeluaran
- **Kategori** — Buat kategori custom dengan preset default
- **Dashboard** — Ringkasan (total pemasukan, total pengeluaran, saldo bersih, 5 kategori terbesar)

**Model Data:**

- 1 pengguna = 1 wallet
- 1 wallet berisi banyak transaksi
- Setiap transaksi masuk ke 1 kategori
- Kategori bisa dikustomisasi per wallet

**Layout UI:**

```
Dashboard (ringkasan + transaksi terbaru)
├── Halaman Transaksi (CRUD)
├── Halaman Kategori (kelola kategori)
└── Akun / Logout
```

---

## Tech Stack: Kenapa Pilihan Ini?

- **Nuxt 4** — Framework frontend + backend
- **Tailwind CSS** — Utility-first styling
- **Drizzle ORM** — Layer database dengan type-safety
- **SQLite** — Database lightweight
- **Better Auth** — Framework autentikasi
- **TypeScript** — Type safety strategis

### Nuxt 4

Nuxt adalah meta-framework di atas Vue 3. 

**Kenapa Nuxt?**

- File-based routing (halaman otomatis jadi route)
- Built-in Nitro server (backend dalam repo yang sama, bukan service terpisah)
- Auto-imports (component, composable, utility—tanpa import manual)
- Production-ready defaults (SSR, optimasi performa)
- Nuxt 4 adalah versi latest stable dengan banyak peningkatan

### Tailwind CSS

Utility-first CSS framework. Alih-alih nulis custom CSS class, compose utilities: `<div class="flex gap-4 text-lg font-semibold">`.

**Kenapa Tailwind?**

- Development cepat (gak perlu bolak-balik ke file CSS)
- Built-in design system (spacing, warna, tipografi)
- Bundle size kecil (hanya CSS yang tinggal pakai saja)
- Modern dan widely adopted

### Drizzle ORM

ORM TypeScript untuk SQL database. Define schema di TypeScript, dapat full type safety dan autocomplete.

**Kenapa Drizzle?**

- TypeScript-first (schema sebagai code, full type safety)
- SQL-first mindset (paham SQL yang dijalankan, bukan hidden)
- Lightweight (bundle kecil, zero runtime overhead)
- Support SQLite excellent

**vs Alternatif:**

- Prisma lebih polished tapi lebih berat
- TypeORM bagus tapi lebih opinionated
- Raw SQL kehilangan type safety

### SQLite

Embedded SQL database. Single file, gak perlu setup server.

**Kenapa SQLite ?**

- Zero setup (gak perlu install PostgreSQL/MySQL server)
- Development-friendly (mudah inspeksi, backup, iterate)
- Cukup powerful untuk data model Money Tracker
- Clear upgrade path ke PostgreSQL kalau diperlukan (Drizzle bikin mudah)

### Better Auth

Framework autentikasi modern. Handle signup, login, session, password reset—semua kompleksitas autentikasi ter-abstract.

**Kenapa Better Auth?**

- Framework-agnostic (works dengan Nuxt, Next, Express, dll)
- TypeScript-first (full type safety)
- Open source (gak ada vendor lock-in)
- Minimal boilerplate

### TypeScript: Pendekatan Minimal

Bukan "TypeScript di mana-mana"—itu overengineering.

**Di mana TypeScript wajib:**

- Database schema (Drizzle config)
- API request/response contracts
- Konfigurasi Better Auth

**Di mana JavaScript fine:**

- Vue component (Vue handle sebagian besar type inference)

Balance ini memberikan type safety di tempat yang penting + kecepatan development.

---

## Gambaran Arsitektur

Mental model cepat:

```
Browser
  ↓
[Nuxt UI - Vue component + Tailwind CSS]
  ↓
[Nuxt/Nitro Server - API route]
  ↓
[Drizzle ORM - Query builder]
  ↓
[SQLite Database]
```

**Contoh: Pengguna tambah transaksi**

1. Pengguna isi form di browser (Vue component)
2. Submit POST /api/transactions
3. Better Auth middleware verifikasi user authenticated
4. Server handler validasi dan insert via Drizzle
5. Drizzle compile ke SQL dan execute di SQLite
6. Response balik ke browser dengan transaksi baru
7. UI update secara reaktif

Itu full-stack flow di sini.

---

## Learning Path

Setelah intro ini, berikut urutannya:

```
01. Pengenalan 
02. Setup Proyek (inisialisasi Nuxt, configure Tailwind, organisir struktur)
03. Schema Database (design dengan Drizzle)
04. Transaction CRUD (tambah/lihat/edit/hapus transaksi)
05. Manajemen Kategori (buat/kelola kategori)
06. Logika Dashboard (ringkasan dan pengelompokan)
07. Autentikasi (integrasi Better Auth + isolasi user)
```

Setiap artikel berdiri sendiri (clone folder, `npm install`, jalankan), tapi progressive (build di atas yang sebelumnya).

---

## Prinsip Dasar

Sebelum mulai coding:

### Bangun untuk Belajar

Ini bukan cuma untuk di-copy. Tapi dipahami *mengapa* setiap keputusan penting. Ketika ketemu masalah di proyek future akan recognize pattern.

### Dokumentasikan Kesulitan Real

Code terlihat mudah, realitanya punya momen "kenapa ini gak jalan". Kami dokumentasikan itu, bukan cuma solusi yang sudah dipoleskan.

### Praktis Lebih dari Sempurna

Kami gak kejar 100% perfection arsitektur. Target: code yang solid, maintainable, understandable. Shipped > never perfect.

---

## Langkah Selanjutnya

Artikel selanjutnya: **Setup Proyek**

- Inisialisasi proyek Nuxt 4
- Configure Tailwind CSS
- Setup environment variable (untuk Better Auth)
- Organisir sustainable folder structure
- Buat simple test component

15 menit setup yang proper menghemat jam-jam kemudian.

---

## Resources

- [Dokumentasi Nuxt](https://nuxt.com)
- [Vue 3 Guide](https://vuejs.org/guide/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Better Auth Docs](https://better-auth.com)
- [SQLite Official](https://www.sqlite.org)

---

**Status:** ✅ Siap  
**Artikel Selanjutnya:** [Setup Project](https://sdqstack.in/blog/money-tracker-setup)