<template>
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 border-b border-zaccGold/20">
    <div class="mx-auto max-w-7xl px-6">
      <div class="flex h-16 items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-3">
          <img src="/logo.png" alt="ZACC logo" class="h-12 sm:h-14 w-auto" />
          <div class="leading-tight">
            <div class="text-[2.25rem] font-black tracking-[3px] text-zaccGold">ZACC</div>
            <div class="text-xs font-semibold text-zaccGold/95">Refuse, Resist, Report Corruption</div>
          </div>
        </NuxtLink>

        <nav class="hidden lg:flex items-center gap-7 text-sm">
          <!-- About Us Dropdown -->
          <div
            class="relative"
            @mouseenter="showAboutDropdown = true"
            @mouseleave="showAboutDropdown = false"
          >
            <button class="text-zaccBlack/80 hover:text-zaccGreen flex items-center gap-1 py-2">
              About Us
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
            
            <!-- Dropdown Menu -->
            <div
              v-show="showAboutDropdown"
              class="absolute top-full left-0 w-56 z-50"
            >
              <!-- Invisible padding area to bridge gap -->
              <div class="h-2"></div>
              <div class="bg-white rounded-lg shadow-xl border border-zaccGreen/20 overflow-hidden">
                <NuxtLink
                  to="/mandate"
                  class="block px-4 py-3 text-sm text-zaccBlack hover:bg-zaccBlack/5 hover:text-zaccGreen transition-colors"
                  @click="showAboutDropdown = false"
                >
                  Our Mandate
                </NuxtLink>
                <div class="border-t border-zaccBlack/5"></div>
                <NuxtLink
                  to="/commissioners"
                  class="block px-4 py-3 text-sm text-zaccBlack hover:bg-zaccBlack/5 hover:text-zaccGreen transition-colors"
                  @click="showAboutDropdown = false"
                >
                  Commissioners
                </NuxtLink>
                <div class="border-t border-zaccBlack/5"></div>
                <NuxtLink
                  to="/executives"
                  class="block px-4 py-3 text-sm text-zaccBlack hover:bg-zaccBlack/5 hover:text-zaccGreen transition-colors"
                  @click="showAboutDropdown = false"
                >
                  Executives
                </NuxtLink>
                <div class="border-t border-zaccBlack/5"></div>
                <NuxtLink
                  to="/departments"
                  class="block px-4 py-3 text-sm text-zaccBlack hover:bg-zaccBlack/5 hover:text-zaccGreen transition-colors"
                  @click="showAboutDropdown = false"
                >
                  Departments
                </NuxtLink>
                <div class="border-t border-zaccBlack/5"></div>
                <NuxtLink
                  to="/units"
                  class="block px-4 py-3 text-sm text-zaccBlack hover:bg-zaccBlack/5 hover:text-zaccGreen transition-colors"
                  @click="showAboutDropdown = false"
                >
                  Units
                </NuxtLink>
              </div>
            </div>
          </div>
          
          <!-- Resources Dropdown -->
          <div
            class="relative"
            @mouseenter="showResourcesDropdown = true"
            @mouseleave="showResourcesDropdown = false"
          >
            <button class="text-zaccBlack/80 hover:text-zaccGreen flex items-center gap-1 py-2">
              Resources
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
            
            <!-- Dropdown Menu -->
            <div
              v-show="showResourcesDropdown"
              class="absolute top-full left-0 w-56 z-50"
            >
              <!-- Invisible padding area to bridge gap -->
              <div class="h-2"></div>
              <div class="bg-white rounded-lg shadow-xl border border-zaccGreen/20 overflow-hidden">
                <NuxtLink
                  to="/legislation"
                  class="block px-4 py-3 text-sm text-zaccBlack hover:bg-zaccBlack/5 hover:text-zaccGreen transition-colors"
                  @click="showResourcesDropdown = false"
                >
                  Legislation
                </NuxtLink>
                <div class="border-t border-zaccBlack/5"></div>
                <NuxtLink
                  to="/rulings"
                  class="block px-4 py-3 text-sm text-zaccBlack hover:bg-zaccBlack/5 hover:text-zaccGreen transition-colors"
                  @click="showResourcesDropdown = false"
                >
                  Rulings
                </NuxtLink>
                <div class="border-t border-zaccBlack/5"></div>
                <NuxtLink
                  to="/statistics"
                  class="block px-4 py-3 text-sm text-zaccBlack hover:bg-zaccBlack/5 hover:text-zaccGreen transition-colors"
                  @click="showResourcesDropdown = false"
                >
                  Statistics
                </NuxtLink>
                <div class="border-t border-zaccBlack/5"></div>
                <NuxtLink
                  to="/careers"
                  class="block px-4 py-3 text-sm text-zaccBlack hover:bg-zaccBlack/5 hover:text-zaccGreen transition-colors"
                  @click="showResourcesDropdown = false"
                >
                  Vacancies
                </NuxtLink>
                <div class="border-t border-zaccBlack/5"></div>
                <NuxtLink
                  to="/downloads"
                  class="block px-4 py-3 text-sm text-zaccBlack hover:bg-zaccBlack/5 hover:text-zaccGreen transition-colors"
                  @click="showResourcesDropdown = false"
                >
                  Downloads
                </NuxtLink>
                <div class="border-t border-zaccBlack/5"></div>
                <NuxtLink
                  to="/tenders"
                  class="block px-4 py-3 text-sm text-zaccBlack hover:bg-zaccBlack/5 hover:text-zaccGreen transition-colors"
                  @click="showResourcesDropdown = false"
                >
                  Tenders
                </NuxtLink>
              </div>
            </div>
          </div>
          
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
                      class="block p-4 hover:bg-zaccBlack/5 transition-colors"
                      @click="showNewsDropdown = false"
                    >
                      <div class="flex items-start gap-3">
                        <div
                          v-if="article.imageUrl"
                          class="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-zaccBlack/10"
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
                  <div class="border-t border-zaccGreen/20 bg-zaccBlack/5">
                    <NuxtLink
                      to="/news"
                      class="block p-4 text-center text-sm font-semibold text-zaccGreen hover:bg-zaccBlack/10 transition-colors"
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
          
          <NuxtLink to="/gallery" class="text-zaccBlack/80 hover:text-zaccGreen">Gallery</NuxtLink>
          <NuxtLink to="/contact" class="text-zaccBlack/80 hover:text-zaccGreen">Contact</NuxtLink>
        </nav>

        <div class="hidden lg:flex items-center gap-3">
          <NuxtLink
            to="/report"
            class="report-now-button inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 relative overflow-hidden"
          >
            <span class="relative z-10 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="h-5 w-5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Report Now
            </span>
            <span class="absolute inset-0 bg-white/20 animate-pulse"></span>
          </NuxtLink>
          <!-- Miniature Flying Flag -->
          <div class="relative flex items-center ml-2">
            <img 
              src="/flag.gif" 
              alt="Zimbabwe Flag" 
              class="h-8 w-auto object-contain"
              style="max-width: 50px;"
            />
          </div>
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
        <NuxtLink to="/about" class="py-2 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">About Us</NuxtLink>
        <NuxtLink to="/mandate" class="py-2 pl-6 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Our Mandate</NuxtLink>
        <NuxtLink to="/commissioners" class="py-2 pl-6 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Commissioners</NuxtLink>
        <NuxtLink to="/executives" class="py-2 pl-6 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Executives</NuxtLink>
        <NuxtLink to="/departments" class="py-2 pl-6 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Departments</NuxtLink>
        <NuxtLink to="/units" class="py-2 pl-6 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Units</NuxtLink>
        <div class="py-2 text-zaccBlack/70 font-semibold">Resources</div>
        <NuxtLink to="/legislation" class="py-2 pl-6 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Legislation</NuxtLink>
        <NuxtLink to="/rulings" class="py-2 pl-6 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Rulings</NuxtLink>
        <NuxtLink to="/statistics" class="py-2 pl-6 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Statistics</NuxtLink>
        <NuxtLink to="/careers" class="py-2 pl-6 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Vacancies</NuxtLink>
        <NuxtLink to="/downloads" class="py-2 pl-6 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Downloads</NuxtLink>
        <NuxtLink to="/tenders" class="py-2 pl-6 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Tenders</NuxtLink>
        <NuxtLink to="/report" class="py-2 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Report Corruption</NuxtLink>
        <NuxtLink to="/news" class="py-2 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">News & Updates</NuxtLink>
        <NuxtLink to="/gallery" class="py-2 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Gallery</NuxtLink>
        <NuxtLink to="/contact" class="py-2 text-zaccBlack/70 hover:text-zaccBlack" @click="closeMenu">Contact</NuxtLink>
        <NuxtLink
          to="/report"
          class="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-zaccGold px-4 py-2 font-semibold text-white hover:bg-zaccGold/90"
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
const showAboutDropdown = ref(false)
const showResourcesDropdown = ref(false)
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
