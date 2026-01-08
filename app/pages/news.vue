<template>
  <NuxtLayout name="main">
    <div class="overflow-x-hidden">
      <!-- Hero Section -->
    <section class="relative isolate overflow-hidden bg-zaccGreen text-white py-24">
      <div class="absolute inset-0">
        <img src="/gavel.jpg" alt="News and updates" class="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div class="absolute inset-0 bg-zaccGreen/90"></div>
      </div>
      <div class="relative mx-auto max-w-7xl px-6">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">News & Updates</h1>
          <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
            Stay informed about ZACC's latest announcements, case updates, events, and educational insights.
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
        <!-- Search and Filter Section -->
        <div class="mb-12 rounded-2xl bg-white p-6 shadow-lg border border-zaccGreen/10">
          <div class="grid gap-6 lg:grid-cols-3">
            <div class="lg:col-span-2">
              <label for="newsSearch" class="block text-sm font-semibold text-zaccBlack mb-2">
                Search News
              </label>
              <div class="relative">
                <InputText
                  id="newsSearch"
                  v-model="searchQuery"
                  placeholder="Search by title, content, or keywords..."
                  class="w-full pl-10"
                />
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-zaccBlack/40"></i>
              </div>
            </div>
            <div>
              <label for="categoryFilter" class="block text-sm font-semibold text-zaccBlack mb-2">
                Filter by Category
              </label>
              <Dropdown
                id="categoryFilter"
                v-model="selectedCategory"
                :options="categories"
                optionLabel="label"
                optionValue="value"
                placeholder="All Categories"
                class="w-full"
                showClear
              />
            </div>
          </div>
        </div>

        <!-- News Grid -->
        <div v-if="loading" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          <div
            v-for="i in 6"
            :key="i"
            class="news-card overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] animate-pulse"
          >
            <div class="h-1 bg-gray-200"></div>
            <div class="aspect-[16/9] bg-gray-200"></div>
            <div class="p-5">
              <div class="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div class="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
        <div v-else-if="filteredNews.length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          <NuxtLink
            v-for="article in paginatedNews"
            :key="article.id"
            :to="`/${article.slug}`"
            class="news-card group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] cursor-pointer hover:shadow-xl transition-all block"
          >
            <div class="relative">
              <div class="h-1 bg-zaccGold"></div>
              <div class="aspect-[16/9] overflow-hidden">
                <img
                  :src="getImageUrl(article.imageUrl)"
                  :alt="article.title"
                  class="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  @error="(e) => { (e.target as HTMLImageElement).src = '/placeholder-news.jpg' }"
                />
              </div>
            </div>
            <div class="p-5">
              <div class="flex items-center justify-between mb-2">
                <div class="text-xs text-zaccBlack/50">{{ formatDate(article.publishedAt || article.createdAt) }}</div>
                <Badge :value="article.category" :severity="getCategorySeverity(article.category)" />
              </div>
              <h3 class="text-base font-semibold group-hover:text-zaccGreen transition-colors mb-2">
                {{ article.title }}
              </h3>
              <p class="text-sm text-zaccBlack/60 line-clamp-2 mb-4">
                {{ article.excerpt }}
              </p>
              <Button
                label="Read More"
                icon="pi pi-arrow-right"
                iconPos="right"
                severity="secondary"
                outlined
                class="w-full group-hover:!bg-zaccGreen group-hover:!border-zaccGreen group-hover:!text-white transition-all duration-300"
                @click.stop
              />
            </div>
          </NuxtLink>
        </div>

        <!-- No Results -->
        <div v-else class="text-center py-20">
          <i class="pi pi-inbox text-6xl text-zaccBlack/20 mb-4"></i>
          <h3 class="text-xl font-semibold text-zaccBlack mb-2">No News Found</h3>
          <p class="text-zaccBlack/60">Try adjusting your search or filter criteria.</p>
        </div>

        <!-- Pagination -->
        <div v-if="filteredNews.length > itemsPerPage" class="flex justify-center mt-12">
          <Paginator
            :rows="itemsPerPage"
            :totalRecords="filteredNews.length"
            :first="(currentPage - 1) * itemsPerPage"
            @page="onPageChange"
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          />
        </div>

        <!-- Featured Article (if exists) -->
        <div v-if="featuredArticle && currentPage === 1" class="mt-16 rounded-2xl overflow-hidden border border-zaccGreen/20 shadow-xl">
          <div class="grid lg:grid-cols-2">
            <div class="relative h-64 lg:h-auto">
              <img
                :src="getImageUrl(featuredArticle.imageUrl)"
                :alt="featuredArticle.title"
                class="h-full w-full object-cover"
                @error="(e) => { (e.target as HTMLImageElement).src = '/placeholder-news.jpg' }"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-zaccBlack/80 to-transparent"></div>
            </div>
            <div class="bg-gradient-to-br from-zaccGreen/10 to-zaccGold/10 p-8 lg:p-12 flex flex-col justify-center">
              <Badge :value="featuredArticle.category" :severity="getCategorySeverity(featuredArticle.category)" class="mb-4 w-fit" />
              <h2 class="text-3xl font-extrabold text-zaccBlack mb-4">{{ featuredArticle.title }}</h2>
              <p class="text-zaccBlack/70 mb-6 leading-relaxed">{{ featuredArticle.excerpt }}</p>
              <div class="flex items-center justify-between">
                <div class="text-sm text-zaccBlack/50">{{ formatDate(featuredArticle.publishedAt || featuredArticle.createdAt) }}</div>
                <NuxtLink :to="`/${featuredArticle.slug}`">
                  <Button
                    label="Read Full Article"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    style="background: #209341; border-color: #209341;"
                  />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Article Detail Dialog -->
    <Dialog
      v-model:visible="showDialog"
      :header="selectedArticle?.title"
      :modal="true"
      :style="{ width: '90vw', maxWidth: '900px' }"
      :closable="true"
    >
      <div v-if="selectedArticle" class="space-y-6 overflow-x-hidden w-full max-w-full box-border">
        <div class="flex items-center gap-4 text-sm text-zaccBlack/60 flex-wrap">
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar"></i>
            <span>{{ formatDate(selectedArticle.date) }}</span>
          </div>
          <Badge :value="selectedArticle.category" :severity="getCategorySeverity(selectedArticle.category)" />
        </div>
        <div v-if="selectedArticle.imageUrl" class="aspect-video overflow-hidden rounded-lg w-full max-w-full">
          <img :src="getImageUrl(selectedArticle.imageUrl)" :alt="selectedArticle.title" class="h-full w-full object-cover max-w-full" />
        </div>
        <div class="w-full max-w-full box-border prose prose-sm max-w-none">
          <div class="text-zaccBlack/80 leading-relaxed break-words overflow-wrap-anywhere word-break-break-word" v-html="selectedArticle.content"></div>
        </div>
      </div>
    </Dialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  title: 'News & Updates - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Stay informed about ZACC\'s latest announcements, case updates, events, and educational insights on anti-corruption efforts in Zimbabwe.'
    }
  ]
})

