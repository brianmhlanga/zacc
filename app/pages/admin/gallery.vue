<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- Page Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Media Library</h1>
          <p class="mt-2 text-gray-600">Manage gallery images and photos</p>
        </div>
        <div class="flex items-center gap-2">
          <Button
            label="Bulk Upload"
            icon="pi pi-upload"
            @click="openBulkUploadDialog"
            style="background: #209341; border-color: #209341;"
          />
          <Button
            label="Add Image"
            icon="pi pi-plus"
            @click="openCreateDialog"
            style="background: #209341; border-color: #209341;"
          />
        </div>
      </div>

      <!-- Toolbar -->
      <Card class="mb-6 border-0 shadow-md">
        <template #content>
          <div class="flex items-center justify-between flex-wrap gap-4">
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
                  @change="fetchGallery"
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
                  @change="fetchGallery"
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
            <div class="flex items-center gap-2">
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText
                  v-model="searchQuery"
                  placeholder="Search images..."
                  class="w-64"
                />
              </span>
              <Button
                :icon="viewMode === 'grid' ? 'pi pi-list' : 'pi pi-th-large'"
                :label="viewMode === 'grid' ? 'List' : 'Grid'"
                outlined
                @click="toggleViewMode"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Bulk Actions Bar -->
      <Card v-if="selectedImages.length > 0" class="mb-6 border-0 shadow-md bg-blue-50">
        <template #content>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-zaccBlack">
                {{ selectedImages.length }} image{{ selectedImages.length > 1 ? 's' : '' }} selected
              </span>
            </div>
            <div class="flex items-center gap-2">
              <Button
                label="Publish"
                icon="pi pi-check"
                severity="success"
                outlined
                @click="bulkPublish"
              />
              <Button
                label="Unpublish"
                icon="pi pi-times"
                severity="warning"
                outlined
                @click="bulkUnpublish"
              />
              <Button
                label="Delete"
                icon="pi pi-trash"
                severity="danger"
                outlined
                @click="bulkDelete"
              />
              <Button
                label="Clear Selection"
                icon="pi pi-times-circle"
                severity="secondary"
                outlined
                @click="clearSelection"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Gallery Grid View -->
      <Card v-if="viewMode === 'grid'" class="border-0 shadow-md">
        <template #content>
          <div v-if="loading" class="text-center py-12">
            <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
            <p class="mt-4 text-gray-600">Loading images...</p>
          </div>
          <div v-else-if="filteredImages.length === 0" class="text-center py-12 text-gray-500">
            <i class="pi pi-image text-4xl mb-4"></i>
            <p>No gallery images found</p>
          </div>
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <div
              v-for="image in paginatedImages"
              :key="image.id"
              class="relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all"
              :class="selectedImages.includes(image.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'"
              @click="toggleImageSelection(image.id)"
            >
              <!-- Selection Checkbox -->
              <div class="absolute top-2 left-2 z-10">
                <Checkbox
                  :modelValue="selectedImages.includes(image.id)"
                  :binary="true"
                  @click.stop="toggleImageSelection(image.id)"
                  class="bg-white rounded"
                />
              </div>

              <!-- Image -->
              <div class="aspect-square bg-gray-100 relative">
                <img
                  :src="getImageUrl(image.imageUrl)"
                  :alt="image.alt || image.title"
                  class="w-full h-full object-cover"
                  @error="handleImageError"
                />
                <!-- Overlay on hover -->
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                  <div class="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                    <Button
                      icon="pi pi-eye"
                      rounded
                      text
                      severity="success"
                      @click.stop="viewImage(image)"
                      v-tooltip.top="'View'"
                    />
                    <Button
                      icon="pi pi-pencil"
                      rounded
                      text
                      severity="info"
                      @click.stop="openEditDialog(image)"
                      v-tooltip.top="'Edit'"
                    />
                    <Button
                      icon="pi pi-trash"
                      rounded
                      text
                      severity="danger"
                      @click.stop="confirmDelete(image)"
                      v-tooltip.top="'Delete'"
                    />
                  </div>
                </div>
              </div>

              <!-- Image Info -->
              <div class="p-2 bg-white">
                <div class="text-xs font-semibold text-zaccBlack truncate" :title="image.title">
                  {{ image.title }}
                </div>
                <div class="flex items-center justify-between mt-1">
                  <Tag
                    :value="image.isPublished ? 'Published' : 'Draft'"
                    :severity="image.isPublished ? 'success' : 'warning'"
                    class="text-xs"
                  />
                  <span class="text-xs text-gray-500">{{ formatDate(image.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="mt-6 flex items-center justify-center gap-2">
            <Button
              icon="pi pi-angle-left"
              outlined
              :disabled="currentPage === 1"
              @click="currentPage--"
            />
            <span class="text-sm text-gray-600">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <Button
              icon="pi pi-angle-right"
              outlined
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            />
          </div>
        </template>
      </Card>

      <!-- Gallery List View -->
      <Card v-else class="border-0 shadow-md">
        <template #content>
          <DataTable
            v-model:selection="selectedImageObjects"
            :value="filteredImages"
            :loading="loading"
            :paginator="true"
            :rows="20"
            :rowsPerPageOptions="[10, 20, 50, 100]"
            dataKey="id"
            stripedRows
            class="text-sm"
            selectionMode="multiple"
          >
            <template #header>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xl font-semibold text-zaccBlack">All Gallery Images</span>
              </div>
            </template>

            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

            <Column header="Image" style="width: 120px">
              <template #body="{ data }">
                <div class="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 cursor-pointer" @click="viewImage(data)">
                  <img
                    :src="getImageUrl(data.imageUrl)"
                    :alt="data.alt || data.title"
                    class="w-full h-full object-cover"
                    @error="handleImageError"
                  />
                </div>
              </template>
            </Column>

            <Column field="title" header="Title" sortable>
              <template #body="{ data }">
                <div class="max-w-md">
                  <div class="font-semibold text-zaccBlack">{{ data.title }}</div>
                  <div v-if="data.description" class="text-xs text-gray-500 truncate mt-1">
                    {{ truncateText(data.description, 80) }}
                  </div>
                </div>
              </template>
            </Column>

            <Column field="category" header="Category" sortable>
              <template #body="{ data }">
                <Tag :value="formatCategory(data.category)" :severity="getCategorySeverity(data.category)" />
              </template>
            </Column>

            <Column field="order" header="Order" sortable>
              <template #body="{ data }">
                <span class="text-gray-600">{{ data.order }}</span>
              </template>
            </Column>

            <Column field="isPublished" header="Status" sortable>
              <template #body="{ data }">
                <Tag
                  :value="data.isPublished ? 'Published' : 'Draft'"
                  :severity="data.isPublished ? 'success' : 'warning'"
                />
              </template>
            </Column>

            <Column field="updatedAt" header="Last Updated" sortable>
              <template #body="{ data }">
                <div class="text-xs text-gray-600">
                  <div>{{ formatDate(data.updatedAt) }}</div>
                </div>
              </template>
            </Column>

            <Column header="Actions" :exportable="false" style="width: 160px">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <Button
                    icon="pi pi-eye"
                    severity="success"
                    outlined
                    rounded
                    @click="viewImage(data)"
                    v-tooltip.top="'View Image'"
                  />
                  <Button
                    icon="pi pi-pencil"
                    severity="info"
                    outlined
                    rounded
                    @click="openEditDialog(data)"
                    v-tooltip.top="'Edit Image'"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    outlined
                    rounded
                    @click="confirmDelete(data)"
                    v-tooltip.top="'Delete Image'"
                  />
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="text-center py-8 text-gray-500">
                <i class="pi pi-image text-4xl mb-4"></i>
                <p>No gallery images found</p>
              </div>
            </template>
          </DataTable>
        </template>
      </Card>

      <!-- Bulk Upload Dialog -->
      <Dialog
        v-model:visible="bulkUploadDialogVisible"
        header="Bulk Upload Images"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '800px' }"
        :closable="true"
      >
        <div class="space-y-4">
          <!-- Drag and Drop Zone -->
          <div
            class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
            :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'"
            @drop.prevent="handleDrop"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
          >
            <i class="pi pi-cloud-upload text-5xl text-gray-400 mb-4"></i>
            <p class="text-lg font-semibold text-zaccBlack mb-2">Drop images here or click to upload</p>
            <p class="text-sm text-gray-500 mb-4">You can upload multiple images at once</p>
            <FileUpload
              mode="advanced"
              :multiple="true"
              accept="image/*"
              :maxFileSize="5000000"
              :auto="false"
              chooseLabel="Select Images"
              @select="onBulkImageSelect"
              @clear="clearBulkUpload"
              class="w-full"
            />
          </div>

          <!-- Upload Progress -->
          <div v-if="uploadingImages.length > 0" class="space-y-2">
            <div class="text-sm font-semibold text-zaccBlack">Uploading {{ uploadingImages.length }} image(s)...</div>
            <div v-for="(upload, index) in uploadingImages" :key="index" class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span class="truncate flex-1">{{ upload.file.name }}</span>
                <span class="ml-2">{{ upload.progress }}%</span>
              </div>
              <ProgressBar :value="upload.progress" />
            </div>
          </div>

          <!-- Uploaded Images Preview -->
          <div v-if="bulkUploadedImages.length > 0" class="space-y-4">
            <div class="text-sm font-semibold text-zaccBlack">Uploaded Images ({{ bulkUploadedImages.length }})</div>
            <div class="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              <div
                v-for="(uploaded, index) in bulkUploadedImages"
                :key="index"
                class="relative border rounded-lg overflow-hidden"
              >
                <img
                  :src="uploaded.preview"
                  :alt="uploaded.file.name"
                  class="w-full h-32 object-cover"
                />
                <div class="p-2 bg-white">
                  <InputText
                    v-model="uploaded.title"
                    :placeholder="getFileNameWithoutExt(uploaded.file.name)"
                    class="w-full text-xs mb-2"
                  />
                  <Dropdown
                    v-model="uploaded.category"
                    :options="categoryOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Category"
                    class="w-full text-xs"
                  />
                </div>
                <Button
                  icon="pi pi-times"
                  severity="danger"
                  rounded
                  text
                  class="absolute top-1 right-1"
                  @click="removeBulkUploaded(index)"
                />
              </div>
            </div>
          </div>

          <!-- Bulk Upload Actions -->
          <div v-if="bulkUploadedImages.length > 0" class="flex justify-end gap-2 pt-4 border-t">
            <Button
              label="Cancel"
              severity="secondary"
              outlined
              @click="closeBulkUploadDialog"
            />
            <Button
              label="Save All Images"
              icon="pi pi-save"
              :loading="bulkSaving"
              @click="saveBulkUpload"
              style="background: #209341; border-color: #209341;"
            />
          </div>
        </div>
      </Dialog>

      <!-- Create/Edit Gallery Image Dialog -->
      <Dialog
        v-model:visible="dialogVisible"
        :header="isEditMode ? 'Edit Gallery Image' : 'Create New Gallery Image'"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '800px' }"
        :closable="true"
      >
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="title" class="block text-sm font-semibold text-zaccBlack mb-2">
              Title <span class="text-red-500">*</span>
            </label>
            <InputText
              id="title"
              v-model="galleryForm.title"
              placeholder="Image title"
              class="w-full"
              :class="{ 'p-invalid': errors.title }"
            />
            <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
          </div>

          <div>
            <label for="description" class="block text-sm font-semibold text-zaccBlack mb-2">
              Description
            </label>
            <Textarea
              id="description"
              v-model="galleryForm.description"
              placeholder="Image description"
              :rows="3"
              class="w-full"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="category" class="block text-sm font-semibold text-zaccBlack mb-2">
                Category <span class="text-red-500">*</span>
              </label>
              <Dropdown
                id="category"
                v-model="galleryForm.category"
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
              <label for="order" class="block text-sm font-semibold text-zaccBlack mb-2">
                Order
              </label>
              <InputNumber
                id="order"
                v-model="galleryForm.order"
                :min="0"
                class="w-full"
              />
              <small class="text-gray-500">Display order (lower numbers appear first)</small>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-zaccBlack mb-2">
              Image <span class="text-red-500">*</span>
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
              <div v-if="isEditMode && galleryForm.imageUrl && !uploadedImage" class="mb-2">
                <small class="text-gray-600 font-semibold">Current Image:</small>
              </div>
              <div v-else-if="uploadedImage" class="mb-2">
                <small class="text-gray-600 font-semibold">New Image Preview:</small>
              </div>
              <div class="relative inline-block">
                <img
                  :src="getImageUrl()"
                  alt="Image preview"
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

          <div>
            <label for="alt" class="block text-sm font-semibold text-zaccBlack mb-2">
              Alt Text
            </label>
            <InputText
              id="alt"
              v-model="galleryForm.alt"
              placeholder="Alternative text for accessibility"
              class="w-full"
            />
            <small class="text-gray-500">Optional alt text for screen readers</small>
          </div>

          <div class="flex flex-col gap-3 pt-2">
            <div class="flex items-center gap-2">
              <Checkbox
                id="showTitle"
                v-model="galleryForm.showTitle"
                :binary="true"
              />
              <label for="showTitle" class="text-sm font-semibold text-zaccBlack">
                Show title on public gallery
              </label>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox
                id="isPublished"
                v-model="galleryForm.isPublished"
                :binary="true"
              />
              <label for="isPublished" class="text-sm font-semibold text-zaccBlack">
                Published
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

      <!-- Image View Dialog -->
      <Dialog
        v-model:visible="viewDialogVisible"
        :header="viewingImage?.title"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '1200px' }"
        :closable="true"
      >
        <div v-if="viewingImage" class="text-center">
          <img
            :src="getImageUrl(viewingImage.imageUrl)"
            :alt="viewingImage.alt || viewingImage.title"
            class="max-w-full max-h-[70vh] mx-auto rounded-lg"
            @error="handleImageError"
          />
          <div v-if="viewingImage.description" class="mt-4 text-gray-600">
            {{ viewingImage.description }}
          </div>
        </div>
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
  title: 'Gallery Management - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'Manage gallery images and photos'
    }
  ]
})

