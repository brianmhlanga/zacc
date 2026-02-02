<template>
  <NuxtLayout name="main">
    <div>
      <!-- Hero Section -->
      <section class="relative isolate overflow-hidden bg-zaccBlack text-white py-24">
        <div class="absolute inset-0">
          <img src="/gavel2.jpg" alt="Commissioners" class="absolute inset-0 h-full w-full object-cover opacity-20" />
          <div class="absolute inset-0 bg-zaccBlack/90"></div>
        </div>
        <div class="relative mx-auto max-w-7xl px-6">
          <div class="text-center">
            <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Commissioners</h1>
            <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
              ZACC is headed by the Chairperson and eight Commissioners appointed by the President in consultation with Parliament's Standing Rules and Orders Committee. Commissioners are selected based on integrity, experience in law, auditing, investigation, public administration, and other relevant fields.
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
              <div class="h-52 w-full bg-gray-200"></div>
              <div class="p-5">
                <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>

          <!-- Commissioners by Commission Period - Tabs -->
          <div v-else-if="groupedCommissions.length > 0">
            <!-- Custom Tabs Navigation -->
            <div class="mb-8">
              <div class="flex flex-wrap justify-center gap-2 border-b-2 border-zaccBlack/10">
                <button
                  v-for="(commission, index) in groupedCommissions"
                  :key="index"
                  @click="activeTabIndex = index"
                  :class="[
                    'px-6 py-3 font-semibold text-sm transition-all duration-300 relative',
                    activeTabIndex === index
                      ? 'text-zaccBlack bg-zaccGold/10'
                      : 'text-zaccBlack/60 hover:text-zaccBlack hover:bg-zaccGold/5'
                  ]"
                  :style="activeTabIndex === index ? { borderBottom: '3px solid #d4af37' } : { borderBottom: '3px solid transparent' }"
                >
                  <div class="flex items-center gap-2">
                    <span>{{ commission.period }}</span>
                    <span v-if="commission.years" class="text-xs opacity-70">({{ commission.years }})</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Tab Content -->
            <div class="min-h-[400px]">
              <div
                v-for="(commission, index) in groupedCommissions"
                :key="index"
                v-show="activeTabIndex === index"
                class="animate-fade-in"
              >
                <!-- Commission Period Header -->
                <div class="text-center mb-12">
                  <h2 class="text-3xl font-extrabold text-zaccBlack mb-2">{{ commission.period }}</h2>
                  <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-4"></div>
                  <p v-if="commission.years" class="text-zaccBlack/70 text-lg">{{ commission.years }}</p>
                </div>

                <!-- Chairperson Row (Centered, Single Card) -->
                <div v-if="commission.chairperson" class="flex justify-center mb-8">
                  <div class="w-full sm:w-1/2 lg:w-1/4">
                    <div class="rounded-[5px] bg-white overflow-hidden shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] hover:shadow-xl transition-shadow">
                      <img 
                        :src="getImageUrl(commission.chairperson.imageUrl)" 
                        :alt="commission.chairperson.name" 
                        class="h-52 w-full object-cover"
                        style="object-position: top center;"
                        @error="handleImageError"
                      />
                      <div class="p-5">
                        <div class="font-semibold text-lg text-zaccBlack">{{ commission.chairperson.name }}</div>
                        <div class="text-sm text-zaccGreen font-medium mt-1">{{ getCommissionerTitle(commission.chairperson) }}</div>
                        <p class="mt-3 text-sm text-zaccBlack/70 line-clamp-3">{{ commission.chairperson.description }}</p>
                        <button
                          @click="openCommissionerDialog(commission.chairperson)"
                          class="mt-4 inline-flex items-center gap-2 rounded-md bg-zaccGold px-4 py-2 text-sm font-semibold text-white hover:bg-zaccGold/90 transition-opacity w-full justify-center"
                        >
                          View More
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
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Other Commissioners Grid -->
                <div v-if="commission.others.length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div
                    v-for="commissioner in commission.others"
                    :key="commissioner.id"
                    class="rounded-[5px] bg-white overflow-hidden shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] hover:shadow-xl transition-shadow"
                  >
                    <img 
                      :src="getImageUrl(commissioner.imageUrl)" 
                      :alt="commissioner.name" 
                      class="h-52 w-full object-cover"
                      style="object-position: top center;"
                      @error="handleImageError"
                    />
                    <div class="p-5">
                      <div class="font-semibold text-lg text-zaccBlack">{{ commissioner.name }}</div>
                      <div class="text-sm text-zaccGreen font-medium mt-1">{{ getCommissionerTitle(commissioner) }}</div>
                      <p class="mt-3 text-sm text-zaccBlack/70 line-clamp-3">{{ commissioner.description }}</p>
                      <button
                        @click="openCommissionerDialog(commissioner)"
                        class="mt-4 inline-flex items-center gap-2 rounded-md bg-zaccGold px-4 py-2 text-sm font-semibold text-white hover:bg-zaccGold/90 transition-opacity w-full justify-center"
                      >
                        View More
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
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No Data -->
          <div v-else-if="!loading && groupedCommissions.length === 0" class="text-center py-20">
            <i class="pi pi-users text-6xl text-zaccBlack/20 mb-4"></i>
            <h3 class="text-xl font-semibold text-zaccBlack mb-2">No Commissioners Found</h3>
            <p class="text-zaccBlack/60">Commissioner information will be available soon.</p>
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

      <!-- Commissioner Details Dialog -->
      <Dialog
        v-model:visible="showDialog"
        :header="selectedCommissioner?.name || 'Commissioner Details'"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '800px' }"
        :closable="true"
        class="commissioner-dialog"
      >
        <div v-if="selectedCommissioner" class="space-y-6">
          <!-- Header with Image -->
          <div class="flex flex-col sm:flex-row gap-6 pb-6 border-b border-zaccGreen/20">
            <div class="flex-shrink-0">
              <img
                :src="getImageUrl(selectedCommissioner.imageUrl)"
                :alt="selectedCommissioner.name"
                class="w-48 h-52 rounded-lg object-cover shadow-lg"
                @error="handleImageError"
              />
            </div>
            <div class="flex-1">
              <h3 class="text-2xl font-extrabold text-zaccBlack mb-2">{{ selectedCommissioner.name }}</h3>
              <div class="space-y-2">
                <div v-if="selectedCommissioner.title" class="text-lg font-semibold text-zaccGreen">
                  {{ selectedCommissioner.title }}
                </div>
                <div class="text-sm text-zaccBlack/70">
                  {{ selectedCommissioner.role }}
                </div>
                <div v-if="selectedCommissioner.email" class="flex items-center gap-2 text-sm text-zaccBlack/70">
                  <i class="pi pi-envelope text-zaccGreen"></i>
                  <a :href="`mailto:${selectedCommissioner.email}`" class="hover:text-zaccGreen transition-colors">
                    {{ selectedCommissioner.email }}
                  </a>
                </div>
                <div v-if="selectedCommissioner.phone" class="flex items-center gap-2 text-sm text-zaccBlack/70">
                  <i class="pi pi-phone text-zaccGreen"></i>
                  <a :href="`tel:${selectedCommissioner.phone}`" class="hover:text-zaccGreen transition-colors">
                    {{ selectedCommissioner.phone }}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div v-if="selectedCommissioner.description">
            <h4 class="text-lg font-semibold text-zaccBlack mb-3">Overview</h4>
            <p class="text-zaccBlack/80 leading-relaxed">{{ selectedCommissioner.description }}</p>
          </div>

          <!-- Bio -->
          <div v-if="selectedCommissioner.bio">
            <h4 class="text-lg font-semibold text-zaccBlack mb-3">Biography</h4>
            <div class="text-zaccBlack/80 leading-relaxed prose prose-sm max-w-none" v-html="selectedCommissioner.bio"></div>
          </div>
        </div>
      </Dialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  title: 'Commissioners - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Meet the Commissioners of the Zimbabwe Anti-Corruption Commission. Learn about our leadership team guiding Zimbabwe\'s anti-corruption mandate.'
    }
  ]
})