const categories = [
  { label: 'All Categories', value: null },
  { label: 'Announcements', value: 'announcements' },
  { label: 'Case Updates', value: 'case-updates' },
  { label: 'Events', value: 'events' },
  { label: 'Educational', value: 'educational' },
  { label: 'Partnerships', value: 'partnerships' },
  { label: 'Compliance', value: 'compliance' }
]

const newsArticles = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref(null)
const currentPage = ref(1)
const itemsPerPage = 9
const showDialog = ref(false)
const selectedArticle = ref(null)

// Helper function to get image URL
const getImageUrl = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return '/placeholder-news.jpg'
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

// Fetch news from API
const fetchNews = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedCategory.value) {
      params.category = selectedCategory.value
    }
    const data = await $fetch('/api/public/news', { params })
    newsArticles.value = data
  } catch (error: any) {
    console.error('Error fetching news:', error)
    newsArticles.value = []
  } finally {
    loading.value = false
  }
}

const featuredArticle = computed(() => {
  // Get the first featured article, or first article if no featured
  return newsArticles.value.find(article => article.isFeatured) || newsArticles.value[0]
})

const filteredNews = computed(() => {
  let filtered = newsArticles.value

  // Filter by category (if not already filtered by API)
  if (selectedCategory.value) {
    filtered = filtered.filter(article => article.category === selectedCategory.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.excerpt?.toLowerCase().includes(query) ||
      article.content?.toLowerCase().includes(query) ||
      (article.tags && article.tags.some((tag: any) => tag.tag?.toLowerCase().includes(query)))
    )
  }

  return filtered
})

const paginatedNews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredNews.value.slice(start, end)
})

const formatDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const getCategorySeverity = (category) => {
  const severityMap = {
    'announcements': 'info',
    'case-updates': 'success',
    'events': 'warning',
    'educational': 'help',
    'partnerships': 'secondary',
    'compliance': 'danger'
  }
  return severityMap[category] || 'secondary'
}

const viewArticle = (article: any) => {
  selectedArticle.value = article
  showDialog.value = true
}

const onPageChange = (event) => {
  currentPage.value = (event.first / itemsPerPage) + 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Reset to page 1 when filters change
watch([searchQuery, selectedCategory], () => {
  currentPage.value = 1
})

// Fetch news on mount
onMounted(() => {
  fetchNews()
})
</script>

<style scoped>
.news-card:hover {
  transform: translateY(-4px);
}

:deep(.p-dialog-header) {
  background: linear-gradient(to right, rgba(32, 147, 65, 0.1), rgba(212, 175, 55, 0.1));
  border-bottom: 1px solid rgba(32, 147, 65, 0.2);
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

:deep(.p-dialog-header .p-dialog-title) {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
  overflow: hidden;
}

:deep(.p-dialog-content) {
  overflow-x: hidden !important;
  max-width: 100% !important;
  width: 100% !important;
  box-sizing: border-box !important;
  padding: 1.5rem !important;
}

:deep(.p-dialog) {
  max-width: 100vw !important;
  overflow-x: hidden !important;
  box-sizing: border-box !important;
}

:deep(.p-dialog .p-dialog-content-wrapper) {
  max-width: 100% !important;
  overflow-x: hidden !important;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.p-button.p-button-outlined) {
  border-width: 1.5px;
  font-weight: 600;
}

:deep(.p-button.p-button-outlined:hover) {
  transform: translateX(2px);
}

.overflow-wrap-anywhere {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.word-break-break-word {
  word-break: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

.prose {
  word-break: break-word;
  overflow-wrap: break-word;
}

.prose :deep(p) {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.prose :deep(ul),
.prose :deep(ol) {
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
}

.prose :deep(li) {
  margin-bottom: 0.25rem;
}

.prose :deep(strong) {
  font-weight: 600;
}

.prose :deep(em) {
  font-style: italic;
}

.prose :deep(a) {
  color: #209341;
  text-decoration: underline;
}

.prose :deep(a:hover) {
  color: #1a7a33;
}
</style>
