<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- Page Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Corruption Reports</h1>
          <p class="mt-2 text-gray-600">Manage and track corruption reports</p>
        </div>
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
                @change="fetchReports"
              />
            </div>
            <div class="flex items-center gap-2">
              <label for="priorityFilter" class="text-sm font-semibold text-zaccBlack whitespace-nowrap">
                Priority:
              </label>
              <Dropdown
                id="priorityFilter"
                v-model="selectedPriority"
                :options="priorityOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All Priorities"
                class="w-48"
                @change="fetchReports"
              />
            </div>
            <div class="flex items-center gap-2">
              <label for="typeFilter" class="text-sm font-semibold text-zaccBlack whitespace-nowrap">
                Type:
              </label>
              <Dropdown
                id="typeFilter"
                v-model="selectedType"
                :options="typeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All Types"
                class="w-48"
                @change="fetchReports"
              />
            </div>
            <Button
              v-if="selectedStatus || selectedPriority || selectedType"
              label="Clear Filters"
              icon="pi pi-times"
              severity="secondary"
              outlined
              @click="clearFilters"
            />
          </div>
        </template>
      </Card>

      <!-- Reports Table -->
      <Card class="border-0 shadow-md">
        <template #content>
          <DataTable
            v-model:filters="filters"
            :value="reports"
            :loading="loading"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            :globalFilterFields="['reportNumber', 'corruptionType', 'location', 'incidentDescription']"
            dataKey="id"
            stripedRows
            class="text-sm"
          >
            <template #header>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xl font-semibold text-zaccBlack">All Reports</span>
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText
                    v-model="filters.global.value"
                    placeholder="Search reports..."
                    class="w-64"
                  />
                </span>
              </div>
            </template>

            <Column field="reportNumber" header="Report #" sortable>
              <template #body="{ data }">
                <span class="font-mono text-xs">{{ data.reportNumber.substring(0, 8) }}...</span>
              </template>
            </Column>

            <Column field="corruptionType" header="Type" sortable>
              <template #body="{ data }">
                <span class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                  {{ formatCorruptionType(data.corruptionType) }}
                </span>
              </template>
            </Column>

            <Column field="location" header="Location" sortable />

            <Column field="status" header="Status" sortable>
              <template #body="{ data }">
                <Tag
                  :value="formatStatus(data.status)"
                  :severity="getStatusSeverity(data.status)"
                />
              </template>
            </Column>

            <Column field="priority" header="Priority" sortable>
              <template #body="{ data }">
                <Tag
                  :value="data.priority"
                  :severity="getPrioritySeverity(data.priority)"
                />
              </template>
            </Column>

            <Column field="isAnonymous" header="Anonymous" sortable>
              <template #body="{ data }">
                <Tag
                  :value="data.isAnonymous ? 'Yes' : 'No'"
                  :severity="data.isAnonymous ? 'secondary' : 'info'"
                />
              </template>
            </Column>

            <Column field="createdAt" header="Submitted" sortable>
              <template #body="{ data }">
                {{ formatDate(data.createdAt) }}
              </template>
            </Column>

            <Column field="_count.files" header="Files" sortable>
              <template #body="{ data }">
                <span class="font-semibold">{{ data._count?.files || 0 }}</span>
              </template>
            </Column>

            <Column header="Actions" :exportable="false" style="min-width: 80px">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <Button
                    icon="pi pi-eye"
                    severity="info"
                    rounded
                    text
                    @click="openViewDialog(data)"
                    v-tooltip.top="'View Details'"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- View Report Dialog -->
      <Dialog
        v-model:visible="viewDialogVisible"
        header="Report Details"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '1000px' }"
        :closable="true"
      >
        <div v-if="viewingReport" class="space-y-6">
          <!-- Report Number and Status -->
          <div class="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 class="text-lg font-bold text-zaccBlack">Report #{{ viewingReport.reportNumber }}</h3>
              <p class="text-sm text-gray-500">Submitted: {{ formatDateTime(viewingReport.createdAt) }}</p>
            </div>
            <div class="flex items-center gap-2">
              <Tag
                :value="formatStatus(viewingReport.status)"
                :severity="getStatusSeverity(viewingReport.status)"
              />
              <Tag
                :value="viewingReport.priority"
                :severity="getPrioritySeverity(viewingReport.priority)"
              />
            </div>
          </div>

          <!-- Contact Information -->
          <div>
            <h4 class="font-semibold text-zaccBlack mb-2">Contact Information</h4>
            <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span class="text-sm text-gray-600">Anonymous:</span>
                <span class="ml-2 font-semibold">{{ viewingReport.isAnonymous ? 'Yes' : 'No' }}</span>
              </div>
              <div v-if="!viewingReport.isAnonymous">
                <span class="text-sm text-gray-600">Name:</span>
                <span class="ml-2 font-semibold">{{ viewingReport.name || 'N/A' }}</span>
              </div>
              <div v-if="!viewingReport.isAnonymous && viewingReport.email">
                <span class="text-sm text-gray-600">Email:</span>
                <span class="ml-2 font-semibold">{{ viewingReport.email }}</span>
              </div>
              <div v-if="!viewingReport.isAnonymous && viewingReport.phone">
                <span class="text-sm text-gray-600">Phone:</span>
                <span class="ml-2 font-semibold">{{ viewingReport.phone }}</span>
              </div>
              <div v-if="viewingReport.organization">
                <span class="text-sm text-gray-600">Organization:</span>
                <span class="ml-2 font-semibold">{{ viewingReport.organization }}</span>
              </div>
            </div>
          </div>

          <!-- Report Details -->
          <div>
            <h4 class="font-semibold text-zaccBlack mb-2">Report Details</h4>
            <div class="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <span class="text-sm text-gray-600">Corruption Type:</span>
                <span class="ml-2 font-semibold">{{ formatCorruptionType(viewingReport.corruptionType) }}</span>
              </div>
              <div>
                <span class="text-sm text-gray-600">Location:</span>
                <span class="ml-2 font-semibold">{{ viewingReport.location }}</span>
                <span v-if="viewingReport.province" class="ml-2 text-gray-500">({{ viewingReport.province }})</span>
              </div>
              <div v-if="viewingReport.incidentDate">
                <span class="text-sm text-gray-600">Incident Date:</span>
                <span class="ml-2 font-semibold">{{ formatDateTime(viewingReport.incidentDate) }}</span>
                <span v-if="viewingReport.incidentTime" class="ml-2 text-gray-500">{{ viewingReport.incidentTime }}</span>
              </div>
              <div>
                <span class="text-sm text-gray-600 font-semibold">Description:</span>
                <div class="mt-2 text-zaccBlack prose prose-sm max-w-none" v-html="viewingReport.incidentDescription"></div>
              </div>
              <div v-if="viewingReport.peopleInvolved">
                <span class="text-sm text-gray-600 font-semibold">People Involved:</span>
                <div class="mt-2 text-zaccBlack prose prose-sm max-w-none" v-html="viewingReport.peopleInvolved"></div>
              </div>
              <div v-if="viewingReport.additionalInfo">
                <span class="text-sm text-gray-600 font-semibold">Additional Information:</span>
                <div class="mt-2 text-zaccBlack prose prose-sm max-w-none" v-html="viewingReport.additionalInfo"></div>
              </div>
            </div>
          </div>

          <!-- Files -->
          <div v-if="viewingReport.files && viewingReport.files.length > 0">
            <h4 class="font-semibold text-zaccBlack mb-2">Attached Files</h4>
            <div class="space-y-2">
              <div
                v-for="file in viewingReport.files"
                :key="file.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div class="flex items-center gap-3">
                  <i :class="getFileIcon(file.fileType)" class="text-2xl text-gray-600"></i>
                  <div>
                    <div class="font-semibold text-zaccBlack">{{ file.fileName }}</div>
                    <div class="text-xs text-gray-500">{{ formatFileSize(file.fileSize) }}</div>
                  </div>
                </div>
                <Button
                  label="Download"
                  icon="pi pi-download"
                  severity="secondary"
                  outlined
                  size="small"
                  @click="downloadFile(file.fileUrl)"
                />
              </div>
            </div>
          </div>

          <!-- Status Updates -->
          <div v-if="viewingReport.updates && viewingReport.updates.length > 0">
            <h4 class="font-semibold text-zaccBlack mb-2">Status Updates</h4>
            <div class="space-y-3">
              <div
                v-for="update in viewingReport.updates"
                :key="update.id"
                class="p-4 bg-gray-50 rounded-lg border-l-4"
                :class="getStatusBorderColor(update.status)"
              >
                <div class="flex items-center justify-between mb-2">
                  <Tag
                    :value="formatStatus(update.status)"
                    :severity="getStatusSeverity(update.status)"
                  />
                  <span class="text-xs text-gray-500">{{ formatDateTime(update.createdAt) }}</span>
                </div>
                <p v-if="update.notes" class="text-sm text-zaccBlack mt-2 whitespace-pre-wrap">{{ update.notes }}</p>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      <!-- Edit Report Dialog -->
      <Dialog
        v-model:visible="editDialogVisible"
        header="Update Report Status"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '600px' }"
        :closable="true"
      >
        <form @submit.prevent="handleUpdate" class="space-y-4">
          <div>
            <label for="status" class="block text-sm font-semibold text-zaccBlack mb-2">
              Status <span class="text-red-500">*</span>
            </label>
            <Dropdown
              id="status"
              v-model="updateForm.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select status"
              class="w-full"
              :class="{ 'p-invalid': errors.status }"
            />
            <small v-if="errors.status" class="p-error">{{ errors.status }}</small>
          </div>

          <div>
            <label for="priority" class="block text-sm font-semibold text-zaccBlack mb-2">
              Priority
            </label>
            <Dropdown
              id="priority"
              v-model="updateForm.priority"
              :options="priorityOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select priority"
              class="w-full"
            />
          </div>

          <div>
            <label for="assignedTo" class="block text-sm font-semibold text-zaccBlack mb-2">
              Assign To
            </label>
            <Dropdown
              id="assignedTo"
              v-model="updateForm.assignedTo"
              :options="userOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select user"
              class="w-full"
              showClear
            />
          </div>

          <div>
            <label for="notes" class="block text-sm font-semibold text-zaccBlack mb-2">
              Notes
            </label>
            <Textarea
              id="notes"
              v-model="updateForm.notes"
              placeholder="Add notes about this status update..."
              :rows="4"
              class="w-full"
            />
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button
              label="Cancel"
              severity="secondary"
              outlined
              @click="closeEditDialog"
            />
            <Button
              type="submit"
              label="Update"
              :loading="updating"
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
  title: 'Corruption Reports - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'Manage and track corruption reports'
    }
  ]
})