const commissioners = ref<any[]>([])
const loading = ref(true)
const showDialog = ref(false)
const selectedCommissioner = ref<any>(null)
const activeTabIndex = ref(0)

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

// Helper to get clean title (remove commission period from title)
const getCommissionerTitle = (commissioner: any) => {
  if (!commissioner.title) return commissioner.role
  // Remove the commission period suffix if present
  return commissioner.title.replace(/\s*\([^)]*Commission\)/g, '') || commissioner.role
}

// Group commissioners by commission period and separate chairperson
const groupedCommissions = computed(() => {
  const groups: any = {}
  
  commissioners.value.forEach((commissioner) => {
    let period = 'Current Commission'
    let years = '2024 to Present'
    
    // Determine commission period from title (case-insensitive)
    const titleLower = (commissioner.title || '').toLowerCase()
    if (titleLower.includes('4th commission')) {
      period = '4th Commission'
      years = '2019 to 2024'
    } else if (titleLower.includes('3rd commission')) {
      period = '3rd Commission'
      years = '2016 to 2019'
    } else if (titleLower.includes('2nd commission')) {
      period = '2nd Commission'
      years = '2011 to 2015'
    } else if (titleLower.includes('1st commission')) {
      period = '1st Commission'
      years = '2005 to 2010'
    } else if (commissioner.isActive) {
      period = 'Current Commission'
      years = '2024 to Present'
    } else {
      // If inactive and no title match, default to a period based on order
      // This is a fallback for edge cases
      period = 'Current Commission'
      years = '2024 to Present'
    }
    
    if (!groups[period]) {
      groups[period] = {
        period,
        years,
        chairperson: null,
        others: []
      }
    }
    
    // Separate Chairperson (only) from others (including Deputy Chairperson)
    if (commissioner.role === 'Chairperson') {
      groups[period].chairperson = commissioner
    } else {
      // All others including Deputy Chairperson go in the regular grid
      groups[period].others.push(commissioner)
    }
  })
  
  // Sort others by order (Deputy Chairperson will be first in others array if sorted by order)
  Object.keys(groups).forEach(key => {
    groups[key].others.sort((a: any, b: any) => {
      // Deputy Chairperson should come first in others array
      if (a.role === 'Deputy Chairperson' && b.role !== 'Deputy Chairperson') return -1
      if (a.role !== 'Deputy Chairperson' && b.role === 'Deputy Chairperson') return 1
      return a.order - b.order
    })
  })
  
  // Return in order: Current, 4th, 3rd, 2nd, 1st
  const order = ['Current Commission', '4th Commission', '3rd Commission', '2nd Commission', '1st Commission']
  const result = order
    .filter(period => {
      const group = groups[period]
      // Include group if it has a chairperson or at least one other member
      return group && (group.chairperson || group.others.length > 0)
    })
    .map(period => groups[period])
  
  // Debug: log what we found
  if (process.client) {
    console.log('Grouped Commissions:', result.map(g => ({ period: g.period, chairperson: !!g.chairperson, others: g.others.length })))
    console.log('All commissioners:', commissioners.value.length)
  }
  
  return result
})

// Fetch commissioners from API (all, including inactive)
const fetchCommissioners = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/public/commissioners', {
      params: { all: 'true' }
    })
    commissioners.value = data
  } catch (error: any) {
    console.error('Error fetching commissioners:', error)
    commissioners.value = []
  } finally {
    loading.value = false
  }
}

// Open commissioner details dialog
const openCommissionerDialog = (commissioner: any) => {
  selectedCommissioner.value = commissioner
  showDialog.value = true
}

onMounted(() => {
  fetchCommissioners()
})
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.commissioner-dialog .p-dialog-header) {
  background: linear-gradient(to right, rgba(32, 147, 65, 0.1), rgba(212, 175, 55, 0.1));
  border-bottom: 1px solid rgba(32, 147, 65, 0.2);
  padding: 1.5rem;
}

:deep(.commissioner-dialog .p-dialog-content) {
  padding: 1.5rem;
}

/* Tab Animation */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-in-out;
}
</style>
