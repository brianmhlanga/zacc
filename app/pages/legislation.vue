<template>
  <NuxtLayout name="main">
    <div>
      <!-- Hero Section -->
    <section class="relative isolate overflow-hidden bg-zaccGreen text-white py-24">
      <div class="absolute inset-0">
        <img src="/gavel.jpg" alt="Legal framework" class="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div class="absolute inset-0 bg-zaccGreen/90"></div>
      </div>
      <div class="relative mx-auto max-w-7xl px-6">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">{{ getContent('hero-title', 'Legislation') }}</h1>
          <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
            {{ getContent('hero-subtitle', 'Legal Framework and Anti-Corruption Laws') }}
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
        <!-- Introduction -->
        <div class="grid gap-12 lg:grid-cols-2 items-center mb-20">
          <div>
            <h2 class="text-3xl font-extrabold mb-4">{{ getContent('introduction-title', 'Legal Framework') }}</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mb-6"></div>
            <p class="text-zaccBlack/70 leading-relaxed mb-4">
              {{ getContent('introduction-paragraph-1', 'The Zimbabwe Anti-Corruption Commission operates within a comprehensive legal and policy framework.') }}
            </p>
            <p class="text-zaccBlack/70 leading-relaxed">
              {{ getContent('introduction-paragraph-2', 'The legal basis for ZACC\'s operations ensures independence, accountability, and effectiveness.') }}
            </p>
          </div>
          <div class="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-lg">
            <img src="/gavel2.jpg" alt="Legal documents" class="h-full w-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-zaccGreen/80 to-transparent"></div>
            <div class="absolute bottom-6 left-6 right-6 text-white">
              <div class="text-2xl font-extrabold">{{ getContent('introduction-image-overlay-title', 'Constitutional Mandate') }}</div>
              <div class="text-sm text-white/90 mt-1">{{ getContent('introduction-image-overlay-subtitle', 'Established by law, serving justice') }}</div>
            </div>
          </div>
        </div>

        <!-- Constitutional Framework -->
        <div class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">{{ getContent('constitutional-title', 'Constitutional Framework') }}</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
            <p class="text-zaccBlack/70 max-w-3xl mx-auto">
              {{ getContent('constitutional-description', 'Constitution of Zimbabwe (Amendment No. 20 of 2013)') }}
            </p>
          </div>
          <div class="grid gap-8 lg:grid-cols-2 items-center">
            <div class="relative h-[400px] rounded-2xl overflow-hidden shadow-lg">
              <img src="/flag.jpg" alt="Constitution" class="h-full w-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-zaccBlack/70 to-transparent"></div>
              <div class="absolute bottom-6 left-6 right-6 text-white">
                <div class="text-2xl font-extrabold">{{ getContent('constitutional-image-overlay-title', 'Sections 254 & 255') }}</div>
                <div class="text-sm text-white/90 mt-1">{{ getContent('constitutional-image-overlay-subtitle', 'Constitutional Provisions') }}</div>
              </div>
            </div>
            <div class="space-y-6">
              <div class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border-l-4 border-zaccGreen">
                <p class="text-zaccBlack/70 mb-4">
                  {{ getContent('constitutional-content', 'The Zimbabwe Anti-Corruption Commission is established as an independent constitutional commission.') }}
                </p>
                <div v-if="pageContent['constitutional-mandates']" class="font-semibold text-zaccBlack mb-3">{{ pageContent['constitutional-mandates'].title }}</div>
                <ul v-if="getMetadata('constitutional-mandates')?.items" class="space-y-2 text-zaccBlack/70">
                  <li
                    v-for="(item, index) in getMetadata('constitutional-mandates').items"
                    :key="index"
                    class="flex items-start gap-2"
                  >
                    <svg class="h-5 w-5 text-zaccGreen mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Enabling Legislation -->
        <div class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">{{ getContent('enabling-title', 'Enabling Legislation') }}</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
            <p class="text-zaccBlack/70 max-w-3xl mx-auto">
              {{ getContent('enabling-description', 'Anti-Corruption Commission Act [Chapter 9:22]') }}
            </p>
          </div>
          <div class="grid gap-8 lg:grid-cols-2">
            <div class="rounded-xl bg-white p-8 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border-l-4 border-zaccGold">
              <div class="flex items-start gap-4 mb-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-zaccGold/10 flex items-center justify-center">
                  <svg class="h-6 w-6 text-zaccGold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-extrabold mb-3">{{ pageContent['enabling-overview-title']?.title || 'Act Overview' }}</h3>
                  <p class="text-zaccBlack/70 mb-4">
                    {{ getContent('enabling-overview-title', 'The Anti-Corruption Commission Act [Chapter 9:22] operationalises the constitutional mandate of ZACC.') }}
                  </p>
                </div>
              </div>
            </div>
            <div class="rounded-xl bg-white p-8 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border-l-4 border-zaccGreen">
              <h3 class="text-xl font-extrabold mb-4">{{ pageContent['enabling-provisions-title']?.title || 'Key Provisions Include:' }}</h3>
              <ul v-if="getMetadata('enabling-provisions-title')?.items" class="space-y-3 text-zaccBlack/70">
                <li
                  v-for="(item, index) in getMetadata('enabling-provisions-title').items"
                  :key="index"
                  class="flex items-start gap-3"
                >
                  <svg class="h-5 w-5 text-zaccGreen mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Criminal and Procedural Laws -->
        <div class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">{{ getContent('criminal-title', 'Criminal and Procedural Laws') }}</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
            <p class="text-zaccBlack/70 max-w-3xl mx-auto">
              {{ getContent('criminal-description', 'ZACC derives investigative and enforcement support from the following statutes:') }}
            </p>
          </div>
          <div v-if="getMetadata('criminal-laws')?.laws" class="grid gap-6 lg:grid-cols-3">
            <div
              v-for="(law, index) in getMetadata('criminal-laws').laws"
              :key="index"
              class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border border-zaccGreen/10 hover:border-zaccGreen/30 transition"
            >
              <div class="text-2xl font-extrabold text-zaccGreen mb-3">{{ law.title }}</div>
              <div class="text-sm text-zaccBlack/60 mb-4">{{ law.chapter }}</div>
              <p class="text-sm text-zaccBlack/70 mb-4" v-if="law.description">{{ law.description }}</p>
              <ul v-if="law.items" class="space-y-2 text-xs text-zaccBlack/70">
                <li
                  v-for="(item, itemIndex) in law.items"
                  :key="itemIndex"
                  class="flex items-start gap-2"
                >
                  <span class="text-zaccGreen">•</span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Financial Crimes and Asset Recovery -->
        <div class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">{{ getContent('financial-title', 'Financial Crimes and Asset Recovery Legislation') }}</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
          </div>
          <div class="grid gap-8 lg:grid-cols-2 items-center">
            <div class="relative h-[400px] rounded-2xl overflow-hidden shadow-lg">
              <img src="/gavelmoney.jpg" alt="Asset recovery" class="h-full w-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-zaccBlack/70 to-transparent"></div>
            </div>
            <div v-if="getMetadata('financial-laws')?.laws" class="space-y-6">
              <div
                v-for="(law, index) in getMetadata('financial-laws').laws"
                :key="index"
                :class="[
                  'rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)]',
                  index === 0 ? 'border-l-4 border-zaccGreen' : 'border-l-4 border-zaccGold'
                ]"
              >
                <h3 class="text-xl font-extrabold mb-3">{{ law.title }}</h3>
                <div class="text-sm text-zaccBlack/60 mb-3">{{ law.chapter }}</div>
                <p v-if="law.description && !law.items" class="text-zaccBlack/70">{{ law.description }}</p>
                <p v-if="law.description && law.items" class="text-zaccBlack/70 mb-3">{{ law.description }}</p>
                <ul v-if="law.items" class="space-y-2 text-sm text-zaccBlack/70">
                  <li
                    v-for="(item, itemIndex) in law.items"
                    :key="itemIndex"
                    class="flex items-start gap-2"
                  >
                    <svg class="h-4 w-4 text-zaccGreen mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Governance and Public Sector Integrity -->
        <div class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">{{ getContent('governance-title', 'Governance and Public Sector Integrity Laws') }}</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
          </div>
          <div v-if="getMetadata('governance-laws')?.laws" class="grid gap-6 lg:grid-cols-2">
            <div
              v-for="(law, index) in getMetadata('governance-laws').laws"
              :key="index"
              class="rounded-xl bg-white p-8 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border border-zaccGreen/10"
            >
              <div class="flex items-start gap-4 mb-4">
                <div :class="[
                  'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
                  index === 0 ? 'bg-zaccGreen/10' : 'bg-zaccGold/10'
                ]">
                  <svg :class="[
                    'h-6 w-6',
                    index === 0 ? 'text-zaccGreen' : 'text-zaccGold'
                  ]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-extrabold mb-2">{{ law.title }}</h3>
                  <div class="text-sm text-zaccBlack/60 mb-3">{{ law.chapter }}</div>
                  <p class="text-zaccBlack/70">{{ law.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- International and Regional Instruments -->
        <div class="mb-20 rounded-2xl bg-gradient-to-r from-zaccGreen/10 to-zaccGold/10 p-12 border border-zaccGreen/20">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">{{ getContent('international-title', 'International and Regional Instruments') }}</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
            <p class="text-zaccBlack/70 max-w-3xl mx-auto">
              {{ getContent('international-description', 'Zimbabwe is a State Party to key international anti-corruption conventions which guide the work of ZACC:') }}
            </p>
          </div>
          <div v-if="getMetadata('international-conventions')?.conventions" class="grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
            <div
              v-for="(convention, index) in getMetadata('international-conventions').conventions"
              :key="index"
              class="rounded-xl bg-white p-6 shadow-sm text-center border border-zaccGreen/10"
            >
              <div class="text-3xl font-extrabold text-zaccGreen mb-2">{{ convention.abbreviation }}</div>
              <div class="font-semibold mb-2">{{ convention.title }}</div>
              <p class="text-xs text-zaccBlack/70">{{ convention.description }}</p>
            </div>
          </div>
          <div class="mt-8 text-center">
            <p class="text-zaccBlack/70 max-w-3xl mx-auto">
              {{ getContent('international-closing', 'These instruments reinforce Zimbabwe\'s commitment to international cooperation, asset recovery, and the promotion of integrity and good governance.') }}
            </p>
          </div>
        </div>

        <!-- Regulations and Statutory Instruments -->
        <div class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">{{ getContent('regulations-title', 'Regulations and Statutory Instruments') }}</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
          </div>
          <div class="grid gap-8 lg:grid-cols-2 items-center">
            <div class="relative h-[400px] rounded-2xl overflow-hidden shadow-lg">
              <img src="/el1.jpg" alt="Regulations" class="h-full w-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-br from-zaccGreen/70 to-zaccBlack/50"></div>
            </div>
            <div class="rounded-xl bg-white p-8 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)]">
              <p class="text-zaccBlack/70 leading-relaxed">
                {{ getContent('regulations-paragraph-1', 'The Minister responsible for anti-corruption, in consultation with ZACC, may issue regulations and statutory instruments.') }}
              </p>
              <p class="text-zaccBlack/70 leading-relaxed mt-4">
                {{ getContent('regulations-paragraph-2', 'These regulations provide detailed operational guidelines, procedures, and standards.') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Access to Legislation -->
        <div class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">{{ getContent('access-title', 'Access to Legislation') }}</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
          </div>
          <div class="rounded-2xl bg-gradient-to-br from-zaccGreen/10 to-zaccGold/10 p-12 border border-zaccGreen/20">
            <div class="text-center mb-8">
              <p class="text-zaccBlack/70 text-lg max-w-3xl mx-auto mb-8">
                {{ getContent('access-description', 'Members of the public are encouraged to familiarise themselves with the laws governing anti-corruption in Zimbabwe.') }}
              </p>
            </div>
            <div v-if="legalDocuments.length > 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
              <div
                v-for="doc in legalDocuments"
                :key="doc.id"
                class="rounded-xl bg-white p-6 shadow-sm border border-zaccGreen/10 text-center hover:border-zaccGreen/30 transition cursor-pointer group"
                @click="viewDocument(doc)"
              >
                <div class="flex justify-center mb-3">
                  <div class="flex h-12 w-12 items-center justify-center rounded-md bg-zaccGreen/10 text-zaccGreen group-hover:bg-zaccGreen group-hover:text-white transition-colors">
                    <i :class="getFileIcon(doc.fileType)" class="text-2xl"></i>
                  </div>
                </div>
                <div class="text-xs font-semibold text-zaccGreen mb-2 uppercase">{{ (doc.fileType || 'PDF').toUpperCase() }}</div>
                <div class="font-semibold text-sm mb-1 text-zaccBlack group-hover:text-zaccGreen transition-colors line-clamp-2">{{ doc.title }}</div>
                <div v-if="doc.description" class="text-xs text-zaccBlack/60 line-clamp-2">{{ doc.description }}</div>
              </div>
            </div>
            <div v-else-if="!loadingDocuments" class="text-center py-8">
              <p class="text-zaccBlack/60">No legal documents available at this time.</p>
            </div>
            <div class="mt-8 text-center">
              <NuxtLink
                to="/downloads"
                class="inline-flex items-center gap-2 rounded-md bg-zaccGreen px-6 py-3 font-semibold text-white shadow-glow hover:brightness-110"
              >
                {{ getContent('access-button-text', 'View All Legal Documents') }}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5l6 6-6 6M3 12h16.5" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Contact for Legal Inquiries -->
        <div class="mb-12 rounded-2xl bg-zaccGreen p-12 text-white text-center relative overflow-hidden">
          <div class="absolute inset-0 opacity-10">
            <img src="/flag.jpg" alt="Background" class="h-full w-full object-cover" />
          </div>
          <div class="relative z-10">
            <h2 class="text-3xl font-extrabold mb-4">{{ getContent('inquiries-title', 'Legal Inquiries') }}</h2>
            <div class="h-1 w-20 rounded bg-white/70 mx-auto mb-6"></div>
            <p class="text-white/90 text-lg mb-8 max-w-3xl mx-auto">
              {{ getContent('inquiries-description', 'For legal inquiries, compliance guidance, or questions about anti-corruption legislation, please contact our Legal Department.') }}
            </p>
            <NuxtLink
              to="/contact"
              class="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 font-semibold text-zaccGreen shadow-lg hover:bg-white/90"
            >
              {{ getContent('inquiries-button-text', 'Contact Legal Department') }}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5l6 6-6 6M3 12h16.5" />
              </svg>
            </NuxtLink>
          </div>
        </div>

        <!-- Back to Home -->
        <div class="text-center pt-8">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 rounded-md bg-zaccGreen px-6 py-3 font-semibold text-white shadow-glow hover:brightness-110"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Home
          </NuxtLink>
        </div>
      </div>
    </section>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
const pageContent = ref<any>({})
const loading = ref(true)
const legalDocuments = ref<any[]>([])
const loadingDocuments = ref(true)

// Fetch all legislation page content
const fetchPageContent = async () => {
  loading.value = true
  try {
    const content = await $fetch('/api/public/page-content', {
      params: { pageKey: 'legislation' }
    })
    
    // Organize content by sectionKey
    const contentMap: any = {}
    content.forEach((item: any) => {
      contentMap[item.sectionKey] = item
    })
    
    pageContent.value = contentMap
  } catch (error) {
    console.error('Error fetching legislation page content:', error)
  } finally {
    loading.value = false
  }
}

// Helper to get content
const getContent = (sectionKey: string, fallback: string = '') => {
  return pageContent.value[sectionKey]?.content || fallback
}

// Helper to get metadata
const getMetadata = (sectionKey: string) => {
  return pageContent.value[sectionKey]?.metadata || null
}

// Fetch legal documents
const fetchLegalDocuments = async () => {
  loadingDocuments.value = true
  try {
    const downloads = await $fetch('/api/public/downloads', {
      params: {
        category: 'legal',
        limit: 4
      }
    })
    legalDocuments.value = downloads || []
  } catch (error) {
    console.error('Error fetching legal documents:', error)
    legalDocuments.value = []
  } finally {
    loadingDocuments.value = false
  }
}

// Helper function to get file URL (same as downloads page)
const getFileUrl = (fileUrl: string | null | undefined) => {
  if (!fileUrl) return '#'
  
  // If it's already a full URL (http/https), use as is
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl
  }
  
  // If it already starts with /api/, use as is
  if (fileUrl.startsWith('/api/')) {
    return fileUrl
  }
  
  // If it starts with /uploads/, prepend /api
  if (fileUrl.startsWith('/uploads/')) {
    return `/api${fileUrl}`
  }
  
  // If it doesn't start with /, it's just a filename, prepend /api/uploads/
  if (!fileUrl.startsWith('/')) {
    return `/api/uploads/${fileUrl}`
  }
  
  // Otherwise, prepend /api
  return `/api${fileUrl}`
}

// View document
const viewDocument = (doc: any) => {
  if (doc.fileUrl) {
    const fileUrl = getFileUrl(doc.fileUrl)
    window.open(fileUrl, '_blank')
  } else if (doc.id) {
    navigateTo(`/downloads?view=${doc.id}`)
  }
}

// Get file icon
const getFileIcon = (fileType: string) => {
  const type = (fileType || 'pdf').toLowerCase()
  if (type === 'pdf') return 'pi pi-file-pdf'
  if (type === 'doc' || type === 'docx') return 'pi pi-file-word'
  if (type === 'xls' || type === 'xlsx') return 'pi pi-file-excel'
  return 'pi pi-file'
}

onMounted(() => {
  fetchPageContent()
  fetchLegalDocuments()
})

useHead({
  title: 'Legislation - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Learn about the legal framework governing ZACC, including the Constitution of Zimbabwe (Sections 254-255), Anti-Corruption Commission Act [Chapter 9:22], and related anti-corruption legislation.'
    }
  ]
})
</script>
