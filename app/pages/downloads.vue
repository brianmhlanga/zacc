<template>
  <div>
    <!-- Hero Section -->
    <section class="relative isolate overflow-hidden bg-zaccGreen text-white py-24">
      <div class="absolute inset-0">
        <img src="/gavel2.jpg" alt="Downloads" class="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div class="absolute inset-0 bg-zaccGreen/90"></div>
      </div>
      <div class="relative mx-auto max-w-7xl px-6">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Downloads</h1>
          <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
            Access forms, publications, reports, and other resources from ZACC.
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
              <label for="downloadSearch" class="block text-sm font-semibold text-zaccBlack mb-2">
                Search Downloads
              </label>
              <div class="relative">
                <InputText
                  id="downloadSearch"
                  v-model="searchQuery"
                  placeholder="Search by title, description, or keywords..."
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

        <!-- Downloads Grid -->
        <div v-if="filteredDownloads.length > 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          <div
            v-for="download in paginatedDownloads"
            :key="download.id"
            class="download-card group rounded-lg border border-black/10 bg-white p-4 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer"
            @click="handleDownload(download)"
          >
            <div class="grid grid-cols-[auto_1fr] items-start gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-md bg-zaccGold/20 text-zaccBlack">
                <i :class="getFileIcon(download.type)" class="text-2xl"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2 mb-1">
                  <div class="font-semibold text-sm group-hover:text-zaccGreen transition-colors line-clamp-2">
                    {{ download.title }}
                  </div>
                  <Badge :value="download.type.toUpperCase()" :severity="getFileTypeSeverity(download.type)" class="flex-shrink-0" />
                </div>
                <div class="text-xs text-zaccBlack/60 mb-3">
                  {{ download.size }} • Updated {{ download.year }}
                </div>
                <div class="text-xs text-zaccBlack/50 line-clamp-1">
                  {{ download.description }}
                </div>
              </div>
            </div>
            <Button
              label="Download"
              icon="pi pi-download"
              class="w-full mt-4"
              style="background: #d4af37; border-color: #d4af37;"
              @click.stop="handleDownload(download)"
            />
          </div>
        </div>

        <!-- No Results -->
        <div v-else class="text-center py-20">
          <i class="pi pi-inbox text-6xl text-zaccBlack/20 mb-4"></i>
          <h3 class="text-xl font-semibold text-zaccBlack mb-2">No Downloads Found</h3>
          <p class="text-zaccBlack/60">Try adjusting your search or filter criteria.</p>
        </div>

        <!-- Pagination -->
        <div v-if="filteredDownloads.length > itemsPerPage" class="flex justify-center mt-12">
          <Paginator
            :rows="itemsPerPage"
            :totalRecords="filteredDownloads.length"
            :first="(currentPage - 1) * itemsPerPage"
            @page="onPageChange"
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          />
        </div>

        <!-- Categories Section -->
        <div class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            v-for="category in categoryStats"
            :key="category.name"
            class="text-center hover:shadow-lg transition-shadow cursor-pointer"
            @click="selectedCategory = category.value"
          >
            <template #content>
              <div class="p-6">
                <div class="w-16 h-16 rounded-full bg-zaccGreen/10 flex items-center justify-center mx-auto mb-4">
                  <i :class="category.icon" class="text-3xl text-zaccGreen"></i>
                </div>
                <h3 class="font-extrabold text-lg mb-2">{{ category.name }}</h3>
                <p class="text-sm text-zaccBlack/60">{{ category.count }} files</p>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
useHead({
  title: 'Downloads - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Download forms, publications, reports, and resources from the Zimbabwe Anti-Corruption Commission.'
    }
  ]
})

const categories = [
  { label: 'All Categories', value: null },
  { label: 'Forms', value: 'forms' },
  { label: 'Reports', value: 'reports' },
  { label: 'Policies', value: 'policies' },
  { label: 'Guidelines', value: 'guidelines' },
  { label: 'Publications', value: 'publications' },
  { label: 'Legal Documents', value: 'legal' }
]

