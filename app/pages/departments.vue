<template>
  <NuxtLayout name="main">
    <div>
      <!-- Hero Section -->
      <section class="relative isolate overflow-hidden bg-zaccBlack text-white py-24">
        <div class="absolute inset-0">
          <img src="/gavel2.jpg" alt="Departments" class="absolute inset-0 h-full w-full object-cover opacity-20" />
          <div class="absolute inset-0 bg-zaccBlack/90"></div>
        </div>
        <div class="relative mx-auto max-w-7xl px-6">
          <div class="text-center">
            <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">{{ getContent('hero-title', 'Departments') }}</h1>
            <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
              {{ getContent('hero-subtitle', 'ZACC Departments and Their Functions') }}
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
          <!-- Introduction -->
          <div class="mb-12 text-center">
            <p class="text-zaccBlack/70 leading-relaxed text-lg max-w-3xl mx-auto">
              {{ getContent('introduction-description', 'The Commission has, in terms of the Constitution and the Act, a Secretariat which is headed by the Executive Secretary.') }}
            </p>
          </div>

          <!-- Departments List -->
          <div v-if="departments.length > 0" class="space-y-12">
            <div
              v-for="(dept, index) in departments"
              :key="index"
              class="rounded-2xl bg-white p-8 shadow-lg border border-zaccGreen/10"
            >
              <h2 class="text-2xl font-extrabold text-zaccBlack mb-4">{{ dept.name }}</h2>
              <p class="text-zaccBlack/70 mb-6">{{ dept.description }}</p>
              
              <!-- Department with Units -->
              <div v-if="dept.units && dept.units.length > 0" class="space-y-8">
                <div
                  v-for="(unit, unitIndex) in dept.units"
                  :key="unitIndex"
                  class="border-l-4 border-zaccGreen pl-6"
                >
                  <h3 class="text-xl font-semibold text-zaccGreen mb-4">{{ unit.name }}</h3>
                  <ul class="space-y-3">
                    <li
                      v-for="(func, funcIndex) in unit.functions"
                      :key="funcIndex"
                      class="flex items-start gap-3 text-zaccBlack/80"
                    >
                      <svg class="h-5 w-5 text-zaccGreen mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{{ func }}</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <!-- Department with Direct Functions -->
              <ul v-else-if="dept.functions && dept.functions.length > 0" class="space-y-3">
                <li
                  v-for="(func, funcIndex) in dept.functions"
                  :key="funcIndex"
                  class="flex items-start gap-3 text-zaccBlack/80"
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
            <p class="mt-4 text-zaccBlack/60">Loading departments...</p>
          </div>

          <!-- No Data -->
          <div v-else class="text-center py-20">
            <i class="pi pi-building text-6xl text-zaccBlack/20 mb-4"></i>
            <h3 class="text-xl font-semibold text-zaccBlack mb-2">No Departments Found</h3>
            <p class="text-zaccBlack/60">Department information will be available soon.</p>
          </div>

          <!-- Back to About -->
          <div class="text-center pt-8">
            <NuxtLink
              to="/about"
              class="inline-flex items-center gap-2 rounded-md bg-zaccGold px-6 py-3 font-semibold text-white shadow-glow hover:bg-zaccGold/90"
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
  title: 'Departments - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Learn about ZACC departments and their functions. Explore the organizational structure of the Zimbabwe Anti-Corruption Commission.'
    }
  ]
})

const pageContent = ref<any>({})
const departments = ref<any[]>([])
const loading = ref(true)

// Fetch page content
const fetchPageContent = async () => {
  loading.value = true
  try {
    const content = await $fetch('/api/public/page-content', {
      params: { pageKey: 'departments' }
    })
    
    // Organize content by sectionKey
    const contentMap: any = {}
    content.forEach((item: any) => {
      contentMap[item.sectionKey] = item
    })
    
    pageContent.value = contentMap
    
    // Extract departments from metadata
    if (contentMap['departments-list']?.metadata?.departments) {
      departments.value = contentMap['departments-list'].metadata.departments
    }
  } catch (error) {
    console.error('Error fetching departments page content:', error)
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

