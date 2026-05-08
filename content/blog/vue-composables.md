---
title: "Memahami Vue Composables: Cara Reuse Logic di Vue 3"
description: "Composables adalah fitur powerful di Vue 3 untuk mengekstrak dan menggunakan kembali stateful logic. Pelajari cara membuatnya dari contoh nyata."
date: "2024-01-10"
tags: ["vue", "javascript", "tips"]
image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80"
---

## Apa itu Composables?

Composables adalah fungsi JavaScript yang memanfaatkan Composition API Vue untuk mengenkapsulasi dan menggunakan kembali stateful logic. Anggap saja seperti React Hooks, tapi untuk Vue 3.

Nama composable selalu diawali dengan `use` — misalnya `useFetch`, `useCounter`, `useLocalStorage`.

## Mengapa Composables?

Sebelum Composition API (Vue 3), kita menggunakan **Mixins** untuk reuse logic, yang memiliki beberapa masalah:

- Nama properti bisa konflik (namespace collision)
- Sulit untuk trace darimana sebuah properti berasal
- Tidak type-safe

Composables menyelesaikan semua masalah ini.

## Composable Pertama: useCounter

```ts
// composables/useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)

  const doubled = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  function reset() {
    count.value = initialValue
  }

  return { count, doubled, increment, decrement, reset }
}
```

Penggunaan di komponen:

```vue
<script setup lang="ts">
const { count, doubled, increment, decrement, reset } = useCounter(10)
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Doubled: {{ doubled }}</p>
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
    <button @click="reset">Reset</button>
  </div>
</template>
```

## Composable Praktis: useFetch

Composable untuk data fetching dengan loading dan error state:

```ts
// composables/useFetch.ts
import { ref, watchEffect } from 'vue'

export function useFetch<T>(url: string | (() => string)) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function fetchData() {
    const resolvedUrl = typeof url === 'function' ? url() : url
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(resolvedUrl)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      data.value = await response.json()
    } catch (e) {
      error.value = e instanceof Error ? e : new Error('Unknown error')
    } finally {
      isLoading.value = false
    }
  }

  watchEffect(() => {
    fetchData()
  })

  return { data, error, isLoading, refresh: fetchData }
}
```

## Composable untuk LocalStorage

```ts
// composables/useLocalStorage.ts
import { ref, watch } from 'vue'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const stored = localStorage.getItem(key)
  const value = ref<T>(stored ? JSON.parse(stored) : defaultValue)

  watch(value, (newValue) => {
    if (newValue === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(newValue))
    }
  }, { deep: true })

  return value
}
```

Penggunaan:

```vue
<script setup>
// Data otomatis tersimpan dan dibaca dari localStorage
const darkMode = useLocalStorage('dark-mode', false)
const userPrefs = useLocalStorage('prefs', { fontSize: 16, lang: 'id' })
</script>
```

## Composable untuk Debounce

```ts
// composables/useDebounce.ts
import { ref, watch } from 'vue'

export function useDebounce<T>(value: Ref<T>, delay = 300) {
  const debouncedValue = ref<T>(value.value) as Ref<T>
  let timeout: ReturnType<typeof setTimeout>

  watch(value, (newValue) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  return debouncedValue
}
```

Sangat berguna untuk search input:

```vue
<script setup>
const searchQuery = ref('')
const debouncedQuery = useDebounce(searchQuery, 500)

// Hanya fetch ketika user berhenti mengetik selama 500ms
watchEffect(() => {
  if (debouncedQuery.value) {
    fetchSearchResults(debouncedQuery.value)
  }
})
</script>
```

## Tips Membuat Composable yang Baik

1. **Selalu awali nama dengan `use`** — ini konvensi Vue
2. **Return reactive values** — gunakan `ref` atau `reactive`
3. **Cleanup di `onUnmounted`** — bersihkan event listeners, intervals, dll
4. **Accept refs sebagai parameter** — buat composable lebih fleksibel
5. **Tetap fokus** — satu composable, satu tanggung jawab

```ts
// Cleanup example
export function useEventListener(target: EventTarget, event: string, callback: EventListener) {
  onMounted(() => target.addEventListener(event, callback))
  onUnmounted(() => target.removeEventListener(event, callback))
}
```

## Kesimpulan

Composables adalah salah satu fitur terbaik Vue 3. Dengan mengekstrak logic ke dalam composables, kode menjadi lebih modular, testable, dan mudah di-reuse. Mulai dari composable sederhana seperti `useCounter`, dan tingkatkan kompleksitasnya sesuai kebutuhan aplikasi.
