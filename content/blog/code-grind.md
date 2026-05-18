---
title: "code.grind"
description: "Bikin Habit Tracker Sendiri Untuk Boost Konsistensi Belajar"
date: "2024-05-18"
tags: ["project","code-grind"]
image: "https://sdqstack.in/images/code-grind.png"
---

## Kenapa gua buat ini

> Devlog singkat: ingin lebih produktif pakai sistem pomodoro dengan sedikit modifikasi.

---

Gua punya masalah yang mungkin familiar: susah konsisten ngoding. Bukan karena gak mau, tapi karena gak ada sistem. Setiap hari niat penuh, tapi pas weekend gua lupa udah ngoding berapa hari minggu ini. Streak-nya ilang, motivasinya ikut ilang.

Akhirnya gua mutusin: bikin sendiri aja. Sesimple mungkin. Pakai basic pemrograman file HTML CSS dan Javascript, buka di browser, langsung jalan.

---

## Kenapa pakai basic pemrograman?

Ini keputusan paling penting di project ini, dan jawaban gua simpel: **gua gak mau ada friction sama sekali**.

Kalau harus install Node, clone repo, `npm install`, baru bisa jalan — itu udah kejauhan buat sesuatu yang harusnya jadi kebiasaan harian. Tool untuk membangun kebiasaan harus semudah mungkin diakses, bukan jadi rintangan baru.

- Download sekali, buka selamanya
- Gak perlu internet (kecuali Google Fonts, dan itu opsional)
- Data di `localStorage` — milik lo sepenuhnya, gak ada server yang nyimpen apapun
- Bisa dibuka di laptop, PC, atau bahkan flashdisk orang lain

Zero dependency juga berarti zero maintenance. Gak ada `npm audit` yang ngirim notifikasi tiap minggu. Gak ada breaking change dari library. Lima tahun lagi file ini masih jalan sama persis.

---

## Pomodoro 40 Menit, Bukan 25

Teknik Pomodoro original itu 25 menit fokus, 5 menit istirahat. Gua ganti jadi 40 menit.

Kenapa? Karena buat gua, 25 menit itu keburu abis pas lagi masuk ke flow state. Baru serius ngerti masalahnya, timer udah bunyi. Dua kali ganti konteks itu mahal secara mental.

40 menit lebih pas — cukup panjang buat masuk deep work, tapi masih cukup pendek buat gak burnout. Flow setelah istirahat juga ada: setelah 5 menit break, app otomatis buka tab Log supaya gua langsung nulis apa yang baru dikerjain. Setelah itu baru lanjut sesi berikutnya.

Itu ritme yang gua rasa nyaman: **fokus → istirahat → refleksi → ulang**.

---

## Fitur yang Masuk (dan Yang Sengaja Gak Masuk)

**Yang ada:**

- Timer dengan progress ring dan phase indicator (Fokus → Istirahat → Review)
- Session dots — maksimal 4 sesi per hari, biar ada batasnya
- Habit tracker 30 hari terakhir dengan streak counter
- Tombol "tandai hari ini selesai" yang bisa dipakai walau gak ngoding pake timer
- Log harian untuk nulis progress tiap hari
- Notifikasi suara setiap fase selesai

**Yang sengaja gak ada:**

- Akun / login
- Sync ke cloud
- Reminder / push notification
- Statistik kompleks

Ini bukan karena gua malas nambahnya. Tapi karena setiap fitur tambahan adalah keputusan yang harus dibuat ulang tiap hari: "hari ini mau pakai fitur ini gak?" Semakin sedikit keputusan, semakin besar kemungkinan gua buka app-nya.

---

## Stack

```
HTML + CSS + Vanilla JavaScript
localStorage untuk data
Google Fonts (Space Mono + DM Sans) — opsional
```

CSS-nya pakai custom properties (variables) supaya gampang ganti tema. Semua warna dikontrol dari satu tempat:

```css
:root {
  --bg:     #080810;
  --accent: #22d3a0;  /* hijau toska */
  --warn:   #fb923c;  /* oranye buat streak */
}
```

JavaScript-nya pure vanilla. Gak ada framework, gak ada bundler. Kalau lo buka devtools dan lihat source-nya, lo langsung ngerti — gak ada layer abstraksi yang nyembunyiin logic.

---

Project ini live di [grind.sdqstack.in](https://grind.sdqstack.in).

---

## Yang Gua Pelajari

Proyek kecil kayak gini justru ngajarin gua hal yang sering lupa pas kerja di project besar:

**Constraints itu membantu.** Dengan batasan "harus satu file", gua gak bisa over-engineer. Setiap fitur harus worth the bytes.

**Scope adalah fitur.** Banyak project gagal bukan karena kodenya jelek, tapi karena scope-nya gak pernah selesai didefinisiin. code.grind selesai karena dari awal gua tau apa yang gak akan gua tambahkan.

**Bikin tool untuk diri sendiri dulu.** Kalau lo pengguna pertamanya, lo langsung tau mana yang kerasa janky dan mana yang natural.

---

Kodenya open source di [github.com/shodiqarifin/code.grind](https://github.com/shodiqarifin/code.grind). Bebas dipakai, dimodifikasi, atau dijadiin base project lo sendiri.

Kalau tulisan atau project ini bermanfaat, trakteer gua ya — [trakteer.id/shodiq_arifin](https://trakteer.id/shodiq_arifin).

Sekarang balik ngoding...
