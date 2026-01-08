<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- Page Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">News Management</h1>
          <p class="mt-2 text-gray-600">Manage news articles and announcements</p>
        </div>
        <Button
          label="Add Article"
          icon="pi pi-plus"
          @click="openCreateDialog"
          style="background: #209341; border-color: #209341;"
        />
      </div>

      <!-- Filters -->
      <Card class="mb-6 border-0 shadow-md">
        <template #content>
          <div class="flex items-center gap-4 flex-wrap">
            <div class="flex items-center gap-2">
              <label for="categoryFilter" class="text-sm font-semibold text-zaccBlack whitespace-nowrap">
                Category:
              </label>
              <Dropdown
                id="categoryFilter"
                v-model="selectedCategory"
                :options="categoryOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All Categories"
                class="w-48"
                @change="fetchNews"
              />
            </div>
            <div class="flex items-center gap-2">
              <label for="statusFilter" class="text-sm font-semibold text-zaccBlack whitespace-nowrap">
                Status:
              </label>
              <Dropdown
                id="statusFilter"
                v-model="selectedStatus"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All Status"
                class="w-48"
                @change="fetchNews"
              />
            </div>
            <Button
              v-if="selectedCategory || selectedStatus"
              label="Clear Filters"
              icon="pi pi-times"
              severity="secondary"
              outlined
              @click="clearFilters"
            />
          </div>
        </template>
      </Card>

      <!-- News Table -->
      <Card class="border-0 shadow-md">
        <template #content>
          <DataTable
            v-model:filters="filters"
            :value="news"
            :loading="loading"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            :globalFilterFields="['title', 'excerpt', 'category']"
            dataKey="id"
            stripedRows
            class="text-sm"
          >
            <template #header>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xl font-semibold text-zaccBlack">All News Articles</span>
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText
                    v-model="filters.global.value"
                    placeholder="Search articles..."
                    class="w-64"
                  />
                </span>
              </div>
            </template>

            <Column field="title" header="Title" sortable>
              <template #body="{ data }">
                <div class="max-w-md">
                  <div class="font-semibold text-zaccBlack">{{ data.title }}</div>
                  <div class="text-xs text-gray-500 truncate mt-1">{{ truncateText(data.excerpt, 80) }}</div>
                </div>
              </template>
            </Column>

            <Column field="category" header="Category" sortable>
              <template #body="{ data }">
                <Tag :value="formatCategory(data.category)" :severity="getCategorySeverity(data.category)" />
              </template>
            </Column>

            <Column field="isPublished" header="Status">
              <template #body="{ data }">
                <div class="flex flex-col gap-1">
                  <Tag
                    :value="data.isPublished ? 'Published' : 'Draft'"
                    :severity="data.isPublished ? 'success' : 'warning'"
                  />
                  <Tag
                    v-if="data.isFeatured"
                    value="Featured"
                    severity="info"
                    class="text-xs"
                  />
                </div>
              </template>
            </Column>

            <Column field="views" header="Views" sortable>
              <template #body="{ data }">
                <div class="flex items-center gap-1 text-gray-600">
                  <i class="pi pi-eye text-sm"></i>
                  <span>{{ data.views || 0 }}</span>
                </div>
              </template>
            </Column>

            <Column field="publishedAt" header="Published" sortable>
              <template #body="{ data }">
                <div class="text-xs text-gray-600">
                  {{ data.publishedAt ? formatDate(data.publishedAt) : '-' }}
                </div>
              </template>
            </Column>

            <Column field="updatedAt" header="Last Updated" sortable>
              <template #body="{ data }">
                <div class="text-xs text-gray-600">
                  <div>{{ formatDate(data.updatedAt) }}</div>
                  <div v-if="data.updater" class="text-gray-500 mt-1">
                    by {{ data.updater.name || data.updater.email }}
                  </div>
                </div>
              </template>
            </Column>

            <Column header="Actions" :exportable="false" style="width: 200px">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <Button
                    icon="pi pi-external-link"
                    severity="success"
                    outlined
                    rounded
                    size="small"
                    @click="previewArticle(data)"
                    v-tooltip.top="data.isPublished ? 'View Published Article' : 'Preview Draft Article'"
                    :disabled="!data.slug"
                  />
                  <Button
                    icon="pi pi-pencil"
                    severity="info"
                    outlined
                    rounded
                    size="small"
                    @click="openEditDialog(data)"
                    v-tooltip.top="'Edit Article'"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    outlined
                    rounded
                    size="small"
                    @click="confirmDelete(data)"
                    v-tooltip.top="'Delete Article'"
                  />
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="text-center py-8 text-gray-500">
                <i class="pi pi-file text-4xl mb-4"></i>
                <p>No news articles found</p>
              </div>
            </template>
          </DataTable>
        </template>
      </Card>

      <!-- Create/Edit News Dialog -->
      <Dialog
        v-model:visible="dialogVisible"
        :header="isEditMode ? 'Edit News Article' : 'Create New News Article'"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '1000px' }"
        :closable="true"
      >
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="title" class="block text-sm font-semibold text-zaccBlack mb-2">
                Title <span class="text-red-500">*</span>
              </label>
              <InputText
                id="title"
                v-model="newsForm.title"
                placeholder="Article title"
                class="w-full"
                :class="{ 'p-invalid': errors.title }"
                @input="generateSlug"
              />
              <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
            </div>

            <div>
              <label for="slug" class="block text-sm font-semibold text-zaccBlack mb-2">
                Slug <span class="text-red-500">*</span>
              </label>
              <InputText
                id="slug"
                v-model="newsForm.slug"
                placeholder="article-slug"
                class="w-full"
                :class="{ 'p-invalid': errors.slug }"
              />
              <small v-if="errors.slug" class="p-error">{{ errors.slug }}</small>
              <small class="text-gray-500">URL-friendly identifier</small>
            </div>
          </div>

          <div>
            <label for="excerpt" class="block text-sm font-semibold text-zaccBlack mb-2">
              Excerpt <span class="text-red-500">*</span>
            </label>
            <Textarea
              id="excerpt"
              v-model="newsForm.excerpt"
              placeholder="Brief summary of the article"
              :rows="3"
              class="w-full"
              :class="{ 'p-invalid': errors.excerpt }"
            />
            <small v-if="errors.excerpt" class="p-error">{{ errors.excerpt }}</small>
            <small class="text-gray-500">Short description shown in listings</small>
          </div>

          <div>
            <label for="content" class="block text-sm font-semibold text-zaccBlack mb-2">
              Content <span class="text-red-500">*</span>
            </label>
            <Editor
              id="content"
              v-model="newsForm.content"
              editorStyle="height: 400px"
              :class="{ 'p-invalid': errors.content }"
            >
              <template #toolbar>
                <span class="ql-formats">
                  <button class="ql-bold"></button>
                  <button class="ql-italic"></button>
                  <button class="ql-underline"></button>
                  <button class="ql-strike"></button>
                </span>
                <span class="ql-formats">
                  <button class="ql-header" value="1"></button>
                  <button class="ql-header" value="2"></button>
                  <button class="ql-blockquote"></button>
                  <button class="ql-code-block"></button>
                </span>
                <span class="ql-formats">
                  <button class="ql-list" value="ordered"></button>
                  <button class="ql-list" value="bullet"></button>
                  <button class="ql-indent" value="-1"></button>
                  <button class="ql-indent" value="+1"></button>
                </span>
                <span class="ql-formats">
                  <button class="ql-link"></button>
                  <button class="ql-image"></button>
                  <button class="ql-video"></button>
                </span>
                <span class="ql-formats">
                  <button class="ql-align"></button>
                  <button class="ql-color"></button>
                  <button class="ql-background"></button>
                </span>
                <span class="ql-formats">
                  <button class="ql-clean"></button>
                </span>
              </template>
            </Editor>
            <small v-if="errors.content" class="p-error">{{ errors.content }}</small>
            <small class="text-gray-500">Rich text editor with formatting options</small>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="category" class="block text-sm font-semibold text-zaccBlack mb-2">
                Category <span class="text-red-500">*</span>
              </label>
              <Dropdown
                id="category"
                v-model="newsForm.category"
                :options="categoryOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select category"
                class="w-full"
                :class="{ 'p-invalid': errors.category }"
              />
              <small v-if="errors.category" class="p-error">{{ errors.category }}</small>
            </div>

            <div>
              <label class="block text-sm font-semibold text-zaccBlack mb-2">
                Feature Image
              </label>
              <FileUpload
                mode="basic"
                :multiple="false"
                accept="image/*"
                :maxFileSize="5000000"
                :auto="false"
                chooseLabel="Upload Image"
                @select="onImageSelect"
                @clear="clearImage"
                class="w-full"
              />
              <small class="text-gray-500">JPG, PNG, or GIF. Maximum 5MB.</small>
              <div v-if="hasImage" class="mt-4">
                <div v-if="isEditMode && newsForm.imageUrl && !uploadedImage" class="mb-2">
                  <small class="text-gray-600 font-semibold">Current Image:</small>
                </div>
                <div v-else-if="uploadedImage" class="mb-2">
                  <small class="text-gray-600 font-semibold">New Image Preview:</small>
                </div>
                <div class="relative inline-block">
                  <img
                    :src="getImageUrl()"
                    alt="Feature image preview"
                    class="max-w-xs max-h-48 rounded-lg border border-gray-200 object-cover"
                    @error="handleImageError"
                  />
                  <Button
                    icon="pi pi-times"
                    severity="danger"
                    rounded
                    text
                    class="absolute top-2 right-2"
                    @click="clearImage"
                    v-tooltip.top="'Remove image'"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label for="tags" class="block text-sm font-semibold text-zaccBlack mb-2">
              Tags
            </label>
            <InputText
              id="tags"
              v-model="tagsInput"
              placeholder="Enter tags separated by commas"
              class="w-full"
              @blur="updateTags"
              @keydown.enter.prevent.stop="handleTagEnter"
              @keypress.enter.prevent.stop="handleTagEnter"
            />
            <small class="text-gray-500">Separate multiple tags with commas</small>
            <div v-if="newsForm.tags.length > 0" class="flex flex-wrap gap-2 mt-2">
              <Tag
                v-for="(tag, index) in newsForm.tags"
                :key="index"
                :value="tag"
                severity="info"
                class="cursor-pointer"
                @click="removeTag(tag)"
              >
                <template #icon>
                  <i class="pi pi-times text-xs ml-1"></i>
                </template>
              </Tag>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="metaTitle" class="block text-sm font-semibold text-zaccBlack mb-2">
                SEO Meta Title
              </label>
              <InputText
                id="metaTitle"
                v-model="newsForm.metaTitle"
                placeholder="SEO title (optional)"
                class="w-full"
              />
              <small class="text-gray-500">Leave empty to use article title</small>
            </div>

            <div>
              <label for="publishedAt" class="block text-sm font-semibold text-zaccBlack mb-2">
                Publish Date
              </label>
              <Calendar
                id="publishedAt"
                v-model="publishedAtDate"
                :showTime="true"
                :hourFormat="12"
                dateFormat="yy-mm-dd"
                class="w-full"
                :disabled="!newsForm.isPublished"
              />
            </div>
          </div>

          <div>
            <label for="metaDescription" class="block text-sm font-semibold text-zaccBlack mb-2">
              SEO Meta Description
            </label>
            <Textarea
              id="metaDescription"
              v-model="newsForm.metaDescription"
              placeholder="SEO description (optional)"
              :rows="2"
              class="w-full"
            />
            <small class="text-gray-500">Leave empty to use excerpt</small>
          </div>

          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2">
              <Checkbox
                id="isFeatured"
                v-model="newsForm.isFeatured"
                :binary="true"
              />
              <label for="isFeatured" class="text-sm font-semibold text-zaccBlack">
                Featured Article
              </label>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox
                id="isPublished"
                v-model="newsForm.isPublished"
                :binary="true"
              />
              <label for="isPublished" class="text-sm font-semibold text-zaccBlack">
                Publish Now
              </label>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button
              label="Cancel"
              severity="secondary"
              outlined
              @click="closeDialog"
            />
            <Button
              type="submit"
              :label="isEditMode ? 'Update' : 'Create'"
              :loading="submitting"
              style="background: #209341; border-color: #209341;"
            />
          </div>
        </form>
      </Dialog>

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

