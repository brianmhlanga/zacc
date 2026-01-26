<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- Page Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Executives Management</h1>
          <p class="mt-2 text-gray-600">Manage executive team members</p>
        </div>
        <Button
          label="Add Executive"
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
                @change="fetchExecutives"
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

      <!-- Executives Table -->
      <Card class="border-0 shadow-md">
        <template #content>
          <DataTable
            v-model:filters="filters"
            :value="executives"
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
                <span class="text-xl font-semibold text-zaccBlack">All Executives</span>
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText
                    v-model="filters.global.value"
                    placeholder="Search executives..."
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

            <Column field="role" header="Role" sortable>
              <template #body="{ data }">
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                  {{ data.role }}
                </span>
              </template>
            </Column>

            <Column field="title" header="Title" sortable>
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

      <!-- Create/Edit Executive Dialog -->
      <Dialog
        v-model:visible="dialogVisible"
        :header="isEditMode ? 'Edit Executive' : 'Create New Executive'"
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
                v-model="executiveForm.name"
                placeholder="Full name"
                class="w-full"
                :class="{ 'p-invalid': errors.name }"
              />
              <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
            </div>

            <div>
              <label for="role" class="block text-sm font-semibold text-zaccBlack mb-2">
                Role <span class="text-red-500">*</span>
              </label>
              <AutoComplete
                id="role"
                v-model="executiveForm.role"
                :suggestions="roleSuggestions"
                @complete="searchRole"
                placeholder="Type or select role"
                class="w-full"
                :class="{ 'p-invalid': errors.role }"
                dropdown
              />
              <small v-if="errors.role" class="p-error">{{ errors.role }}</small>
              <small class="text-gray-500">Common: Executive Secretary, General Manager, etc.</small>
            </div>
          </div>

          <div>
            <label for="title" class="block text-sm font-semibold text-zaccBlack mb-2">
              Title
            </label>
            <InputText
              id="title"
              v-model="executiveForm.title"
              placeholder="e.g., Executive Secretary, General Manager Finance"
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
              v-model="executiveForm.description"
              placeholder="Brief description of the executive"
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
              v-model="executiveForm.bio"
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
                v-model="executiveForm.email"
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
                v-model="executiveForm.phone"
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
            <div v-if="uploadedImage || executiveForm.imageUrl" class="mt-4">
              <div v-if="isEditMode && executiveForm.imageUrl && !uploadedImage" class="mb-2">
                <small class="text-gray-600 font-semibold">Current Photo:</small>
              </div>
              <div v-else-if="uploadedImage" class="mb-2">
                <small class="text-gray-600 font-semibold">New Photo:</small>
              </div>
              <div class="flex items-center gap-4">
                <img
                  :src="uploadedImage || getImageUrl(executiveForm.imageUrl)"
                  alt="Photo preview"
                  class="w-32 h-32 rounded-lg border border-gray-200 object-cover"
                  @error="handleImageError"
                />
                <Button
                  v-if="uploadedImage || executiveForm.imageUrl"
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
                v-model="executiveForm.order"
                :min="0"
                class="w-full"
              />
              <small class="text-gray-500">Display order (lower numbers appear first)</small>
            </div>

            <div class="flex items-center gap-2 pt-6">
              <Checkbox
                id="isActive"
                v-model="executiveForm.isActive"
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
  title: 'Executives Management - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'Manage executive team members'
    }
  ]
})

definePageMeta({
  middleware: 'admin'
})

const confirm = useConfirm()
const toast = useToast()

// State
const executives = ref([])
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

const executiveForm = reactive({
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

const roleSuggestions = ref<string[]>([])
const commonRoles = ['Executive Secretary', 'General Manager', 'Manager', 'Director', 'Deputy Director', 'Coordinator', 'Officer', 'Assistant']

const searchRole = (event: any) => {
  const query = event.query.toLowerCase()
  if (!query) {
    roleSuggestions.value = commonRoles
  } else {
    roleSuggestions.value = commonRoles.filter(role => 
      role.toLowerCase().includes(query)
    )
    // If the query doesn't match any common role, add it as a suggestion
    if (!commonRoles.some(r => r.toLowerCase() === query)) {
      roleSuggestions.value.push(query)
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

// Fetch executives
const fetchExecutives = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedStatus.value !== null) {
      params.isActive = selectedStatus.value
    }

    const data = await $fetch('/api/team', { params })
    executives.value = data
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load executives',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Image upload handler
const onImageSelect = async (event: any) => {
  const file = event.files[0]
  if (!file) return

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

    executiveForm.imageUrl = response.path
    errors.imageUrl = ''
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to upload image',
      life: 3000
    })
    errors.imageUrl = 'Image upload failed'
  }
}

const clearImage = () => {
  uploadedImage.value = null
  uploadedImageFile.value = null
  executiveForm.imageUrl = ''
}

// Dialog handlers
const openCreateDialog = () => {
  isEditMode.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (executive: any) => {
  isEditMode.value = true
  executiveForm.id = executive.id
  executiveForm.name = executive.name
  executiveForm.role = executive.role
  executiveForm.title = executive.title || ''
  executiveForm.description = executive.description
  executiveForm.bio = executive.bio || ''
  executiveForm.imageUrl = executive.imageUrl
  executiveForm.email = executive.email || ''
  executiveForm.phone = executive.phone || ''
  executiveForm.order = executive.order
  executiveForm.isActive = executive.isActive
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
  executiveForm.id = ''
  executiveForm.name = ''
  executiveForm.role = ''
  executiveForm.title = ''
  executiveForm.description = ''
  executiveForm.bio = ''
  executiveForm.imageUrl = ''
  executiveForm.email = ''
  executiveForm.phone = ''
  executiveForm.order = 0
  executiveForm.isActive = true
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

  if (!executiveForm.name.trim()) {
    errors.name = 'Name is required'
    isValid = false
  }

  if (!executiveForm.role.trim()) {
    errors.role = 'Role is required'
    isValid = false
  }

  if (!executiveForm.description.trim()) {
    errors.description = 'Description is required'
    isValid = false
  }

  if (!executiveForm.imageUrl) {
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
      name: executiveForm.name,
      role: executiveForm.role,
      title: executiveForm.title || undefined,
      description: executiveForm.description,
      bio: executiveForm.bio || undefined,
      imageUrl: executiveForm.imageUrl,
      email: executiveForm.email || undefined,
      phone: executiveForm.phone || undefined,
      order: executiveForm.order,
      isActive: executiveForm.isActive
    }

    if (isEditMode.value) {
      await $fetch(`/api/team/${executiveForm.id}`, {
        method: 'PUT',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Executive updated successfully',
        life: 3000
      })
    } else {
      await $fetch('/api/team', {
        method: 'POST',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Executive created successfully',
        life: 3000
      })
    }

    await fetchExecutives()
    closeDialog()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to save executive',
      life: 3000
    })
  } finally {
    submitting.value = false
  }
}

// Delete handler
const handleDelete = (executive: any) => {
  confirm.require({
    message: `Are you sure you want to delete "${executive.name}"? This action cannot be undone.`,
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
        await $fetch(`/api/team/${executive.id}`, {
          method: 'DELETE'
        })
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Executive deleted successfully',
          life: 3000
        })
        await fetchExecutives()
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.data?.message || 'Failed to delete executive',
          life: 3000
        })
      }
    }
  })
}

const clearFilters = () => {
  selectedStatus.value = null
  fetchExecutives()
}

// Lifecycle
onMounted(() => {
  fetchExecutives()
})
</script>
