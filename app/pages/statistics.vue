<template>
  <NuxtLayout name="main">
    <div>
      <!-- Hero Section -->
      <section class="relative isolate overflow-hidden bg-zaccBlack text-white py-24">
        <div class="absolute inset-0">
          <img src="/el2.jpg" alt="Statistics background" class="absolute inset-0 h-full w-full object-cover opacity-20" />
          <div class="absolute inset-0 bg-zaccBlack/90"></div>
        </div>
        <div class="relative mx-auto max-w-7xl px-6">
          <div class="text-center">
            <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">{{ pageContent.title || 'ZACC Statistics' }}</h1>
            <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
              {{ pageContent.description || 'Key indicators of our anti-corruption work and partnerships.' }}
            </p>
          </div>
        </div>
      </section>

      <!-- Main Statistics Content -->
      <section class="relative py-20">
        <div
          class="absolute inset-0 -z-10 opacity-20"
          style="background: radial-gradient(40% 40% at 50% 0%, rgba(212,175,55,0.15), transparent)"
        ></div>
        <div class="mx-auto max-w-7xl px-6">
          <!-- Loading State -->
          <div v-if="loading" class="text-center py-20">
            <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-zaccGreen border-t-transparent"></div>
            <p class="mt-4 text-lg text-zaccBlack/60">Loading statistics...</p>
          </div>

          <!-- Statistics Grid -->
          <div v-else-if="statistics.length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="stat in statistics"
              :key="stat.id"
              class="rounded-2xl border border-zaccGreen/30 bg-zaccBlack p-8 text-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <div class="text-5xl font-extrabold text-white mb-3">
                <span
                  class="countup"
                  :data-target="stat.value"
                  :data-prefix="stat.prefix || ''"
                  :data-suffix="stat.suffix || ''"
                >{{ stat.value }}</span>
              </div>
              <div class="text-lg font-semibold text-white">{{ stat.label }}</div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-20">
            <i class="pi pi-chart-bar text-6xl text-zaccBlack/30 mb-4"></i>
            <h3 class="text-xl font-semibold text-zaccBlack mb-2">No Statistics Available</h3>
            <p class="text-zaccBlack/60">Statistics will be displayed here once available.</p>
          </div>

          <!-- Back to Home -->
          <div class="mt-12 text-center">
            <NuxtLink
              to="/"
              class="inline-flex items-center gap-2 rounded-md bg-zaccBlack px-6 py-3 font-semibold text-white shadow-glow hover:brightness-110"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Home
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
const { observeStats } = useCountUp()

const statistics = ref<any[]>([])
const pageContent = ref<any>({
  title: '',
  description: ''
})
const loading = ref(true)

// Fetch statistics for the statistics page
const fetchStatistics = async () => {
  loading.value = true
  try {
    const stats = await $fetch('/api/public/statistics', {
      params: { section: 'statistics' }
    })
    statistics.value = stats || []
  } catch (error) {
    console.error('Error fetching statistics:', error)
    statistics.value = []
  } finally {
    loading.value = false
  }
}

// Fetch page content
const fetchPageContent = async () => {
  try {
    const content = await $fetch('/api/public/page-content', {
      params: { pageKey: 'statistics' }
    })
    
    const titleContent = content.find((item: any) => item.sectionKey === 'statistics-title')
    const descContent = content.find((item: any) => item.sectionKey === 'statistics-description')
    
    pageContent.value = {
      title: titleContent?.content || '',
      description: descContent?.content || ''
    }
  } catch (error) {
    console.error('Error fetching page content:', error)
  }
}

onMounted(async () => {
  await Promise.all([fetchStatistics(), fetchPageContent()])
  await nextTick()
  observeStats()
})

useHead({
  title: 'Statistics - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'View comprehensive statistics and key indicators of ZACC\'s anti-corruption work, including investigations, prevention activities, and partnerships.'
    }
  ]
})
</script>