definePageMeta({
  middleware: 'admin'
})

const confirm = useConfirm()
const toast = useToast()

// State
const reports = ref([])
const loading = ref(false)
const viewDialogVisible = ref(false)
const editDialogVisible = ref(false)
const viewingReport = ref<any>(null)
const updating = ref(false)
const selectedStatus = ref<string | null>(null)
const selectedPriority = ref<string | null>(null)
const selectedType = ref<string | null>(null)
const users = ref<any[]>([])
const filters = ref({
  global: { value: null, matchMode: 'contains' }
})

const updateForm = reactive({
  id: '',
  status: '',
  priority: '',
  assignedTo: null as string | null,
  notes: ''
})

const errors = reactive({
  status: ''
})

const statusOptions = [
  { label: 'All', value: null },
  { label: 'New', value: 'NEW' },
  { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
  { label: 'Under Investigation', value: 'UNDER_INVESTIGATION' },
  { label: 'Referred to Prosecution', value: 'REFERRED_TO_PROSECUTION' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Archived', value: 'ARCHIVED' }
]

const priorityOptions = [
  { label: 'All', value: null },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' }
]

const typeOptions = [
  { label: 'All', value: null },
  { label: 'Bribery', value: 'bribery' },
  { label: 'Embezzlement', value: 'embezzlement' },
  { label: 'Fraud', value: 'fraud' },
  { label: 'Nepotism', value: 'nepotism' },
  { label: 'Abuse of Power', value: 'abuse_of_power' },
  { label: 'Other', value: 'other' }
]

const userOptions = computed(() => {
  return users.value.map(user => ({
    label: `${user.name || user.email} (${user.role})`,
    value: user.id
  }))
})

// Helper functions
const formatDate = (date: string | Date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatDateTime = (date: string | Date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatCorruptionType = (type: string) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getStatusSeverity = (status: string) => {
  const severityMap: Record<string, string> = {
    NEW: 'info',
    ACKNOWLEDGED: 'warning',
    UNDER_INVESTIGATION: 'warning',
    REFERRED_TO_PROSECUTION: 'success',
    CLOSED: 'secondary',
    ARCHIVED: 'secondary'
  }
  return severityMap[status] || 'secondary'
}

const getPrioritySeverity = (priority: string) => {
  const severityMap: Record<string, string> = {
    LOW: 'secondary',
    MEDIUM: 'info',
    HIGH: 'warning',
    URGENT: 'danger'
  }
  return severityMap[priority] || 'secondary'
}

const getStatusBorderColor = (status: string) => {
  const colorMap: Record<string, string> = {
    NEW: 'border-blue-500',
    ACKNOWLEDGED: 'border-yellow-500',
    UNDER_INVESTIGATION: 'border-orange-500',
    REFERRED_TO_PROSECUTION: 'border-green-500',
    CLOSED: 'border-gray-500',
    ARCHIVED: 'border-gray-400'
  }
  return colorMap[status] || 'border-gray-300'
}

const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return 'pi pi-file-pdf'
  if (fileType.includes('image')) return 'pi pi-image'
  if (fileType.includes('word')) return 'pi pi-file-word'
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'pi pi-file-excel'
  return 'pi pi-file'
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const downloadFile = (url: string) => {
  window.open(url, '_blank')
}

// Fetch reports
const fetchReports = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedStatus.value) {
      params.status = selectedStatus.value
    }
    if (selectedPriority.value) {
      params.priority = selectedPriority.value
    }
    if (selectedType.value) {
      params.corruptionType = selectedType.value
    }

    const data = await $fetch('/api/reports', { params })
    reports.value = data
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load reports',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Fetch users
const fetchUsers = async () => {
  try {
    const data = await $fetch('/api/users')
    users.value = data.filter((user: any) => user.isActive)
  } catch (error: any) {
    console.error('Failed to load users:', error)
  }
}

// Dialog handlers
const openViewDialog = async (report: any) => {
  try {
    const data = await $fetch(`/api/reports/${report.id}`)
    viewingReport.value = data
    viewDialogVisible.value = true
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load report details',
      life: 3000
    })
  }
}

const openEditDialog = (report: any) => {
  updateForm.id = report.id
  updateForm.status = report.status
  updateForm.priority = report.priority
  updateForm.assignedTo = report.assignedTo
  updateForm.notes = ''
  errors.status = ''
  editDialogVisible.value = true
}

const closeEditDialog = () => {
  editDialogVisible.value = false
  updateForm.id = ''
  updateForm.status = ''
  updateForm.priority = ''
  updateForm.assignedTo = null
  updateForm.notes = ''
  errors.status = ''
}

// Update handler
const handleUpdate = async () => {
  if (!updateForm.status) {
    errors.status = 'Status is required'
    return
  }

  updating.value = true
  try {
    const payload: any = {
      status: updateForm.status,
      priority: updateForm.priority,
      assignedTo: updateForm.assignedTo || null,
      notes: updateForm.notes || null
    }

    await $fetch(`/api/reports/${updateForm.id}`, {
      method: 'PUT',
      body: payload
    })

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Report updated successfully',
      life: 3000
    })

    await fetchReports()
    closeEditDialog()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to update report',
      life: 3000
    })
  } finally {
    updating.value = false
  }
}

// Delete handler
const handleDelete = (report: any) => {
  confirm.require({
    message: `Are you sure you want to delete report #${report.reportNumber}? This action cannot be undone.`,
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
        await $fetch(`/api/reports/${report.id}`, {
          method: 'DELETE'
        })
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Report deleted successfully',
          life: 3000
        })
        await fetchReports()
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.data?.message || 'Failed to delete report',
          life: 3000
        })
      }
    }
  })
}

const clearFilters = () => {
  selectedStatus.value = null
  selectedPriority.value = null
  selectedType.value = null
  fetchReports()
}

// Lifecycle
onMounted(() => {
  fetchReports()
  fetchUsers()
})
</script>

<style scoped>
.prose {
  word-break: break-word;
  overflow-wrap: break-word;
}

.prose :deep(p) {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.prose :deep(ul),
.prose :deep(ol) {
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
}

.prose :deep(li) {
  margin-bottom: 0.25rem;
}

.prose :deep(strong) {
  font-weight: 600;
}

.prose :deep(em) {
  font-style: italic;
}

.prose :deep(a) {
  color: #209341;
  text-decoration: underline;
}

.prose :deep(a:hover) {
  color: #1a7a33;
}
</style>

