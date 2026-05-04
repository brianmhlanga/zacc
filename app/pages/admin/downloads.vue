<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- Page Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Downloads Management</h1>
          <p class="mt-2 text-gray-600">Manage downloadable files and documents</p>
        </div>
        <Button
          label="Add Download"
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
                @change="fetchDownloads"
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
                @change="fetchDownloads"
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

      <!-- Downloads Table -->
      <Card class="border-0 shadow-md">
        <template #content>
          <DataTable
            v-model:filters="filters"
            :value="downloads"
            :loading="loading"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            :globalFilterFields="['title', 'description', 'category']"
            dataKey="id"
            stripedRows
            class="text-sm"
          >
            <template #header>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xl font-semibold text-zaccBlack">All Downloads</span>
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText
                    v-model="filters.global.value"
                    placeholder="Search downloads..."
                    class="w-64"
                  />
                </span>
              </div>
            </template>

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

            <Column field="fileType" header="File Type" sortable>
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <i :class="getFileIcon(data.fileType)" class="text-lg"></i>
                  <Tag :value="data.fileType.toUpperCase()" :severity="getFileTypeSeverity(data.fileType)" />
                </div>
              </template>
            </Column>

            <Column field="fileSize" header="Size" sortable>
              <template #body="{ data }">
                <span class="text-gray-600">{{ formatFileSize(data.fileSize) }}</span>
              </template>
            </Column>

            <Column field="downloadCount" header="Downloads" sortable>
              <template #body="{ data }">
                <div class="flex items-center gap-1 text-gray-600">
                  <i class="pi pi-download text-sm"></i>
                  <span>{{ data.downloadCount || 0 }}</span>
                </div>
              </template>
            </Column>

            <Column field="isPublished" header="Status">
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
                  <div v-if="data.updater" class="text-gray-500 mt-1">
                    by {{ data.updater.name || data.updater.email }}
                  </div>
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
                    @click="viewDownload(data)"
                    v-tooltip.top="'View/Download File'"
                  />
                  <Button
                    icon="pi pi-pencil"
                    severity="info"
                    outlined
                    rounded
                    @click="openEditDialog(data)"
                    v-tooltip.top="'Edit Download'"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    outlined
                    rounded
                    @click="confirmDelete(data)"
                    v-tooltip.top="'Delete Download'"
                  />
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="text-center py-8 text-gray-500">
                <i class="pi pi-file text-4xl mb-4"></i>
                <p>No downloads found</p>
              </div>
            </template>
          </DataTable>
        </template>
      </Card>

      <!-- Create/Edit Download Dialog -->
      <Dialog
        v-model:visible="dialogVisible"
        :header="isEditMode ? 'Edit Download' : 'Create New Download'"
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
              v-model="downloadForm.title"
              placeholder="Download title"
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
              v-model="downloadForm.description"
              placeholder="Brief description of the download"
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
                v-model="downloadForm.category"
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
              <label for="year" class="block text-sm font-semibold text-zaccBlack mb-2">
                Year
              </label>
              <InputText
                id="year"
                v-model="downloadForm.year"
                placeholder="e.g., 2024"
                class="w-full"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-zaccBlack mb-2">
              File <span class="text-red-500">*</span>
            </label>
            <FileUpload
              mode="basic"
              :multiple="false"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              :maxFileSize="52428800"
              :auto="false"
              chooseLabel="Upload Document"
              @select="onFileSelect"
              @clear="clearFile"
              class="w-full"
            />
            <small class="text-gray-500">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT. Maximum 50MB.</small>
            <div v-if="uploadedFile || downloadForm.fileUrl" class="mt-4">
              <div v-if="isEditMode && downloadForm.fileUrl && !uploadedFile" class="mb-2">
                <small class="text-gray-600 font-semibold">Current File:</small>
              </div>
              <div v-else-if="uploadedFile" class="mb-2">
                <small class="text-gray-600 font-semibold">New File:</small>
              </div>
              <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <i :class="getFileIcon(downloadForm.fileType || 'file')" class="text-2xl text-gray-600"></i>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-zaccBlack truncate">
                    {{ uploadedFile?.name || getFileNameFromUrl(downloadForm.fileUrl) }}
                  </div>
                  <div v-if="uploadedFile" class="text-xs text-gray-500">
                    {{ formatFileSize(uploadedFile.size) }}
                  </div>
                  <div v-else-if="downloadForm.fileSize" class="text-xs text-gray-500">
                    {{ formatFileSize(downloadForm.fileSize) }}
                  </div>
                </div>
                <Button
                  icon="pi pi-times"
                  severity="danger"
                  rounded
                  text
                  @click="clearFile"
                  v-tooltip.top="'Remove file'"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="order" class="block text-sm font-semibold text-zaccBlack mb-2">
                Order
              </label>
              <InputNumber
                id="order"
                v-model="downloadForm.order"
                :min="0"
                class="w-full"
              />
              <small class="text-gray-500">Display order (lower numbers appear first)</small>
            </div>

            <div class="flex items-center gap-2 pt-6">
              <Checkbox
                id="isPublished"
                v-model="downloadForm.isPublished"
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

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

