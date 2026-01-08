<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- Page Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-extrabold text-zaccBlack">Site Settings</h1>
        <p class="mt-2 text-gray-600">Manage site-wide configuration and settings</p>
      </div>

      <!-- Category Tabs -->
      <Card class="mb-6 border-0 shadow-md">
        <template #content>
          <div class="flex items-center gap-2 border-b border-gray-200 pb-2">
            <Button
              v-for="category in categoryOptions"
              :key="category.value"
              :label="category.label"
              :severity="activeCategory === category.value ? undefined : 'secondary'"
              :outlined="activeCategory !== category.value"
              @click="activeCategory = category.value"
              class="rounded-lg"
            />
          </div>
        </template>
      </Card>

      <!-- Settings Form -->
      <Card class="border-0 shadow-md">
        <template #content>
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div
              v-for="setting in categorySettings"
              :key="setting.key"
              class="p-4 border border-gray-200 rounded-lg"
            >
              <div class="mb-3">
                <label :for="setting.key" class="block text-sm font-semibold text-zaccBlack mb-1">
                  {{ formatKey(setting.key) }}
                </label>
                <p v-if="setting.description" class="text-xs text-gray-500 mb-2">
                  {{ setting.description }}
                </p>
              </div>

              <!-- Text Input -->
              <InputText
                v-if="setting.type === 'text'"
                :id="setting.key"
                v-model="settingsForm[setting.key]"
                :placeholder="`Enter ${formatKey(setting.key)}`"
                class="w-full"
              />

              <!-- Number Input -->
              <InputNumber
                v-else-if="setting.type === 'number'"
                :id="setting.key"
                v-model="settingsForm[setting.key]"
                class="w-full"
              />

              <!-- Boolean/Checkbox -->
              <div v-else-if="setting.type === 'boolean'" class="flex items-center gap-2">
                <Checkbox
                  :id="setting.key"
                  v-model="settingsForm[setting.key]"
                  :binary="true"
                />
                <label :for="setting.key" class="text-sm text-gray-700">
                  {{ settingsForm[setting.key] ? 'Enabled' : 'Disabled' }}
                </label>
              </div>

              <!-- URL Input -->
              <InputText
                v-else-if="setting.type === 'url'"
                :id="setting.key"
                v-model="settingsForm[setting.key]"
                type="url"
                :placeholder="`Enter URL for ${formatKey(setting.key)}`"
                class="w-full"
              />

              <!-- Image Upload -->
              <div v-else-if="setting.type === 'image'">
                <FileUpload
                  mode="basic"
                  :multiple="false"
                  accept="image/*"
                  :maxFileSize="5242880"
                  :auto="false"
                  chooseLabel="Upload Image"
                  @select="(e) => onImageSelect(e, setting.key)"
                  @clear="() => clearImage(setting.key)"
                  class="w-full mb-2"
                />
                <div v-if="settingsForm[setting.key]" class="mt-2">
                  <div v-if="isEditMode && setting.value && !uploadedImages[setting.key]" class="mb-2">
                    <small class="text-gray-600 font-semibold">Current Image:</small>
                  </div>
                  <div v-else-if="uploadedImages[setting.key]" class="mb-2">
                    <small class="text-gray-600 font-semibold">New Image:</small>
                  </div>
                  <img
                    :src="uploadedImages[setting.key] || getImageUrl(settingsForm[setting.key])"
                    alt="Setting image"
                    class="w-32 h-32 rounded-lg border border-gray-200 object-cover"
                    @error="handleImageError"
                  />
                </div>
              </div>

              <!-- JSON/Textarea -->
              <Textarea
                v-else-if="setting.type === 'json'"
                :id="setting.key"
                v-model="settingsForm[setting.key]"
                :placeholder="`Enter JSON for ${formatKey(setting.key)}`"
                :rows="4"
                class="w-full font-mono text-sm"
              />
            </div>

            <div v-if="categorySettings.length === 0" class="text-center py-12 text-gray-500">
              <i class="pi pi-cog text-4xl mb-4 text-gray-300"></i>
              <p>No settings found for this category.</p>
              <Button
                label="Add Setting"
                icon="pi pi-plus"
                severity="secondary"
                outlined
                @click="openCreateDialog"
                class="mt-4"
              />
            </div>

            <div v-else class="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <Button
                label="Add Setting"
                icon="pi pi-plus"
                severity="secondary"
                outlined
                @click="openCreateDialog"
              />
              <Button
                type="submit"
                label="Save Changes"
                :loading="saving"
                icon="pi pi-save"
                style="background: #209341; border-color: #209341;"
              />
            </div>
          </form>
        </template>
      </Card>

      <!-- Create Setting Dialog -->
      <Dialog
        v-model:visible="createDialogVisible"
        header="Create New Setting"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '600px' }"
        :closable="true"
      >
        <form @submit.prevent="handleCreate" class="space-y-4">
          <div>
            <label for="newKey" class="block text-sm font-semibold text-zaccBlack mb-2">
              Key <span class="text-red-500">*</span>
            </label>
            <InputText
              id="newKey"
              v-model="newSetting.key"
              placeholder="e.g., site_name, contact_email"
              class="w-full"
              :class="{ 'p-invalid': errors.key }"
            />
            <small v-if="errors.key" class="p-error">{{ errors.key }}</small>
            <small class="text-gray-500">Unique identifier (use lowercase with underscores)</small>
          </div>

          <div>
            <label for="newType" class="block text-sm font-semibold text-zaccBlack mb-2">
              Type <span class="text-red-500">*</span>
            </label>
            <Dropdown
              id="newType"
              v-model="newSetting.type"
              :options="typeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select type"
              class="w-full"
              :class="{ 'p-invalid': errors.type }"
            />
            <small v-if="errors.type" class="p-error">{{ errors.type }}</small>
          </div>

          <div>
            <label for="newCategory" class="block text-sm font-semibold text-zaccBlack mb-2">
              Category
            </label>
            <AutoComplete
              id="newCategory"
              v-model="newSetting.category"
              :suggestions="categorySuggestions"
              @complete="searchCategory"
              placeholder="Type or select category"
              class="w-full"
              dropdown
            />
            <small class="text-gray-500">Common: general, seo, appearance, footer, header</small>
          </div>

          <div>
            <label for="newDescription" class="block text-sm font-semibold text-zaccBlack mb-2">
              Description
            </label>
            <Textarea
              id="newDescription"
              v-model="newSetting.description"
              placeholder="Brief description of this setting"
              :rows="2"
              class="w-full"
            />
          </div>

          <div>
            <label for="newValue" class="block text-sm font-semibold text-zaccBlack mb-2">
              Initial Value
            </label>
            <InputText
              id="newValue"
              v-model="newSetting.value"
              placeholder="Default value"
              class="w-full"
            />
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button
              label="Cancel"
              severity="secondary"
              outlined
              @click="closeCreateDialog"
            />
            <Button
              type="submit"
              label="Create"
              :loading="creating"
              style="background: #209341; border-color: #209341;"
            />
          </div>
        </form>
      </Dialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

