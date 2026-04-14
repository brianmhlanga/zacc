<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- Page Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Statistics Management</h1>
          <p class="mt-2 text-gray-600">Manage statistics displayed on the website</p>
        </div>
        <Button
          label="Add Statistic"
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
              <label for="sectionFilter" class="text-sm font-semibold text-zaccBlack whitespace-nowrap">
                Section:
              </label>
              <Dropdown
                id="sectionFilter"
                v-model="selectedSection"
                :options="sectionOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All Sections"
                class="w-48"
                @change="fetchStatistics"
              />
            </div>
            <div class="flex items-center gap-2">
              <label for="statusFilter" class="text-sm font-semibold text-zaccBlack whitespace-nowrap">
                Visibility:
              </label>
              <Dropdown
                id="statusFilter"
                v-model="selectedVisibility"
                :options="visibilityOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All"
                class="w-48"
                @change="fetchStatistics"
              />
            </div>
            <div class="flex items-center gap-2">
              <label for="yearFilter" class="text-sm font-semibold text-zaccBlack whitespace-nowrap">
                Year:
              </label>
              <InputNumber
                id="yearFilter"
                v-model="selectedYear"
                :min="2000"
                :max="2100"
                :use-grouping="false"
                placeholder="All"
                class="w-32"
                @blur="fetchStatistics"
              />
            </div>
            <Button
              v-if="selectedSection || selectedVisibility !== null || selectedYear !== null"
              label="Clear Filters"
              icon="pi pi-times"
              severity="secondary"
              outlined
              @click="clearFilters"
            />
          </div>
        </template>
      </Card>

      <!-- Statistics Table -->
      <Card class="border-0 shadow-md">
        <template #content>
          <DataTable
            v-model:filters="filters"
            :value="statistics"
            :loading="loading"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            :globalFilterFields="['label', 'section']"
            dataKey="id"
            stripedRows
            class="text-sm"
          >
            <template #header>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xl font-semibold text-zaccBlack">All Statistics</span>
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText
                    v-model="filters.global.value"
                    placeholder="Search statistics..."
                    class="w-64"
                  />
                </span>
              </div>
            </template>

            <Column field="label" header="Label" sortable>
              <template #body="{ data }">
                <div class="font-semibold text-zaccBlack">{{ data.label }}</div>
              </template>
            </Column>

            <Column field="value" header="Value" sortable>
              <template #body="{ data }">
                <div class="flex items-center gap-1">
                  <span v-if="data.prefix" class="text-gray-600">{{ data.prefix }}</span>
                  <span class="font-bold text-zaccBlack">{{ formatNumber(data.value) }}</span>
                  <span v-if="data.suffix" class="text-gray-600">{{ data.suffix }}</span>
                </div>
              </template>
            </Column>

            <Column field="section" header="Section" sortable>
              <template #body="{ data }">
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                  {{ formatSection(data.section) }}
                </span>
              </template>
            </Column>

            <Column field="year" header="Year" sortable />

            <Column field="color" header="Color">
              <template #body="{ data }">
                <div v-if="data.color" class="flex items-center gap-2">
                  <div
                    class="w-4 h-4 rounded-full border border-gray-300"
                    :class="getColorClass(data.color)"
                  ></div>
                  <span class="text-xs capitalize">{{ data.color }}</span>
                </div>
                <span v-else class="text-gray-400">-</span>
              </template>
            </Column>

            <Column field="order" header="Order" sortable />

            <Column field="isVisible" header="Visible" sortable>
              <template #body="{ data }">
                <Tag
                  :value="data.isVisible ? 'Yes' : 'No'"
                  :severity="data.isVisible ? 'success' : 'secondary'"
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

      <!-- Create/Edit Statistic Dialog -->
      <Dialog
        v-model:visible="dialogVisible"
        :header="isEditMode ? 'Edit Statistic' : 'Create New Statistic'"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '700px' }"
        :closable="true"
      >
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="label" class="block text-sm font-semibold text-zaccBlack mb-2">
              Label <span class="text-red-500">*</span>
            </label>
            <InputText
              id="label"
              v-model="statisticForm.label"
              placeholder="e.g., Projects Tracked"
              class="w-full"
              :class="{ 'p-invalid': errors.label }"
            />
            <small v-if="errors.label" class="p-error">{{ errors.label }}</small>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="value" class="block text-sm font-semibold text-zaccBlack mb-2">
                Value <span class="text-red-500">*</span>
              </label>
              <InputNumber
                id="value"
                v-model="statisticForm.value"
                :min="0"
                class="w-full"
                :class="{ 'p-invalid': errors.value }"
              />
              <small v-if="errors.value" class="p-error">{{ errors.value }}</small>
            </div>

            <div>
              <label for="section" class="block text-sm font-semibold text-zaccBlack mb-2">
                Section <span class="text-red-500">*</span>
              </label>
              <AutoComplete
                id="section"
                v-model="statisticForm.section"
                :suggestions="sectionSuggestions"
                @complete="searchSection"
                placeholder="Type or select section"
                class="w-full"
                :class="{ 'p-invalid': errors.section }"
                dropdown
              />
              <small v-if="errors.section" class="p-error">{{ errors.section }}</small>
              <small class="text-gray-500">Common: homepage, about, statistics, other (or enter custom)</small>
            </div>
          </div>

          <div>
            <label for="statYear" class="block text-sm font-semibold text-zaccBlack mb-2">
              Year <span class="text-red-500">*</span>
            </label>
            <InputNumber
              id="statYear"
              v-model="statisticForm.year"
              :min="2000"
              :max="2100"
              :use-grouping="false"
              class="w-full max-w-xs"
            />
            <small class="text-gray-500">Statistics page filters by this year on the public site.</small>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="prefix" class="block text-sm font-semibold text-zaccBlack mb-2">
                Prefix
              </label>
              <InputText
                id="prefix"
                v-model="statisticForm.prefix"
                placeholder="e.g., $"
                class="w-full"
              />
              <small class="text-gray-500">Displayed before the value</small>
            </div>

            <div>
              <label for="suffix" class="block text-sm font-semibold text-zaccBlack mb-2">
                Suffix
              </label>
              <InputText
                id="suffix"
                v-model="statisticForm.suffix"
                placeholder="e.g., +, m, k"
                class="w-full"
              />
              <small class="text-gray-500">Displayed after the value</small>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="icon" class="block text-sm font-semibold text-zaccBlack mb-2">
                Icon
              </label>
              <InputText
                id="icon"
                v-model="statisticForm.icon"
                placeholder="e.g., pi-check-circle"
                class="w-full"
              />
              <small class="text-gray-500">PrimeVue icon class</small>
            </div>

            <div>
              <label for="color" class="block text-sm font-semibold text-zaccBlack mb-2">
                Color
              </label>
              <Dropdown
                id="color"
                v-model="statisticForm.color"
                :options="colorOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select color"
                class="w-full"
                showClear
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="order" class="block text-sm font-semibold text-zaccBlack mb-2">
                Order
              </label>
              <InputNumber
                id="order"
                v-model="statisticForm.order"
                :min="0"
                class="w-full"
              />
              <small class="text-gray-500">Display order (lower numbers appear first)</small>
            </div>

            <div class="flex items-center gap-2 pt-6">
              <Checkbox
                id="isVisible"
                v-model="statisticForm.isVisible"
                :binary="true"
              />
              <label for="isVisible" class="text-sm font-semibold text-zaccBlack">
                Visible
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
  title: 'Statistics Management - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'Manage statistics displayed on the website'
    }
  ]
})

