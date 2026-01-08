<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- Page Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Rulings Management</h1>
          <p class="mt-2 text-gray-600">Manage court rulings and case updates</p>
        </div>
        <Button
          label="Add Ruling"
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
              <label for="outcomeFilter" class="text-sm font-semibold text-zaccBlack whitespace-nowrap">
                Outcome:
              </label>
              <Dropdown
                id="outcomeFilter"
                v-model="selectedOutcome"
                :options="outcomeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All Outcomes"
                class="w-48"
                @change="fetchRulings"
              />
            </div>
            <div class="flex items-center gap-2">
              <label for="yearFilter" class="text-sm font-semibold text-zaccBlack whitespace-nowrap">
                Year:
              </label>
              <Dropdown
                id="yearFilter"
                v-model="selectedYear"
                :options="yearOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All Years"
                class="w-48"
                @change="fetchRulings"
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
                @change="fetchRulings"
              />
            </div>
            <Button
              v-if="selectedOutcome || selectedYear || selectedStatus"
              label="Clear Filters"
              icon="pi pi-times"
              severity="secondary"
              outlined
              @click="clearFilters"
            />
          </div>
        </template>
      </Card>

      <!-- Rulings Table -->
      <Card class="border-0 shadow-md">
        <template #content>
          <DataTable
            v-model:filters="filters"
            :value="rulings"
            :loading="loading"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            :globalFilterFields="['caseNumber', 'title', 'summary', 'court', 'judge']"
            dataKey="id"
            stripedRows
            class="text-sm"
          >
            <template #header>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xl font-semibold text-zaccBlack">All Rulings</span>
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText
                    v-model="filters.global.value"
                    placeholder="Search rulings..."
                    class="w-64"
                  />
                </span>
              </div>
            </template>

            <Column field="caseNumber" header="Case Number" sortable>
              <template #body="{ data }">
                <div class="font-semibold text-zaccBlack">{{ data.caseNumber }}</div>
              </template>
            </Column>

            <Column field="title" header="Title" sortable>
              <template #body="{ data }">
                <div class="max-w-md">
                  <div class="font-semibold text-zaccBlack">{{ data.title }}</div>
                  <div class="text-xs text-gray-500 truncate mt-1">{{ truncateText(data.summary, 80) }}</div>
                </div>
              </template>
            </Column>

            <Column field="outcome" header="Outcome" sortable>
              <template #body="{ data }">
                <Tag :value="data.outcome" :severity="getOutcomeSeverity(data.outcome)" />
              </template>
            </Column>

            <Column field="court" header="Court" sortable>
              <template #body="{ data }">
                <span class="text-gray-600">{{ data.court }}</span>
              </template>
            </Column>

            <Column field="date" header="Date" sortable>
              <template #body="{ data }">
                <div class="text-xs text-gray-600">
                  {{ formatDate(data.date) }}
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
                    v-if="data.downloadUrl"
                    icon="pi pi-eye"
                    severity="success"
                    outlined
                    rounded
                    @click="viewRuling(data)"
                    v-tooltip.top="'View/Download File'"
                  />
                  <Button
                    icon="pi pi-pencil"
                    severity="info"
                    outlined
                    rounded
                    @click="openEditDialog(data)"
                    v-tooltip.top="'Edit Ruling'"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    outlined
                    rounded
                    @click="confirmDelete(data)"
                    v-tooltip.top="'Delete Ruling'"
                  />
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="text-center py-8 text-gray-500">
                <i class="pi pi-gavel text-4xl mb-4"></i>
                <p>No rulings found</p>
              </div>
            </template>
          </DataTable>
        </template>
      </Card>

      <!-- Create/Edit Ruling Dialog -->
      <Dialog
        v-model:visible="dialogVisible"
        :header="isEditMode ? 'Edit Ruling' : 'Create New Ruling'"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '1000px' }"
        :closable="true"
      >
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="caseNumber" class="block text-sm font-semibold text-zaccBlack mb-2">
                Case Number <span class="text-red-500">*</span>
              </label>
              <InputText
                id="caseNumber"
                v-model="rulingForm.caseNumber"
                placeholder="e.g., HC 123/2024"
                class="w-full"
                :class="{ 'p-invalid': errors.caseNumber }"
              />
              <small v-if="errors.caseNumber" class="p-error">{{ errors.caseNumber }}</small>
            </div>

            <div>
              <label for="year" class="block text-sm font-semibold text-zaccBlack mb-2">
                Year <span class="text-red-500">*</span>
              </label>
              <InputText
                id="year"
                v-model="rulingForm.year"
                placeholder="e.g., 2024"
                class="w-full"
                :class="{ 'p-invalid': errors.year }"
              />
              <small v-if="errors.year" class="p-error">{{ errors.year }}</small>
            </div>
          </div>

          <div>
            <label for="title" class="block text-sm font-semibold text-zaccBlack mb-2">
              Title <span class="text-red-500">*</span>
            </label>
            <InputText
              id="title"
              v-model="rulingForm.title"
              placeholder="Ruling title"
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
              v-model="rulingForm.slug"
              placeholder="ruling-slug"
              class="w-full"
              :class="{ 'p-invalid': errors.slug }"
            />
            <small v-if="errors.slug" class="p-error">{{ errors.slug }}</small>
            <small class="text-gray-500">URL-friendly identifier</small>
          </div>

          <div>
            <label for="summary" class="block text-sm font-semibold text-zaccBlack mb-2">
              Summary <span class="text-red-500">*</span>
            </label>
            <Textarea
              id="summary"
              v-model="rulingForm.summary"
              placeholder="Brief summary of the ruling"
              :rows="3"
              class="w-full"
              :class="{ 'p-invalid': errors.summary }"
            />
            <small v-if="errors.summary" class="p-error">{{ errors.summary }}</small>
          </div>

          <div>
            <label for="details" class="block text-sm font-semibold text-zaccBlack mb-2">
              Details <span class="text-red-500">*</span>
            </label>
            <Editor
              id="details"
              v-model="rulingForm.details"
              editorStyle="height: 300px"
              :class="{ 'p-invalid': errors.details }"
            >
              <template #toolbar>
                <span class="ql-formats">
                  <button class="ql-bold"></button>
                  <button class="ql-italic"></button>
                  <button class="ql-underline"></button>
                </span>
                <span class="ql-formats">
                  <button class="ql-header" value="1"></button>
                  <button class="ql-header" value="2"></button>
                </span>
                <span class="ql-formats">
                  <button class="ql-list" value="ordered"></button>
                  <button class="ql-list" value="bullet"></button>
                </span>
              </template>
            </Editor>
            <small v-if="errors.details" class="p-error">{{ errors.details }}</small>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="court" class="block text-sm font-semibold text-zaccBlack mb-2">
                Court <span class="text-red-500">*</span>
              </label>
              <InputText
                id="court"
                v-model="rulingForm.court"
                placeholder="e.g., High Court of Zimbabwe"
                class="w-full"
                :class="{ 'p-invalid': errors.court }"
              />
              <small v-if="errors.court" class="p-error">{{ errors.court }}</small>
            </div>

            <div>
              <label for="judge" class="block text-sm font-semibold text-zaccBlack mb-2">
                Judge <span class="text-red-500">*</span>
              </label>
              <InputText
                id="judge"
                v-model="rulingForm.judge"
                placeholder="e.g., Hon. Justice Smith"
                class="w-full"
                :class="{ 'p-invalid': errors.judge }"
              />
              <small v-if="errors.judge" class="p-error">{{ errors.judge }}</small>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="date" class="block text-sm font-semibold text-zaccBlack mb-2">
                Date <span class="text-red-500">*</span>
              </label>
              <Calendar
                id="date"
                v-model="rulingDate"
                dateFormat="yy-mm-dd"
                class="w-full"
                :class="{ 'p-invalid': errors.date }"
              />
              <small v-if="errors.date" class="p-error">{{ errors.date }}</small>
            </div>

            <div>
              <label for="outcome" class="block text-sm font-semibold text-zaccBlack mb-2">
                Outcome <span class="text-red-500">*</span>
              </label>
              <Dropdown
                id="outcome"
                v-model="rulingForm.outcome"
                :options="outcomeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select outcome"
                class="w-full"
                :class="{ 'p-invalid': errors.outcome }"
              />
              <small v-if="errors.outcome" class="p-error">{{ errors.outcome }}</small>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="assetsRecovered" class="block text-sm font-semibold text-zaccBlack mb-2">
                Assets Recovered
              </label>
              <Textarea
                id="assetsRecovered"
                v-model="rulingForm.assetsRecovered"
                placeholder="Details of assets recovered"
                :rows="2"
                class="w-full"
              />
            </div>

            <div>
              <label for="sentence" class="block text-sm font-semibold text-zaccBlack mb-2">
                Sentence
              </label>
              <Textarea
                id="sentence"
                v-model="rulingForm.sentence"
                placeholder="Sentence details"
                :rows="2"
                class="w-full"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-zaccBlack mb-2">
              Full Ruling Document
            </label>
            <FileUpload
              mode="basic"
              :multiple="false"
              accept=".pdf,.doc,.docx"
              :maxFileSize="52428800"
              :auto="false"
              chooseLabel="Upload Document"
              @select="onDocumentSelect"
              @clear="clearDocument"
              class="w-full"
            />
            <small class="text-gray-500">PDF, DOC, DOCX. Maximum 50MB.</small>
            <div v-if="uploadedDocument || rulingForm.downloadUrl" class="mt-4">
              <div v-if="isEditMode && rulingForm.downloadUrl && !uploadedDocument" class="mb-2">
                <small class="text-gray-600 font-semibold">Current Document:</small>
              </div>
              <div v-else-if="uploadedDocument" class="mb-2">
                <small class="text-gray-600 font-semibold">New Document:</small>
              </div>
              <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <i class="pi pi-file-pdf text-2xl text-red-600"></i>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-zaccBlack truncate">
                    {{ uploadedDocument?.name || getFileNameFromUrl(rulingForm.downloadUrl) }}
                  </div>
                  <div v-if="uploadedDocument" class="text-xs text-gray-500">
                    {{ formatFileSize(uploadedDocument.size) }}
                  </div>
                  <div v-else-if="rulingForm.downloadUrl" class="text-xs text-gray-500">
                    <a :href="rulingForm.downloadUrl" target="_blank" class="text-blue-600 hover:underline">
                      View current document
                    </a>
                  </div>
                </div>
                <Button
                  icon="pi pi-times"
                  severity="danger"
                  rounded
                  text
                  @click="clearDocument"
                  v-tooltip.top="'Remove document'"
                />
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
            <div v-if="rulingForm.tags.length > 0" class="flex flex-wrap gap-2 mt-2">
              <Tag
                v-for="(tag, index) in rulingForm.tags"
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
                :disabled="!rulingForm.isPublished"
              />
            </div>

            <div class="flex items-center gap-2 pt-6">
              <Checkbox
                id="isPublished"
                v-model="rulingForm.isPublished"
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
  title: 'Rulings Management - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'Manage court rulings and case updates'
    }
  ]
})

