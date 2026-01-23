<template>
  <NuxtLayout name="main">
    <div>
      <!-- Hero Section -->
      <section class="relative isolate overflow-hidden bg-zaccBlack text-white py-24">
        <div class="absolute inset-0">
          <img src="/gavel2.jpg" alt="Executives" class="absolute inset-0 h-full w-full object-cover opacity-20" />
          <div class="absolute inset-0 bg-zaccBlack/90"></div>
        </div>
        <div class="relative mx-auto max-w-7xl px-6">
          <div class="text-center">
            <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">ZACC Management Profiles</h1>
            <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
              Meet the executive leadership team of the Zimbabwe Anti-Corruption Commission. Our management team provides strategic direction and operational oversight to ensure effective implementation of ZACC's mandate.
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
          <!-- Loading State -->
          <div v-if="loading" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="i in 4"
              :key="i"
              class="rounded-[5px] bg-white overflow-hidden shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] animate-pulse"
            >
              <div class="h-48 w-full bg-gray-200"></div>
              <div class="p-5">
                <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>

          <!-- Executives Display -->
          <div v-if="!loading && executives.length > 0">
            <!-- Executive Secretary Row (Own Row at Top, Centered) -->
            <div v-if="executiveSecretary" class="mb-8 flex justify-center">
              <div class="w-full max-w-sm">
                <div class="rounded-[5px] bg-white overflow-hidden shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] hover:shadow-xl transition-shadow">
                  <img 
                    :src="getImageUrl(executiveSecretary.imageUrl)" 
                    :alt="executiveSecretary.name" 
                    class="h-48 w-full object-cover"
                    @error="handleImageError"
                  />
                  <div class="p-5">
                    <div class="font-semibold text-lg text-zaccBlack mb-1">{{ executiveSecretary.name }}</div>
                    <div class="text-sm text-zaccGreen font-medium mb-2">{{ executiveSecretary.title || executiveSecretary.role }}</div>
                    <p class="text-sm text-zaccBlack/70 line-clamp-3 leading-relaxed">{{ executiveSecretary.description }}</p>
                    <button
                      @click="openExecutiveDialog(executiveSecretary)"
                      class="mt-3 inline-flex items-center gap-2 rounded-md bg-zaccGold px-3 py-1.5 text-xs font-semibold text-white hover:bg-zaccGold/90 transition-opacity w-full justify-center"
                    >
                      View More
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="h-3.5 w-3.5"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5l6 6-6 6M3 12h16.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Other Executives Grid -->
            <div v-if="otherExecutives.length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div
                v-for="executive in otherExecutives"
                :key="executive.id"
                class="rounded-[5px] bg-white overflow-hidden shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] hover:shadow-xl transition-shadow"
              >
                <img 
                  :src="getImageUrl(executive.imageUrl)" 
                  :alt="executive.name" 
                  class="h-48 w-full object-cover"
                  @error="handleImageError"
                />
                <div class="p-5">
                  <div class="font-semibold text-lg text-zaccBlack mb-1">{{ executive.name }}</div>
                  <div class="text-sm text-zaccGreen font-medium mb-2">{{ executive.title || executive.role }}</div>
                  <p class="text-sm text-zaccBlack/70 line-clamp-3 leading-relaxed">{{ executive.description }}</p>
                  <button
                    @click="openExecutiveDialog(executive)"
                    class="mt-3 inline-flex items-center gap-2 rounded-md bg-zaccGold px-3 py-1.5 text-xs font-semibold text-white hover:bg-zaccGold/90 transition-opacity w-full justify-center"
                  >
                    View More
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="h-3.5 w-3.5"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5l6 6-6 6M3 12h16.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- No Data -->
          <div v-else-if="!loading && executives.length === 0" class="text-center py-20">
            <i class="pi pi-briefcase text-6xl text-zaccBlack/20 mb-4"></i>
            <h3 class="text-xl font-semibold text-zaccBlack mb-2">No Executives Found</h3>
            <p class="text-zaccBlack/60">Executive information will be available soon.</p>
          </div>

          <!-- Back to About -->
          <div class="text-center pt-12">
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

      <!-- Executive Details Dialog -->
      <Dialog
        v-model:visible="showDialog"
        :header="selectedExecutive?.name || 'Executive Details'"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '800px' }"
        :closable="true"
        class="executive-dialog"
      >
        <div v-if="selectedExecutive" class="space-y-6">
          <!-- Header with Image -->
          <div class="flex flex-col sm:flex-row gap-6 pb-6 border-b border-zaccGreen/20">
            <div class="flex-shrink-0">
              <img
                :src="getImageUrl(selectedExecutive.imageUrl)"
                :alt="selectedExecutive.name"
                class="w-48 h-48 rounded-lg object-cover shadow-lg"
                @error="handleImageError"
              />
            </div>
            <div class="flex-1">
              <h3 class="text-2xl font-extrabold text-zaccBlack mb-2">{{ selectedExecutive.name }}</h3>
              <div class="space-y-2">
                <div v-if="selectedExecutive.title" class="text-lg font-semibold text-zaccGreen">
                  {{ selectedExecutive.title }}
                </div>
                <div class="text-sm text-zaccBlack/70">
                  {{ selectedExecutive.role }}
                </div>
                <div v-if="selectedExecutive.email" class="flex items-center gap-2 text-sm text-zaccBlack/70">
                  <i class="pi pi-envelope text-zaccGreen"></i>
                  <a :href="`mailto:${selectedExecutive.email}`" class="hover:text-zaccGreen transition-colors">
                    {{ selectedExecutive.email }}
                  </a>
                </div>
                <div v-if="selectedExecutive.phone" class="flex items-center gap-2 text-sm text-zaccBlack/70">
                  <i class="pi pi-phone text-zaccGreen"></i>
                  <a :href="`tel:${selectedExecutive.phone}`" class="hover:text-zaccGreen transition-colors">
                    {{ selectedExecutive.phone }}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div v-if="selectedExecutive.description">
            <h4 class="text-lg font-semibold text-zaccBlack mb-3">Overview</h4>
            <p class="text-zaccBlack/80 leading-relaxed">{{ selectedExecutive.description }}</p>
          </div>

          <!-- Bio -->
          <div v-if="selectedExecutive.bio">
            <h4 class="text-lg font-semibold text-zaccBlack mb-3">Biography</h4>
            <div class="text-zaccBlack/80 leading-relaxed prose prose-sm max-w-none" v-html="selectedExecutive.bio"></div>
          </div>
        </div>
      </Dialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  title: 'Executives - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Meet the Executive leadership team of the Zimbabwe Anti-Corruption Commission. Learn about our management team providing strategic direction and operational oversight.'
    }
  ]
})

