<template>
  <section id="commissioners" class="relative py-20 bg-zaccGreen">
    <div class="mx-auto max-w-7xl px-6">
      <div class="mb-8 flex items-end justify-between">
        <div>
          <h2 class="text-2xl font-extrabold text-white">ZACC Commissioners</h2>
          <div class="mt-2 h-1 w-20 rounded bg-white/70"></div>
          <p class="mt-2 text-white/90">Leadership team guiding Zimbabwe's anti‑corruption mandate.</p>
        </div>
      </div>
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
      <div v-else-if="commissioners.length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="commissioner in commissioners"
          :key="commissioner.id"
          class="rounded-[5px] bg-white overflow-hidden shadow-[0_5px_10px_0_rgba(41,61,102,0.2)]"
        >
          <img 
            :src="getImageUrl(commissioner.imageUrl)" 
            :alt="commissioner.name" 
            class="h-48 w-full object-cover"
            @error="(e) => { (e.target as HTMLImageElement).src = '/placeholder-avatar.png' }"
          />
          <div class="p-5">
            <div class="font-semibold">{{ commissioner.name }}</div>
            <div class="text-sm text-zaccBlack/70">{{ commissioner.title || commissioner.role }}</div>
            <p class="mt-2 text-sm text-zaccBlack/70">{{ commissioner.description }}</p>
            <button
              @click="openCommissionerDialog(commissioner)"
              class="mt-3 inline-flex items-center gap-2 rounded-md bg-zaccBlack px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity w-full justify-center"
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
      <div v-else class="text-center py-12">
        <p class="text-white/80">No team members available at this time.</p>
      </div>
    </div>

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
              class="w-48 h-48 rounded-lg object-cover shadow-lg"
              @error="(e) => { (e.target as HTMLImageElement).src = '/placeholder-avatar.png' }"
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
  </section>
</template>

<script setup lang="ts">
const commissioners = ref<any[]>([])
const loading = ref(true)
const showDialog = ref(false)
const selectedCommissioner = ref<any>(null)

// Helper function to get image URL
const getImageUrl = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return '/placeholder-avatar.png'
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

// Fetch commissioners from API
const fetchCommissioners = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/public/commissioners')
    commissioners.value = data
  } catch (error: any) {
    console.error('Error fetching commissioners:', error)
    // Fallback to empty array if API fails
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

// Fetch on mount
onMounted(() => {
  fetchCommissioners()
})
</script>

<style scoped>
:deep(.commissioner-dialog .p-dialog-header) {
  background: linear-gradient(to right, rgba(32, 147, 65, 0.1), rgba(212, 175, 55, 0.1));
  border-bottom: 1px solid rgba(32, 147, 65, 0.2);
  padding: 1.5rem;
}

:deep(.commissioner-dialog .p-dialog-content) {
  padding: 1.5rem;
}
</style>
