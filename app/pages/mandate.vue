<template>
  <NuxtLayout name="main">
    <div>
      <!-- Hero Section -->
      <section class="relative isolate overflow-hidden bg-zaccBlack text-white py-24">
        <div class="absolute inset-0">
          <img src="/flag.jpg" alt="Zimbabwe flag" class="absolute inset-0 h-full w-full object-cover opacity-20" />
          <div class="absolute inset-0 bg-zaccBlack/90"></div>
        </div>
        <div class="relative mx-auto max-w-7xl px-6">
          <div class="text-center">
            <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">{{ getContent('hero-title', 'Our Mandate') }}</h1>
            <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
              {{ getContent('hero-subtitle', 'The mandate of the Zimbabwe Anti-Corruption Commission') }}
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
          <!-- Our Mandate -->
          <div class="mb-20">
            <div class="text-center mb-12">
              <h2 class="text-3xl font-extrabold mb-4">{{ getContent('mandate-title', 'Our Mandate') }}</h2>
              <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
              <p class="text-zaccBlack/70 max-w-3xl mx-auto">
                {{ getContent('mandate-description', 'The mandate of the Zimbabwe Anti-Corruption Commission is to combat corruption and related offences through prevention, investigation, and public education.') }}
              </p>
            </div>
            <div v-if="getMetadata('mandate-items')?.items" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="(item, index) in getMetadata('mandate-items').items"
                :key="index"
                class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border border-zaccGreen/10"
              >
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-zaccBlack/10 flex items-center justify-center">
                    <svg class="h-6 w-6 text-zaccGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div class="font-semibold mb-1">{{ item.title }}</div>
                    <p class="text-sm text-zaccBlack/70">{{ item.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Vision and Mission with Image -->
          <div class="grid gap-12 lg:grid-cols-2 items-center mb-20">
            <div class="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-lg">
              <img src="/businessman.jpg" alt="ZACC mission" class="h-full w-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-br from-zaccGreen/80 to-zaccBlack/60"></div>
              <div class="absolute inset-0 flex items-center justify-center p-8">
                <div class="text-center text-white">
                  <div class="text-4xl font-extrabold mb-2">{{ getContent('vision-mission-years-stat', '20+') }}</div>
                  <div class="text-lg">{{ getMetadata('vision-mission-years-stat')?.label || 'Years of Service' }}</div>
                </div>
              </div>
            </div>
            <div class="space-y-6">
              <div class="rounded-xl bg-gradient-to-br from-zaccGreen/10 to-zaccGold/10 p-8 border border-zaccGreen/20">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zaccGold/20 text-zaccBlack">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-6 w-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3l2.5 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 6.1 18l.9-5.4L3 8.7l5.4-.8L12 3z" />
                  </svg>
                </div>
                <div class="font-semibold text-xl mb-3">{{ pageContent['vision-title']?.title || 'Our Vision' }}</div>
                <p class="text-zaccBlack/70 leading-relaxed">
                  {{ getContent('vision-title', 'A corruption-free Zimbabwe founded on integrity, transparency, and accountability.') }}
                </p>
              </div>
              <div class="rounded-xl bg-gradient-to-br from-zaccGreen/10 to-zaccGold/10 p-8 border border-zaccGreen/20">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zaccBlack/20 text-zaccGreen">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-6 w-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15z" />
                  </svg>
                </div>
                <div class="font-semibold text-xl mb-3">{{ pageContent['mission-title']?.title || 'Our Mission' }}</div>
                <p class="text-zaccBlack/70 leading-relaxed">
                  {{ getContent('mission-title', 'To effectively prevent and combat corruption through investigation, prevention, public education, and strategic partnerships.') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Core Values -->
          <div class="mb-20">
            <div class="text-center mb-12">
              <h2 class="text-3xl font-extrabold mb-4">{{ getContent('core-values-title', 'Our Core Values') }}</h2>
              <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
              <p class="text-zaccBlack/70 max-w-3xl mx-auto">
                {{ getContent('core-values-description', 'The work of the Commission is guided by the following core values:') }}
              </p>
            </div>
            <div v-if="getMetadata('core-values-items')?.values" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div
                v-for="(value, index) in getMetadata('core-values-items').values"
                :key="index"
                class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] text-center border border-zaccGreen/10 hover:border-zaccGreen/30 transition"
              >
                <div class="text-3xl font-extrabold text-zaccGreen mb-2">{{ value.letter }}</div>
                <div class="font-semibold text-zaccBlack mb-2">{{ value.title }}</div>
                <p class="text-sm text-zaccBlack/70">{{ value.description }}</p>
              </div>
            </div>
          </div>

          <!-- Our Functions with Image -->
          <div class="mb-20">
            <div class="text-center mb-12">
              <h2 class="text-3xl font-extrabold mb-4">{{ getContent('functions-title', 'Our Functions') }}</h2>
              <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
              <p class="text-zaccBlack/70 max-w-3xl mx-auto">
                {{ getContent('functions-description', 'In fulfilling its constitutional and statutory obligations, ZACC performs the following functions:') }}
              </p>
            </div>
            <div class="grid gap-8 lg:grid-cols-2 items-center">
              <div v-if="getMetadata('functions-items')?.items" class="space-y-4">
                <div
                  v-for="(item, index) in getMetadata('functions-items').items.slice(0, 4)"
                  :key="index"
                  class="flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm border border-zaccGreen/10"
                >
                  <svg class="h-6 w-6 text-zaccGreen mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-zaccBlack/80">{{ item }}</span>
                </div>
              </div>
              <div class="relative h-[400px] rounded-2xl overflow-hidden shadow-lg">
                <img src="/gavel.jpg" alt="ZACC functions" class="h-full w-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-zaccBlack/70 to-transparent"></div>
              </div>
            </div>
            <div v-if="getMetadata('functions-items')?.items" class="grid gap-4 sm:grid-cols-2 mt-8">
              <div
                v-for="(item, index) in getMetadata('functions-items').items.slice(4)"
                :key="index"
                class="flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm border border-zaccGreen/10"
              >
                <svg class="h-6 w-6 text-zaccGreen mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-zaccBlack/80">{{ item }}</span>
              </div>
            </div>
          </div>

          <!-- Back to About -->
          <div class="text-center pt-8">
            <NuxtLink
              to="/about"
              class="inline-flex items-center gap-2 rounded-md bg-zaccGold px-6 py-3 font-semibold text-white shadow-glow hover:bg-zaccGold/90 transition"
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
  title: 'Our Mandate - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Learn about ZACC\'s mandate, vision, mission, core values, and functions. The Zimbabwe Anti-Corruption Commission\'s commitment to combating corruption.'
    }
  ]
})

const pageContent = ref<any>({})

// Fetch all mandate page content (using 'about' pageKey since content is stored there)
const fetchPageContent = async () => {
  try {
    const content = await $fetch('/api/public/page-content', {
      params: { pageKey: 'about' }
    })
    
    // Organize content by sectionKey
    const contentMap: any = {}
    content.forEach((item: any) => {
      contentMap[item.sectionKey] = item
    })
    
    pageContent.value = contentMap
  } catch (error) {
    console.error('Error fetching mandate page content:', error)
  }
}

// Helper to get content
const getContent = (sectionKey: string, fallback: string = '') => {
  return pageContent.value[sectionKey]?.content || fallback
}

// Helper to get metadata
const getMetadata = (sectionKey: string) => {
  return pageContent.value[sectionKey]?.metadata || null
}

onMounted(() => {
  fetchPageContent()
})
</script>
