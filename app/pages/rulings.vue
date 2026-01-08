<template>
  <NuxtLayout name="main">
    <div>
      <!-- Hero Section -->
    <section class="relative isolate overflow-hidden bg-zaccGreen text-white py-24">
      <div class="absolute inset-0">
        <img src="/gavel.jpg" alt="Court rulings" class="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div class="absolute inset-0 bg-zaccGreen/90"></div>
      </div>
      <div class="relative mx-auto max-w-7xl px-6">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Court Rulings</h1>
          <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
            Access court judgments, legal decisions, and case outcomes from corruption-related proceedings.
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
          <div class="grid gap-6 lg:grid-cols-4">
            <div class="lg:col-span-2">
              <label for="rulingsSearch" class="block text-sm font-semibold text-zaccBlack mb-2">
                Search Rulings
              </label>
              <div class="relative">
                <InputText
                  id="rulingsSearch"
                  v-model="searchQuery"
                  placeholder="Search by case number, title, or keywords..."
                  class="w-full pl-10"
                />
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-zaccBlack/40"></i>
              </div>
            </div>
            <div>
              <label for="yearFilter" class="block text-sm font-semibold text-zaccBlack mb-2">
                Filter by Year
              </label>
              <Dropdown
                id="yearFilter"
                v-model="selectedYear"
                :options="years"
                optionLabel="label"
                optionValue="value"
                placeholder="All Years"
                class="w-full"
                showClear
              />
            </div>
            <div>
              <label for="outcomeFilter" class="block text-sm font-semibold text-zaccBlack mb-2">
                Filter by Outcome
              </label>
              <Dropdown
                id="outcomeFilter"
                v-model="selectedOutcome"
                :options="outcomes"
                optionLabel="label"
                optionValue="value"
                placeholder="All Outcomes"
                class="w-full"
                showClear
              />
            </div>
          </div>
        </div>

        <!-- Rulings List -->
        <div v-if="loading" class="space-y-6 mb-12">
          <Card
            v-for="i in 6"
            :key="i"
            class="animate-pulse"
          >
            <template #content>
              <div class="p-6">
                <div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div class="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div class="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </template>
          </Card>
        </div>
        <div v-else-if="filteredRulings.length > 0" class="space-y-6 mb-12">
          <Card
            v-for="ruling in paginatedRulings"
            :key="ruling.id"
            class="hover:shadow-lg transition-all cursor-pointer"
            @click="viewRuling(ruling)"
          >
            <template #content>
              <div class="p-6">
                <div class="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div class="flex-1">
                    <div class="flex items-start justify-between gap-4 mb-3">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <Badge :value="ruling.outcome" :severity="getOutcomeSeverity(ruling.outcome)" />
                          <span class="text-sm text-zaccBlack/50">{{ ruling.caseNumber }}</span>
                        </div>
                        <h3 class="text-xl font-extrabold text-zaccBlack mb-2 hover:text-zaccGreen transition-colors">
                          {{ ruling.title }}
                        </h3>
                        <div class="flex flex-wrap items-center gap-4 text-sm text-zaccBlack/60 mb-3">
                          <div class="flex items-center gap-2">
                            <i class="pi pi-calendar"></i>
                            <span>{{ formatDate(ruling.date) }}</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <i class="pi pi-building"></i>
                            <span>{{ ruling.court }}</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <i class="pi pi-user"></i>
                            <span>{{ ruling.judge }}</span>
                          </div>
                        </div>
                        <p class="text-zaccBlack/70 leading-relaxed mb-4">
                          {{ ruling.summary }}
                        </p>
                        <div v-if="ruling.tags && ruling.tags.length > 0" class="flex flex-wrap gap-2">
                          <Tag v-for="tag in ruling.tags" :key="tag" :value="tag" severity="secondary" />
                        </div>
                      </div>
                      <div class="flex-shrink-0 flex gap-2">
                        <Button
                          icon="pi pi-eye"
                          label="View"
                          style="background: #209341; border-color: #209341;"
                          @click.stop="viewRuling(ruling)"
                        />
                        <Button
                          v-if="ruling.downloadUrl"
                          icon="pi pi-download"
                          label="Download"
                          severity="secondary"
                          outlined
                          @click.stop="downloadRuling(ruling)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- No Results -->
        <div v-else class="text-center py-20">
          <i class="pi pi-inbox text-6xl text-zaccBlack/20 mb-4"></i>
          <h3 class="text-xl font-semibold text-zaccBlack mb-2">No Rulings Found</h3>
          <p class="text-zaccBlack/60">Try adjusting your search or filter criteria.</p>
        </div>

        <!-- Pagination -->
        <div v-if="filteredRulings.length > itemsPerPage" class="flex justify-center mt-12">
          <Paginator
            :rows="itemsPerPage"
            :totalRecords="filteredRulings.length"
            :first="(currentPage - 1) * itemsPerPage"
            @page="onPageChange"
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          />
        </div>

        <!-- Statistics Section -->
        <div class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card class="text-center border-l-4 border-l-zaccGreen">
            <template #content>
              <div class="p-6">
                <div class="w-16 h-16 rounded-full bg-zaccGreen/10 flex items-center justify-center mx-auto mb-4">
                  <i class="pi pi-file text-zaccGreen text-3xl"></i>
                </div>
                <div class="text-3xl font-extrabold text-zaccBlack mb-2">{{ totalRulings }}</div>
                <div class="text-sm text-zaccBlack/60">Total Rulings</div>
              </div>
            </template>
          </Card>
          <Card class="text-center border-l-4 border-l-zaccGold">
            <template #content>
              <div class="p-6">
                <div class="w-16 h-16 rounded-full bg-zaccGold/10 flex items-center justify-center mx-auto mb-4">
                  <i class="pi pi-check-circle text-zaccGold text-3xl"></i>
                </div>
                <div class="text-3xl font-extrabold text-zaccBlack mb-2">{{ convictionsCount }}</div>
                <div class="text-sm text-zaccBlack/60">Convictions</div>
              </div>
            </template>
          </Card>
          <Card class="text-center border-l-4 border-l-zaccGreen">
            <template #content>
              <div class="p-6">
                <div class="w-16 h-16 rounded-full bg-zaccGreen/10 flex items-center justify-center mx-auto mb-4">
                  <i class="pi pi-dollar text-zaccGreen text-3xl"></i>
                </div>
                <div class="text-3xl font-extrabold text-zaccBlack mb-2">${{ assetRecoveryTotal }}</div>
                <div class="text-sm text-zaccBlack/60">Asset Recovery</div>
              </div>
            </template>
          </Card>
          <Card class="text-center border-l-4 border-l-zaccGold">
            <template #content>
              <div class="p-6">
                <div class="w-16 h-16 rounded-full bg-zaccGold/10 flex items-center justify-center mx-auto mb-4">
                  <i class="pi pi-calendar text-zaccGold text-3xl"></i>
                </div>
                <div class="text-3xl font-extrabold text-zaccBlack mb-2">{{ currentYear }}</div>
                <div class="text-sm text-zaccBlack/60">This Year</div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </section>

    <!-- Ruling Detail Dialog -->
    <Dialog
      v-model:visible="showDialog"
      :header="selectedRuling?.title"
      :modal="true"
      :style="{ width: '90vw', maxWidth: '1000px' }"
      :closable="true"
    >
      <div v-if="selectedRuling" class="space-y-6">
        <div class="flex flex-wrap items-center gap-4 text-sm text-zaccBlack/60 pb-4 border-b">
          <div class="flex items-center gap-2">
            <i class="pi pi-hashtag"></i>
            <span class="font-semibold">Case Number:</span>
            <span>{{ selectedRuling.caseNumber }}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar"></i>
            <span class="font-semibold">Date:</span>
            <span>{{ formatDate(selectedRuling.date) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-building"></i>
            <span class="font-semibold">Court:</span>
            <span>{{ selectedRuling.court }}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-user"></i>
            <span class="font-semibold">Judge:</span>
            <span>{{ selectedRuling.judge }}</span>
          </div>
          <Badge :value="selectedRuling.outcome" :severity="getOutcomeSeverity(selectedRuling.outcome)" />
        </div>
        <div class="prose max-w-none">
          <h4 class="font-extrabold text-lg mb-3">Summary</h4>
          <p class="text-zaccBlack/80 leading-relaxed mb-6">{{ selectedRuling.summary }}</p>
          <h4 class="font-extrabold text-lg mb-3">Details</h4>
          <p class="text-zaccBlack/80 leading-relaxed mb-6">{{ selectedRuling.details }}</p>
          <div v-if="selectedRuling.assetsRecovered" class="rounded-lg bg-zaccGreen/5 p-4 border border-zaccGreen/20 mb-6">
            <div class="font-semibold text-zaccGreen mb-2">Assets Recovered</div>
            <div class="text-zaccBlack/70">{{ selectedRuling.assetsRecovered }}</div>
          </div>
          <div v-if="selectedRuling.sentence" class="rounded-lg bg-zaccGold/5 p-4 border border-zaccGold/20 mb-6">
            <div class="font-semibold text-zaccGold mb-2">Sentence</div>
            <div class="text-zaccBlack/70">{{ selectedRuling.sentence }}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 pt-4 border-t">
          <Button
            v-if="selectedRuling.downloadUrl"
            label="Download Full Judgment"
            icon="pi pi-download"
            @click="downloadRuling(selectedRuling)"
            style="background: #d4af37; border-color: #d4af37;"
          />
          <Button
            label="Close"
            severity="secondary"
            outlined
            @click="showDialog = false"
          />
        </div>
      </div>
    </Dialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  title: 'Court Rulings - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Access court judgments, legal decisions, and case outcomes from corruption-related proceedings handled by ZACC.'
    }
  ]
})