useHead({
  title: 'News Management - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'Manage news articles and announcements'
    }
  ]
})

definePageMeta({
  middleware: 'admin'
})

const confirm = useConfirm()
const toast = useToast()

// State
const news = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const selectedCategory = ref<string | null>(null)
const selectedStatus = ref<string | null>(null)
const tagsInput = ref('')
const isProcessingTag = ref(false)
const publishedAtDate = ref<Date | null>(null)
const uploadedImage = ref<string | null>(null)
const uploadedImageFile = ref<File | null>(null)
const filters = ref({
  global: { value: null, matchMode: 'contains' }
})

const newsForm = reactive({
  id: '',
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  imageUrl: '',
  category: '',
  isFeatured: false,
  isPublished: false,
  metaTitle: '',
  metaDescription: '',
  tags: [] as string[]
})

const errors = reactive({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: ''
})

// Computed property to check if there's an image to display
const hasImage = computed(() => {
  return !!(newsForm.imageUrl || uploadedImage.value)
})

const categoryOptions = [
  { label: 'Announcements', value: 'announcements' },
  { label: 'Case Updates', value: 'case-updates' },
  { label: 'Events', value: 'events' },
  { label: 'Educational', value: 'educational' },
  { label: 'Partnerships', value: 'partnerships' },
  { label: 'Compliance', value: 'compliance' }
]

