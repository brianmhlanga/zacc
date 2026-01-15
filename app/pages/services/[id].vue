<template>
  <NuxtLayout name="main">
    <div class="overflow-x-hidden">
      <!-- Hero Section -->
      <section class="relative isolate overflow-hidden bg-zaccBlack text-white py-24">
        <div class="absolute inset-0">
          <div class="absolute inset-0 bg-zaccBlack/90"></div>
        </div>
        <div class="relative mx-auto max-w-7xl px-6">
          <div class="text-center">
            <div v-if="service" class="flex justify-center mb-4">
              <div class="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white">
                <svg
                  v-if="!service.icon || service.icon === 'education'"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class="h-8 w-8"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 6l8 4-8 4-8-4 8-4zm0 8v4m-4 0h8"
                  />
                </svg>
                <svg
                  v-else-if="service.icon === 'prevention'"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class="h-8 w-8"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4.5 12a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0zm3-1.5l3 3 6-6"
                  />
                </svg>
                <svg
                  v-else-if="service.icon === 'investigations'"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class="h-8 w-8"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z"
                  />
                </svg>
                <svg
                  v-else-if="service.icon === 'legal'"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class="h-8 w-8"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 6l-8 4 8 4 8-4-8-4zm0 8v4m-4 0h8"
                  />
                </svg>
                <svg
                  v-else-if="service.icon === 'prosecution'"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class="h-8 w-8"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h8M6 11h12M9 15h6" />
                </svg>
              </div>
            </div>
            <h1 v-if="service" class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              {{ service.title }}
            </h1>
            <p v-else class="text-xl text-white/90">Loading...</p>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <section class="relative py-20">
        <div
          class="absolute inset-0 -z-10 opacity-20"
          style="background: radial-gradient(40% 40% at 50% 0%, rgba(212,175,55,0.15), transparent)"
        ></div>
        <div class="mx-auto max-w-4xl px-6">
          <div v-if="loading" class="text-center py-20">
            <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-zaccGreen border-t-transparent"></div>
            <p class="mt-4 text-zaccBlack/60">Loading service details...</p>
          </div>

          <div v-else-if="error" class="text-center py-20">
            <i class="pi pi-exclamation-triangle text-6xl text-red-400 mb-4"></i>
            <h2 class="text-2xl font-semibold text-zaccBlack mb-2">Service Not Found</h2>
            <p class="text-zaccBlack/60 mb-6">{{ error }}</p>
            <Button
              label="Back to Home"
              icon="pi pi-arrow-left"
              iconPos="left"
              severity="secondary"
              outlined
              @click="navigateTo('/')"
            />
          </div>

          <div v-else-if="service" class="space-y-8">
            <!-- Service Description -->
            <div class="bg-white rounded-2xl border border-zaccGreen/10 p-8 lg:p-12 shadow-lg">
              <div class="prose prose-lg max-w-none">
                <div class="text-zaccBlack/80 leading-relaxed whitespace-pre-wrap">{{ service.description }}</div>
              </div>
            </div>

            <!-- Back Button -->
            <div class="flex justify-center">
              <Button
                label="Back to Home"
                icon="pi pi-arrow-left"
                iconPos="left"
                severity="secondary"
                outlined
                @click="navigateTo('/#what-we-do')"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'main'
})

const route = useRoute()
const service = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Extract id from route params
const serviceId = computed(() => {
  const idParam = route.params.id
  if (Array.isArray(idParam)) {
    return idParam[0] as string
  }
  return idParam as string
})

// Fetch service
const fetchService = async () => {
  loading.value = true
  error.value = null

  try {
    console.log('Fetching service with ID:', serviceId.value)
    const data = await $fetch(`/api/public/services/${serviceId.value}`)
    console.log('Service data received:', data)
    service.value = data

    // Set page title and meta
    useHead({
      title: `${data.title} - What We Do - ZACC`,
      meta: [
        {
          name: 'description',
          content: data.description?.substring(0, 160) || 'Learn more about ZACC services.'
        }
      ]
    })
  } catch (err: any) {
    console.error('Error fetching service:', err)
    console.error('Error details:', err.data, err.statusCode, err.statusMessage)
    error.value = err.data?.message || err.statusMessage || 'Failed to load service'

    if (err.statusCode === 404) {
      error.value = 'This service could not be found. It may have been removed or the link is incorrect.'
    }
  } finally {
    loading.value = false
  }
}

// Fetch on mount
onMounted(() => {
  if (serviceId.value) {
    fetchService()
  } else {
    error.value = 'Invalid service URL'
    loading.value = false
  }
})

// Watch for route changes
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchService()
  }
})
</script>

<style scoped>
:deep(.prose) {
  color: inherit;
}
</style>