useHead({
  title: 'Downloads Management - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'Manage downloadable files and documents'
    }
  ]
})

definePageMeta({
  middleware: 'admin'
})

const confirm = useConfirm()
const toast = useToast()

// State
const downloads = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const selectedCategory = ref<string | null>(null)
const selectedStatus = ref<string | null>(null)
const uploadedFile = ref<File | null>(null)
const filters = ref({
  global: { value: null, matchMode: 'contains' }
})

const downloadForm = reactive({
  id: '',
  title: '',
  description: '',
  category: '',
  fileType: '',
  fileUrl: '',
  fileSize: 0,
  year: '',
  isPublished: true,
  order: 0
})

const errors = reactive({
  title: '',
  category: '',
  fileUrl: ''
})

const categoryOptions = [
  { label: 'Forms', value: 'forms' },
  { label: 'Reports', value: 'reports' },
  { label: 'Policies', value: 'policies' },
  { label: 'Guidelines', value: 'guidelines' },
  { label: 'Publications', value: 'publications' },
  { label: 'Legal', value: 'legal' },
  { label: 'Press Releases', value: 'press_releases' }
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
    'forms': 'info',
    'reports': 'warning',
    'policies': 'success',
    'guidelines': 'primary',
    'publications': 'secondary',
    'legal': 'danger',
    'press_releases': 'warning'
  }
  return severityMap[category] || 'info'
}

const getFileIcon = (fileType: string) => {
  const icons: Record<string, string> = {
    'pdf': 'pi pi-file-pdf',
    'doc': 'pi pi-file-word',
    'docx': 'pi pi-file-word',
    'xls': 'pi pi-file-excel',
    'xlsx': 'pi pi-file-excel',
    'ppt': 'pi pi-file',
    'pptx': 'pi pi-file',
    'txt': 'pi pi-file'
  }
  return icons[fileType?.toLowerCase()] || 'pi pi-file'
}

const getFileTypeSeverity = (fileType: string) => {
  const severityMap: Record<string, string> = {
    'pdf': 'danger',
    'doc': 'info',
    'docx': 'info',
    'xls': 'success',
    'xlsx': 'success',
    'ppt': 'warning',
    'pptx': 'warning',
    'txt': 'secondary'
  }
  return severityMap[fileType?.toLowerCase()] || 'secondary'
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const truncateText = (text: string, length: number) => {
  if (!text) return ''
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

const getFileNameFromUrl = (url: string) => {
  if (!url) return 'No file'
  const parts = url.split('/')
  return parts[parts.length - 1]
}

// File upload handlers
const onFileSelect = async (event: any) => {
  const file = event.files[0]
  if (file) {
    if (file.size > 50 * 1024 * 1024) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'File size must be less than 50MB',
        life: 3000
      })
      return
    }
    
    uploadedFile.value = file
    
    // Upload to server
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await $fetch('/api/upload/document', {
        method: 'POST',
        body: formData
      })
      
      if (response && response.path) {
        downloadForm.fileUrl = response.path
        downloadForm.fileSize = response.size
        downloadForm.fileType = response.fileType
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'File uploaded successfully',
          life: 2000
        })
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.data?.message || 'Failed to upload file',
        life: 3000
      })
      uploadedFile.value = null
    }
  }
}

