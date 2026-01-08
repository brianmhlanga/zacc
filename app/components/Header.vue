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
          <NuxtLink to="/statistics" class="text-zaccBlack/80 hover:text-zaccGreen">Statistics</NuxtLink>
          <NuxtLink to="/legislation" class="text-zaccBlack/80 hover:text-zaccGreen">Legislation</NuxtLink>
          <NuxtLink to="/report" class="text-zaccBlack/80 hover:text-zaccGreen">Report</NuxtLink>
          
          <!-- News Dropdown -->
          <div
            class="relative"
            @mouseenter="showNewsDropdown = true"
            @mouseleave="showNewsDropdown = false"
          >
            <button class="text-zaccBlack/80 hover:text-zaccGreen flex items-center gap-1 py-2">
              News
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="h-4 w-4"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            
            <!-- Dropdown Menu - with padding area that's part of hover zone -->
            <div
              v-show="showNewsDropdown"
              class="absolute top-full left-0 w-80 z-50"
            >
              <!-- Invisible padding area to bridge gap -->
              <div class="h-2"></div>
              <div class="bg-white rounded-lg shadow-xl border border-zaccGreen/20 overflow-hidden">
                <div class="max-h-96 overflow-y-auto">
                <!-- Loading State -->
                <div v-if="loadingNews" class="p-4 text-center">
                  <div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-zaccGreen border-t-transparent"></div>
                  <p class="mt-2 text-sm text-zaccBlack/60">Loading news...</p>
                </div>
                
                <!-- News Items -->
                <div v-else-if="newsItems.length > 0">
                  <div
                    v-for="article in newsItems"
                    :key="article.id"
                    class="border-b border-zaccBlack/5 last:border-b-0"
                  >
                    <NuxtLink
                      :to="`/${article.slug}`"
                      class="block p-4 hover:bg-zaccGreen/5 transition-colors"
                      @click="showNewsDropdown = false"
                    >
                      <div class="flex items-start gap-3">
                        <div
                          v-if="article.imageUrl"
                          class="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-zaccGreen/10"
                        >
                          <img
                            :src="getImageUrl(article.imageUrl)"
                            :alt="article.title"
                            class="w-full h-full object-cover"
                          />
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="text-sm font-semibold text-zaccBlack line-clamp-2 hover:text-zaccGreen transition-colors">
                            {{ article.title }}
                          </h4>
                          <p class="mt-1 text-xs text-zaccBlack/60 line-clamp-2">
                            {{ article.excerpt }}
                          </p>
                          <div class="mt-2 text-xs text-zaccBlack/50">
                            {{ formatDate(article.publishedAt || article.createdAt) }}
                          </div>
                        </div>
                      </div>
                    </NuxtLink>
                  </div>
                  
                  <!-- View All Link -->
                  <div class="border-t border-zaccGreen/20 bg-zaccGreen/5">
                    <NuxtLink
                      to="/news"
                      class="block p-4 text-center text-sm font-semibold text-zaccGreen hover:bg-zaccGreen/10 transition-colors"
                      @click="showNewsDropdown = false"
                    >
                      View All News
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="inline-block h-4 w-4 ml-1"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5l6 6-6 6M3 12h16.5" />
                      </svg>
                    </NuxtLink>
                  </div>
                </div>
                
                <!-- No News -->
                <div v-else class="p-4 text-center">
                  <p class="text-sm text-zaccBlack/60">No news available</p>
                  <NuxtLink
                    to="/news"
                    class="mt-2 inline-block text-sm font-semibold text-zaccGreen hover:underline"
                    @click="showNewsDropdown = false"
                  >
                    View All News
                  </NuxtLink>
                </div>
              </div>
              </div>
            </div>
          </div>
          
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
        <NuxtLink to="/statistics" class="py-2 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Statistics</NuxtLink>
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
const showNewsDropdown = ref(false)
const newsItems = ref<any[]>([])
const loadingNews = ref(false)

// Helper function to get image URL
const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
}

// Format date
const formatDate = (date: string | Date) => {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Fetch latest news for dropdown
const fetchNews = async () => {
  loadingNews.value = true
  try {
    const data = await $fetch('/api/public/news', {
      params: {
        limit: 5
      }
    })
    newsItems.value = data
  } catch (error: any) {
    console.error('Error fetching news:', error)
    newsItems.value = []
  } finally {
    loadingNews.value = false
  }
}


const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

// Fetch news on mount
onMounted(() => {
  fetchNews()
})
</script>
