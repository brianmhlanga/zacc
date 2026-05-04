<template>
  <NuxtLayout name="main">
    <div>
      <section class="relative isolate overflow-hidden bg-zaccBlack text-white py-24">
        <div class="absolute inset-0">
          <img
            src="/gavel2.jpg"
            alt="Announcements"
            class="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div class="absolute inset-0 bg-zaccBlack/90"></div>
        </div>
        <div class="relative mx-auto max-w-7xl px-6">
          <div class="text-center">
            <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Announcements</h1>
            <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
              Official press releases and media statements from ZACC, available to read or download.
            </p>
          </div>
        </div>
      </section>

      <section class="relative py-20">
        <div
          class="absolute inset-0 -z-10 opacity-20"
          style="background: radial-gradient(40% 40% at 50% 0%, rgba(212, 175, 55, 0.15), transparent)"
        ></div>
        <div class="mx-auto max-w-7xl px-6">
          <div class="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-lg border border-zaccGreen/10">
            <div>
              <p class="text-sm font-semibold uppercase tracking-wide text-zaccGreen">Category</p>
              <p class="mt-1 text-lg font-bold text-zaccBlack">Press releases</p>
              <p class="mt-1 text-sm text-zaccBlack/60">
                For all other documents, see
                <NuxtLink to="/downloads" class="font-semibold text-zaccGreen hover:underline">Downloads</NuxtLink>.
              </p>
            </div>
          </div>

          <div class="mb-8 rounded-2xl bg-white p-6 shadow-lg border border-zaccGreen/10">
            <label for="announcementSearch" class="block text-sm font-semibold text-zaccBlack mb-2">
              Search announcements
            </label>
            <div class="relative">
              <InputText
                id="announcementSearch"
                v-model="searchQuery"
                placeholder="Search by title, description, or keywords..."
                class="w-full pl-10"
              />
              <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-zaccBlack/40"></i>
            </div>
          </div>

          <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            <div
              v-for="i in 12"
              :key="i"
              class="download-card group rounded-lg border border-black/10 bg-white p-4 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] animate-pulse"
            >
              <div class="grid grid-cols-[auto_1fr] items-start gap-4">
                <div class="h-12 w-12 rounded-md bg-gray-200"></div>
                <div class="flex-1 min-w-0">
                  <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div class="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div class="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
              <div class="h-10 bg-gray-200 rounded mt-4"></div>
            </div>
          </div>
          <div v-else-if="filteredDownloads.length > 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            <div
              v-for="download in paginatedDownloads"
              :key="download.id"
              class="download-card group rounded-lg border border-black/10 bg-white p-4 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div class="grid grid-cols-[auto_1fr] items-start gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-md bg-zaccGold/20 text-zaccBlack">
                  <i :class="getFileIcon(download.fileType)" class="text-2xl"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2 mb-1">
                    <div class="font-semibold text-sm group-hover:text-zaccGreen transition-colors line-clamp-2">
                      {{ download.title }}
                    </div>
                    <Badge
                      :value="(download.fileType || 'PDF').toUpperCase()"
                      :severity="getFileTypeSeverity(download.fileType)"
                      class="flex-shrink-0"
                    />
                  </div>
                  <div class="text-xs text-zaccBlack/60 mb-3">
                    {{ formatFileSize(download.fileSize || 0) }}
                    <span v-if="download.year"> • {{ download.year }}</span>
                  </div>
                  <div v-if="download.description" class="text-xs text-zaccBlack/50 line-clamp-1">
                    {{ download.description }}
                  </div>
                </div>
              </div>
              <div class="flex gap-2 mt-4">
                <NuxtLink
                  :to="getFileUrl(download.fileUrl)"
                  target="_blank"
                  class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-zaccGold px-3 py-2 text-xs font-semibold text-white hover:bg-zaccGold/90 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  View
                </NuxtLink>
                <a
                  :href="getFileUrl(download.fileUrl)"
                  :download="download.title"
                  class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-zaccGold px-3 py-2 text-xs font-semibold text-white hover:brightness-110 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </a>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-20">
            <i class="pi pi-inbox text-6xl text-zaccBlack/20 mb-4"></i>
            <h3 class="text-xl font-semibold text-zaccBlack mb-2">No announcements yet</h3>
            <p class="text-zaccBlack/60">Check back soon, or try a different search.</p>
          </div>

          <div v-if="filteredDownloads.length > itemsPerPage" class="flex justify-center mt-12">
            <Paginator
              :rows="itemsPerPage"
              :totalRecords="filteredDownloads.length"
              :first="(currentPage - 1) * itemsPerPage"
              @page="onPageChange"
              template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            />
          </div>
        </div>
      </section>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
const PRESS_RELEASES_CATEGORY = 'press_releases'

useHead({
  title: 'Announcements - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content:
        'ZACC announcements and press releases — official statements and downloadable documents from the Zimbabwe Anti-Corruption Commission.'
    }
  ]
})

const downloads = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 12

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const getFileUrl = (fileUrl: string | null | undefined) => {
  if (!fileUrl) return '#'
  if (fileUrl.startsWith('/api/')) {
    return fileUrl
  }
  if (fileUrl.startsWith('/uploads/')) {
    return `/api${fileUrl}`
  }
  if (!fileUrl.startsWith('/')) {
    return `/api/uploads/${fileUrl}`
  }
  return `/api${fileUrl}`
}

const fetchDownloads = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/public/downloads', {
      params: { category: PRESS_RELEASES_CATEGORY }
    })
    downloads.value = data
  } catch (error: any) {
    console.error('Error fetching announcements:', error)
    downloads.value = []
  } finally {
    loading.value = false
  }
}

const filteredDownloads = computed(() => {
  let filtered = downloads.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (download) =>
        download.title.toLowerCase().includes(query) ||
        download.description?.toLowerCase().includes(query) ||
        download.category?.toLowerCase().includes(query)
    )
  }
  return filtered
})

const paginatedDownloads = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredDownloads.value.slice(start, end)
})

const getFileIcon = (type: string) => {
  const icons: Record<string, string> = {
    pdf: 'pi pi-file-pdf',
    doc: 'pi pi-file-word',
    docx: 'pi pi-file-word',
    xls: 'pi pi-file-excel',
    xlsx: 'pi pi-file-excel',
    ppt: 'pi pi-file',
    pptx: 'pi pi-file'
  }
  return icons[type?.toLowerCase()] || 'pi pi-file'
}

const getFileTypeSeverity = (type: string) => {
  const severityMap: Record<string, string> = {
    pdf: 'danger',
    doc: 'info',
    docx: 'info',
    xls: 'success',
    xlsx: 'success',
    ppt: 'warning',
    pptx: 'warning'
  }
  return severityMap[type?.toLowerCase()] || 'secondary'
}

const onPageChange = (event: { first: number }) => {
  currentPage.value = event.first / itemsPerPage + 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(searchQuery, () => {
  currentPage.value = 1
})

onMounted(() => {
  fetchDownloads()
})
</script>

<style scoped>
.download-card:hover {
  border-color: rgba(32, 147, 65, 0.3);
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