const years = computed(() => {
  const uniqueYears = [...new Set(rulings.value.map(r => r.year))].sort().reverse()
  return [
    { label: 'All Years', value: null },
    ...uniqueYears.map(year => ({ label: year, value: year }))
  ]
})

const outcomes = [
  { label: 'All Outcomes', value: null },
  { label: 'Conviction', value: 'Conviction' },
  { label: 'Acquittal', value: 'Acquittal' },
  { label: 'Settlement', value: 'Settlement' },
  { label: 'Dismissed', value: 'Dismissed' }
]

const rulings = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')
const selectedYear = ref(null)
const selectedOutcome = ref(null)
const currentPage = ref(1)
const itemsPerPage = 9
const showDialog = ref(false)
const selectedRuling = ref(null)

// Helper function to get download URL
const getDownloadUrl = (downloadUrl: string | null | undefined) => {
  if (!downloadUrl) return '#'
  // If it already starts with /api/, use as is
  if (downloadUrl.startsWith('/api/')) {
    return downloadUrl
  }
  // If it starts with /uploads/, prepend /api
  if (downloadUrl.startsWith('/uploads/')) {
    return `/api${downloadUrl}`
  }
  // If it doesn't start with /, it might be a relative path, prepend /api/uploads/
  if (!downloadUrl.startsWith('/')) {
    return `/api/uploads/${downloadUrl}`
  }
  // Otherwise, prepend /api
  return `/api${downloadUrl}`
}

