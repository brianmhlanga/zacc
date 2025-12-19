<template>
  <div>
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
        <div v-if="filteredNews.length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          <div
            v-for="article in paginatedNews"
            :key="article.id"
            class="news-card group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] cursor-pointer hover:shadow-xl transition-all"
            @click="viewArticle(article)"
          >
            <div class="relative">
              <div class="h-1 bg-zaccGold"></div>
              <div class="aspect-[16/9] overflow-hidden">
                <img
                  :src="article.image"
                  :alt="article.title"
                  class="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
            <div class="p-5">
              <div class="flex items-center justify-between mb-2">
                <div class="text-xs text-zaccBlack/50">{{ formatDate(article.date) }}</div>
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
                @click.stop="viewArticle(article)"
              />
            </div>
          </div>
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
                :src="featuredArticle.image"
                :alt="featuredArticle.title"
                class="h-full w-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-zaccBlack/80 to-transparent"></div>
            </div>
            <div class="bg-gradient-to-br from-zaccGreen/10 to-zaccGold/10 p-8 lg:p-12 flex flex-col justify-center">
              <Badge :value="featuredArticle.category" :severity="getCategorySeverity(featuredArticle.category)" class="mb-4 w-fit" />
              <h2 class="text-3xl font-extrabold text-zaccBlack mb-4">{{ featuredArticle.title }}</h2>
              <p class="text-zaccBlack/70 mb-6 leading-relaxed">{{ featuredArticle.excerpt }}</p>
              <div class="flex items-center justify-between">
                <div class="text-sm text-zaccBlack/50">{{ formatDate(featuredArticle.date) }}</div>
                <Button
                  label="Read Full Article"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  @click="viewArticle(featuredArticle)"
                  style="background: #209341; border-color: #209341;"
                />
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
      <div v-if="selectedArticle" class="space-y-6">
        <div class="flex items-center gap-4 text-sm text-zaccBlack/60">
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar"></i>
            <span>{{ formatDate(selectedArticle.date) }}</span>
          </div>
          <Badge :value="selectedArticle.category" :severity="getCategorySeverity(selectedArticle.category)" />
        </div>
        <div class="aspect-video overflow-hidden rounded-lg">
          <img :src="selectedArticle.image" :alt="selectedArticle.title" class="h-full w-full object-cover" />
        </div>
        <div class="prose max-w-none">
          <p class="text-lg text-zaccBlack/80 leading-relaxed">{{ selectedArticle.content }}</p>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
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

