<template>
  <section id="home" class="relative isolate overflow-hidden text-white">
    <div id="hero-slides" class="absolute inset-0 -z-10">
      <img
        v-for="(slide, index) in heroSlides"
        :key="slide.id"
        :src="slide.imageUrl"
        :alt="slide.title"
        :class="[
          'absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out',
          index === 0 ? 'opacity-100' : 'opacity-0'
        ]"
      />
    </div>
    <div class="absolute inset-0 -z-10 bg-black/60 pointer-events-none"></div>
    <div class="mx-auto max-w-7xl px-6 pb-24 pt-16 lg:pb-32 lg:pt-24">
      <div class="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span
            v-if="heroContent.badge"
            class="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white"
          >
            {{ heroContent.badge }}
          </span>
          <h1 class="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl text-white">
            {{ heroContent.title || 'Zimbabwe Anti-Corruption Commission' }}
          </h1>
          <p class="mt-4 text-base leading-relaxed text-white/90">
            {{ heroContent.description || 'Preventing and combating corruption through enforcement, public education, research, and partnerships.' }}
          </p>
          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <NuxtLink
              :to="heroContent.primaryButton?.link === '#report' ? '/report' : (heroContent.primaryButton?.link || '/report')"
              class="inline-flex items-center justify-center gap-2 rounded-md bg-zaccGreen px-6 py-3 font-semibold text-white shadow-glow hover:brightness-110"
            >
              {{ heroContent.primaryButton?.text || 'Report Corruption' }}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                class="h-4 w-4"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5l6 6-6 6M3 12h16.5" />
              </svg>
            </NuxtLink>
            <NuxtLink
              :to="heroContent.secondaryButton?.link === '#about' ? '/about' : (heroContent.secondaryButton?.link || '/about')"
              class="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 font-semibold text-zaccBlack hover:bg-white/90"
            >
              {{ heroContent.secondaryButton?.text || 'Learn More' }}
            </NuxtLink>
          </div>
          <div v-if="heroStats.length > 0" class="mt-8 grid grid-cols-3 gap-6 text-center">
            <div
              v-for="stat in heroStats"
              :key="stat.id"
              :class="[
                'rounded-lg p-4 shadow-sm text-white',
                stat.color === 'green' ? 'bg-zaccGreen' : stat.color === 'gold' ? 'bg-zaccGold' : 'bg-zaccBlack'
              ]"
            >
              <div class="text-2xl font-extrabold">
                <span
                  class="countup"
                  :data-target="stat.value"
                  :data-prefix="stat.prefix || ''"
                  :data-suffix="stat.suffix || ''"
                >0</span>
              </div>
              <div class="text-xs text-white/90">{{ stat.label }}</div>
            </div>
          </div>
        </div>
        <div class="relative"></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { startSlideshow } = useHeroSlides()
const { observeStats } = useCountUp()

const heroSlides = ref<any[]>([])
const heroContent = ref<any>({
  badge: '',
  title: '',
  description: '',
  primaryButton: null,
  secondaryButton: null
})
const heroStats = ref<any[]>([])
const loading = ref(true)

// Fetch hero slides
const fetchHeroSlides = async () => {
  try {
    const slides = await $fetch('/api/public/hero-slides')
    heroSlides.value = slides || []
  } catch (error) {
    console.error('Error fetching hero slides:', error)
    heroSlides.value = []
  }
}

// Fetch hero content
const fetchHeroContent = async () => {
  try {
    const content = await $fetch('/api/public/page-content', {
      params: { pageKey: 'home' }
    })
    
    const contentMap: any = {}
    content.forEach((item: any) => {
      contentMap[item.sectionKey] = item
    })
    
    // Normalize button links
    const primaryButton = contentMap['hero-primary-button']?.metadata || null
    if (primaryButton && primaryButton.link === '#report') {
      primaryButton.link = '/report'
    }
    
    const secondaryButton = contentMap['hero-secondary-button']?.metadata || null
    if (secondaryButton && secondaryButton.link === '#about') {
      secondaryButton.link = '/about'
    }
    
    heroContent.value = {
      badge: contentMap['hero-badge']?.content || '',
      title: contentMap['hero-title']?.content || '',
      description: contentMap['hero-description']?.content || '',
      primaryButton: primaryButton,
      secondaryButton: secondaryButton
    }
  } catch (error) {
    console.error('Error fetching hero content:', error)
  }
}

// Fetch hero statistics
const fetchHeroStats = async () => {
  try {
    const stats = await $fetch('/api/public/statistics', {
      params: { section: 'hero' }
    })
    heroStats.value = stats || []
  } catch (error) {
    console.error('Error fetching hero stats:', error)
    heroStats.value = []
  }
}

// Fetch all data
const fetchData = async () => {
  loading.value = true
  await Promise.all([
    fetchHeroSlides(),
    fetchHeroContent(),
    fetchHeroStats()
  ])
  loading.value = false
}

onMounted(async () => {
  await fetchData()
  
  // Start slideshow after slides are loaded
  if (heroSlides.value.length > 0) {
    await nextTick()
    startSlideshow('hero-slides')
  }
  
  // Observe stats after they're loaded
  await nextTick()
  observeStats()
})
</script>
