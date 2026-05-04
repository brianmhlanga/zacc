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
              class="inline-flex items-center justify-center gap-2 rounded-md bg-zaccGold px-6 py-3 font-semibold text-white shadow-glow hover:bg-zaccGold/90"
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
                stat.color === 'green' ? 'bg-zaccBlack' : stat.color === 'gold' ? 'bg-zaccGold' : 'bg-zaccBlack'
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
        <div class="relative lg:min-h-[420px]">
          <div
            v-if="citizenHero.enabled && (citizenHero.items.length > 0 || citizenHero.footerText || citizenHero.footerCta)"
            class="rounded-2xl border border-zaccGold/50 bg-black/55 p-4 shadow-xl backdrop-blur-md sm:p-5 lg:absolute lg:right-0 lg:top-0 lg:w-full lg:max-w-sm"
          >
            <div class="flex items-start gap-2.5 border-b border-white/10 px-0.5 pb-3 sm:gap-3 sm:pb-4">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zaccGold/60 text-zaccGold sm:h-10 sm:w-10"
              >
                <i class="pi pi-users text-base sm:text-lg"></i>
              </div>
              <div class="min-w-0 pr-0.5">
                <h2 class="text-base font-bold text-zaccGold sm:text-lg">{{ citizenHero.title }}</h2>
                <p v-if="citizenHero.subtitle" class="mt-1 text-xs leading-snug text-white/85 sm:text-sm">
                  {{ citizenHero.subtitle }}
                </p>
              </div>
            </div>

            <div
              v-if="citizenHero.items.length > 0"
              class="citizen-actions-scroll mt-3 max-h-[min(20rem,48vh)] space-y-2.5 overflow-y-auto px-0.5 py-0.5 sm:mt-4 sm:space-y-3"
            >
              <div
                v-for="item in citizenHero.items"
                :key="item.id"
                :class="[
                  'grid min-h-0 overflow-hidden rounded-lg border border-white/10 bg-white/5',
                  citizenHeroItemHasQr(item)
                    ? 'grid-cols-[minmax(0,1fr)_minmax(5.25rem,22%)] sm:grid-cols-[minmax(0,1fr)_7.5rem] md:grid-cols-[minmax(0,1fr)_8.5rem]'
                    : 'grid-cols-1'
                ]"
              >
                <div class="flex min-h-[4rem] min-w-0 gap-2.5 p-2.5 sm:min-h-[4.25rem] sm:gap-3 sm:p-3">
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm text-white sm:h-10 sm:w-10"
                    :class="iconToneClass(item.iconTone)"
                  >
                    <i :class="`pi pi-${item.iconName || 'users'}`"></i>
                  </div>
                  <div class="min-w-0 flex-1 flex flex-col justify-center">
                    <div class="font-semibold text-sm text-white leading-snug">{{ item.title }}</div>
                    <p v-if="item.description" class="mt-1 text-xs leading-relaxed text-white/70 line-clamp-2">
                      {{ item.description }}
                    </p>
                    <div class="mt-2 flex flex-wrap items-center gap-2">
                      <template v-if="item.actionStyle === 'BUTTON' || item.actionStyle === 'BUTTON_QR'">
                        <component
                          :is="ctaComponent(item.ctaUrl)"
                          v-bind="ctaBind(item.ctaUrl)"
                          class="inline-flex items-center gap-1 rounded-md bg-zaccGold px-3 py-1.5 text-xs font-bold text-zaccBlack hover:bg-zaccGold/90"
                        >
                          {{ item.ctaLabel }}
                          <i class="pi pi-arrow-right text-xs"></i>
                        </component>
                      </template>
                      <template v-else-if="item.actionStyle === 'LINK'">
                        <component
                          :is="ctaComponent(item.ctaUrl)"
                          v-bind="ctaBind(item.ctaUrl)"
                          class="text-xs font-semibold text-zaccGold hover:underline inline-flex items-center gap-1"
                        >
                          {{ item.ctaLabel }}
                          <i class="pi pi-arrow-right text-xs"></i>
                        </component>
                      </template>
                    </div>
                  </div>
                </div>
                <div
                  v-if="citizenHeroItemHasQr(item)"
                  class="relative flex h-full min-h-0 flex-col border-l border-white/10 bg-transparent p-1 sm:p-1.5"
                >
                  <img
                    :src="mediaUrl(item.qrImageUrl!)"
                    alt=""
                    class="min-h-0 w-full flex-1 rounded-md object-contain"
                  />
                </div>
              </div>
            </div>

            <div
              v-if="citizenHero.footerText || citizenHero.footerCta"
              class="mt-3 border-t border-white/10 px-0.5 pt-3 sm:mt-4 sm:pt-4"
            >
              <p v-if="citizenHero.footerText" class="text-center text-xs text-white/80">
                {{ citizenHero.footerText }}
              </p>
              <div v-if="citizenHero.footerCta" class="mt-2.5 flex justify-center sm:mt-3">
                <component
                  :is="ctaComponent(citizenHero.footerCta.url)"
                  v-bind="ctaBind(citizenHero.footerCta.url)"
                  class="inline-flex items-center justify-center rounded-md border border-zaccGold px-5 py-2 text-sm font-semibold text-zaccGold hover:bg-zaccGold/10"
                >
                  {{ citizenHero.footerCta.label }}
                </component>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { startSlideshow } = useHeroSlides()
