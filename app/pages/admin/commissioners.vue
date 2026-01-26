<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- Page Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Commissioners Management</h1>
          <p class="mt-2 text-gray-600">Manage commissioners</p>
        </div>
        <Button
          label="Add Commissioner"
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
                @change="fetchCommissioners"
              />
            </div>
            <Button
              v-if="selectedStatus !== null"
              label="Clear Filters"
              icon="pi pi-times"
              severity="secondary"
              outlined
              @click="clearFilters"
            />
          </div>
        </template>
      </Card>

      <!-- Commissioners Table -->
      <Card class="border-0 shadow-md">
        <template #content>
          <DataTable
            v-model:filters="filters"
            :value="commissioners"
            :loading="loading"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            :globalFilterFields="['name', 'role', 'title', 'description']"
            dataKey="id"
            stripedRows
            class="text-sm"
          >
            <template #header>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xl font-semibold text-zaccBlack">All Commissioners</span>
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText
                    v-model="filters.global.value"
                    placeholder="Search commissioners..."
                    class="w-64"
                  />
                </span>
              </div>
            </template>

            <Column field="name" header="Name" sortable>
              <template #body="{ data }">
                <div class="flex items-center gap-3">
                  <img
                    v-if="data.imageUrl"
                    :src="getImageUrl(data.imageUrl)"
                    :alt="data.name"
                    class="w-10 h-10 rounded-full object-cover border border-gray-200"
                    @error="handleImageError"
                  />
                  <div v-else class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <i class="pi pi-user text-gray-400"></i>
                  </div>
                  <div class="font-semibold text-zaccBlack">{{ data.name }}</div>
                </div>
              </template>
            </Column>

            <Column field="role" header="Position Type" sortable>
              <template #body="{ data }">
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                  {{ data.role }}
                </span>
              </template>
            </Column>

            <Column field="title" header="Custom Position" sortable>
              <template #body="{ data }">
                <span v-if="data.title" class="text-zaccBlack">{{ data.title }}</span>
                <span v-else class="text-gray-400">-</span>
              </template>
            </Column>

            <Column field="email" header="Email">
              <template #body="{ data }">
                <span v-if="data.email" class="text-zaccBlack">{{ data.email }}</span>
                <span v-else class="text-gray-400">-</span>
              </template>
            </Column>

            <Column field="order" header="Order" sortable />

            <Column field="isActive" header="Active" sortable>
              <template #body="{ data }">
                <Tag
                  :value="data.isActive ? 'Yes' : 'No'"
                  :severity="data.isActive ? 'success' : 'danger'"
                />
              </template>
            </Column>

            <Column header="Actions" :exportable="false" style="min-width: 150px">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <Button
                    icon="pi pi-pencil"
                    severity="info"
                    rounded
                    text
                    @click="openEditDialog(data)"
                    v-tooltip.top="'Edit'"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    rounded
                    text
                    @click="handleDelete(data)"
                    v-tooltip.top="'Delete'"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- Create/Edit Commissioner Dialog -->
      <Dialog
        v-model:visible="dialogVisible"
        :header="isEditMode ? 'Edit Commissioner' : 'Create New Commissioner'"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '800px' }"
        :closable="true"
      >
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="name" class="block text-sm font-semibold text-zaccBlack mb-2">
                Name <span class="text-red-500">*</span>
              </label>
              <InputText
                id="name"
                v-model="commissionerForm.name"
                placeholder="Full name"
                class="w-full"
                :class="{ 'p-invalid': errors.name }"
              />
              <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
            </div>

            <div>
              <label for="role" class="block text-sm font-semibold text-zaccBlack mb-2">
                Position Type <span class="text-red-500">*</span>
              </label>
              <AutoComplete
                id="role"
                v-model="commissionerForm.role"
                :suggestions="positionTypeSuggestions"
                @complete="searchPositionType"
                placeholder="Type or select position type"
                class="w-full"
                :class="{ 'p-invalid': errors.role }"
                dropdown
              />
              <small v-if="errors.role" class="p-error">{{ errors.role }}</small>
              <small class="text-gray-500">Common: Commissioner, Executive, Staff, etc.</small>
            </div>
          </div>

          <div>
            <label for="title" class="block text-sm font-semibold text-zaccBlack mb-2">
              Custom Position
            </label>
            <InputText
              id="title"
              v-model="commissionerForm.title"
              placeholder="e.g., Chairperson, Vice Chairperson, Director"
              class="w-full"
            />
            <small class="text-gray-500">Optional: Specific title or position</small>
          </div>

          <div>
            <label for="description" class="block text-sm font-semibold text-zaccBlack mb-2">
              Description <span class="text-red-500">*</span>
            </label>
            <Textarea
              id="description"
              v-model="commissionerForm.description"
              placeholder="Brief description of the team member"
              :rows="3"
              class="w-full"
              :class="{ 'p-invalid': errors.description }"
            />
            <small v-if="errors.description" class="p-error">{{ errors.description }}</small>
          </div>

          <div>
            <label for="bio" class="block text-sm font-semibold text-zaccBlack mb-2">
              Bio
            </label>
            <Editor
              v-model="commissionerForm.bio"
              editorStyle="height: 150px"
            />
            <small class="text-gray-500">Optional: Detailed biography</small>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="email" class="block text-sm font-semibold text-zaccBlack mb-2">
                Email
              </label>
              <InputText
                id="email"
                v-model="commissionerForm.email"
                type="email"
                placeholder="email@example.com"
                class="w-full"
              />
            </div>

            <div>
              <label for="phone" class="block text-sm font-semibold text-zaccBlack mb-2">
                Phone
              </label>
              <InputText
                id="phone"
                v-model="commissionerForm.phone"
                placeholder="+263 XXX XXX XXX"
                class="w-full"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-zaccBlack mb-2">
              Photo <span class="text-red-500">*</span>
            </label>
            <FileUpload
              mode="basic"
              :multiple="false"
              accept="image/*"
              :maxFileSize="5242880"
              :auto="false"
              chooseLabel="Upload Photo"
              @select="onImageSelect"
              @clear="clearImage"
              class="w-full"
            />
            <small class="text-gray-500">JPG, PNG, GIF. Maximum 5MB.</small>
            <div v-if="uploadedImage || commissionerForm.imageUrl" class="mt-4">
              <div v-if="isEditMode && commissionerForm.imageUrl && !uploadedImage" class="mb-2">
                <small class="text-gray-600 font-semibold">Current Photo:</small>
              </div>
              <div v-else-if="uploadedImage" class="mb-2">
                <small class="text-gray-600 font-semibold">New Photo:</small>
              </div>
              <div class="flex items-center gap-4">
                <img
                  :src="uploadedImage || getImageUrl(commissionerForm.imageUrl)"
                  alt="Photo preview"
                  class="w-32 h-32 rounded-lg border border-gray-200 object-cover"
                  @error="handleImageError"
                />
                <Button
                  v-if="uploadedImage || commissionerForm.imageUrl"
                  icon="pi pi-times"
                  severity="danger"
                  outlined
                  label="Remove"
                  @click="clearImage"
                />
              </div>
            </div>
            <small v-if="errors.imageUrl" class="p-error">{{ errors.imageUrl }}</small>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="order" class="block text-sm font-semibold text-zaccBlack mb-2">
                Order
              </label>
              <InputNumber
                id="order"
                v-model="commissionerForm.order"
                :min="0"
                class="w-full"
              />
              <small class="text-gray-500">Display order (lower numbers appear first)</small>
            </div>

            <div class="flex items-center gap-2 pt-6">
              <Checkbox
                id="isActive"
                v-model="commissionerForm.isActive"
                :binary="true"
              />
              <label for="isActive" class="text-sm font-semibold text-zaccBlack">
                Active
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
  title: 'Commissioners Management - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'Manage commissioners'
    }
  ]
})