definePageMeta({
  middleware: 'admin'
})

const confirm = useConfirm()
const toast = useToast()

// State
const rulings = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const selectedOutcome = ref<string | null>(null)
const selectedYear = ref<string | null>(null)
const selectedStatus = ref<string | null>(null)
const tagsInput = ref('')
const isProcessingTag = ref(false)
const rulingDate = ref<Date | null>(null)
const publishedAtDate = ref<Date | null>(null)
const uploadedDocument = ref<File | null>(null)
const filters = ref({
  global: { value: null, matchMode: 'contains' }
})

const rulingForm = reactive({
  id: '',
  caseNumber: '',
  title: '',
  slug: '',
  summary: '',
  details: '',
  court: '',
  judge: '',
  date: '',
  outcome: '',
  assetsRecovered: '',
  sentence: '',
  downloadUrl: '',
  year: '',
  isPublished: false,
  publishedAt: '',
  tags: [] as string[]
})

const errors = reactive({
  caseNumber: '',
  title: '',
  slug: '',
  summary: '',
  details: '',
  court: '',
  judge: '',
  date: '',
  outcome: '',
  year: ''
})

const outcomeOptions = [
  { label: 'Conviction', value: 'Conviction' },
  { label: 'Acquittal', value: 'Acquittal' },
  { label: 'Settlement', value: 'Settlement' },
  { label: 'Dismissed', value: 'Dismissed' }
]