definePageMeta({
  middleware: 'admin'
})

const confirm = useConfirm()
const toast = useToast()

// State
const galleryImages = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const bulkUploadDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const viewingImage = ref<any>(null)
const isEditMode = ref(false)
const submitting = ref(false)
const bulkSaving = ref(false)
const selectedCategory = ref<string | null>(null)
const selectedStatus = ref<string | null>(null)
const selectedImages = ref<string[]>([])
const selectedImageObjects = ref<any[]>([])
const searchQuery = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const isDragging = ref(false)
const uploadedImage = ref<string | null>(null)
const uploadedImageFile = ref<File | null>(null)
const bulkUploadedImages = ref<Array<{
  file: File
  preview: string
  title: string
  category: string
  imageUrl: string
  progress: number
}>>([])
const uploadingImages = ref<Array<{
  file: File
  progress: number
}>>([])
const currentPage = ref(1)
const itemsPerPage = 24

const galleryForm = reactive({
  id: '',
  title: '',
  description: '',
  category: '',
  imageUrl: '',
  thumbnailUrl: '',
  alt: '',
  order: 0,
  isPublished: true,
  showTitle: true
})

const errors = reactive({
  title: '',
  category: '',
  imageUrl: ''
})

const categoryOptions = [
  { label: 'Events', value: 'events' },
  { label: 'Office', value: 'office' },
  { label: 'Commissioners', value: 'commissioners' },
  { label: 'Activities', value: 'activities' },
  { label: 'Awards', value: 'awards' },
  { label: 'Training', value: 'training' },
  { label: 'Gallery', value: 'gallery' }
]