definePageMeta({
  middleware: 'admin'
})

const confirm = useConfirm()
const toast = useToast()

// State
const commissioners = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const selectedStatus = ref<string | null>(null)
const uploadedImage = ref<string | null>(null)
const uploadedImageFile = ref<File | null>(null)
const filters = ref({
  global: { value: null, matchMode: 'contains' }
})

const commissionerForm = reactive({
  id: '',
  name: '',
  role: '',
  title: '',
  description: '',
  bio: '',
  imageUrl: '',
  email: '',
  phone: '',
  order: 0,
  isActive: true
})

const errors = reactive({
  name: '',
  role: '',
  description: '',
  imageUrl: ''
})

const statusOptions = [
  { label: 'All', value: null },
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' }
]

const positionTypeSuggestions = ref<string[]>([])
const commonPositionTypes = ['Commissioner', 'Executive', 'Staff', 'Director', 'Manager', 'Coordinator', 'Officer', 'Assistant']

const searchPositionType = (event: any) => {
  const query = event.query.toLowerCase()
  if (!query) {
    positionTypeSuggestions.value = commonPositionTypes
  } else {
    positionTypeSuggestions.value = commonPositionTypes.filter(type => 
      type.toLowerCase().includes(query)
    )
    // If the query doesn't match any common type, add it as a suggestion
    if (!commonPositionTypes.some(t => t.toLowerCase() === query)) {
      positionTypeSuggestions.value.push(query)
    }
  }
}