const executives = ref<any[]>([])
const loading = ref(true)
const showDialog = ref(false)
const selectedExecutive = ref<any>(null)

// Separate Executive Secretary from other executives
const executiveSecretary = computed(() => {
  return executives.value.find((exec: any) => 
    exec.role?.toLowerCase().includes('executive secretary') || 
    exec.title?.toLowerCase().includes('executive secretary')
  ) || null
})

const otherExecutives = computed(() => {
  return executives.value
    .filter((exec: any) => {
      const roleLower = exec.role?.toLowerCase() || ''
      const titleLower = exec.title?.toLowerCase() || ''
      return !roleLower.includes('executive secretary') && !titleLower.includes('executive secretary')
    })
    .sort((a: any, b: any) => a.order - b.order)
})

// Data URI for placeholder avatar (simple gray square)
const placeholderAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='

// Helper function to get image URL
const getImageUrl = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return placeholderAvatar
  // If it already starts with /api/, use as is
  if (imageUrl.startsWith('/api/')) {
    return imageUrl
  }
  // If it starts with /uploads/, prepend /api
  if (imageUrl.startsWith('/uploads/')) {
    return `/api${imageUrl}`
  }
  // If it doesn't start with /, it might be a relative path, prepend /api/uploads/
  if (!imageUrl.startsWith('/')) {
    return `/api/uploads/${imageUrl}`
  }
  // Otherwise, prepend /api
  return `/api${imageUrl}`
}

// Handle image errors - prevent infinite loop
const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  // Only set placeholder if not already set to prevent infinite loop
  if (img.src !== placeholderAvatar && !img.src.includes('data:image')) {
    img.src = placeholderAvatar
    img.onerror = null // Remove error handler to prevent loop
  }
}

// Fetch executives from API
const fetchExecutives = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/public/executives')
    console.log('Fetched executives:', data)
    console.log('Executives count:', data?.length || 0)
    executives.value = data || []
    console.log('Executives ref value:', executives.value)
    console.log('Executives length:', executives.value.length)
  } catch (error: any) {
    console.error('Error fetching executives:', error)
    executives.value = []
  } finally {
    loading.value = false
    console.log('Loading set to false, executives.length:', executives.value.length)
  }
}

// Open executive details dialog
const openExecutiveDialog = (executive: any) => {
  selectedExecutive.value = executive
  showDialog.value = true
}

onMounted(() => {
  fetchExecutives()
})
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.executive-dialog .p-dialog-header) {
  background: linear-gradient(to right, rgba(32, 147, 65, 0.1), rgba(212, 175, 55, 0.1));
  border-bottom: 1px solid rgba(32, 147, 65, 0.2);
  padding: 1.5rem;
}

:deep(.executive-dialog .p-dialog-content) {
  padding: 1.5rem;
}
</style>
