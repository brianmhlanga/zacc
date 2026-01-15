<template>
  <NuxtLayout name="main">
    <div>
      <!-- Hero Section -->
      <section class="relative isolate overflow-hidden bg-zaccBlack text-white py-24">
        <div class="absolute inset-0">
          <img src="/gavel2.jpg" alt="Executive Units" class="absolute inset-0 h-full w-full object-cover opacity-20" />
          <div class="absolute inset-0 bg-zaccBlack/90"></div>
        </div>
        <div class="relative mx-auto max-w-7xl px-6">
          <div class="text-center">
            <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">{{ getContent('hero-title', 'Executive Units') }}</h1>
            <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
              {{ getContent('hero-subtitle', 'ZACC Executive Units and Their Functions') }}
            </p>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <section class="relative py-20">
        <div
          class="absolute inset-0 -z-10 opacity-20"
          style="background: radial-gradient(40% 40% at 50% 0%, rgba(212,175,55,0.15), transparent)"
        ></div>
        <div class="mx-auto max-w-7xl px-6">
          <!-- Units List -->
          <div v-if="units.length > 0" class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="(unit, index) in units"
              :key="index"
              class="rounded-2xl bg-white p-6 shadow-lg border border-zaccGreen/10 hover:border-zaccGreen/30 transition"
            >
              <h2 class="text-xl font-extrabold text-zaccBlack mb-4">{{ unit.name }}</h2>
              <p class="text-zaccBlack/70 mb-6 text-sm">{{ unit.description }}</p>
              
              <ul class="space-y-3">
                <li
                  v-for="(func, funcIndex) in unit.functions"
                  :key="funcIndex"
                  class="flex items-start gap-3 text-zaccBlack/80 text-sm"
                >
                  <svg class="h-5 w-5 text-zaccGreen mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ func }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Loading State -->
          <div v-else-if="loading" class="text-center py-20">
            <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zaccGreen border-t-transparent"></div>
            <p class="mt-4 text-zaccBlack/60">Loading units...</p>
          </div>

          <!-- No Data -->
          <div v-else class="text-center py-20">
            <i class="pi pi-sitemap text-6xl text-zaccBlack/20 mb-4"></i>
            <h3 class="text-xl font-semibold text-zaccBlack mb-2">No Units Found</h3>
            <p class="text-zaccBlack/60">Unit information will be available soon.</p>
          </div>

          <!-- Back to About -->
          <div class="text-center pt-8">
            <NuxtLink
              to="/about"
              class="inline-flex items-center gap-2 rounded-md bg-zaccBlack px-6 py-3 font-semibold text-white shadow-glow hover:brightness-110"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to About Us
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  title: 'Executive Units - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Learn about ZACC executive units and their functions. Explore the organizational structure of the Zimbabwe Anti-Corruption Commission.'
    }
  ]
})

const pageContent = ref<any>({})
const units = ref<any[]>([])
const loading = ref(true)

// Fetch page content
const fetchPageContent = async () => {
  loading.value = true
  try {
    const content = await $fetch('/api/public/page-content', {
      params: { pageKey: 'units' }
    })
    
    // Organize content by sectionKey
    const contentMap: any = {}
    content.forEach((item: any) => {
      contentMap[item.sectionKey] = item
    })
    
    pageContent.value = contentMap
    
    // Extract units from metadata
    if (contentMap['units-list']?.metadata?.units) {
      units.value = contentMap['units-list'].metadata.units
    }
  } catch (error) {
    console.error('Error fetching units page content:', error)
  } finally {
    loading.value = false
  }
}

// Helper to get content
const getContent = (sectionKey: string, fallback: string = '') => {
  return pageContent.value[sectionKey]?.content || fallback
}

onMounted(() => {
  fetchPageContent()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

