<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- Page Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Content Management</h1>
          <p class="mt-2 text-gray-600">Manage dynamic content for site pages</p>
        </div>
        <Button
          label="Add Section"
          icon="pi pi-plus"
          @click="openCreateDialog"
          style="background: #209341; border-color: #209341;"
        />
      </div>

      <!-- Page Selection -->
      <Card class="mb-6 border-0 shadow-md">
        <template #content>
          <div class="flex items-center gap-4">
            <label for="pageSelect" class="text-sm font-semibold text-zaccBlack whitespace-nowrap">
              Select Page:
            </label>
            <Dropdown
              id="pageSelect"
              v-model="selectedPage"
              :options="pageOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select a page"
              class="w-64"
              @change="onPageChange"
            />
            <Button
              v-if="selectedPage"
              label="Clear Filter"
              icon="pi pi-times"
              severity="secondary"
              outlined
              @click="clearPageFilter"
            />
          </div>
        </template>
      </Card>

      <!-- Content Sections -->
      <Card class="border-0 shadow-md">
        <template #content>
          <DataTable
            v-model:filters="filters"
            :value="filteredContent"
            :loading="loading"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            :globalFilterFields="['pageKey', 'sectionKey', 'title']"
            dataKey="id"
            stripedRows
            class="text-sm"
          >
            <template #header>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xl font-semibold text-zaccBlack">
                  {{ selectedPage ? `Content for ${getPageLabel(selectedPage)}` : 'All Content Sections' }}
                </span>
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText
                    v-model="filters.global.value"
                    placeholder="Search content..."
                    class="w-64"
                  />
                </span>
              </div>
            </template>

            <Column field="pageKey" header="Page" sortable>
              <template #body="{ data }">
                <Tag :value="getPageLabel(data.pageKey)" severity="info" />
              </template>
            </Column>

            <Column field="sectionKey" header="Section" sortable>
              <template #body="{ data }">
                <span class="font-semibold text-zaccBlack">{{ formatSectionKey(data.sectionKey) }}</span>
              </template>
            </Column>

            <Column field="title" header="Title" sortable>
              <template #body="{ data }">
                <div class="max-w-xs">
                  <div class="font-semibold text-zaccBlack truncate">{{ data.title || 'No title' }}</div>
                  <div class="text-xs text-gray-500 truncate mt-1" v-html="truncateContent(data.content, 60)"></div>
                </div>
              </template>
            </Column>

            <Column field="order" header="Order" sortable>
              <template #body="{ data }">
                <span class="text-gray-600">{{ data.order }}</span>
              </template>
            </Column>

            <Column field="isVisible" header="Status">
              <template #body="{ data }">
                <Tag
                  :value="data.isVisible ? 'Visible' : 'Hidden'"
                  :severity="data.isVisible ? 'success' : 'secondary'"
                />
              </template>
            </Column>

            <Column field="isLocked" header="Lock" sortable>
              <template #body="{ data }">
                <Tag v-if="data.isLocked" value="Locked" severity="danger" />
                <span v-else class="text-gray-400">—</span>
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

            <Column header="Actions" :exportable="false" style="width: 120px">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <Button
                    icon="pi pi-pencil"
                    severity="info"
                    outlined
                    rounded
                    :disabled="data.isLocked && !isSuperAdmin"
                    @click="openEditDialog(data)"
                    v-tooltip.top="'Edit Section'"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    outlined
                    rounded
                    :disabled="data.isLocked && !isSuperAdmin"
                    @click="confirmDelete(data)"
                    v-tooltip.top="'Delete Section'"
                  />
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="text-center py-8 text-gray-500">
                <i class="pi pi-file text-4xl mb-4"></i>
                <p>{{ selectedPage ? 'No content sections found for this page' : 'No content sections found' }}</p>
              </div>
            </template>
          </DataTable>
        </template>
      </Card>

      <!-- Create/Edit Content Dialog -->
      <Dialog
        v-model:visible="dialogVisible"
        :header="isEditMode ? 'Edit Content Section' : 'Create New Content Section'"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '800px' }"
        :closable="true"
      >
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="pageKey" class="block text-sm font-semibold text-zaccBlack mb-2">
                Page <span class="text-red-500">*</span>
              </label>
              <Dropdown
                id="pageKey"
                v-model="contentForm.pageKey"
                :options="pageOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select a page"
                class="w-full"
                :class="{ 'p-invalid': errors.pageKey }"
                :disabled="isEditMode"
              />
              <small v-if="errors.pageKey" class="p-error">{{ errors.pageKey }}</small>
            </div>

            <div>
              <label for="sectionKey" class="block text-sm font-semibold text-zaccBlack mb-2">
                Section Key <span class="text-red-500">*</span>
              </label>
              <InputText
                id="sectionKey"
                v-model="contentForm.sectionKey"
                placeholder="e.g., hero, introduction, mandate"
                class="w-full"
                :class="{ 'p-invalid': errors.sectionKey }"
                :disabled="isEditMode"
              />
              <small v-if="errors.sectionKey" class="p-error">{{ errors.sectionKey }}</small>
              <small class="text-gray-500">Unique identifier for this section</small>
            </div>
          </div>

          <div>
            <label for="title" class="block text-sm font-semibold text-zaccBlack mb-2">
              Title (Optional)
            </label>
            <InputText
              id="title"
              v-model="contentForm.title"
              placeholder="Section title"
              class="w-full"
            />
          </div>

          <div>
            <label for="content" class="block text-sm font-semibold text-zaccBlack mb-2">
              Content <span class="text-red-500">*</span>
            </label>
            <Textarea
              id="content"
              v-model="contentForm.content"
              placeholder="Enter content (HTML supported)"
              :rows="10"
              class="w-full"
              :class="{ 'p-invalid': errors.content }"
            />
            <small v-if="errors.content" class="p-error">{{ errors.content }}</small>
            <small class="text-gray-500">You can use HTML tags for formatting</small>
          </div>

          <div>
            <label for="imageUrl" class="block text-sm font-semibold text-zaccBlack mb-2">
              Image URL (Optional)
            </label>
            <InputText
              id="imageUrl"
              v-model="contentForm.imageUrl"
              placeholder="https://example.com/image.jpg"
              class="w-full"
            />
            <small class="text-gray-500">URL to an image for this section</small>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="order" class="block text-sm font-semibold text-zaccBlack mb-2">
                Display Order
              </label>
              <InputNumber
                id="order"
                v-model="contentForm.order"
                :min="0"
                class="w-full"
              />
              <small class="text-gray-500">Lower numbers appear first</small>
            </div>

            <div class="flex items-center gap-2 pt-6">
              <Checkbox
                id="isVisible"
                v-model="contentForm.isVisible"
                :binary="true"
              />
              <label for="isVisible" class="text-sm font-semibold text-zaccBlack">
                Visible on site
              </label>
            </div>
          </div>

          <div v-if="isSuperAdmin && isEditMode" class="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div class="flex items-center gap-2">
              <Checkbox
                id="isLocked"
                v-model="contentForm.isLocked"
                :binary="true"
              />
              <label for="isLocked" class="text-sm font-semibold text-zaccBlack">
                Lock section (only super administrators can edit or delete while locked)
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
  title: 'Content Management - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'Manage dynamic content for site pages'
    }
  ]
})