// Fetch rulings from API
const fetchRulings = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedYear.value) {
      params.year = selectedYear.value
    }
    if (selectedOutcome.value) {
      params.outcome = selectedOutcome.value
    }
    const data = await $fetch('/api/public/rulings', { params })
    rulings.value = data
  } catch (error: any) {
    console.error('Error fetching rulings:', error)
    rulings.value = []
  } finally {
    loading.value = false
  }
}

const filteredRulings = computed(() => {
  let filtered = rulings.value

  // Filter by year (if not already filtered by API)
  if (selectedYear.value) {
    filtered = filtered.filter(ruling => ruling.year === selectedYear.value)
  }

  // Filter by outcome (if not already filtered by API)
  if (selectedOutcome.value) {
    filtered = filtered.filter(ruling => ruling.outcome === selectedOutcome.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(ruling =>
      ruling.caseNumber.toLowerCase().includes(query) ||
      ruling.title.toLowerCase().includes(query) ||
      ruling.summary?.toLowerCase().includes(query) ||
      ruling.court.toLowerCase().includes(query) ||
      ruling.judge.toLowerCase().includes(query) ||
      (ruling.tags && ruling.tags.some((tag: string) => tag.toLowerCase().includes(query)))
    )
  }

  return filtered
})

const paginatedRulings = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredRulings.value.slice(start, end)
})

const totalRulings = computed(() => rulings.value.length)

const convictionsCount = computed(() => {
  return rulings.value.filter(r => r.outcome === 'Conviction').length
})

const assetRecoveryTotal = computed(() => {
  const total = rulings.value
    .filter(r => r.assetsRecovered)
    .reduce((sum, r) => {
      const match = r.assetsRecovered?.match(/USD\s*([\d.]+)\s*million/i)
      if (match) {
        return sum + parseFloat(match[1])
      }
      return sum
    }, 0)
  return total.toFixed(1)
})

const currentYear = computed(() => {
  return rulings.value.filter(r => r.year === new Date().getFullYear().toString()).length
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const getOutcomeSeverity = (outcome) => {
  const severityMap = {
    'Conviction': 'success',
    'Acquittal': 'info',
    'Settlement': 'warning',
    'Dismissed': 'secondary'
  }
  return severityMap[outcome] || 'secondary'
}

const viewRuling = (ruling) => {
  selectedRuling.value = ruling
  showDialog.value = true
}

const downloadRuling = (ruling: any) => {
  if (ruling.downloadUrl) {
    const url = getDownloadUrl(ruling.downloadUrl)
    window.open(url, '_blank')
  }
}

const onPageChange = (event) => {
  currentPage.value = (event.first / itemsPerPage) + 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Reset to page 1 when filters change
watch([searchQuery, selectedYear, selectedOutcome], () => {
  currentPage.value = 1
})

// Fetch rulings on mount
onMounted(() => {
  fetchRulings()
})
</script>

<style scoped>
:deep(.p-card) {
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 5px 10px 0 rgba(41, 61, 102, 0.2);
  transition: all 0.3s ease;
}

:deep(.p-card:hover) {
  transform: translateY(-2px);
  border-color: rgba(32, 147, 65, 0.3);
}

:deep(.p-dialog-header) {
  background: linear-gradient(to right, rgba(32, 147, 65, 0.1), rgba(212, 175, 55, 0.1));
  border-bottom: 1px solid rgba(32, 147, 65, 0.2);
}
</style>