const statusOptions = [
  { label: 'All', value: null },
  { label: 'Published', value: 'true' },
  { label: 'Draft', value: 'false' }
]

// Methods
const formatCategory = (category: string) => {
  const cat = categoryOptions.find(c => c.value === category)
  return cat?.label || category
}

const getCategorySeverity = (category: string) => {
  const severityMap: Record<string, string> = {
    'announcements': 'info',
    'case-updates': 'warning',
    'events': 'success',
    'educational': 'primary',
    'partnerships': 'secondary',
    'compliance': 'danger'
  }
  return severityMap[category] || 'info'
}

const truncateText = (text: string, length: number) => {
  return text.length > length ? text.substring(0, length) + '...' : text
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const generateSlug = () => {
  if (!isEditMode.value) {
    newsForm.slug = newsForm.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
}

const handleTagEnter = (event: KeyboardEvent) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  
  // Set flag to prevent form submission
  isProcessingTag.value = true
  
  // Process the tag immediately
  updateTags()
  
  // Reset flag after a brief delay to allow processing to complete
  setTimeout(() => {
    isProcessingTag.value = false
  }, 100)
  
  // Return false to ensure no further event handling
  return false
}

const updateTags = () => {
  // Ensure tags array exists
  if (!Array.isArray(newsForm.tags)) {
    newsForm.tags = []
  }
  
  if (tagsInput.value && typeof tagsInput.value === 'string' && tagsInput.value.trim()) {
    const tags = tagsInput.value
      .split(',')
      .map(tag => tag && typeof tag === 'string' ? tag.trim() : '')
      .filter(tag => tag && tag.length > 0)
    
    if (tags.length > 0) {
      // Merge with existing tags and remove duplicates, ensuring all are strings
      const existingTags = Array.isArray(newsForm.tags) 
        ? newsForm.tags.filter(t => t && typeof t === 'string' && t.trim().length > 0)
        : []
      newsForm.tags = [...new Set([...existingTags, ...tags])]
      tagsInput.value = ''
    }
  }
}

const removeTag = (tag: string) => {
  newsForm.tags = newsForm.tags.filter(t => t !== tag)
}

const getImageUrl = () => {
  // If we have a preview (base64), use it
  if (uploadedImage.value) {
    return uploadedImage.value
  }
  // If we have a server path, use it directly
  if (newsForm.imageUrl) {
    // If it already starts with /api/, use as is
    if (newsForm.imageUrl.startsWith('/api/')) {
      return newsForm.imageUrl
    }
    // If it starts with /uploads/, prepend /api
    if (newsForm.imageUrl.startsWith('/uploads/')) {
      return `/api${newsForm.imageUrl}`
    }
    // If it doesn't start with /, it might be a relative path, prepend /api/uploads/
    if (!newsForm.imageUrl.startsWith('/')) {
      return `/api/uploads/${newsForm.imageUrl}`
    }
    // Otherwise, prepend /api
    return `/api${newsForm.imageUrl}`
  }
  return ''
}

const handleImageError = (event: Event) => {
  // If image fails to load, try alternative path
  const img = event.target as HTMLImageElement
  if (newsForm.imageUrl && !img.src.includes('/api/')) {
    // Try with /api prefix if not already there
    const altUrl = newsForm.imageUrl.startsWith('/') 
      ? `/api${newsForm.imageUrl}`
      : `/api/uploads/${newsForm.imageUrl}`
    img.src = altUrl
  }
}

// Image upload handlers
const onImageSelect = async (event: any) => {
  const file = event.files[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Image size must be less than 5MB',
        life: 3000
      })
      return
    }
    
    // Create preview immediately
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedImage.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
    
    // Upload to server
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await $fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (response && response.path) {
        newsForm.imageUrl = response.path
        uploadedImageFile.value = file
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Image uploaded successfully',
          life: 2000
        })
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.data?.message || 'Failed to upload image',
        life: 3000
      })
      uploadedImage.value = null
    }
  }
}