definePageMeta({
  middleware: 'admin'
})

const confirm = useConfirm()
const toast = useToast()
const { user } = useUserSession()
const isSuperAdmin = computed(() => user.value?.role === 'SUPER_ADMIN')

// State
const content = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const selectedPage = ref<string | null>(null)
const filters = ref({
  global: { value: null, matchMode: 'contains' }
})

const contentForm = reactive({
  id: '',
  pageKey: '',
  sectionKey: '',
  title: '',
  content: '',
  imageUrl: '',
  order: 0,
  isVisible: true,
  isLocked: false
})

const errors = reactive({
  pageKey: '',
  sectionKey: '',
  content: ''
})

const pageOptions = [
  { label: 'Home', value: 'home' },
  { label: 'About', value: 'about' },
  { label: 'Legislation', value: 'legislation' },
  { label: 'Contact', value: 'contact' },
  { label: 'Services', value: 'services' },
  { label: 'Reports', value: 'reports' }
]

// Computed
const filteredContent = computed(() => {
  if (!selectedPage.value) {
    return content.value
  }
  return content.value.filter((item: any) => item.pageKey === selectedPage.value)
})

// Methods
const getPageLabel = (pageKey: string) => {
  const page = pageOptions.find(p => p.value === pageKey)
  return page?.label || pageKey
}