definePageMeta({
  middleware: 'admin'
})

const confirm = useConfirm()
const toast = useToast()

// State
const statistics = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const selectedSection = ref<string | null>(null)
const selectedVisibility = ref<string | null>(null)
const selectedYear = ref<number | null>(null)
const filters = ref({
  global: { value: null, matchMode: 'contains' }
})

const statisticForm = reactive({
  id: '',
  label: '',
  value: 0,
  prefix: '',
  suffix: '',
  icon: '',
  color: null as string | null,
  order: 0,
  isVisible: true,
  section: 'homepage',
  year: new Date().getFullYear()
})

const errors = reactive({
  label: '',
  value: '',
  section: ''
})

const sectionOptions = [
  { label: 'All', value: null },
  { label: 'Homepage', value: 'homepage' },
  { label: 'About', value: 'about' },
  { label: 'Statistics page', value: 'statistics' },
  { label: 'Other', value: 'other' }
]

const sectionSuggestions = ref<string[]>([])
const commonSections = ['homepage', 'about', 'statistics', 'other']

const searchSection = (event: any) => {
  const query = event.query.toLowerCase()
  if (!query) {
    sectionSuggestions.value = commonSections
  } else {
    sectionSuggestions.value = commonSections.filter(section => 
      section.toLowerCase().includes(query)
    )
    // If the query doesn't match any common section, add it as a suggestion
    if (!commonSections.some(s => s.toLowerCase() === query)) {
      sectionSuggestions.value.push(query)
    }
  }
}

