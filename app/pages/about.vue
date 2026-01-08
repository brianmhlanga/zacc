<template>
  <NuxtLayout name="main">
    <div>
      <!-- Hero Section for About Page -->
    <section class="relative isolate overflow-hidden bg-zaccGreen text-white py-24">
      <div class="absolute inset-0">
        <img src="/flag.jpg" alt="Zimbabwe flag" class="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div class="absolute inset-0 bg-zaccGreen/90"></div>
      </div>
      <div class="relative mx-auto max-w-7xl px-6">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">{{ getContent('hero-title', 'About Us') }}</h1>
          <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
            {{ getContent('hero-subtitle', 'Zimbabwe Anti-Corruption Commission (ZACC)') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Main About Content -->
    <section class="relative py-20">
      <div
        class="absolute inset-0 -z-10 opacity-20"
        style="background: radial-gradient(40% 40% at 50% 0%, rgba(212,175,55,0.15), transparent)"
      ></div>
      <div class="mx-auto max-w-7xl px-6">
        <!-- Introduction with Image -->
        <div class="grid gap-12 lg:grid-cols-2 items-center mb-20">
          <div>
            <h2 class="text-3xl font-extrabold mb-4">{{ getContent('introduction-title', 'Zimbabwe Anti-Corruption Commission') }}</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mb-6"></div>
            <p class="text-zaccBlack/70 leading-relaxed mb-4">
              {{ getContent('introduction-paragraph-1', 'The Zimbabwe Anti-Corruption Commission (ZACC) is an independent constitutional commission established in terms of the Constitution of Zimbabwe and the Anti-Corruption Commission Act [Chapter 9:22].') }}
            </p>
            <p class="text-zaccBlack/70 leading-relaxed">
              {{ getContent('introduction-paragraph-2', 'ZACC operates independently and without fear, favour, or prejudice, guided by the Constitution and the laws of Zimbabwe.') }}
            </p>
          </div>
          <div class="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-lg">
            <img src="/gavel2.jpg" alt="ZACC operations" class="h-full w-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-zaccGreen/80 to-transparent"></div>
            <div class="absolute bottom-6 left-6 right-6 text-white">
              <div class="text-2xl font-extrabold">{{ getContent('introduction-image-overlay-title', 'Independent & Accountable') }}</div>
              <div class="text-sm text-white/90 mt-1">{{ getContent('introduction-image-overlay-subtitle', 'Serving Zimbabwe with integrity') }}</div>
            </div>
          </div>
        </div>

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
                <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-zaccGreen/10 flex items-center justify-center">
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
              <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zaccGreen/20 text-zaccGreen">
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

        <!-- Strategic Focus Areas -->
        <div class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">{{ getContent('strategic-focus-title', 'Strategic Focus Areas') }}</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
            <p class="text-zaccBlack/70 max-w-3xl mx-auto">
              {{ getContent('strategic-focus-description', 'The Commission\'s work is guided by national development priorities and strategic frameworks. Key focus areas include:') }}
            </p>
          </div>
          <div v-if="getMetadata('strategic-focus-items')?.areas" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="(area, index) in getMetadata('strategic-focus-items').areas"
              :key="index"
              class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border border-zaccGreen/10 hover:border-zaccGreen/30 transition"
            >
              <div class="absolute top-0 right-0 w-20 h-20 bg-zaccGreen/5 rounded-bl-full"></div>
              <div class="relative">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-2 h-2 rounded-full bg-zaccGreen"></div>
                  <span class="font-semibold text-zaccBlack">{{ area.title }}</span>
                </div>
                <p class="text-sm text-zaccBlack/70">{{ area.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- NACS Section with Image -->
        <div class="mb-20 grid gap-12 lg:grid-cols-2 items-center">
          <div class="relative h-[400px] rounded-2xl overflow-hidden shadow-lg">
            <img src="/el1.jpg" alt="NACS collaboration" class="h-full w-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-br from-zaccGreen/70 to-zaccBlack/50"></div>
          </div>
          <div class="rounded-2xl bg-gradient-to-br from-zaccGreen/10 to-zaccGold/10 p-8 border border-zaccGreen/20">
            <h2 class="text-2xl font-extrabold mb-4">{{ getContent('nacs-title', 'Role in the National Anti-Corruption Strategy (NACS)') }}</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mb-6"></div>
            <p class="text-zaccBlack/70 leading-relaxed">
              {{ getContent('nacs-description', 'The Zimbabwe Anti-Corruption Commission plays a leading role in the implementation and coordination of the National Anti-Corruption Strategy (NACS).') }}
            </p>
          </div>
        </div>

        <!-- Leadership and Governance -->
        <div class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">{{ getContent('leadership-title', 'Leadership and Governance') }}</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
          </div>
          <div class="grid gap-8 lg:grid-cols-2 items-center">
            <div class="relative h-[400px] rounded-2xl overflow-hidden shadow-lg">
              <img src="/el2.jpg" alt="ZACC leadership" class="h-full w-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-zaccBlack/60 to-transparent"></div>
            </div>
            <div>
              <p class="text-zaccBlack/70 leading-relaxed text-lg">
                {{ getContent('leadership-description', 'ZACC is governed by a Commission appointed in accordance with the Constitution of Zimbabwe.') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Commitment to Citizens -->
        <div class="mb-20 rounded-2xl bg-gradient-to-r from-zaccGreen to-zaccGreen/90 p-12 text-white relative overflow-hidden">
          <div class="absolute inset-0 opacity-10">
            <img src="/flag.jpg" alt="Background" class="h-full w-full object-cover" />
          </div>
          <div class="relative z-10 max-w-4xl mx-auto text-center">
            <h2 class="text-3xl font-extrabold mb-6">{{ getContent('commitment-title', 'Our Commitment to Citizens') }}</h2>
            <div class="h-1 w-20 rounded bg-white/70 mx-auto mb-8"></div>
            <p class="text-white/90 leading-relaxed text-lg mb-6">
              {{ getContent('commitment-paragraph-1', 'The Zimbabwe Anti-Corruption Commission is committed to serving the people of Zimbabwe with integrity and professionalism.') }}
            </p>
            <p class="text-white/90 leading-relaxed text-lg">
              {{ getContent('commitment-paragraph-2', 'ZACC upholds human rights and due process, and remains resolute in its zero-tolerance approach to corruption in all its forms.') }}
            </p>
          </div>
        </div>

        <!-- National Presence -->
        <div class="mb-12 text-center">
          <h2 class="text-3xl font-extrabold mb-4">{{ getContent('national-presence-title', 'National Presence') }}</h2>
          <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
          <p class="text-zaccBlack/70 leading-relaxed text-lg max-w-3xl mx-auto">
            {{ getContent('national-presence-description', 'ZACC has a nationwide mandate and operates across Zimbabwe to ensure accessibility and responsiveness to corruption-related concerns wherever they arise.') }}
          </p>
        </div>

        <!-- Back to Home -->
        <div class="text-center pt-8">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 rounded-md bg-zaccGreen px-6 py-3 font-semibold text-white shadow-glow hover:brightness-110"
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
const pageContent = ref<any>({})
const loading = ref(true)

// Fetch all about page content
const fetchPageContent = async () => {
  loading.value = true
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
    console.error('Error fetching about page content:', error)
  } finally {
    loading.value = false
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

useHead({
  title: 'About Us - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Learn about ZACC - Zimbabwe Anti-Corruption Commission. Our mandate, vision, mission, core values, functions, and commitment to combating corruption through prevention, investigation, and public education.'
    }
  ]
})
</script>