useHead({
  title: 'Site Settings - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'Manage site-wide configuration and settings'
    }
  ]
})

definePageMeta({
  middleware: 'admin'
})

const toast = useToast()

// State
const settings = ref([])
const loading = ref(false)
const saving = ref(false)
const creating = ref(false)
const activeCategory = ref('general')
const createDialogVisible = ref(false)
const isEditMode = ref(false)
const uploadedImages = ref<Record<string, string>>({})
const settingsForm = reactive<Record<string, any>>({})

const newSetting = reactive({
  key: '',
  value: '',
  type: '',
  category: 'general',
  description: ''
})

const errors = reactive({
  key: '',
  type: ''
})

const categoryOptions = [
  { label: 'General', value: 'general' },
  { label: 'SEO', value: 'seo' },
  { label: 'Appearance', value: 'appearance' },
  { label: 'Footer', value: 'footer' },
  { label: 'Header', value: 'header' }
]

const typeOptions = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'URL', value: 'url' },
  { label: 'Image', value: 'image' },
  { label: 'JSON', value: 'json' }
]

const categorySuggestions = ref<string[]>([])
const commonCategories = ['general', 'seo', 'appearance', 'footer', 'header']

const searchCategory = (event: any) => {
  const query = event.query.toLowerCase()
  if (!query) {
    categorySuggestions.value = commonCategories
  } else {
    categorySuggestions.value = commonCategories.filter(cat => 
      cat.toLowerCase().includes(query)
    )
    if (!commonCategories.some(c => c.toLowerCase() === query)) {
      categorySuggestions.value.push(query)
    }
  }
}

