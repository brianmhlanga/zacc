<template>
  <NuxtLayout name="main">
    <div class="overflow-x-hidden w-full max-w-full">
      <!-- Loading State -->
      <div v-if="loading" class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-4xl text-zaccGreen mb-4"></i>
          <p class="text-zaccBlack/60">Loading article...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="min-h-screen flex items-center justify-center py-20">
        <div class="text-center max-w-md mx-auto px-6">
          <i class="pi pi-exclamation-triangle text-6xl text-red-500 mb-4"></i>
          <h1 class="text-3xl font-extrabold text-zaccBlack mb-4">Article Not Found</h1>
          <p class="text-zaccBlack/70 mb-6">{{ error }}</p>
          <Button
            label="Go Back to News"
            icon="pi pi-arrow-left"
            @click="navigateTo('/news')"
            style="background: #209341; border-color: #209341;"
          />
        </div>
      </div>

      <!-- Article Content -->
      <div v-else-if="article" class="min-h-screen">
        <!-- Hero Section with Article Image -->
        <section class="relative isolate overflow-hidden bg-zaccBlack text-white">
          <div v-if="article.imageUrl" class="absolute inset-0">
            <img
              :src="getImageUrl(article.imageUrl)"
              :alt="article.title"
              class="absolute inset-0 h-full w-full object-cover opacity-30"
            />
            <div class="absolute inset-0 bg-zaccBlack/80"></div>
          </div>
          <div v-else class="absolute inset-0 bg-zaccBlack"></div>
          <div class="relative mx-auto max-w-4xl px-6 py-24">
            <div class="text-center">
              <div class="mb-4">
                <Tag
                  :value="formatCategory(article.category)"
                  :severity="getCategorySeverity(article.category)"
                  class="text-sm"
                />
                <Tag
                  v-if="article.isFeatured"
                  value="Featured"
                  severity="info"
                  class="text-sm ml-2"
                />
                <Tag
                  v-if="!article.isPublished"
                  value="Draft Preview"
                  severity="warning"
                  class="text-sm ml-2"
                />
              </div>
              <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-6">
                {{ article.title }}
              </h1>
              <p v-if="article.excerpt" class="text-xl text-white/90 max-w-3xl mx-auto mb-6">
                {{ article.excerpt }}
              </p>
              <div class="flex items-center justify-center gap-6 text-sm text-white/80">
                <div class="flex items-center gap-2">
                  <i class="pi pi-calendar"></i>
                  <span>{{ formatDate(article.publishedAt || article.createdAt) }}</span>
                </div>
                <div v-if="article.views" class="flex items-center gap-2">
                  <i class="pi pi-eye"></i>
                  <span>{{ article.views }} views</span>
                </div>
                <div v-if="article.creator" class="flex items-center gap-2">
                  <i class="pi pi-user"></i>
                  <span>{{ article.creator.name || article.creator.email }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Article Content -->
        <section class="relative py-16 overflow-x-hidden">
          <div class="mx-auto max-w-3xl px-6 w-full max-w-full box-border">
            <div class="bg-white rounded-2xl p-8 lg:p-12 overflow-x-hidden">
              <div class="prose prose-lg max-w-none overflow-x-hidden">
                <!-- Article Image (if not in hero) -->
                <div v-if="article.imageUrl" class="mb-8 rounded-2xl overflow-hidden shadow-md w-full max-w-xl mx-auto">
                  <img
                    :src="getImageUrl(article.imageUrl)"
                    :alt="article.title"
                    class="w-full h-auto object-cover max-w-full"
                  />
                </div>

                <!-- Article Content (HTML from editor) -->
                <div
                  class="article-content text-zaccBlack/80 leading-relaxed w-full max-w-full overflow-x-hidden box-border"
                  v-html="article.content"
                ></div>

                <!-- Tags -->
                <div v-if="article.tags && article.tags.length > 0" class="mt-12 pt-8 border-t border-zaccGreen/20">
                  <h3 class="text-lg font-semibold text-zaccBlack mb-4">Tags</h3>
                  <div class="flex flex-wrap gap-2">
                    <Tag
                      v-for="tag in article.tags"
                      :key="tag.id"
                      :value="tag.tag"
                      severity="secondary"
                      class="cursor-default"
                    />
                  </div>
                </div>

                <!-- Back Button -->
                <div class="mt-12 pt-8 border-t border-zaccGreen/20">
                  <Button
                    label="Back to News"
                    icon="pi pi-arrow-left"
                    iconPos="left"
                    severity="secondary"
                    outlined
                    @click="navigateTo('/news')"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'main'
});

const route = useRoute();

// Extract slug from route params
const slug = computed(() => {
  const slugParam = route.params.slug;
  if (Array.isArray(slugParam)) {
    return slugParam[0] as string;
  }
  return slugParam as string;
});

const article = ref(null);
const loading = ref(true);
const error = ref(null);

// Early check: if no slug, show error immediately
// This will run during setup, so we need to check the route path
if (process.client) {
  const currentPath = route.path;
  console.log('Current route path:', currentPath);
  console.log('Route params:', route.params);
  
  // If we're on /news without a slug, this shouldn't happen but let's check
  if (currentPath === '/news' || !route.params.slug) {
    console.error('Route mismatch: Expected /[slug] but got:', currentPath);
  }
}

