<template>
  <section id="downloads" class="relative py-20">
    <div class="mx-auto max-w-7xl px-6">
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-2xl font-extrabold">Downloads</h2>
          <div class="mt-2 h-1 w-20 rounded bg-zaccGold"></div>
          <p class="mt-2 text-zaccBlack/60">Access forms, publications, and reports.</p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="relative w-full sm:w-64">
            <input
              id="downloadSearch"
              v-model="searchQuery"
              type="search"
              placeholder="Search downloads..."
              class="w-full rounded-md border border-black/10 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-zaccBlack/40 outline-none focus:border-zaccGold"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zaccBlack/40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z"
              />
            </svg>
          </div>
          <NuxtLink
            to="/downloads"
            class="inline-flex items-center justify-center gap-2 rounded-md bg-zaccGold px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-zaccGold/90"
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
          </NuxtLink>
        </div>
      </div>
      <div v-if="loading" id="downloadGrid" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="i in 8"
          :key="i"
          class="download-card group grid grid-cols-[auto_1fr] items-start gap-4 rounded-[5px] border border-black/10 bg-white p-4 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] animate-pulse"
        >
          <div class="h-10 w-10 rounded-md bg-gray-200"></div>
          <div class="flex-1 min-w-0">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div class="col-span-2 mt-4 h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div v-else-if="filteredDownloads.length > 0" id="downloadGrid" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="download in filteredDownloads"
          :key="download.id"
          class="download-card group grid grid-cols-[auto_1fr] items-start gap-4 rounded-[5px] border border-black/10 bg-white p-4 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] transition hover:-translate-y-0.5 hover:shadow-lg"
          :data-title="download.title"
          :data-body="download.description || ''"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-md bg-zaccGold/20 text-zaccBlack">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path fill="#fff" d="M14 2v6h6" />
              <path d="M8 15h8M8 11h8" stroke="#111" stroke-width="1.5" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <div class="font-semibold group-hover:text-zaccYellow truncate">{{ download.title }}</div>
              <span
                class="ml-3 inline-flex items-center rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-zaccBlack/70 uppercase flex-shrink-0"
              >
                {{ download.fileType || 'PDF' }}
              </span>
            </div>
            <div class="mt-1 text-xs text-zaccBlack/60">
              {{ formatFileSize(download.fileSize || 0) }}
              <span v-if="download.year"> • {{ download.year }}</span>
            </div>
          </div>
          <div class="col-span-2 mt-4 flex gap-2">
            <NuxtLink
              :to="getFileUrl(download.fileUrl)"
              target="_blank"
              class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-zaccGold px-3 py-2 text-xs font-semibold text-white hover:bg-zaccGold/90 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View
            </NuxtLink>
            <a
              :href="getFileUrl(download.fileUrl)"
              :download="download.title"
              class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-zaccGold px-3 py-2 text-xs font-semibold text-white hover:brightness-110 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-12">
        <p class="text-zaccBlack/60">No downloads available at this time.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const downloads = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Helper function to get file URL
const getFileUrl = (fileUrl: string | null | undefined) => {
  if (!fileUrl) return '#'
  // If it already starts with /api/, use as is
  if (fileUrl.startsWith('/api/')) {
    return fileUrl
  }
  // If it starts with /uploads/, prepend /api
  if (fileUrl.startsWith('/uploads/')) {
    return `/api${fileUrl}`
  }
  // If it doesn't start with /, it might be a relative path, prepend /api/uploads/
  if (!fileUrl.startsWith('/')) {
    return `/api/uploads/${fileUrl}`
  }
  // Otherwise, prepend /api
  return `/api${fileUrl}`
}

// Fetch downloads from API
const fetchDownloads = async () => {
  loading.value = true
  try {
    // Limit to 12 downloads for the home page preview
    const data = await $fetch('/api/public/downloads', {
      params: { limit: 12 }
    })
    downloads.value = data
  } catch (error: any) {
    console.error('Error fetching downloads:', error)
    // Fallback to empty array if API fails
    downloads.value = []
  } finally {
    loading.value = false
  }
}

// Filter downloads based on search
const filteredDownloads = computed(() => {
  if (!searchQuery.value) {
    return downloads.value
  }
  const query = searchQuery.value.toLowerCase()
  return downloads.value.filter(download => 
    download.title.toLowerCase().includes(query) ||
    download.description?.toLowerCase().includes(query) ||
    download.category?.toLowerCase().includes(query)
  )
})

const { setupSearch } = useSearch()

onMounted(() => {
  fetchDownloads()
  setupSearch('downloadSearch', '.download-card')
})
</script>