const statusOptions = [
  { label: 'All', value: null },
  { label: 'Published', value: 'true' },
  { label: 'Draft', value: 'false' }
]

// Generate year options (current year and 10 years back)
const currentYear = new Date().getFullYear()
const yearOptions = [
  { label: 'All Years', value: null },
  ...Array.from({ length: 11 }, (_, i) => ({
    label: String(currentYear - i),
    value: String(currentYear - i)
  }))
]

// Methods
const getOutcomeSeverity = (outcome: string) => {
  const severityMap: Record<string, string> = {
    'Conviction': 'success',
    'Acquittal': 'info',
    'Settlement': 'warning',
    'Dismissed': 'secondary'
  }
  return severityMap[outcome] || 'secondary'
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

const generateSlug = () => {
  if (!isEditMode.value) {
    rulingForm.slug = rulingForm.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
}

const handleTagEnter = (event: KeyboardEvent) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  
  isProcessingTag.value = true
  updateTags()
  
  setTimeout(() => {
    isProcessingTag.value = false
  }, 100)
  
  return false
}

const updateTags = () => {
  if (!Array.isArray(rulingForm.tags)) {
    rulingForm.tags = []
  }
  
  if (tagsInput.value && typeof tagsInput.value === 'string' && tagsInput.value.trim()) {
    const tags = tagsInput.value
      .split(',')
      .map(tag => tag && typeof tag === 'string' ? tag.trim() : '')
      .filter(tag => tag && tag.length > 0)
    
    if (tags.length > 0) {
      const existingTags = Array.isArray(rulingForm.tags) 
        ? rulingForm.tags.filter(t => t && typeof t === 'string' && t.trim().length > 0)
        : []
      rulingForm.tags = [...new Set([...existingTags, ...tags])]
      tagsInput.value = ''
    }
  }
}

const removeTag = (tag: string) => {
  rulingForm.tags = rulingForm.tags.filter(t => t !== tag)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const getFileNameFromUrl = (url: string) => {
  if (!url) return 'No document'
  const parts = url.split('/')
  return parts[parts.length - 1]
}

// Document upload handlers
const onDocumentSelect = async (event: any) => {
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
    
    uploadedDocument.value = file
    
    // Upload to server
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await $fetch('/api/upload/document', {
        method: 'POST',
        body: formData
      })
      
      if (response && response.path) {
        rulingForm.downloadUrl = response.path
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Document uploaded successfully',
          life: 2000
        })
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.data?.message || 'Failed to upload document',
        life: 3000
      })
      uploadedDocument.value = null
    }
  }
}