const { observeStats } = useCountUp()

const citizenHero = reactive({
  enabled: false,
  title: '',
  subtitle: '',
  footerText: '',
  footerCta: null as { label: string; url: string } | null,
  items: [] as Array<{
    id: string
    title: string
    description: string
    iconName: string
    iconTone: string
    actionStyle: string
    ctaLabel: string | null
    ctaUrl: string | null
    qrImageUrl: string | null
  }>
})

function citizenHeroItemHasQr(item: (typeof citizenHero.items)[0]) {
  return (
    (item.actionStyle === 'QR' || item.actionStyle === 'BUTTON_QR') &&
    Boolean(item.qrImageUrl?.trim())
  )
}

function iconToneClass(tone: string) {
  switch (tone) {
    case 'red':
      return 'bg-red-900/75'
    case 'emerald':
      return 'bg-emerald-900/65'
    case 'gold':
      return 'bg-zaccGold/30 text-zaccBlack'
    default:
      return 'bg-white/10'
  }
}

function isExternal(url: string) {
  return /^https?:\/\//i.test(url) || url.startsWith('//')
}

function ctaComponent(url: string | null | undefined) {
  if (!url || url === '#') return 'span'
  return isExternal(url) ? 'a' : 'NuxtLink'
}

function ctaBind(url: string | null | undefined) {
  if (!url) return {}
  if (isExternal(url)) {
    return { href: url, target: '_blank', rel: 'noopener noreferrer' }
  }
  return { to: url }
}

function mediaUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/api/')) return url
  if (url.startsWith('/uploads/')) return `/api${url}`
  if (url.startsWith('/')) return `/api${url}`
  return `/api/uploads/${url}`
}

async function fetchCitizenHero() {
  try {
    const data = await $fetch<{
      enabled: boolean
      title: string
      subtitle: string
      footerText: string
      footerCta: { label: string; url: string } | null
      items: typeof citizenHero.items
    }>('/api/public/citizen-hero')
    citizenHero.enabled = Boolean(data.enabled)
    citizenHero.title = data.title || 'Citizen Actions'
    citizenHero.subtitle = data.subtitle || ''
    citizenHero.footerText = data.footerText || ''
    citizenHero.footerCta = data.footerCta
    citizenHero.items = data.items || []
  } catch (e) {
    console.error('Error fetching citizen hero:', e)
    citizenHero.enabled = false
    citizenHero.items = []
  }
}

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
    fetchHeroStats(),
    fetchCitizenHero()
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

<style scoped>
.citizen-actions-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(212, 175, 55, 0.7) rgba(255, 255, 255, 0.08);
}
.citizen-actions-scroll::-webkit-scrollbar {
  width: 6px;
}
.citizen-actions-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;
}
.citizen-actions-scroll::-webkit-scrollbar-thumb {
  background: rgba(212, 175, 55, 0.65);
  border-radius: 6px;
}
</style>