const downloads = [
  {
    id: 1,
    title: 'Self Declaration Form',
    description: 'Statutory form for income and asset declaration',
    category: 'forms',
    type: 'pdf',
    size: '1.2 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 2,
    title: 'Annual Report 2024',
    description: 'Comprehensive annual report on ZACC activities',
    category: 'reports',
    type: 'pdf',
    size: '4.8 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 3,
    title: 'National Anti-Corruption Survey',
    description: 'Survey publication on corruption perceptions',
    category: 'publications',
    type: 'pdf',
    size: '3.1 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 4,
    title: 'Strategic Plan 2025-2029',
    description: 'Strategic plan document outlining ZACC objectives',
    category: 'reports',
    type: 'pdf',
    size: '2.4 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 5,
    title: 'Quarterly Report Q1 2025',
    description: 'First quarter performance report',
    category: 'reports',
    type: 'pdf',
    size: '2.9 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 6,
    title: 'Procurement Guidelines',
    description: 'Guidelines for transparent procurement processes',
    category: 'guidelines',
    type: 'pdf',
    size: '1.7 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 7,
    title: 'Whistleblower Policy',
    description: 'Policy document on whistleblower protection',
    category: 'policies',
    type: 'pdf',
    size: '1.1 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 8,
    title: 'Compliance Checklist',
    description: 'Checklist for organizational compliance',
    category: 'forms',
    type: 'pdf',
    size: '0.8 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 9,
    title: 'DIAL Form',
    description: 'Declaration of Income, Assets and Liabilities',
    category: 'forms',
    type: 'pdf',
    size: '1.5 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 10,
    title: 'Annual Budget Review',
    description: 'Comprehensive budget review document',
    category: 'reports',
    type: 'pdf',
    size: '3.9 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 11,
    title: 'KLIF Progress Report',
    description: 'Progress report on key initiatives',
    category: 'reports',
    type: 'pdf',
    size: '2.1 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 12,
    title: 'Anti-Corruption Handbook',
    description: 'Comprehensive handbook on anti-corruption measures',
    category: 'publications',
    type: 'pdf',
    size: '5.2 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 13,
    title: 'Public Procurement Code',
    description: 'Code document for public procurement',
    category: 'legal',
    type: 'pdf',
    size: '2.0 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 14,
    title: 'Transparency Guidelines',
    description: 'Guidelines for transparency in public service',
    category: 'guidelines',
    type: 'pdf',
    size: '1.9 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 15,
    title: 'Corruption Report Form',
    description: 'Form for reporting corruption incidents',
    category: 'forms',
    type: 'pdf',
    size: '0.9 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 16,
    title: 'Asset Declaration Guide',
    description: 'Guide for completing asset declarations',
    category: 'guidelines',
    type: 'pdf',
    size: '1.3 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 17,
    title: 'Code of Conduct',
    description: 'Code of conduct for public officials',
    category: 'policies',
    type: 'pdf',
    size: '1.6 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 18,
    title: 'Investigation Procedures',
    description: 'Standard operating procedures for investigations',
    category: 'guidelines',
    type: 'pdf',
    size: '2.3 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 19,
    title: 'Quarterly Report Q2 2025',
    description: 'Second quarter performance report',
    category: 'reports',
    type: 'pdf',
    size: '3.2 MB',
    year: '2025',
    url: '#'
  },
  {
    id: 20,
    title: 'Anti-Corruption Act',
    description: 'Full text of the Anti-Corruption Commission Act',
    category: 'legal',
    type: 'pdf',
    size: '4.5 MB',
    year: '2025',
    url: '#'
  }
]

const searchQuery = ref('')
const selectedCategory = ref(null)
const currentPage = ref(1)
const itemsPerPage = 12

const filteredDownloads = computed(() => {
  let filtered = downloads

  // Filter by category
  if (selectedCategory.value) {
    filtered = filtered.filter(download => download.category === selectedCategory.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(download =>
      download.title.toLowerCase().includes(query) ||
      download.description.toLowerCase().includes(query) ||
      download.category.toLowerCase().includes(query)
    )
  }

  return filtered
})

const paginatedDownloads = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredDownloads.value.slice(start, end)
})

const categoryStats = computed(() => {
  const stats = categories.slice(1).map(cat => ({
    name: cat.label,
    value: cat.value,
    icon: getCategoryIcon(cat.value),
    count: downloads.filter(d => d.category === cat.value).length
  }))
  return stats
})

const getFileIcon = (type) => {
  const icons = {
    pdf: 'pi pi-file-pdf',
    doc: 'pi pi-file-word',
    docx: 'pi pi-file-word',
    xls: 'pi pi-file-excel',
    xlsx: 'pi pi-file-excel',
    ppt: 'pi pi-file',
    pptx: 'pi pi-file'
  }
  return icons[type] || 'pi pi-file'
}

const getFileTypeSeverity = (type) => {
  const severityMap = {
    pdf: 'danger',
    doc: 'info',
    docx: 'info',
    xls: 'success',
    xlsx: 'success',
    ppt: 'warning',
    pptx: 'warning'
  }
  return severityMap[type] || 'secondary'
}

const getCategoryIcon = (category) => {
  const icons = {
    forms: 'pi pi-file-edit',
    reports: 'pi pi-chart-bar',
    policies: 'pi pi-shield',
    guidelines: 'pi pi-book',
    publications: 'pi pi-bookmark',
    legal: 'pi pi-gavel'
  }
  return icons[category] || 'pi pi-file'
}

const handleDownload = (download) => {
  // In a real application, this would trigger the actual download
  console.log('Downloading:', download.title)
  // window.open(download.url, '_blank')
  // For now, just show a message
  alert(`Downloading: ${download.title}`)
}

const onPageChange = (event) => {
  currentPage.value = (event.first / itemsPerPage) + 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Reset to page 1 when filters change
watch([searchQuery, selectedCategory], () => {
  currentPage.value = 1
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

:deep(.p-card) {
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

:deep(.p-card:hover) {
  transform: translateY(-2px);
  border-color: rgba(32, 147, 65, 0.3);
}
</style>
