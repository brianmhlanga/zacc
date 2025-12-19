<template>
  <div>
    <!-- Hero Section -->
    <section class="relative isolate overflow-hidden bg-zaccGreen text-white py-24">
      <div class="absolute inset-0">
        <img src="/harare.JPG" alt="Gallery" class="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div class="absolute inset-0 bg-zaccGreen/90"></div>
      </div>
      <div class="relative mx-auto max-w-7xl px-6">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Gallery</h1>
          <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
            Explore our photo gallery showcasing ZACC's activities, events, and achievements.
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
              <label for="gallerySearch" class="block text-sm font-semibold text-zaccBlack mb-2">
                Search Gallery
              </label>
              <div class="relative">
                <InputText
                  id="gallerySearch"
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

        <!-- Category Tabs -->
        <div class="mb-8 flex flex-wrap gap-2 justify-center">
          <Button
            v-for="category in categories.slice(1)"
            :key="category.value"
            :label="category.label"
            :severity="selectedCategory === category.value ? null : 'secondary'"
            :outlined="selectedCategory !== category.value"
            @click="selectedCategory = selectedCategory === category.value ? null : category.value"
            class="!bg-zaccGreen !border-zaccGreen !text-white"
            :class="{ '!bg-zaccGold !border-zaccGold': selectedCategory === category.value }"
          />
        </div>

        <!-- Gallery Grid -->
        <div v-if="filteredImages.length > 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-12">
          <div
            v-for="image in paginatedImages"
            :key="image.id"
            class="group relative overflow-hidden rounded-lg cursor-pointer hover:shadow-xl transition-all"
            @click="openLightbox(image)"
          >
            <div class="aspect-square overflow-hidden bg-zaccGreen/10">
              <img
                :src="image.src"
                :alt="image.title"
                class="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div class="font-semibold text-sm mb-1">{{ image.title }}</div>
                <div class="text-xs text-white/80">{{ image.category }}</div>
              </div>
            </div>
            <div class="absolute top-2 right-2">
              <Badge :value="image.category" severity="secondary" class="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div v-else class="text-center py-20">
          <i class="pi pi-images text-6xl text-zaccBlack/20 mb-4"></i>
          <h3 class="text-xl font-semibold text-zaccBlack mb-2">No Images Found</h3>
          <p class="text-zaccBlack/60">Try adjusting your search or filter criteria.</p>
        </div>

        <!-- Pagination -->
        <div v-if="filteredImages.length > itemsPerPage" class="flex justify-center mt-12">
          <Paginator
            :rows="itemsPerPage"
            :totalRecords="filteredImages.length"
            :first="(currentPage - 1) * itemsPerPage"
            @page="onPageChange"
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          />
        </div>
      </div>
    </section>

    <!-- Lightbox Dialog -->
    <Dialog
      v-model:visible="showLightbox"
      :modal="true"
      :closable="true"
      :style="{ width: '90vw', maxWidth: '1200px' }"
      class="lightbox-dialog"
      @hide="closeLightbox"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div>
            <h3 class="text-xl font-extrabold">{{ selectedImage?.title }}</h3>
            <p class="text-sm text-zaccBlack/60 mt-1">{{ selectedImage?.category }} • {{ selectedImage?.date }}</p>
          </div>
          <div class="flex items-center gap-2">
            <Button
              icon="pi pi-chevron-left"
              severity="secondary"
              outlined
              rounded
              @click="previousImage"
              :disabled="currentImageIndex === 0"
              aria-label="Previous image"
            />
            <span class="text-sm text-zaccBlack/60">
              {{ currentImageIndex + 1 }} / {{ filteredImages.length }}
            </span>
            <Button
              icon="pi pi-chevron-right"
              severity="secondary"
              outlined
              rounded
              @click="nextImage"
              :disabled="currentImageIndex === filteredImages.length - 1"
              aria-label="Next image"
            />
          </div>
        </div>
      </template>
      <div v-if="selectedImage" class="relative">
        <div class="aspect-video overflow-hidden rounded-lg bg-zaccGreen/10 mb-4">
          <img
            :src="selectedImage.src"
            :alt="selectedImage.title"
            class="h-full w-full object-contain"
          />
        </div>
        <p v-if="selectedImage.description" class="text-zaccBlack/70 leading-relaxed">
          {{ selectedImage.description }}
        </p>
        <div class="mt-4 flex items-center gap-2">
          <Button
            label="Download"
            icon="pi pi-download"
            severity="secondary"
            outlined
            @click="downloadImage(selectedImage)"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
useHead({
  title: 'Gallery - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Explore ZACC\'s photo gallery showcasing activities, events, office spaces, and achievements in the fight against corruption.'
    }
  ]
})

const categories = [
  { label: 'All Categories', value: null },
  { label: 'Events', value: 'events' },
  { label: 'Office', value: 'office' },
  { label: 'Commissioners', value: 'commissioners' },
  { label: 'Activities', value: 'activities' },
  { label: 'Awards', value: 'awards' },
  { label: 'Training', value: 'training' }
]

