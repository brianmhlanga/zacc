<template>
  <div class="relative z-40 hidden md:block bg-zaccGreen text-white">
    <div class="mx-auto max-w-7xl px-6">
      <div class="flex items-center justify-between py-2 text-sm">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center gap-2 text-white/90">
            <span class="h-2 w-2 rounded-full bg-white"></span>
            <span id="newsFlashText">News Flash</span>
          </span>
          <NuxtLink
            to="#news"
            class="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/20"
          >
            Read More
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="h-3 w-3"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13.5 4.5l6 6-6 6M3 12h16.5"
              />
            </svg>
          </NuxtLink>
        </div>
        <div class="flex items-center gap-6">
          <div class="hidden sm:flex items-center gap-2 text-white">
            <a
              href="#"
              aria-label="X"
              class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/50 hover:border-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                <path
                  d="M18.3 5.7L13.98 11l4.52 7.3h-2.22l-3.55-5.75-4.3 5.75H4.22L9 12.98 4.92 5.7h2.23l3.24 5.29 3.95-5.29h3.96z"
                />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Facebook"
              class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/50 hover:border-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                <path
                  d="M13 22v-8h3l.5-3H13V9.5c0-.86.24-1.44 1.5-1.44H17V5.3c-.26-.03-1.16-.1-2.21-.1-2.18 0-3.79 1.33-3.79 3.77V11H8v3h3v8h2z"
                />
              </svg>
            </a>
            <a
              href="#"
              aria-label="YouTube"
              class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/50 hover:border-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                <path
                  d="M21.6 7.2a2.75 2.75 0 00-1.94-1.95C17.9 5 12 5 12 5s-5.9 0-7.66.25A2.75 2.75 0 002.4 7.2 28.4 28.4 0 002.15 12a28.4 28.4 0 00.25 4.8 2.75 2.75 0 001.94 1.95C6.1 19 12 19 12 19s5.9 0 7.66-.25a2.75 2.75 0 001.94-1.95c.17-1.58.25-3.2.25-4.8 0-1.6-.08-3.22-.25-4.8zM10 15V9l5 3-5 3z"
                />
              </svg>
            </a>
          </div>
          <NuxtLink to="/careers" class="inline-flex items-center gap-2 font-semibold text-white hover:opacity-90 transition-colors">
            Careers
          </NuxtLink>
          <NuxtLink to="/gallery" class="text-white/90 hover:text-white">Gallery</NuxtLink>
        </div>
      </div>
      <!-- Hidden data source for News Flash rotation -->
      <div id="flashData" class="hidden">
        <span class="flash-item">Court upholds asset seizure in landmark case</span>
        <span class="flash-item">Compliance monitoring initiative launches nationwide</span>
        <span class="flash-item">Stakeholder engagement strengthens integrity systems</span>
      </div>
    </div>
    <!-- Zimbabwe flag accent stripes on the right -->
    <div
      class="pointer-events-none absolute inset-y-0 right-0 w-16 bg-[repeating-linear-gradient(90deg,#209341_0_8px,#d4af37_8px_16px,#e11d2d_16px_24px,#111111_24px_32px,#e11d2d_32px_40px,#d4af37_40px_48px,#209341_48px_56px)]"
    ></div>
  </div>
</template>

<script setup lang="ts">
const { startNewsFlash } = useNewsFlash()

onMounted(() => {
  startNewsFlash('newsFlashText', 'flashData')
})
</script>