const clearImage = () => {
  uploadedImage.value = null
  uploadedImageFile.value = null
  newsForm.imageUrl = ''
}

// Fetch news
const fetchNews = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedCategory.value) params.category = selectedCategory.value
    if (selectedStatus.value !== null) params.isPublished = selectedStatus.value

    const data = await $fetch('/api/news', { params })
    news.value = data
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load news',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  selectedCategory.value = null
  selectedStatus.value = null
  fetchNews()
}

// Open create dialog
const openCreateDialog = () => {
  isEditMode.value = false
  resetForm()
  dialogVisible.value = true
}

// Open edit dialog
const openEditDialog = (item: any) => {
  isEditMode.value = true
  newsForm.id = item.id
  newsForm.title = item.title
  newsForm.slug = item.slug
  newsForm.excerpt = item.excerpt
  newsForm.content = item.content
  // Ensure imageUrl is set properly - preserve the original path
  newsForm.imageUrl = item.imageUrl || ''
  newsForm.category = item.category
  newsForm.isFeatured = item.isFeatured
  newsForm.isPublished = item.isPublished
  newsForm.metaTitle = item.metaTitle || ''
  newsForm.metaDescription = item.metaDescription || ''
  newsForm.tags = item.tags?.map((t: any) => t.tag) || []
  tagsInput.value = ''
  publishedAtDate.value = item.publishedAt ? new Date(item.publishedAt) : null
  // Clear any uploaded image preview - we'll use the existing image from the server
  uploadedImage.value = null
  uploadedImageFile.value = null
  dialogVisible.value = true
}

