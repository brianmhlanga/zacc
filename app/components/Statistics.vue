<template>
  <section id="stats" class="relative isolate py-20 overflow-hidden text-white">
    <div class="absolute inset-0 -z-10">
      <img src="/el2.jpg" alt="decorative background" class="absolute inset-0 h-full w-full object-cover opacity-70" />
      <div
        class="absolute inset-0"
        style="background: radial-gradient(120% 80% at 50% -20%, rgba(32,147,65,0.06), transparent 60%), radial-gradient(120% 80% at 50% 120%, rgba(212,175,55,0.10), transparent 60%)"
      ></div>
      <div class="absolute inset-0 bg-black/45"></div>
    </div>
    <div class="mx-auto max-w-7xl px-6">
      <div class="text-center">
        <h2 class="text-2xl font-extrabold text-white">{{ sectionContent.title || 'ZACC Statistics' }}</h2>
        <p class="mt-2 text-white/80">{{ sectionContent.description || 'Key indicators of our anti-corruption work and partnerships.' }}</p>
      </div>
      <div v-if="loading" class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="i in 6"
          :key="i"
          class="rounded-2xl border border-white/50 bg-transparent p-6 text-center text-white animate-pulse"
        >
          <div class="h-10 bg-white/20 rounded mb-2"></div>
          <div class="h-4 bg-white/20 rounded w-3/4 mx-auto"></div>
        </div>
      </div>
      <div v-else-if="statistics.length > 0" class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="stat in statistics"
          :key="stat.id"
          class="rounded-2xl border border-white/50 bg-transparent p-6 text-center text-white"
        >
          <div class="text-4xl font-extrabold">
            <span
              class="countup"
              :data-target="stat.value"
              :data-prefix="stat.prefix || ''"
              :data-suffix="stat.suffix || ''"
            >{{ stat.value }}</span>
          </div>
          <div class="mt-2 text-sm text-white/85">{{ stat.label }}</div>
        </div>
      </div>
      <div v-else class="mt-10 text-center text-white/60">
        <p>No statistics available at this time.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { observeStats } = useCountUp()

const statistics = ref<any[]>([])
const sectionContent = ref<any>({
  title: '',
  description: ''
})
const loading = ref(true)

// Fetch statistics
const fetchStatistics = async () => {
  loading.value = true
  try {
    const stats = await $fetch('/api/public/statistics', {
      params: { section: 'homepage', year: new Date().getFullYear() }
    })
    statistics.value = stats || []
  } catch (error) {
    console.error('Error fetching statistics:', error)
    statistics.value = []
  } finally {
    loading.value = false
  }
}

// Fetch section content
const fetchSectionContent = async () => {
  try {
    const content = await $fetch('/api/public/page-content', {
      params: { pageKey: 'home' }
    })
    
    const titleContent = content.find((item: any) => item.sectionKey === 'statistics-title')
    const descContent = content.find((item: any) => item.sectionKey === 'statistics-description')
    
    sectionContent.value = {
      title: titleContent?.content || '',
      description: descContent?.content || ''
    }
  } catch (error) {
    console.error('Error fetching section content:', error)
  }
}

onMounted(async () => {
  await Promise.all([fetchStatistics(), fetchSectionContent()])
  await nextTick()
  observeStats()
})
</script>