const clearDocument = () => {
  uploadedDocument.value = null
  rulingForm.downloadUrl = ''
}

// Fetch rulings
const fetchRulings = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedOutcome.value) params.outcome = selectedOutcome.value
    if (selectedYear.value) params.year = selectedYear.value
    if (selectedStatus.value !== null) params.isPublished = selectedStatus.value

    const data = await $fetch('/api/rulings', { params })
    rulings.value = data
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load rulings',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  selectedOutcome.value = null
  selectedYear.value = null
  selectedStatus.value = null
  fetchRulings()
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
  rulingForm.id = item.id
  rulingForm.caseNumber = item.caseNumber
  rulingForm.title = item.title
  rulingForm.slug = item.slug
  rulingForm.summary = item.summary
  rulingForm.details = item.details
  rulingForm.court = item.court
  rulingForm.judge = item.judge
  rulingForm.outcome = item.outcome
  rulingForm.assetsRecovered = item.assetsRecovered || ''
  rulingForm.sentence = item.sentence || ''
  rulingForm.downloadUrl = item.downloadUrl || ''
  rulingForm.year = item.year
  rulingForm.isPublished = item.isPublished
  rulingForm.tags = item.tags?.map((t: any) => t.tag) || []
  tagsInput.value = ''
  rulingDate.value = item.date ? new Date(item.date) : null
  publishedAtDate.value = item.publishedAt ? new Date(item.publishedAt) : null
  uploadedDocument.value = null
  dialogVisible.value = true
}

// Close dialog
const closeDialog = () => {
  dialogVisible.value = false
  resetForm()
}

// Reset form
const resetForm = () => {
  rulingForm.id = ''
  rulingForm.caseNumber = ''
  rulingForm.title = ''
  rulingForm.slug = ''
  rulingForm.summary = ''
  rulingForm.details = ''
  rulingForm.court = ''
  rulingForm.judge = ''
  rulingForm.outcome = ''
  rulingForm.assetsRecovered = ''
  rulingForm.sentence = ''
  rulingForm.downloadUrl = ''
  rulingForm.year = ''
  rulingForm.isPublished = false
  rulingForm.publishedAt = ''
  rulingForm.tags = []
  tagsInput.value = ''
  rulingDate.value = null
  publishedAtDate.value = null
  uploadedDocument.value = null
  errors.caseNumber = ''
  errors.title = ''
  errors.slug = ''
  errors.summary = ''
  errors.details = ''
  errors.court = ''
  errors.judge = ''
  errors.date = ''
  errors.outcome = ''
  errors.year = ''
}