// Close dialog
const closeDialog = () => {
  dialogVisible.value = false
  resetForm()
}

// Reset form
const resetForm = () => {
  newsForm.id = ''
  newsForm.title = ''
  newsForm.slug = ''
  newsForm.excerpt = ''
  newsForm.content = ''
  newsForm.imageUrl = ''
  newsForm.category = ''
  newsForm.isFeatured = false
  newsForm.isPublished = false
  newsForm.metaTitle = ''
  newsForm.metaDescription = ''
  newsForm.tags = []
  tagsInput.value = ''
  publishedAtDate.value = null
  uploadedImage.value = null
  uploadedImageFile.value = null
  errors.title = ''
  errors.slug = ''
  errors.excerpt = ''
  errors.content = ''
  errors.category = ''
}

// Validate form
const validateForm = () => {
  let valid = true
  errors.title = ''
  errors.slug = ''
  errors.excerpt = ''
  errors.content = ''
  errors.category = ''

  if (!newsForm.title.trim()) {
    errors.title = 'Title is required'
    valid = false
  }

  if (!newsForm.slug.trim()) {
    errors.slug = 'Slug is required'
    valid = false
  }

  if (!newsForm.excerpt.trim()) {
    errors.excerpt = 'Excerpt is required'
    valid = false
  }

  if (!newsForm.content.trim()) {
    errors.content = 'Content is required'
    valid = false
  }

  if (!newsForm.category) {
    errors.category = 'Category is required'
    valid = false
  }

  return valid
}