const newsArticles = [
  {
    id: 1,
    title: 'ZACC enhances stakeholder engagement',
    excerpt: 'Strategic collaboration to strengthen integrity systems across public institutions.',
    content: 'The Zimbabwe Anti-Corruption Commission has launched a comprehensive stakeholder engagement initiative aimed at strengthening integrity systems across public institutions. This program focuses on collaborative approaches to prevent corruption and promote transparency.',
    category: 'partnerships',
    date: '2025-11-06',
    image: '/businessman.jpg'
  },
  {
    id: 2,
    title: 'Compliance monitoring initiative',
    excerpt: 'New program to assess integrity plans and risk controls.',
    content: 'ZACC has introduced a new compliance monitoring initiative designed to assess integrity plans and risk controls across various sectors. This program will help identify vulnerabilities and strengthen anti-corruption measures.',
    category: 'compliance',
    date: '2025-10-28',
    image: '/gavel.jpg'
  },
  {
    id: 3,
    title: 'Asset recovery success',
    excerpt: 'Recent court outcomes reinforce deterrence against graft.',
    content: 'Recent successful asset recovery cases have demonstrated ZACC\'s commitment to combating corruption. Court outcomes have reinforced the deterrence message against graft and financial misconduct.',
    category: 'case-updates',
    date: '2025-10-15',
    image: '/gavelmoney.jpg'
  },
  {
    id: 4,
    title: 'Guidelines for expedited trials',
    excerpt: 'Justice sector adopts streamlined procedures for corruption cases.',
    content: 'The justice sector has adopted new streamlined procedures for corruption cases, enabling faster resolution while maintaining due process. These guidelines aim to expedite trials without compromising fairness.',
    category: 'announcements',
    date: '2025-10-09',
    image: '/flag.jpg'
  },
  {
    id: 5,
    title: 'Partnerships expanded',
    excerpt: 'New collaborations with regional integrity bodies.',
    content: 'ZACC has expanded its partnerships with regional integrity bodies, fostering greater cooperation in the fight against corruption. These collaborations enhance information sharing and capacity building.',
    category: 'partnerships',
    date: '2025-10-01',
    image: '/el1.jpg'
  },
  {
    id: 6,
    title: 'Capacity building initiatives',
    excerpt: 'Training programs for investigators and compliance officers.',
    content: 'Comprehensive training programs have been launched for investigators and compliance officers, enhancing their skills in detecting and preventing corruption. These initiatives strengthen ZACC\'s operational capacity.',
    category: 'educational',
    date: '2025-09-20',
    image: '/gavel2.jpg'
  },
  {
    id: 7,
    title: 'Public awareness campaign launched',
    excerpt: 'Nationwide campaign to educate citizens about corruption reporting.',
    content: 'A nationwide public awareness campaign has been launched to educate citizens about corruption reporting mechanisms and their rights. The campaign uses multiple media channels to reach diverse audiences.',
    category: 'educational',
    date: '2025-09-15',
    image: '/el2.jpg'
  },
  {
    id: 8,
    title: 'International cooperation strengthened',
    excerpt: 'Enhanced collaboration with international anti-corruption bodies.',
    content: 'ZACC has strengthened its international cooperation with global anti-corruption bodies, facilitating cross-border investigations and asset recovery efforts.',
    category: 'partnerships',
    date: '2025-09-10',
    image: '/businessman.jpg'
  },
  {
    id: 9,
    title: 'Digital reporting system upgraded',
    excerpt: 'Enhanced online platform for corruption reporting.',
    content: 'The digital reporting system has been upgraded with enhanced security features and improved user experience, making it easier for citizens to report corruption incidents confidentially.',
    category: 'announcements',
    date: '2025-09-05',
    image: '/gavel.jpg'
  },
  {
    id: 10,
    title: 'Annual integrity report published',
    excerpt: 'Comprehensive report on anti-corruption efforts and achievements.',
    content: 'ZACC has published its annual integrity report, detailing comprehensive information about anti-corruption efforts, achievements, and challenges faced during the year.',
    category: 'announcements',
    date: '2025-08-28',
    image: '/flag.jpg'
  },
  {
    id: 11,
    title: 'Training workshop for public officials',
    excerpt: 'Specialized training on ethics and integrity for government employees.',
    content: 'A specialized training workshop has been conducted for public officials, focusing on ethics, integrity, and corruption prevention. The program aims to build a culture of accountability.',
    category: 'educational',
    date: '2025-08-20',
    image: '/gavel2.jpg'
  },
  {
    id: 12,
    title: 'High-profile case resolution',
    excerpt: 'Successful prosecution in major corruption case.',
    content: 'A high-profile corruption case has been successfully resolved, demonstrating ZACC\'s commitment to holding individuals accountable regardless of their position or influence.',
    category: 'case-updates',
    date: '2025-08-15',
    image: '/gavelmoney.jpg'
  }
]

const searchQuery = ref('')
const selectedCategory = ref(null)
const currentPage = ref(1)
const itemsPerPage = 9
const showDialog = ref(false)
const selectedArticle = ref(null)

const featuredArticle = computed(() => {
  return newsArticles[0] // First article as featured
})

const filteredNews = computed(() => {
  let filtered = newsArticles

  // Filter by category
  if (selectedCategory.value) {
    filtered = filtered.filter(article => article.category === selectedCategory.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.excerpt.toLowerCase().includes(query) ||
      article.content.toLowerCase().includes(query)
    )
  }

  return filtered
})

const paginatedNews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredNews.value.slice(start, end)
})

const formatDate = (dateString) => {
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

const viewArticle = (article) => {
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
</script>

<style scoped>
.news-card:hover {
  transform: translateY(-4px);
}

:deep(.p-dialog-header) {
  background: linear-gradient(to right, rgba(32, 147, 65, 0.1), rgba(212, 175, 55, 0.1));
  border-bottom: 1px solid rgba(32, 147, 65, 0.2);
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
</style>