// Helper functions
const getImageUrl = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  if (url.startsWith('/api/uploads/') || url.startsWith('/uploads/')) {
    return url.startsWith('/api') ? url : `/api${url}`
  }
  return `/api/uploads/${url}`
}

const handleImageError = (event: any) => {
  event.target.src = '/placeholder-avatar.png'
}

// Fetch commissioners
const fetchCommissioners = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedStatus.value !== null) {
      params.isActive = selectedStatus.value
    }

    const data = await $fetch('/api/commissioners', { params })
    commissioners.value = data
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load commissioners',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Image upload handler
const onImageSelect = async (event: any) => {
  const file = event.files?.[0] || event.files?.[0]?.file || event.files?.[0]
  if (!file) {
    console.error('No file selected')
    return
  }

  uploadedImageFile.value = file

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // Upload file
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await $fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (response && response.path) {
      commissionerForm.imageUrl = response.path
      errors.imageUrl = ''
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Image uploaded successfully',
        life: 2000
      })
    } else {
      throw new Error('Invalid response from server')
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || error.message || 'Failed to upload image',
      life: 3000
    })
    errors.imageUrl = 'Image upload failed'
    uploadedImage.value = null
    uploadedImageFile.value = null
  }
}

const clearImage = () => {
  uploadedImage.value = null
  uploadedImageFile.value = null
  commissionerForm.imageUrl = ''
}

// Dialog handlers
const openCreateDialog = () => {
  isEditMode.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (commissioner: any) => {
  isEditMode.value = true
  commissionerForm.id = commissioner.id
  commissionerForm.name = commissioner.name
  commissionerForm.role = commissioner.role
  commissionerForm.title = commissioner.title || ''
  commissionerForm.description = commissioner.description
  commissionerForm.bio = commissioner.bio || ''
  commissionerForm.imageUrl = commissioner.imageUrl
  commissionerForm.email = commissioner.email || ''
  commissionerForm.phone = commissioner.phone || ''
  commissionerForm.order = commissioner.order
  commissionerForm.isActive = commissioner.isActive
  uploadedImage.value = null
  uploadedImageFile.value = null
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  resetForm()
  clearErrors()
}

const resetForm = () => {
  commissionerForm.id = ''
  commissionerForm.name = ''
  commissionerForm.role = ''
  commissionerForm.title = ''
  commissionerForm.description = ''
  commissionerForm.bio = ''
  commissionerForm.imageUrl = ''
  commissionerForm.email = ''
  commissionerForm.phone = ''
  commissionerForm.order = 0
  commissionerForm.isActive = true
  uploadedImage.value = null
  uploadedImageFile.value = null
}

const clearErrors = () => {
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })
}

const validateForm = () => {
  clearErrors()
  let isValid = true

  if (!commissionerForm.name.trim()) {
    errors.name = 'Name is required'
    isValid = false
  }

  if (!commissionerForm.role.trim()) {
    errors.role = 'Position type is required'
    isValid = false
  }

  if (!commissionerForm.description.trim()) {
    errors.description = 'Description is required'
    isValid = false
  }

  if (!commissionerForm.imageUrl) {
    errors.imageUrl = 'Photo is required'
    isValid = false
  }

  return isValid
}

// Submit handler
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  submitting.value = true
  try {
    const payload: any = {
      name: commissionerForm.name,
      role: commissionerForm.role,
      title: commissionerForm.title || undefined,
      description: commissionerForm.description,
      bio: commissionerForm.bio || undefined,
      imageUrl: commissionerForm.imageUrl,
      email: commissionerForm.email || undefined,
      phone: commissionerForm.phone || undefined,
      order: commissionerForm.order,
      isActive: commissionerForm.isActive
    }

    if (isEditMode.value) {
      await $fetch(`/api/commissioners/${commissionerForm.id}`, {
        method: 'PUT',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Commissioner updated successfully',
        life: 3000
      })
    } else {
      await $fetch('/api/commissioners', {
        method: 'POST',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Commissioner created successfully',
        life: 3000
      })
    }

    await fetchCommissioners()
    closeDialog()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to save commissioner',
      life: 3000
    })
  } finally {
    submitting.value = false
  }
}

// Delete handler
const handleDelete = (commissioner: any) => {
  confirm.require({
    message: `Are you sure you want to delete "${commissioner.name}"? This action cannot be undone.`,
    header: 'Confirm Delete',
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
        await $fetch(`/api/commissioners/${commissioner.id}`, {
          method: 'DELETE'
        })
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Commissioner deleted successfully',
          life: 3000
        })
        await fetchCommissioners()
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.data?.message || 'Failed to delete commissioner',
          life: 3000
        })
      }
    }
  })
}

const clearFilters = () => {
  selectedStatus.value = null
  fetchCommissioners()
}

// Lifecycle
onMounted(() => {
  fetchCommissioners()
})
</script>