const clearFile = () => {
  uploadedFile.value = null
  downloadForm.fileUrl = ''
  downloadForm.fileSize = 0
  downloadForm.fileType = ''
}

// Fetch downloads
const fetchDownloads = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedCategory.value) params.category = selectedCategory.value
    if (selectedStatus.value !== null) params.isPublished = selectedStatus.value

    const data = await $fetch('/api/downloads', { params })
    downloads.value = data
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load downloads',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  selectedCategory.value = null
  selectedStatus.value = null
  fetchDownloads()
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
  downloadForm.id = item.id
  downloadForm.title = item.title
  downloadForm.description = item.description || ''
  downloadForm.category = item.category
  downloadForm.fileType = item.fileType
  downloadForm.fileUrl = item.fileUrl
  downloadForm.fileSize = item.fileSize
  downloadForm.year = item.year || ''
  downloadForm.isPublished = item.isPublished
  downloadForm.order = item.order
  uploadedFile.value = null
  dialogVisible.value = true
}

// Close dialog
const closeDialog = () => {
  dialogVisible.value = false
  resetForm()
}

// Reset form
const resetForm = () => {
  downloadForm.id = ''
  downloadForm.title = ''
  downloadForm.description = ''
  downloadForm.category = ''
  downloadForm.fileType = ''
  downloadForm.fileUrl = ''
  downloadForm.fileSize = 0
  downloadForm.year = ''
  downloadForm.isPublished = true
  downloadForm.order = 0
  uploadedFile.value = null
  errors.title = ''
  errors.category = ''
  errors.fileUrl = ''
}

// Validate form
const validateForm = () => {
  let valid = true
  errors.title = ''
  errors.category = ''
  errors.fileUrl = ''

  if (!downloadForm.title.trim()) {
    errors.title = 'Title is required'
    valid = false
  }

  if (!downloadForm.category) {
    errors.category = 'Category is required'
    valid = false
  }

  if (!downloadForm.fileUrl) {
    errors.fileUrl = 'File is required'
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
      title: downloadForm.title,
      description: downloadForm.description || undefined,
      category: downloadForm.category,
      fileType: downloadForm.fileType,
      fileUrl: downloadForm.fileUrl,
      fileSize: downloadForm.fileSize,
      year: downloadForm.year || undefined,
      isPublished: downloadForm.isPublished,
      order: downloadForm.order
    }

    if (isEditMode.value) {
      await $fetch(`/api/downloads/${downloadForm.id}`, {
        method: 'PUT',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Download updated successfully',
        life: 3000
      })
    } else {
      await $fetch('/api/downloads', {
        method: 'POST',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Download created successfully',
        life: 3000
      })
    }
    closeDialog()
    await fetchDownloads()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || (isEditMode.value ? 'Failed to update download' : 'Failed to create download'),
      life: 3000
    })
  } finally {
    submitting.value = false
  }
}

// View/Download file
const viewDownload = (item: any) => {
  if (item.fileUrl) {
    // Open file in new tab
    window.open(item.fileUrl, '_blank')
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'File URL not available',
      life: 3000
    })
  }
}

// Delete download
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
        await $fetch(`/api/downloads/${item.id}`, {
          method: 'DELETE'
        })
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Download deleted successfully',
          life: 3000
        })
        await fetchDownloads()
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.data?.message || 'Failed to delete download',
          life: 3000
        })
      }
    }
  })
}

// Lifecycle
onMounted(() => {
  fetchDownloads()
})
</script>