// Handle submit
const handleSubmit = async () => {
  // Prevent submission if we're currently processing a tag
  if (isProcessingTag.value) {
    return
  }
  
  if (!validateForm()) {
    return
  }

  // Update tags from input before submitting
  updateTags()
  
  // Ensure we're not processing a tag
  if (isProcessingTag.value) {
    return
  }

  submitting.value = true
  try {
    // Ensure tags array contains only strings and filter out any null/undefined values
    // Double-check that tags is an array and all values are valid strings
    let tagsArray: string[] = []
    if (Array.isArray(newsForm.tags)) {
      tagsArray = newsForm.tags
    } else if (newsForm.tags !== null && newsForm.tags !== undefined) {
      // If it's not an array, try to convert it
      tagsArray = []
    }
    
    const validTags = tagsArray
      .filter(tag => tag !== null && tag !== undefined && typeof tag === 'string')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    const payload: any = {
      title: newsForm.title,
      slug: newsForm.slug,
      excerpt: newsForm.excerpt,
      content: newsForm.content,
      imageUrl: newsForm.imageUrl || undefined,
      category: newsForm.category,
      isFeatured: newsForm.isFeatured,
      isPublished: newsForm.isPublished,
      metaTitle: newsForm.metaTitle || undefined,
      metaDescription: newsForm.metaDescription || undefined,
      tags: validTags
    }

    if (newsForm.isPublished && publishedAtDate.value) {
      payload.publishedAt = publishedAtDate.value.toISOString()
    } else if (!newsForm.isPublished) {
      payload.publishedAt = null
    }

    if (isEditMode.value) {
      await $fetch(`/api/news/${newsForm.id}`, {
        method: 'PUT',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'News article updated successfully',
        life: 3000
      })
    } else {
      await $fetch('/api/news', {
        method: 'POST',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'News article created successfully',
        life: 3000
      })
    }
    closeDialog()
    await fetchNews()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || (isEditMode.value ? 'Failed to update article' : 'Failed to create article'),
      life: 3000
    })
  } finally {
    submitting.value = false
  }
}

// Delete news
const previewArticle = (item: any) => {
  if (!item.slug) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Article must have a slug to preview',
      life: 3000
    })
    return
  }
  
  // Build preview URL - for unpublished articles, we might need to add a preview parameter
  let url = `/${item.slug}`
  
  // If article is not published, add preview parameter (if your frontend supports it)
  if (!item.isPublished) {
    url += `?preview=true`
  }
  
  // Open article in new tab
  window.open(url, '_blank')
}

const confirmDelete = (item: any) => {
  confirm.require({
    message: `Are you sure you want to delete "${item.title}"?`,
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger'
    },
    accept: async () => {
      try {
        await $fetch(`/api/news/${item.id}`, {
          method: 'DELETE'
        })
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'News article deleted successfully',
          life: 3000
        })
        await fetchNews()
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.data?.message || 'Failed to delete article',
          life: 3000
        })
      }
    }
  })
}

// Lifecycle
onMounted(() => {
  fetchNews()
})
</script>

