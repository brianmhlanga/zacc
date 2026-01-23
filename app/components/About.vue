<template>
  <section id="about" class="relative py-20">
    <div
      class="absolute inset-0 -z-10 opacity-20"
      style="background: radial-gradient(40% 40% at 50% 0%, rgba(212,175,55,0.15), transparent)"
    ></div>
    <div class="mx-auto max-w-7xl px-6">
      <div class="grid gap-10 lg:grid-cols-2">
        <div>
          <div
            class="relative h-[calc(28rem+30px)] sm:h-[calc(32rem+30px)] lg:h-[calc(36rem+30px)] overflow-hidden rounded-2xl border border-black/10 shadow-sm"
          >
            <img src="/gavel2.jpg" alt="Judicial gavel" class="h-full w-full object-cover" />
            <div class="absolute inset-0 bg-black/55 pointer-events-none"></div>
            <div
              class="absolute inset-0 pointer-events-none mix-blend-screen"
              style="background: radial-gradient(65% 55% at 100% 0%, rgba(212,175,55,0.35), transparent 60%)"
            ></div>
            <!-- Overlaid mini stats on image bottom -->
            <div v-if="aboutStats.length > 0" class="absolute inset-x-4 bottom-4 grid gap-3 sm:grid-cols-3">
              <div
                v-for="stat in aboutStats"
                :key="stat.id"
                :class="[
                  'rounded-lg p-4 text-center text-white shadow-glow',
                  stat.color === 'green' ? 'bg-zaccBlack/95' : stat.color === 'gold' ? 'bg-zaccGold/95' : 'bg-zaccBlack/95'
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
        </div>
        <div class="space-y-4">
          <div>
            <h2 class="text-2xl font-extrabold">{{ aboutContent.title || 'About ZACC' }}</h2>
            <div class="mt-2 h-1 w-20 rounded bg-zaccGold"></div>
          </div>
          <p
            v-for="(paragraph, index) in aboutContent.paragraphs"
            :key="index"
            class="text-zaccBlack/70"
          >
            {{ paragraph }}
          </p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-[5px] bg-white p-5 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)]">
              <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-zaccBlack/10 text-zaccGreen">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class="h-5 w-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 6v6l4 2M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15z"
                  />
                </svg>
              </div>
              <div class="font-semibold">{{ aboutContent.mission?.title || 'Our Mission' }}</div>
              <p class="mt-1 text-sm text-zaccBlack/70">
                {{ aboutContent.mission?.content || 'To rid Zimbabwe of corruption through lawful enforcement and robust prevention.' }}
              </p>
            </div>
            <div class="rounded-[5px] bg-white p-5 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)]">
              <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-zaccGold/15 text-zaccBlack">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class="h-5 w-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 3l2.5 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 6.1 18l.9-5.4L3 8.7l5.4-.8L12 3z"
                  />
                </svg>
              </div>
              <div class="font-semibold">{{ aboutContent.vision?.title || 'Our Vision' }}</div>
              <p class="mt-1 text-sm text-zaccBlack/70">{{ aboutContent.vision?.content || 'A Zimbabwe free from all forms of corruption.' }}</p>
            </div>
          </div>
          <div class="mt-4">
            <NuxtLink
              to="/about"
              class="inline-flex items-center gap-2 rounded-md bg-zaccGold px-4 py-2 font-semibold text-white shadow-glow hover:bg-zaccGold/90"
            >
              Read More
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
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { observeStats } = useCountUp()

const aboutContent = ref<any>({
  title: '',
  paragraphs: [],
  mission: null,
  vision: null
})
const aboutStats = ref<any[]>([])

// Fetch about content
const fetchAboutContent = async () => {
  try {
    const content = await $fetch('/api/public/page-content', {
      params: { pageKey: 'home' }
    })
    
    const contentMap: any = {}
    content.forEach((item: any) => {
      contentMap[item.sectionKey] = item
    })
    
    aboutContent.value = {
      title: contentMap['about-title']?.content || '',
      paragraphs: [
        contentMap['about-paragraph-1']?.content || '',
        contentMap['about-paragraph-2']?.content || '',
        contentMap['about-paragraph-3']?.content || ''
      ].filter(p => p),
      mission: contentMap['about-mission'] ? {
        title: contentMap['about-mission'].title,
        content: contentMap['about-mission'].content
      } : null,
      vision: contentMap['about-vision'] ? {
        title: contentMap['about-vision'].title,
        content: contentMap['about-vision'].content
      } : null
    }
  } catch (error) {
    console.error('Error fetching about content:', error)
  }
}

// Fetch about statistics
const fetchAboutStats = async () => {
  try {
    const stats = await $fetch('/api/public/statistics', {
      params: { section: 'about' }
    })
    aboutStats.value = stats || []
  } catch (error) {
    console.error('Error fetching about stats:', error)
    aboutStats.value = []
  }
}

onMounted(async () => {
  await Promise.all([fetchAboutContent(), fetchAboutStats()])
  await nextTick()
  observeStats()
})
</script>