// Computed
const categorySettings = computed(() => {
  return settings.value.filter((s: any) => s.category === activeCategory.value)
})

// Helper functions
const formatKey = (key: string) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

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
  event.target.src = '/placeholder-image.png'
}

// Fetch settings
const fetchSettings = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/settings')
    settings.value = data
    
    // Initialize form with current values
    data.forEach((setting: any) => {
      if (setting.type === 'boolean') {
        settingsForm[setting.key] = setting.value === 'true' || setting.value === true
      } else if (setting.type === 'number') {
        settingsForm[setting.key] = Number(setting.value)
      } else {
        settingsForm[setting.key] = setting.value
      }
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load settings',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Image upload handler
const onImageSelect = async (event: any, key: string) => {
  const file = event.files[0]
  if (!file) return

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImages[key] = e.target?.result as string
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

    settingsForm[key] = response.path
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to upload image',
      life: 3000
    })
  }
}

const clearImage = (key: string) => {
  delete uploadedImages[key]
  settingsForm[key] = ''
}

// Submit handler
const handleSubmit = async () => {
  saving.value = true
  try {
    const settingsToUpdate = categorySettings.value.map((setting: any) => ({
      key: setting.key,
      value: setting.type === 'boolean' 
        ? (settingsForm[setting.key] ? 'true' : 'false')
        : String(settingsForm[setting.key] || '')
    }))

    await $fetch('/api/settings/bulk', {
      method: 'PUT',
      body: { settings: settingsToUpdate }
    })

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Settings saved successfully',
      life: 3000
    })

    await fetchSettings()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to save settings',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

// Create setting handlers
const openCreateDialog = () => {
  newSetting.key = ''
  newSetting.value = ''
  newSetting.type = ''
  newSetting.category = activeCategory.value
  newSetting.description = ''
  errors.key = ''
  errors.type = ''
  createDialogVisible.value = true
}

const closeCreateDialog = () => {
  createDialogVisible.value = false
  newSetting.key = ''
  newSetting.value = ''
  newSetting.type = ''
  newSetting.category = 'general'
  newSetting.description = ''
  errors.key = ''
  errors.type = ''
}

const handleCreate = async () => {
  errors.key = ''
  errors.type = ''

  if (!newSetting.key.trim()) {
    errors.key = 'Key is required'
    return
  }

  if (!newSetting.type) {
    errors.type = 'Type is required'
    return
  }

  creating.value = true
  try {
    await $fetch('/api/settings', {
      method: 'POST',
      body: {
        key: newSetting.key,
        value: newSetting.value || '',
        type: newSetting.type,
        category: newSetting.category || null,
        description: newSetting.description || null
      }
    })

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Setting created successfully',
      life: 3000
    })

    await fetchSettings()
    closeCreateDialog()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to create setting',
      life: 3000
    })
  } finally {
    creating.value = false
  }
}

// Watch category changes
watch(activeCategory, () => {
  // Ensure form is initialized for current category
  categorySettings.value.forEach((setting: any) => {
    if (!(setting.key in settingsForm)) {
      if (setting.type === 'boolean') {
        settingsForm[setting.key] = setting.value === 'true' || setting.value === true
      } else if (setting.type === 'number') {
        settingsForm[setting.key] = Number(setting.value)
      } else {
        settingsForm[setting.key] = setting.value
      }
    }
  })
})

// Lifecycle
onMounted(() => {
  fetchSettings()
})
</script>