const statusOptions = [
  { label: 'All', value: null },
  { label: 'Published', value: 'true' },
  { label: 'Draft', value: 'false' }
]

// Computed properties
const hasImage = computed(() => {
  return !!(galleryForm.imageUrl || uploadedImage.value)
})

const filteredImages = computed(() => {
  let filtered = galleryImages.value

  // Filter by category
  if (selectedCategory.value) {
    filtered = filtered.filter((img: any) => img.category === selectedCategory.value)
  }

  // Filter by status
  if (selectedStatus.value !== null) {
    const isPublished = selectedStatus.value === 'true'
    filtered = filtered.filter((img: any) => img.isPublished === isPublished)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((img: any) =>
      img.title.toLowerCase().includes(query) ||
      (img.description && img.description.toLowerCase().includes(query)) ||
      img.category.toLowerCase().includes(query)
    )
  }

  return filtered
})

const paginatedImages = computed(() => {
  if (viewMode.value === 'list') return filteredImages.value
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredImages.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredImages.value.length / itemsPerPage)
})

// Methods
const formatCategory = (category: string) => {
  const cat = categoryOptions.find(c => c.value === category)
  return cat?.label || category
}

const getCategorySeverity = (category: string) => {
  const severityMap: Record<string, string> = {
    'events': 'info',
    'office': 'secondary',
    'commissioners': 'primary',
    'activities': 'success',
    'awards': 'warning',
    'training': 'danger'
  }
  return severityMap[category] || 'info'
}