const formatSectionKey = (key: string) => {
  return key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const truncateContent = (html: string, length: number) => {
  const text = html.replace(/<[^>]*>/g, '')
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

// Fetch content
const fetchContent = async () => {
  loading.value = true
  try {
    const params = selectedPage.value ? { pageKey: selectedPage.value } : {}
    const data = await $fetch('/api/content', { params })
    content.value = data
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load content',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Page change handler
const onPageChange = () => {
  fetchContent()
}

const clearPageFilter = () => {
  selectedPage.value = null
  fetchContent()
}

// Open create dialog
const openCreateDialog = () => {
  isEditMode.value = false
  resetForm()
  dialogVisible.value = true
}

// Open edit dialog
const openEditDialog = (item: any) => {
  if (item.isLocked && !isSuperAdmin.value) {
    toast.add({
      severity: 'warn',
      summary: 'Section locked',
      detail: 'Only a super administrator can edit this locked section.',
      life: 4000
    })
    return
  }
  isEditMode.value = true
  contentForm.id = item.id
  contentForm.pageKey = item.pageKey
  contentForm.sectionKey = item.sectionKey
  contentForm.title = item.title || ''
  contentForm.content = item.content
  contentForm.imageUrl = item.imageUrl || ''
  contentForm.order = item.order
  contentForm.isVisible = item.isVisible
  contentForm.isLocked = !!item.isLocked
  dialogVisible.value = true
}

// Close dialog
const closeDialog = () => {
  dialogVisible.value = false
  resetForm()
}

// Reset form
const resetForm = () => {
  contentForm.id = ''
  contentForm.pageKey = ''
  contentForm.sectionKey = ''
  contentForm.title = ''
  contentForm.content = ''
  contentForm.imageUrl = ''
  contentForm.order = 0
  contentForm.isVisible = true
  contentForm.isLocked = false
  errors.pageKey = ''
  errors.sectionKey = ''
  errors.content = ''
}

// Validate form
const validateForm = () => {
  let valid = true
  errors.pageKey = ''
  errors.sectionKey = ''
  errors.content = ''

  if (!contentForm.pageKey) {
    errors.pageKey = 'Page is required'
    valid = false
  }

  if (!contentForm.sectionKey) {
    errors.sectionKey = 'Section key is required'
    valid = false
  }

  if (!contentForm.content || contentForm.content.trim() === '') {
    errors.content = 'Content is required'
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
    if (isEditMode.value) {
      const body: Record<string, unknown> = {
        title: contentForm.title,
        content: contentForm.content,
        imageUrl: contentForm.imageUrl,
        order: contentForm.order,
        isVisible: contentForm.isVisible
      }
      if (isSuperAdmin.value) {
        body.isLocked = contentForm.isLocked
      }
      await $fetch(`/api/content/${contentForm.id}`, {
        method: 'PUT',
        body
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Content updated successfully',
        life: 3000
      })
    } else {
      await $fetch('/api/content', {
        method: 'POST',
        body: {
          pageKey: contentForm.pageKey,
          sectionKey: contentForm.sectionKey,
          title: contentForm.title,
          content: contentForm.content,
          imageUrl: contentForm.imageUrl,
          order: contentForm.order,
          isVisible: contentForm.isVisible
        }
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Content created successfully',
        life: 3000
      })
    }
    closeDialog()
    await fetchContent()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || (isEditMode.value ? 'Failed to update content' : 'Failed to create content'),
      life: 3000
    })
  } finally {
    submitting.value = false
  }
}

// Delete content
const confirmDelete = (item: any) => {
  if (item.isLocked && !isSuperAdmin.value) {
    toast.add({
      severity: 'warn',
      summary: 'Section locked',
      detail: 'Only a super administrator can delete this locked section.',
      life: 4000
    })
    return
  }
  confirm.require({
    message: `Are you sure you want to delete the "${formatSectionKey(item.sectionKey)}" section from "${getPageLabel(item.pageKey)}"?`,
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
        await $fetch(`/api/content/${item.id}`, {
          method: 'DELETE'
        })
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Content deleted successfully',
          life: 3000
        })
        await fetchContent()
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.data?.message || 'Failed to delete content',
          life: 3000
        })
      }
    }
  })
}

// Lifecycle
onMounted(() => {
  fetchContent()
})
</script>

