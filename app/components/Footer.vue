<template>
  <footer class="relative overflow-hidden border-t border-black/10">
    <div class="absolute inset-0 bg-zaccBlack"></div>
    <div class="relative z-10 mx-auto max-w-7xl px-6 py-10 text-white">
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div class="flex items-center gap-3">
            <img src="/logo.png" alt="ZACC logo" class="h-36 w-auto" />
          </div>
          <p class="mt-3 text-sm text-white/80">Working together to build a corruption-free Zimbabwe.</p>
        </div>
        <div>
          <div class="font-semibold">Quick Links</div>
          <ul class="mt-3 space-y-2 text-sm text-white/80">
            <li>
              <NuxtLink to="/about" class="hover:text-white">About</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/legislation" class="hover:text-white">Legislation</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/report" class="hover:text-white">Report Corruption</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/downloads" class="hover:text-white">Downloads</NuxtLink>
            </li>
          </ul>
        </div>
        <div>
          <div class="font-semibold">Resources</div>
          <ul class="mt-3 space-y-2 text-sm text-white/80">
            <li>
              <NuxtLink to="/news" class="hover:text-white">News & Updates</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/contact" class="hover:text-white">Contact</NuxtLink>
            </li>
          </ul>
        </div>
        <div>
          <div class="font-semibold">Stay Informed</div>
          <form class="mt-3 flex gap-2" @submit.prevent="handleSubscribe">
            <input
              v-model="email"
              type="email"
              placeholder="Email address"
              class="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm placeholder:text-zaccBlack/40 outline-none focus:border-zaccGold"
            />
            <button
              type="submit"
              class="rounded-md bg-zaccGold px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-zaccGold/90"
            >
              Subscribe
            </button>
          </form>
          <div class="mt-4 flex gap-3 text-white">
            <a
              href="#"
              aria-label="X"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zaccGold/70 hover:border-zaccGold hover:bg-zaccGold/20 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4 text-zaccGold">
                <path
                  d="M18.3 5.7L13.98 11l4.52 7.3h-2.22l-3.55-5.75-4.3 5.75H4.22L9 12.98 4.92 5.7h2.23l3.24 5.29 3.95-5.29h3.96z"
                />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Facebook"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zaccGold/70 hover:border-zaccGold hover:bg-zaccGold/20 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4 text-zaccGold">
                <path
                  d="M13 22v-8h3l.5-3H13V9.5c0-.86.24-1.44 1.5-1.44H17V5.3c-.26-.03-1.16-.1-2.21-.1-2.18 0-3.79 1.33-3.79 3.77V11H8v3h3v8h2z"
                />
              </svg>
            </a>
            <a
              href="#"
              aria-label="YouTube"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zaccGold/70 hover:border-zaccGold hover:bg-zaccGold/20 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4 text-zaccGold">
                <path
                  d="M21.6 7.2a2.75 2.75 0 00-1.94-1.95C17.9 5 12 5 12 5s-5.9 0-7.66.25A2.75 2.75 0 002.4 7.2 28.4 28.4 0 002.15 12a28.4 28.4 0 00.25 4.8 2.75 2.75 0 001.94 1.95C6.1 19 12 19 12 19s5.9 0 7.66-.25a2.75 2.75 0 001.94-1.95c.17-1.58.25-3.2.25-4.8 0-1.6-.08-3.22-.25-4.8zM10 15V9l5 3-5 3z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div class="mt-8 border-t border-white/30 pt-5 text-xs text-white/80">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {{ currentYear }} Zimbabwe Anti-Corruption Commission. All rights reserved.</p>
          <p>Designed by Webdev</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const email = ref('')
const currentYear = new Date().getFullYear()

const handleSubscribe = () => {
  // Handle subscription
  console.log('Subscribed:', email.value)
  email.value = ''
}
</script>