const visibilityOptions = [
  { label: 'All', value: null },
  { label: 'Visible', value: 'true' },
  { label: 'Hidden', value: 'false' }
]

const colorOptions = [
  { label: 'Green', value: 'green' },
  { label: 'Gold', value: 'gold' },
  { label: 'Black', value: 'black' },
  { label: 'Blue', value: 'blue' },
  { label: 'Red', value: 'red' },
  { label: 'Purple', value: 'purple' },
  { label: 'Orange', value: 'orange' }
]

// Helper functions
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num)
}

const formatSection = (section: string) => {
  return section.charAt(0).toUpperCase() + section.slice(1)
}

const getColorClass = (color: string) => {
  const colorMap: Record<string, string> = {
    green: 'bg-green-500',
    gold: 'bg-yellow-500',
    black: 'bg-gray-900',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  }
  return colorMap[color] || 'bg-gray-500'
}

const clearErrors = () => {
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })
}

const validateForm = () => {
  clearErrors()
  let isValid = true

  if (!statisticForm.label.trim()) {
    errors.label = 'Label is required'
    isValid = false
  }

  if (statisticForm.value < 0) {
    errors.value = 'Value must be a non-negative integer'
    isValid = false
  }

  if (!statisticForm.section) {
    errors.section = 'Section is required'
    isValid = false
  }

  if (!statisticForm.year || statisticForm.year < 2000 || statisticForm.year > 2100) {
    isValid = false
  }

  return isValid
}

// Fetch statistics
const fetchStatistics = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedSection.value) {
      params.section = selectedSection.value
    }
    if (selectedVisibility.value !== null) {
      params.isVisible = selectedVisibility.value
    }
    if (selectedYear.value !== null && selectedYear.value !== undefined) {
      params.year = selectedYear.value
    }

    const data = await $fetch('/api/statistics', { params })
    statistics.value = data
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load statistics',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Dialog handlers
const openCreateDialog = () => {
  isEditMode.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (statistic: any) => {
  isEditMode.value = true
  statisticForm.id = statistic.id
  statisticForm.label = statistic.label
  statisticForm.value = statistic.value
  statisticForm.prefix = statistic.prefix || ''
  statisticForm.suffix = statistic.suffix || ''
  statisticForm.icon = statistic.icon || ''
  statisticForm.color = statistic.color
  statisticForm.order = statistic.order
  statisticForm.isVisible = statistic.isVisible
  statisticForm.section = statistic.section
  statisticForm.year = statistic.year ?? new Date().getFullYear()
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  resetForm()
  clearErrors()
}

const resetForm = () => {
  statisticForm.id = ''
  statisticForm.label = ''
  statisticForm.value = 0
  statisticForm.prefix = ''
  statisticForm.suffix = ''
  statisticForm.icon = ''
  statisticForm.color = null
  statisticForm.order = 0
  statisticForm.isVisible = true
  statisticForm.section = 'homepage'
  statisticForm.year = new Date().getFullYear()
}

// Submit handler
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  submitting.value = true
  try {
    const payload: any = {
      label: statisticForm.label,
      value: statisticForm.value,
      prefix: statisticForm.prefix || undefined,
      suffix: statisticForm.suffix || undefined,
      icon: statisticForm.icon || undefined,
      color: statisticForm.color || undefined,
      order: statisticForm.order,
      isVisible: statisticForm.isVisible,
      section: statisticForm.section,
      year: statisticForm.year
    }

    if (isEditMode.value) {
      await $fetch(`/api/statistics/${statisticForm.id}`, {
        method: 'PUT',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Statistic updated successfully',
        life: 3000
      })
    } else {
      await $fetch('/api/statistics', {
        method: 'POST',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Statistic created successfully',
        life: 3000
      })
    }

    await fetchStatistics()
    closeDialog()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to save statistic',
      life: 3000
    })
  } finally {
    submitting.value = false
  }
}

// Delete handler
const handleDelete = (statistic: any) => {
  confirm.require({
    message: `Are you sure you want to delete "${statistic.label}"? This action cannot be undone.`,
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
        await $fetch(`/api/statistics/${statistic.id}`, {
          method: 'DELETE'
        })
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Statistic deleted successfully',
          life: 3000
        })
        await fetchStatistics()
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.data?.message || 'Failed to delete statistic',
          life: 3000
        })
      }
    }
  })
}

const clearFilters = () => {
  selectedSection.value = null
  selectedVisibility.value = null
  selectedYear.value = null
  fetchStatistics()
}

// Lifecycle
onMounted(() => {
  fetchStatistics()
})
</script>