// Validate form
const validateForm = () => {
  let valid = true
  errors.caseNumber = ''
  errors.title = ''
  errors.slug = ''
  errors.summary = ''
  errors.details = ''
  errors.court = ''
  errors.judge = ''
  errors.date = ''
  errors.outcome = ''
  errors.year = ''

  if (!rulingForm.caseNumber.trim()) {
    errors.caseNumber = 'Case number is required'
    valid = false
  }

  if (!rulingForm.title.trim()) {
    errors.title = 'Title is required'
    valid = false
  }

  if (!rulingForm.slug.trim()) {
    errors.slug = 'Slug is required'
    valid = false
  }

  if (!rulingForm.summary.trim()) {
    errors.summary = 'Summary is required'
    valid = false
  }

  if (!rulingForm.details.trim()) {
    errors.details = 'Details is required'
    valid = false
  }

  if (!rulingForm.court.trim()) {
    errors.court = 'Court is required'
    valid = false
  }

  if (!rulingForm.judge.trim()) {
    errors.judge = 'Judge is required'
    valid = false
  }

  if (!rulingDate.value) {
    errors.date = 'Date is required'
    valid = false
  }

  if (!rulingForm.outcome) {
    errors.outcome = 'Outcome is required'
    valid = false
  }

  if (!rulingForm.year.trim()) {
    errors.year = 'Year is required'
    valid = false
  }

  return valid
}

// Handle submit
const handleSubmit = async () => {
  if (isProcessingTag.value) {
    return
  }
  
  if (!validateForm()) {
    return
  }

  // Update tags from input
  updateTags()
  
  if (isProcessingTag.value) {
    return
  }

  submitting.value = true
  try {
    // Ensure tags array contains only strings
    const tagsArray = Array.isArray(rulingForm.tags) ? rulingForm.tags : []
    const validTags = tagsArray
      .filter(tag => tag !== null && tag !== undefined && typeof tag === 'string')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    const payload: any = {
      caseNumber: rulingForm.caseNumber,
      title: rulingForm.title,
      slug: rulingForm.slug,
      summary: rulingForm.summary,
      details: rulingForm.details,
      court: rulingForm.court,
      judge: rulingForm.judge,
      date: rulingDate.value!.toISOString(),
      outcome: rulingForm.outcome,
      assetsRecovered: rulingForm.assetsRecovered || undefined,
      sentence: rulingForm.sentence || undefined,
      downloadUrl: rulingForm.downloadUrl || undefined,
      year: rulingForm.year,
      isPublished: rulingForm.isPublished,
      tags: validTags
    }

    if (rulingForm.isPublished && publishedAtDate.value) {
      payload.publishedAt = publishedAtDate.value.toISOString()
    } else if (!rulingForm.isPublished) {
      payload.publishedAt = null
    }

    if (isEditMode.value) {
      await $fetch(`/api/rulings/${rulingForm.id}`, {
        method: 'PUT',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Ruling updated successfully',
        life: 3000
      })
    } else {
      await $fetch('/api/rulings', {
        method: 'POST',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Ruling created successfully',
        life: 3000
      })
    }
    closeDialog()
    await fetchRulings()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || (isEditMode.value ? 'Failed to update ruling' : 'Failed to create ruling'),
      life: 3000
    })
  } finally {
    submitting.value = false
  }
}

// View/Download file
const viewRuling = (item: any) => {
  if (item.downloadUrl) {
    window.open(item.downloadUrl, '_blank')
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Download URL not available',
      life: 3000
    })
  }
}

// Delete ruling
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
        await $fetch(`/api/rulings/${item.id}`, {
          method: 'DELETE'
        })
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Ruling deleted successfully',
          life: 3000
        })
        await fetchRulings()
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.data?.message || 'Failed to delete ruling',
          life: 3000
        })
      }
    }
  })
}

// Lifecycle
onMounted(() => {
  fetchRulings()
})
</script>

