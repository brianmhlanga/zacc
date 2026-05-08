<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- Page Header -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Corruption Reports</h1>
          <p class="mt-2 text-gray-600">Manage and track corruption reports</p>
        </div>
        <NuxtLink to="/admin/analytics">
          <Button
            label="Report analytics"
            icon="pi pi-chart-line"
            outlined
            severity="secondary"
            class="w-full sm:w-auto"
          />
        </NuxtLink>
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
            <div class="flex items-center gap-2">
              <label for="archiveListFilter" class="text-sm font-semibold text-zaccBlack whitespace-nowrap">
                List:
              </label>
              <Dropdown
                id="archiveListFilter"
                v-model="archiveListFilter"
                :options="archiveListOptions"
                option-label="label"
                option-value="value"
                class="w-52"
                @change="fetchReports"
              />
            </div>
            <Button
              v-if="selectedStatus || selectedPriority || selectedType || archiveListFilter !== 'active'"
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
                <span class="text-xl font-semibold text-zaccBlack">
                  {{ archiveListFilter === 'archived' ? 'Archived reports' : 'Active reports' }}
                </span>
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
                  :value="formatReportStatus(data.status, data.customStatus)"
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

            <Column header="Actions" :exportable="false" style="min-width: 240px">
              <template #body="{ data }">
                <div class="flex flex-wrap items-center gap-1">
                  <Button
                    icon="pi pi-eye"
                    severity="info"
                    rounded
                    text
                    @click="openViewDialog(data)"
                    v-tooltip.top="'View Details'"
                  />
                  <Button
                    icon="pi pi-file-pdf"
                    severity="secondary"
                    rounded
                    text
                    :loading="pdfLoadingId === data.id"
                    @click.stop="downloadReportPdf(data.id, data.reportNumber)"
                    v-tooltip.top="'Download PDF'"
                  />
                  <Button
                    v-if="archiveListFilter === 'active' && !data.isArchived"
                    icon="pi pi-inbox"
                    severity="secondary"
                    rounded
                    text
                    :loading="archivingId === data.id"
                    @click="confirmArchiveReport(data)"
                    v-tooltip.top="'Archive (hide from main list)'"
                  />
                  <Button
                    v-if="archiveListFilter === 'archived'"
                    icon="pi pi-replay"
                    severity="success"
                    rounded
                    text
                    :loading="archivingId === data.id"
                    @click="confirmRestoreReport(data)"
                    v-tooltip.top="'Restore to active list'"
                  />
                  <Button
                    icon="pi pi-pencil"
                    severity="warning"
                    rounded
                    text
                    @click="openEditDialog(data)"
                    v-tooltip.top="'Update Status'"
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
            <div class="flex flex-wrap items-center gap-2">
              <Tag
                :value="formatReportStatus(viewingReport.status, viewingReport.customStatus)"
                :severity="getStatusSeverity(viewingReport.status)"
              />
              <Tag
                v-if="viewingReport.isArchived"
                value="List archived"
                severity="secondary"
              />
              <Tag
                :value="viewingReport.priority"
                :severity="getPrioritySeverity(viewingReport.priority)"
              />
              <Button
                v-if="archiveListFilter === 'active' && !viewingReport.isArchived"
                label="Archive"
                icon="pi pi-inbox"
                size="small"
                severity="secondary"
                outlined
                :loading="archivingId === viewingReport.id"
                @click="confirmArchiveReport(viewingReport)"
                v-tooltip.top="'Hide from main list (still in Archived view)'"
              />
              <Button
                v-if="viewingReport.isArchived"
                label="Restore"
                icon="pi pi-replay"
                size="small"
                severity="success"
                outlined
                :loading="archivingId === viewingReport.id"
                @click="confirmRestoreReport(viewingReport)"
                v-tooltip.top="'Return to active reports list'"
              />
              <Button
                icon="pi pi-file-pdf"
                severity="secondary"
                rounded
                outlined
                size="small"
                label="Download PDF"
                :loading="pdfLoadingId === viewingReport.id"
                @click="downloadReportPdf(viewingReport.id, viewingReport.reportNumber)"
                v-tooltip.top="'Download report as PDF'"
              />
              <Button
                icon="pi pi-pencil"
                severity="warning"
                rounded
                outlined
                size="small"
                label="Update Status"
                @click="openEditDialogFromView(viewingReport)"
                v-tooltip.top="'Update Status'"
              />
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 pb-4 border-b border-gray-200">
            <span class="text-sm font-semibold text-zaccBlack w-full sm:w-auto">Quick status</span>
            <Button
              v-for="opt in quickStatusOptions"
              :key="opt.value"
              :label="opt.label"
              size="small"
              severity="secondary"
              outlined
              :disabled="viewingReport.status === opt.value || quickUpdating"
              @click="applyQuickStatus(viewingReport, opt.value)"
            />
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
                <div class="mt-2 space-y-2">
                  <div
                    v-for="(person, idx) in parsedPeopleInvolved"
                    :key="idx"
                    class="rounded-lg border border-zaccBlack/10 bg-white p-3"
                  >
                    <div class="font-semibold text-zaccBlack">
                      {{ person.name || `Person ${idx + 1}` }}
                    </div>
                    <div class="mt-1 text-sm text-zaccBlack/70 space-y-1">
                      <div v-if="person.position"><span class="font-semibold">Position:</span> {{ person.position }}</div>
                      <div v-if="person.organization"><span class="font-semibold">Organization:</span> {{ person.organization }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="viewingReport.additionalInfo">
                <span class="text-sm text-gray-600 font-semibold">Additional Information:</span>
                <div class="mt-2 text-zaccBlack prose prose-sm max-w-none" v-html="viewingReport.additionalInfo"></div>
              </div>
            </div>
          </div>

          <!-- Voice note -->
          <div v-if="viewingReport.audioUrl" class="mb-4">
            <h4 class="font-semibold text-zaccBlack mb-2">Voice note</h4>
            <audio
              :src="resolveFileUrl(viewingReport.audioUrl)"
              controls
              class="w-full max-w-lg"
              preload="metadata"
            />
            <div class="mt-2">
              <Button
                label="Open / download"
                icon="pi pi-download"
                size="small"
                outlined
                @click="downloadFile(viewingReport.audioUrl)"
              />
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
                    :value="formatReportStatus(update.status, update.customStatus)"
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
              :options="editStatusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select status"
              class="w-full"
              :class="{ 'p-invalid': errors.status }"
            />
            <small v-if="errors.status" class="p-error">{{ errors.status }}</small>
          </div>

          <div v-if="updateForm.status === 'CUSTOM'">
            <label for="customStatus" class="block text-sm font-semibold text-zaccBlack mb-2">
              Custom status label <span class="text-red-500">*</span>
            </label>
            <InputText
              id="customStatus"
              v-model="updateForm.customStatus"
              placeholder="e.g. Awaiting witness statement"
              class="w-full"
              maxlength="200"
              :class="{ 'p-invalid': errors.customStatus }"
            />
            <small v-if="errors.customStatus" class="p-error">{{ errors.customStatus }}</small>
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
              v-if="canAssignUsers"
              id="assignedTo"
              v-model="updateForm.assignedTo"
              :options="userOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select user"
              class="w-full"
              showClear
            />
            <p v-else class="text-sm text-gray-500">Assignment is managed by full administrators.</p>
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
const { user, fetch: fetchSession } = useUserSession()

const canAssignUsers = computed(() => user.value?.role !== 'REPORTS_ADMIN')
const quickUpdating = ref(false)
const pdfLoadingId = ref<string | null>(null)
const archivingId = ref<string | null>(null)
const archiveListFilter = ref<'active' | 'archived'>('active')
const archiveListOptions = [
  { label: 'Active reports', value: 'active' },
  { label: 'Archived reports', value: 'archived' }
]

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
  customStatus: '',
  priority: '',
  assignedTo: null as string | null,
  notes: ''
})

