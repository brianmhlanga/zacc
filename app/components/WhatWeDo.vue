<template>
  <section id="what-we-do" class="relative py-20">
    <div
      class="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(212,175,55,0.08),transparent_60%)]"
    ></div>
    <div class="mx-auto max-w-7xl px-6">
      <div class="mb-8 flex items-end justify-between">
        <div>
          <h2 class="text-2xl font-extrabold">What We Do</h2>
          <div class="mt-2 h-1 w-20 rounded bg-zaccGold"></div>
          <p class="mt-2 text-zaccBlack/60">Our core functions to promote integrity and combat corruption.</p>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div
          v-for="i in 5"
          :key="i"
          class="rounded-[5px] bg-white p-5 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] animate-pulse"
        >
          <div class="mb-3 h-10 w-10 rounded-full bg-gray-200"></div>
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-gray-200 rounded w-full mb-2"></div>
          <div class="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>

      <!-- Services Grid -->
      <div v-else-if="services.length > 0" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div
          v-for="service in services"
          :key="service.id"
          class="rounded-[5px] bg-white p-5 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] hover:shadow-xl transition-shadow"
        >
          <div
            class="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
            :class="getIconColorClass(service.iconColor)"
          >
            <svg
              v-if="!service.icon || service.icon === 'education'"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="h-5 w-5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6l8 4-8 4-8-4 8-4zm0 8v4m-4 0h8" />
            </svg>
            <svg
              v-else-if="service.icon === 'prevention'"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="h-5 w-5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0zm3-1.5l3 3 6-6" />
            </svg>
            <svg
              v-else-if="service.icon === 'investigations'"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="h-5 w-5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
            </svg>
            <svg
              v-else-if="service.icon === 'legal'"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="h-5 w-5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6l-8 4 8 4 8-4-8-4zm0 8v4m-4 0h8" />
            </svg>
            <svg
              v-else-if="service.icon === 'prosecution'"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="h-5 w-5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h8M6 11h12M9 15h6" />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="h-5 w-5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6l8 4-8 4-8-4 8-4zm0 8v4m-4 0h8" />
            </svg>
          </div>
          <div class="font-semibold">{{ service.title }}</div>
          <p class="mt-1 text-sm text-zaccBlack/70 line-clamp-3">
            {{ service.description }}
          </p>
          <button
            @click="openServiceDialog(service)"
            class="mt-3 inline-flex items-center gap-2 rounded-md bg-zaccGreen px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition-all w-full justify-center"
          >
            Read More
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

      <!-- No Services -->
      <div v-else class="text-center py-12">
        <p class="text-zaccBlack/60">No services available at this time.</p>
      </div>
    </div>

    <!-- Service Detail Dialog -->
    <Dialog
      v-model:visible="showDialog"
      :header="selectedService?.title || 'Service Details'"
      :modal="true"
      :style="{ width: '90vw', maxWidth: '800px' }"
      :closable="true"
      class="service-dialog"
    >
      <div v-if="selectedService" class="space-y-6">
        <!-- Icon and Title -->
        <div class="flex items-center gap-4 pb-4 border-b border-zaccGreen/20">
          <div
            class="flex h-16 w-16 items-center justify-center rounded-full flex-shrink-0"
            :class="getIconColorClass(selectedService.iconColor)"
          >
            <svg
              v-if="!selectedService.icon || selectedService.icon === 'education'"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="h-8 w-8"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6l8 4-8 4-8-4 8-4zm0 8v4m-4 0h8" />
            </svg>
            <svg
              v-else-if="selectedService.icon === 'prevention'"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="h-8 w-8"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0zm3-1.5l3 3 6-6" />
            </svg>
            <svg
              v-else-if="selectedService.icon === 'investigations'"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="h-8 w-8"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
            </svg>
            <svg
              v-else-if="selectedService.icon === 'legal'"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="h-8 w-8"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6l-8 4 8 4 8-4-8-4zm0 8v4m-4 0h8" />
            </svg>
            <svg
              v-else-if="selectedService.icon === 'prosecution'"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="h-8 w-8"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h8M6 11h12M9 15h6" />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="h-8 w-8"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6l8 4-8 4-8-4 8-4zm0 8v4m-4 0h8" />
            </svg>
          </div>
          <div>
            <h3 class="text-2xl font-extrabold text-zaccBlack">{{ selectedService.title }}</h3>
          </div>
        </div>

        <!-- Description -->
        <div class="prose prose-lg max-w-none">
          <div class="text-zaccBlack/80 leading-relaxed whitespace-pre-wrap">{{ selectedService.description }}</div>
        </div>
      </div>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
const services = ref<any[]>([])
const loading = ref(true)
const showDialog = ref(false)
const selectedService = ref<any>(null)

// Get icon color class
const getIconColorClass = (iconColor: string | null | undefined) => {
  if (!iconColor) return 'bg-zaccGreen/10 text-zaccGreen'
  
  const colorMap: Record<string, string> = {
    'green': 'bg-zaccGreen/10 text-zaccGreen',
    'gold': 'bg-zaccGold/15 text-zaccBlack',
    'black': 'bg-zaccBlack/10 text-zaccBlack'
  }
  
  return colorMap[iconColor.toLowerCase()] || 'bg-zaccGreen/10 text-zaccGreen'
}

// Fetch services from API
const fetchServices = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/public/services')
    console.log('Fetched services:', data)
    services.value = data || []
  } catch (error: any) {
    console.error('Error fetching services:', error)
    console.error('Error details:', error.data || error.message)
    services.value = []
  } finally {
    loading.value = false
  }
}

// Open service details dialog
const openServiceDialog = (service: any) => {
  selectedService.value = service
  showDialog.value = true
}

// Fetch on mount
onMounted(() => {
  fetchServices()
})
</script>

<style scoped>
:deep(.service-dialog .p-dialog-header) {
  background: linear-gradient(to right, rgba(32, 147, 65, 0.1), rgba(212, 175, 55, 0.1));
  border-bottom: 1px solid rgba(32, 147, 65, 0.2);
  padding: 1.5rem;
}

:deep(.service-dialog .p-dialog-content) {
  padding: 1.5rem;
}
</style>