const galleryImages = [
  {
    id: 1,
    title: 'ZACC Headquarters',
    description: 'The main headquarters building of the Zimbabwe Anti-Corruption Commission in Harare.',
    category: 'office',
    src: '/harare.JPG',
    date: '2025'
  },
  {
    id: 2,
    title: 'Legal Framework',
    description: 'Representation of the legal framework and legislation that guides ZACC operations.',
    category: 'activities',
    src: '/gavel2.jpg',
    date: '2025'
  },
  {
    id: 3,
    title: 'Zimbabwe Flag',
    description: 'The national flag symbolizing ZACC\'s commitment to serving Zimbabwe.',
    category: 'events',
    src: '/flag.jpg',
    date: '2025'
  },
  {
    id: 4,
    title: 'Commissioner Portrait One',
    description: 'Portrait of a ZACC commissioner.',
    category: 'commissioners',
    src: '/portraitone.png',
    date: '2025'
  },
  {
    id: 5,
    title: 'Commissioner Portrait Two',
    description: 'Portrait of a ZACC commissioner.',
    category: 'commissioners',
    src: '/portraittwo.png',
    date: '2025'
  },
  {
    id: 6,
    title: 'Commissioner Portrait Three',
    description: 'Portrait of a ZACC commissioner.',
    category: 'commissioners',
    src: '/portraitthree.png',
    date: '2025'
  },
  {
    id: 7,
    title: 'Commissioner Portrait Four',
    description: 'Portrait of a ZACC commissioner.',
    category: 'commissioners',
    src: '/portraitfour.png',
    date: '2025'
  },
  {
    id: 8,
    title: 'Court Proceedings',
    description: 'Legal proceedings and court activities related to corruption cases.',
    category: 'activities',
    src: '/gavel.jpg',
    date: '2025'
  },
  {
    id: 9,
    title: 'Asset Recovery',
    description: 'Visual representation of asset recovery efforts in corruption cases.',
    category: 'activities',
    src: '/gavelmoney.jpg',
    date: '2025'
  },
  {
    id: 10,
    title: 'Stakeholder Engagement',
    description: 'Engagement activities with stakeholders and partners.',
    category: 'events',
    src: '/businessman.jpg',
    date: '2025'
  },
  {
    id: 11,
    title: 'Legal Documents',
    description: 'Important legal documents and legislation materials.',
    category: 'activities',
    src: '/el1.jpg',
    date: '2025'
  },
  {
    id: 12,
    title: 'Office Environment',
    description: 'ZACC office environment and workspace.',
    category: 'office',
    src: '/el2.jpg',
    date: '2025'
  },
  {
    id: 13,
    title: 'Training Session',
    description: 'Training session for investigators and compliance officers.',
    category: 'training',
    src: '/gavel2.jpg',
    date: '2025'
  },
  {
    id: 14,
    title: 'Public Awareness Event',
    description: 'Public awareness campaign event on anti-corruption.',
    category: 'events',
    src: '/flag.jpg',
    date: '2025'
  },
  {
    id: 15,
    title: 'Award Ceremony',
    description: 'Recognition ceremony for outstanding anti-corruption efforts.',
    category: 'awards',
    src: '/businessman.jpg',
    date: '2025'
  },
  {
    id: 16,
    title: 'Legal Consultation',
    description: 'Legal consultation and advisory services.',
    category: 'activities',
    src: '/gavel.jpg',
    date: '2025'
  }
]

const searchQuery = ref('')
const selectedCategory = ref(null)
const currentPage = ref(1)
const itemsPerPage = 16
const showLightbox = ref(false)
const selectedImage = ref(null)
const currentImageIndex = ref(0)

const filteredImages = computed(() => {
  let filtered = galleryImages

  // Filter by category
  if (selectedCategory.value) {
    filtered = filtered.filter(image => image.category === selectedCategory.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(image =>
      image.title.toLowerCase().includes(query) ||
      image.description?.toLowerCase().includes(query) ||
      image.category.toLowerCase().includes(query)
    )
  }

  return filtered
})

const paginatedImages = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredImages.value.slice(start, end)
})

const openLightbox = (image) => {
  selectedImage.value = image
  currentImageIndex.value = filteredImages.value.findIndex(img => img.id === image.id)
  showLightbox.value = true
}

const closeLightbox = () => {
  showLightbox.value = false
  selectedImage.value = null
}

const nextImage = () => {
  if (currentImageIndex.value < filteredImages.value.length - 1) {
    currentImageIndex.value++
    selectedImage.value = filteredImages.value[currentImageIndex.value]
  }
}

const previousImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
    selectedImage.value = filteredImages.value[currentImageIndex.value]
  }
}

const downloadImage = (image) => {
  console.log('Downloading image:', image.title)
  // In a real application, this would trigger the actual download
  // const link = document.createElement('a')
  // link.href = image.src
  // link.download = image.title
  // link.click()
  alert(`Downloading: ${image.title}`)
}

const onPageChange = (event) => {
  currentPage.value = (event.first / itemsPerPage) + 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Reset to page 1 when filters change
watch([searchQuery, selectedCategory], () => {
  currentPage.value = 1
})

// Keyboard navigation for lightbox
onMounted(() => {
  const handleKeyPress = (e) => {
    if (showLightbox.value) {
      if (e.key === 'ArrowRight') {
        nextImage()
      } else if (e.key === 'ArrowLeft') {
        previousImage()
      } else if (e.key === 'Escape') {
        closeLightbox()
      }
    }
  }
  window.addEventListener('keydown', handleKeyPress)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress)
  })
})
</script>

<style scoped>
:deep(.lightbox-dialog .p-dialog-header) {
  background: linear-gradient(to right, rgba(32, 147, 65, 0.1), rgba(212, 175, 55, 0.1));
  border-bottom: 1px solid rgba(32, 147, 65, 0.2);
  padding: 1.5rem;
}

:deep(.p-button) {
  font-weight: 600;
}

:deep(.p-button.p-button-outlined) {
  border-width: 1.5px;
}
</style>