const errors = reactive({
  status: '',
  customStatus: ''
})

const statusOptions = [
  { label: 'All', value: null },
  { label: 'New', value: 'NEW' },
  { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
  { label: 'Under Investigation', value: 'UNDER_INVESTIGATION' },
  { label: 'Referred to Prosecution', value: 'REFERRED_TO_PROSECUTION' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Archived', value: 'ARCHIVED' },
  { label: 'Custom status', value: 'CUSTOM' }
]

// Status options for editing (without "All")
const editStatusOptions = [
  { label: 'New', value: 'NEW' },
  { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
  { label: 'Under Investigation', value: 'UNDER_INVESTIGATION' },
  { label: 'Referred to Prosecution', value: 'REFERRED_TO_PROSECUTION' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Archived', value: 'ARCHIVED' },
  { label: 'Custom status', value: 'CUSTOM' }
]

/** Preset workflow statuses only — custom must be set from the update dialog with a label. */
const quickStatusOptions = computed(() =>
  editStatusOptions.filter((o) => o.value !== 'CUSTOM')
)

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

const formatReportStatus = (status: string, customStatus?: string | null) => {
  if (status === 'CUSTOM' && customStatus?.trim()) {
    return customStatus.trim()
  }
  return formatStatus(status)
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
    ARCHIVED: 'secondary',
    CUSTOM: 'info'
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
    ARCHIVED: 'border-gray-400',
    CUSTOM: 'border-violet-500'
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

const resolveFileUrl = (url: string | null | undefined) => {
  if (!url) return '#'
  if (url.startsWith('/api/')) return url
  if (url.startsWith('/uploads/')) return `/api${url}`
  if (!url.startsWith('/')) return `/api/uploads/${url}`
  return `/api${url}`
}

const downloadFile = (url: string) => {
  window.open(resolveFileUrl(url), '_blank')
}

async function downloadReportPdf(reportId: string, reportNumber?: string) {
  pdfLoadingId.value = reportId
  try {
    const blob = await $fetch<Blob>(`/api/reports/${reportId}/pdf`, {
      responseType: 'blob'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const base = (reportNumber || reportId).replace(/[^a-zA-Z0-9-_]+/g, '_')
    a.download = `ZACC-report-${base}.pdf`
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'PDF download failed',
      detail: error?.data?.message || error?.message || 'Could not generate PDF',
      life: 4000
    })
  } finally {
    pdfLoadingId.value = null
  }
}

const parsePeopleInvolved = (raw: string) => {
  if (!raw) return []
  const cleaned = raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return []

  const normalized = cleaned.replace(/(\d+\.)/g, '\n$1').trim()
  const chunks = normalized
    .split('\n')
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)

  const source = chunks.length ? chunks : [cleaned]
  return source.map((line) => {
    const parts = line.split('|').map((p) => p.trim()).filter(Boolean)
    const item: { name: string; position: string; organization: string } = {
      name: '',
      position: '',
      organization: ''
    }

    parts.forEach((part, idx) => {
      const lower = part.toLowerCase()
      if (lower.startsWith('position:')) {
        item.position = part.slice(part.indexOf(':') + 1).trim()
      } else if (lower.startsWith('organization:')) {
        item.organization = part.slice(part.indexOf(':') + 1).trim()
      } else if (idx === 0) {
        item.name = part
      } else {
        item.name = item.name ? `${item.name} ${part}`.trim() : part
      }
    })

    return item
  })
}

const parsedPeopleInvolved = computed(() => {
  return parsePeopleInvolved(viewingReport.value?.peopleInvolved || '')
})

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
    if (archiveListFilter.value === 'archived') {
      params.archived = 'true'
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
  updateForm.customStatus = report.customStatus?.trim() ? report.customStatus : ''
  updateForm.priority = report.priority
  updateForm.assignedTo = report.assignedTo
  updateForm.notes = ''
  errors.status = ''
  errors.customStatus = ''
  editDialogVisible.value = true
}

const openEditDialogFromView = (report: any) => {
  openEditDialog(report)
  viewDialogVisible.value = false
}

const closeEditDialog = () => {
  editDialogVisible.value = false
  updateForm.id = ''
  updateForm.status = ''
  updateForm.customStatus = ''
  updateForm.priority = ''
  updateForm.assignedTo = null
  updateForm.notes = ''
  errors.status = ''
  errors.customStatus = ''
}

// Update handler
const handleUpdate = async () => {
  errors.status = ''
  errors.customStatus = ''
  if (!updateForm.status) {
    errors.status = 'Status is required'
    return
  }
  if (updateForm.status === 'CUSTOM' && !updateForm.customStatus?.trim()) {
    errors.customStatus = 'Enter a label for this custom status'
    return
  }

  updating.value = true
  const reportId = updateForm.id
  try {
    const payload: any = {
      status: updateForm.status,
      priority: updateForm.priority,
      assignedTo: updateForm.assignedTo || null,
      notes: updateForm.notes || null
    }
    if (updateForm.status === 'CUSTOM') {
      payload.customStatus = updateForm.customStatus.trim()
    } else {
      payload.customStatus = null
    }

    await $fetch(`/api/reports/${reportId}`, {
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

    if (viewingReport.value?.id === reportId) {
      try {
        const data = await $fetch(`/api/reports/${reportId}`)
        viewingReport.value = data
      } catch (error: any) {
        console.error('Failed to refresh report:', error)
      }
    }
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
  archiveListFilter.value = 'active'
  fetchReports()
}

const confirmArchiveReport = (report: any) => {
  const num = report.reportNumber ? `${String(report.reportNumber).substring(0, 8)}…` : report.id
  confirm.require({
    message: `Archive report #${num}? It will be removed from the active list but you can open Archived reports to find it.`,
    header: 'Archive report',
    icon: 'pi pi-inbox',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Archive', severity: 'secondary' },
    accept: () => setReportArchived(report, true)
  })
}

const confirmRestoreReport = (report: any) => {
  confirm.require({
    message: 'Restore this report to the active list?',
    header: 'Restore report',
    icon: 'pi pi-replay',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Restore', severity: 'success' },
    accept: () => setReportArchived(report, false)
  })
}

const setReportArchived = async (report: any, isArchived: boolean) => {
  if (!report?.id) return
  archivingId.value = report.id
  try {
    await $fetch(`/api/reports/${report.id}`, {
      method: 'PUT',
      body: { isArchived }
    })
    toast.add({
      severity: 'success',
      summary: isArchived ? 'Archived' : 'Restored',
      detail: isArchived ? 'Report hidden from active list.' : 'Report is back on the active list.',
      life: 3000
    })
    await fetchReports()
    if (viewingReport.value?.id === report.id) {
      try {
        viewingReport.value = await $fetch(`/api/reports/${report.id}`)
      } catch {
        viewDialogVisible.value = false
      }
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || error.message || 'Request failed',
      life: 4000
    })
  } finally {
    archivingId.value = null
  }
}

const applyQuickStatus = async (report: any, status: string) => {
  if (!report?.id || report.status === status) return
  quickUpdating.value = true
  try {
    await $fetch(`/api/reports/${report.id}`, {
      method: 'PUT',
      body: {
        status,
        notes: `Status set to ${formatReportStatus(status, null)}`
      }
    })
    toast.add({
      severity: 'success',
      summary: 'Updated',
      detail: 'Report status updated',
      life: 3000
    })
    await fetchReports()
    const data = await $fetch(`/api/reports/${report.id}`)
    viewingReport.value = data
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to update status',
      life: 3000
    })
  } finally {
    quickUpdating.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await fetchSession()
  await fetchReports()
  if (canAssignUsers.value) {
    await fetchUsers()
  }
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