const truncateText = (text: string, length: number) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getImageUrl = (url?: string) => {
  const imageUrl = url || galleryForm.imageUrl
  if (uploadedImage.value && !url) {
    return uploadedImage.value
  }
  if (imageUrl) {
    if (imageUrl.startsWith('/api/')) {
      return imageUrl
    }
    if (imageUrl.startsWith('/uploads/')) {
      return `/api${imageUrl}`
    }
    if (!imageUrl.startsWith('/')) {
      return `/api/uploads/${imageUrl}`
    }
    return `/api${imageUrl}`
  }
  return ''
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  const imageUrl = galleryForm.imageUrl || (viewingImage.value?.imageUrl)
  if (imageUrl && !img.src.includes('/api/')) {
    const altUrl = imageUrl.startsWith('/') 
      ? `/api${imageUrl}`
      : `/api/uploads/${imageUrl}`
    img.src = altUrl
  }
}

const getFileNameWithoutExt = (filename: string) => {
  return filename.replace(/\.[^/.]+$/, '')
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

const toggleImageSelection = (imageId: string) => {
  const index = selectedImages.value.indexOf(imageId)
  if (index > -1) {
    selectedImages.value.splice(index, 1)
  } else {
    selectedImages.value.push(imageId)
  }
  // Sync with selectedImageObjects for DataTable
  selectedImageObjects.value = galleryImages.value.filter((img: any) => 
    selectedImages.value.includes(img.id)
  )
}

const clearSelection = () => {
  selectedImages.value = []
  selectedImageObjects.value = []
}

// Watch DataTable selection changes
watch(selectedImageObjects, (newSelection) => {
  selectedImages.value = newSelection.map((img: any) => img.id)
})

// Bulk upload handlers
const openBulkUploadDialog = () => {
  bulkUploadDialogVisible.value = true
  bulkUploadedImages.value = []
  uploadingImages.value = []
}

const closeBulkUploadDialog = () => {
  bulkUploadDialogVisible.value = false
  bulkUploadedImages.value = []
  uploadingImages.value = []
  isDragging.value = false
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    processBulkFiles(Array.from(files))
  }
}

