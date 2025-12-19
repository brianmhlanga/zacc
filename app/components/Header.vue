<template>
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 border-b border-zaccGold/20">
    <div class="mx-auto max-w-7xl px-6">
      <div class="flex h-16 items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-3">
          <img src="/logo.png" alt="ZACC logo" class="h-12 sm:h-14 w-auto" />
          <div class="leading-tight">
            <div class="font-extrabold tracking-tight text-zaccBlack">ZACC</div>
            <div class="text-xs text-zaccBlack/70">Zimbabwe Anti-Corruption Commission</div>
          </div>
        </NuxtLink>

        <nav class="hidden lg:flex items-center gap-7 text-sm">
          <NuxtLink to="/about" class="text-zaccBlack/80 hover:text-zaccGreen">About</NuxtLink>
          <NuxtLink to="#stats" class="text-zaccBlack/80 hover:text-zaccGreen">Statistics</NuxtLink>
          <NuxtLink to="/legislation" class="text-zaccBlack/80 hover:text-zaccGreen">Legislation</NuxtLink>
          <NuxtLink to="/report" class="text-zaccBlack/80 hover:text-zaccGreen">Report</NuxtLink>
          <NuxtLink to="/news" class="text-zaccBlack/80 hover:text-zaccGreen">News</NuxtLink>
          <NuxtLink to="/downloads" class="text-zaccBlack/80 hover:text-zaccGreen">Downloads</NuxtLink>
          <NuxtLink to="/rulings" class="text-zaccBlack/80 hover:text-zaccGreen">Rulings</NuxtLink>
          <NuxtLink to="/contact" class="text-zaccBlack/80 hover:text-zaccGreen">Contact</NuxtLink>
        </nav>

        <div class="hidden lg:flex items-center gap-3">
          <NuxtLink
            to="/report"
            class="inline-flex items-center gap-2 rounded-md bg-zaccGreen px-4 py-2 text-sm font-semibold text-white shadow-glow hover:brightness-110 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="h-4 w-4"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5l6 6-6 6M3 12h16.5" />
            </svg>
            Report Now
          </NuxtLink>
        </div>

        <button
          id="menuBtn"
          class="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-black/10 text-zaccBlack/70 hover:text-zaccBlack"
          @click="toggleMenu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="h-6 w-6"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
      </div>
    </div>
    <div class="h-0.5 -mx-6 bg-zaccGold/30"></div>

    <!-- Mobile Menu -->
    <div
      id="mobileMenu"
      :class="['lg:hidden border-t border-black/10 bg-white', isMenuOpen ? '' : 'hidden']"
    >
      <div class="mx-auto max-w-7xl px-6 py-4 grid grid-cols-1 gap-2 text-sm">
        <NuxtLink to="/about" class="py-2 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">About</NuxtLink>
        <NuxtLink to="/legislation" class="py-2 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Legislation</NuxtLink>
        <NuxtLink to="/report" class="py-2 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Report Corruption</NuxtLink>
        <NuxtLink to="/news" class="py-2 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">News & Updates</NuxtLink>
        <NuxtLink to="/downloads" class="py-2 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Downloads</NuxtLink>
        <NuxtLink to="/rulings" class="py-2 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Court Rulings</NuxtLink>
        <NuxtLink to="/contact" class="py-2 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Contact</NuxtLink>
        <NuxtLink
          to="/report"
          class="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-zaccGreen px-4 py-2 font-semibold text-white"
          @click="closeMenu"
        >
          Report Now
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}
</script>
