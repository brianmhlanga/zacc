<template>
  <section id="news" class="relative py-20">
    <div class="mx-auto max-w-7xl px-6">
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-2xl font-extrabold">Latest News & Updates</h2>
          <div class="mt-2 h-1 w-20 rounded bg-zaccGold"></div>
          <p class="mt-2 text-zaccBlack/60">Announcements, case updates, events, and educational insights.</p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="relative w-full sm:w-64">
            <input
              id="newsSearch"
              v-model="searchQuery"
              type="search"
              placeholder="Search news..."
              class="w-full rounded-md border border-black/10 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-zaccBlack/40 outline-none focus:border-zaccGold"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zaccBlack/40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z"
              />
            </svg>
          </div>
          <NuxtLink
            to="/news"
            class="inline-flex items-center justify-center gap-2 rounded-md bg-zaccGold px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-zaccGold/90"
          >
            View All
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
          </NuxtLink>
        </div>
      </div>
      <!-- Loading State -->
      <div v-if="loading" id="newsGrid" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="i in 6"
          :key="i"
          class="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] animate-pulse"
        >
          <div class="h-1 bg-zaccGold"></div>
          <div class="aspect-[16/9] bg-zaccBlack/10"></div>
          <div class="p-5">
            <div class="h-3 bg-zaccBlack/10 rounded w-24 mb-2"></div>
            <div class="h-5 bg-zaccBlack/10 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-zaccBlack/10 rounded w-full"></div>
          </div>
        </article>
      </div>

      <!-- News Grid -->
      <div v-else-if="newsItems.length > 0" id="newsGrid" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="article in newsItems"
          :key="article.id"
          :to="`/${article.slug}`"
          class="news-card group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] hover:shadow-lg transition-all"
          :data-title="article.title"
          :data-body="article.excerpt"
        >
          <div class="h-1 bg-zaccGold"></div>
          <div class="aspect-[16/9] overflow-hidden bg-zaccBlack/10">
            <img
              v-if="article.imageUrl"
              :src="getImageUrl(article.imageUrl)"
              :alt="article.title"
              class="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
            <div v-else class="h-full w-full flex items-center justify-center bg-zaccBlack/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12 text-zaccGreen/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
          </div>
          <div class="p-5">
            <div class="text-xs text-zaccBlack/50">
              {{ formatDate(article.publishedAt || article.createdAt) }}
            </div>
            <h3 class="mt-1 text-base font-semibold group-hover:text-zaccYellow transition-colors">
              {{ article.title }}
            </h3>
            <p class="mt-2 text-sm text-zaccBlack/60 line-clamp-2">
              {{ article.excerpt }}
            </p>
          </div>
        </NuxtLink>
      </div>

      <!-- No News -->
      <div v-else-if="!loading && newsItems.length === 0" class="text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="mx-auto h-16 w-16 text-zaccBlack/20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
        <h3 class="mt-4 text-lg font-semibold text-zaccBlack">No News Available</h3>
        <p class="mt-2 text-sm text-zaccBlack/60">Check back later for the latest updates.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { setupSearch } = useSearch()

const newsItems = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')

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

// Fetch news from API
const fetchNews = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/public/news', {
      params: {
        limit: 6
      }
    })
    newsItems.value = data
  } catch (error: any) {
    console.error('Error fetching news:', error)
    newsItems.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchNews()
  // Setup search after news is loaded - this will handle DOM-based filtering
  nextTick(() => {
    setupSearch('newsSearch', '.news-card')
  })
})
</script>