const onBulkImageSelect = (event: any) => {
  const files = Array.from(event.files) as File[]
  processBulkFiles(files)
}

const processBulkFiles = async (files: File[]) => {
  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: `${file.name} is too large (max 5MB)`,
        life: 3000
      })
      continue
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = e.target?.result as string
      bulkUploadedImages.value.push({
        file,
        preview,
        title: getFileNameWithoutExt(file.name),
        category: '',
        imageUrl: '',
        progress: 0
      })
    }
    reader.readAsDataURL(file)
  }
}

const removeBulkUploaded = (index: number) => {
  bulkUploadedImages.value.splice(index, 1)
}

const clearBulkUpload = () => {
  bulkUploadedImages.value = []
}

const saveBulkUpload = async () => {
  if (bulkUploadedImages.value.length === 0) return

  bulkSaving.value = true
  let successCount = 0
  let errorCount = 0

  try {
    for (let i = 0; i < bulkUploadedImages.value.length; i++) {
      const item = bulkUploadedImages.value[i]
      
      if (!item.category) {
        toast.add({
          severity: 'warn',
          summary: 'Warning',
          detail: `Please select a category for ${item.title}`,
          life: 3000
        })
        continue
      }

      // Upload file
      try {
        const formData = new FormData()
        formData.append('file', item.file)
        
        const response = await $fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (response && response.path) {
          // Create gallery image
          await $fetch('/api/gallery', {
            method: 'POST',
            body: {
              title: item.title,
              category: item.category,
              imageUrl: response.path,
              isPublished: true,
              order: 0
            }
          })
          successCount++
        }
      } catch (error: any) {
        console.error(`Error uploading ${item.title}:`, error)
        errorCount++
      }
    }

    toast.add({
      severity: successCount > 0 ? 'success' : 'error',
      summary: successCount > 0 ? 'Success' : 'Error',
      detail: `Uploaded ${successCount} image(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      life: 3000
    })

    closeBulkUploadDialog()
    await fetchGallery()
  } finally {
    bulkSaving.value = false
  }
}

// Bulk actions
const bulkPublish = async () => {
  if (selectedImages.value.length === 0) return

  try {
    await Promise.all(
      selectedImages.value.map(id =>
        $fetch(`/api/gallery/${id}`, {
          method: 'PUT',
          body: { isPublished: true }
        })
      )
    )
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `${selectedImages.value.length} image(s) published`,
      life: 3000
    })
    clearSelection()
    await fetchGallery()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to publish images',
      life: 3000
    })
  }
}

const bulkUnpublish = async () => {
  if (selectedImages.value.length === 0) return

  try {
    await Promise.all(
      selectedImages.value.map(id =>
        $fetch(`/api/gallery/${id}`, {
          method: 'PUT',
          body: { isPublished: false }
        })
      )
    )
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `${selectedImages.value.length} image(s) unpublished`,
      life: 3000
    })
    clearSelection()
    await fetchGallery()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to unpublish images',
      life: 3000
    })
  }
}

const bulkDelete = () => {
  if (selectedImages.value.length === 0) return

  confirm.require({
    message: `Are you sure you want to delete ${selectedImages.value.length} image(s)?`,
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
        await Promise.all(
          selectedImages.value.map(id =>
            $fetch(`/api/gallery/${id}`, {
              method: 'DELETE'
            })
          )
        )
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `${selectedImages.value.length} image(s) deleted`,
          life: 3000
        })
        clearSelection()
        await fetchGallery()
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete images',
          life: 3000
        })
      }
    }
  })
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
    
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedImage.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await $fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (response && response.path) {
        galleryForm.imageUrl = response.path
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
  galleryForm.imageUrl = ''
  galleryForm.thumbnailUrl = ''
}

// Fetch gallery images
const fetchGallery = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedCategory.value) params.category = selectedCategory.value
    if (selectedStatus.value !== null) params.isPublished = selectedStatus.value

    const data = await $fetch('/api/gallery', { params })
    galleryImages.value = data
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load gallery images',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  selectedCategory.value = null
  selectedStatus.value = null
  fetchGallery()
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
  galleryForm.id = item.id
  galleryForm.title = item.title
  galleryForm.description = item.description || ''
  galleryForm.category = item.category
  galleryForm.imageUrl = item.imageUrl
  galleryForm.thumbnailUrl = item.thumbnailUrl || ''
  galleryForm.alt = item.alt || ''
  galleryForm.order = item.order
  galleryForm.isPublished = item.isPublished
  galleryForm.showTitle = item.showTitle !== false
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
  galleryForm.id = ''
  galleryForm.title = ''
  galleryForm.description = ''
  galleryForm.category = ''
  galleryForm.imageUrl = ''
  galleryForm.thumbnailUrl = ''
  galleryForm.alt = ''
  galleryForm.order = 0
  galleryForm.isPublished = true
  galleryForm.showTitle = true
  uploadedImage.value = null
  uploadedImageFile.value = null
  errors.title = ''
  errors.category = ''
  errors.imageUrl = ''
}

// Validate form
const validateForm = () => {
  let valid = true
  errors.title = ''
  errors.category = ''
  errors.imageUrl = ''

  if (!galleryForm.title.trim()) {
    errors.title = 'Title is required'
    valid = false
  }

  if (!galleryForm.category) {
    errors.category = 'Category is required'
    valid = false
  }

  if (!galleryForm.imageUrl) {
    errors.imageUrl = 'Image is required'
    valid = false
  }

  return valid
}

// Handle submit
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  submitting.value = true
  try {
    const payload: any = {
      title: galleryForm.title,
      description: galleryForm.description || undefined,
      category: galleryForm.category,
      imageUrl: galleryForm.imageUrl,
      thumbnailUrl: galleryForm.thumbnailUrl || undefined,
      alt: galleryForm.alt || undefined,
      order: galleryForm.order,
      isPublished: galleryForm.isPublished,
      showTitle: galleryForm.showTitle
    }

    if (isEditMode.value) {
      await $fetch(`/api/gallery/${galleryForm.id}`, {
        method: 'PUT',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Gallery image updated successfully',
        life: 3000
      })
    } else {
      await $fetch('/api/gallery', {
        method: 'POST',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Gallery image created successfully',
        life: 3000
      })
    }
    closeDialog()
    await fetchGallery()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || (isEditMode.value ? 'Failed to update image' : 'Failed to create image'),
      life: 3000
    })
  } finally {
    submitting.value = false
  }
}

// View image
const viewImage = (item: any) => {
  viewingImage.value = item
  viewDialogVisible.value = true
}

// Delete gallery image
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
        await $fetch(`/api/gallery/${item.id}`, {
          method: 'DELETE'
        })
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Gallery image deleted successfully',
          life: 3000
        })
        await fetchGallery()
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.data?.message || 'Failed to delete image',
          life: 3000
        })
      }
    }
  })
}

// Watch for page changes
watch(currentPage, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

// Reset to page 1 when filters change
watch([searchQuery, selectedCategory, selectedStatus], () => {
  currentPage.value = 1
})

// Lifecycle
onMounted(() => {
  fetchGallery()
})
</script>

<style scoped>
.group:hover .group-hover\:bg-opacity-40 {
  transition: background-opacity 0.2s;
}
</style>