// Debug: log the slug on setup
watchEffect(() => {
  console.log('[slug].vue - Article slug:', slug.value);
  console.log('[slug].vue - Route path:', route.path);
  console.log('[slug].vue - Route params:', route.params);
  console.log('[slug].vue - Route name:', route.name);
});

const categoryOptions = [
  { label: 'Announcements', value: 'announcements' },
  { label: 'Case Updates', value: 'case-updates' },
  { label: 'Events', value: 'events' },
  { label: 'Educational', value: 'educational' },
  { label: 'Partnerships', value: 'partnerships' },
  { label: 'Compliance', value: 'compliance' }
];

const formatCategory = (category: string) => {
  const cat = categoryOptions.find(c => c.value === category);
  return cat?.label || category;
};

const getCategorySeverity = (category: string) => {
  const severityMap: Record<string, string> = {
    'announcements': 'info',
    'case-updates': 'success',
    'events': 'warning',
    'educational': 'help',
    'partnerships': 'secondary',
    'compliance': 'danger'
  };
  return severityMap[category] || 'secondary';
};

const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  // If it already starts with /api/, use as is
  if (imageUrl.startsWith('/api/')) {
    return imageUrl;
  }
  // If it starts with /uploads/, prepend /api
  if (imageUrl.startsWith('/uploads/')) {
    return `/api${imageUrl}`;
  }
  // If it doesn't start with /, it might be a relative path, prepend /api/uploads/
  if (!imageUrl.startsWith('/')) {
    return `/api/uploads/${imageUrl}`;
  }
  // Otherwise, prepend /api
  return `/api${imageUrl}`;
};

// Fetch article
const fetchArticle = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Check if preview mode (from query param)
    const query = route.query;
    const preview = query.preview === 'true';
    
    const params: any = {};
    if (preview) {
      params.preview = 'true';
    }
    
    const data = await $fetch(`/api/public/news/${slug.value}`, { params });
    article.value = data;
    
    // Set page title and meta
    useHead({
      title: `${data.title} - News - ZACC`,
      meta: [
        {
          name: 'description',
          content: data.metaDescription || data.excerpt || 'Read the full article on ZACC news.'
        },
        {
          property: 'og:title',
          content: data.metaTitle || data.title
        },
        {
          property: 'og:description',
          content: data.metaDescription || data.excerpt || ''
        },
        {
          property: 'og:image',
          content: data.imageUrl ? getImageUrl(data.imageUrl) : ''
        }
      ]
    });
  } catch (err: any) {
    console.error('Error fetching article:', err);
    error.value = err.data?.message || err.statusMessage || 'Failed to load article';
    
    if (err.statusCode === 404) {
      error.value = 'This article could not be found. It may have been removed or the link is incorrect.';
    }
  } finally {
    loading.value = false;
  }
};

// Fetch on mount
onMounted(() => {
  console.log('=== [slug].vue Component mounted ===');
  console.log('Route path:', route.path);
  console.log('Route params:', route.params);
  console.log('Route name:', route.name);
  console.log('Slug value:', slug.value);
  
  if (!slug.value) {
    console.error('No slug found in route params:', route.params);
    error.value = 'Invalid article URL - no slug provided';
    loading.value = false;
    return;
  }
  
  console.log('Fetching article with slug:', slug.value);
  fetchArticle();
});

// Watch for route changes
watch(() => route.params.slug, (newSlug) => {
  console.log('Route slug changed:', newSlug);
  if (newSlug) {
    fetchArticle();
  }
});
</script>

<style scoped>
:deep(.article-content) {
  font-size: 1.125rem;
  line-height: 1.75;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  overflow-x: hidden !important;
  max-width: 100% !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.article-content h1),
:deep(.article-content h2),
:deep(.article-content h3),
:deep(.article-content h4) {
  font-weight: 700;
  color: #209341;
  margin-top: 2rem;
  margin-bottom: 1rem;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  max-width: 100% !important;
  overflow-x: hidden !important;
}

:deep(.article-content h1) {
  font-size: 2.25rem;
}

:deep(.article-content h2) {
  font-size: 1.875rem;
}

:deep(.article-content h3) {
  font-size: 1.5rem;
}

:deep(.article-content h4) {
  font-size: 1.25rem;
}

:deep(.article-content p) {
  margin-bottom: 1.5rem;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  max-width: 100% !important;
  overflow-x: hidden !important;
}

:deep(.article-content ul),
:deep(.article-content ol) {
  margin-bottom: 1.5rem;
  padding-left: 2rem;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  max-width: 100% !important;
  overflow-x: hidden !important;
}

:deep(.article-content li) {
  margin-bottom: 0.5rem;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  max-width: 100% !important;
  overflow-x: hidden !important;
}

:deep(.article-content a) {
  color: #209341;
  text-decoration: underline;
}

:deep(.article-content a:hover) {
  color: #1a7a33;
}

:deep(.article-content img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 2rem 0;
}

:deep(.article-content blockquote) {
  border-left: 4px solid #209341;
  padding-left: 1.5rem;
  margin: 2rem 0;
  font-style: italic;
  color: #4b5563;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  max-width: 100% !important;
  overflow-x: hidden !important;
}

:deep(.article-content code) {
  background-color: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

:deep(.article-content pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 2rem 0;
}

:deep(.article-content pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
}

:deep(.article-content div),
:deep(.article-content span) {
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  max-width: 100% !important;
  overflow-x: hidden !important;
  box-sizing: border-box !important;
}

:deep(.article-content *) {
  max-width: 100% !important;
  box-sizing: border-box !important;
}
</style>

