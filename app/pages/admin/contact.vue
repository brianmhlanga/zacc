<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- Page Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Contact Submissions</h1>
          <p class="mt-2 text-gray-600">Manage and respond to contact form submissions</p>
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
                @change="fetchSubmissions"
              />
            </div>
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
                placeholder="All categories"
                class="w-48"
                @change="fetchSubmissions"
              />
            </div>
            <Button
              v-if="selectedStatus || selectedCategory"
              label="Clear Filters"
              icon="pi pi-times"
              severity="secondary"
              outlined
              @click="clearFilters"
            />
          </div>
        </template>
      </Card>

      <!-- Submissions Table -->
      <Card class="border-0 shadow-md">
        <template #content>
          <DataTable
            v-model:filters="filters"
            :value="submissions"
            :loading="loading"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            :globalFilterFields="['name', 'email', 'subject', 'message', 'category']"
            dataKey="id"
            stripedRows
            class="text-sm"
          >
            <template #header>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xl font-semibold text-zaccBlack">All Submissions</span>
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText
                    v-model="filters.global.value"
                    placeholder="Search submissions..."
                    class="w-64"
                  />
                </span>
              </div>
            </template>

            <Column field="name" header="Name" sortable>
              <template #body="{ data }">
                <div>
                  <div class="font-semibold text-zaccBlack">{{ data.isAnonymous ? 'Anonymous' : data.name }}</div>
                  <div v-if="!data.isAnonymous && data.email" class="text-xs text-gray-500">
                    {{ data.email }}
                  </div>
                </div>
              </template>
            </Column>

            <Column field="category" header="Category" sortable>
              <template #body="{ data }">
                <Tag :value="formatCategory(data.category)" severity="secondary" />
              </template>
            </Column>

            <Column field="subject" header="Subject" sortable>
              <template #body="{ data }">
                <div class="max-w-md">
                  <div class="font-semibold text-zaccBlack">{{ data.subject }}</div>
                  <div class="text-xs text-gray-500 truncate mt-1">
                    {{ truncateText(data.message, 60) }}
                  </div>
                </div>
              </template>
            </Column>

            <Column field="phone" header="Phone">
              <template #body="{ data }">
                <span v-if="data.phone">{{ data.phone }}</span>
                <span v-else class="text-gray-400">-</span>
              </template>
            </Column>

            <Column field="status" header="Status" sortable>
              <template #body="{ data }">
                <Tag
                  :value="formatStatus(data.status)"
                  :severity="getStatusSeverity(data.status)"
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

            <Column field="respondedAt" header="Responded" sortable>
              <template #body="{ data }">
                <span v-if="data.respondedAt">{{ formatDate(data.respondedAt) }}</span>
                <span v-else class="text-gray-400">-</span>
              </template>
            </Column>

            <Column header="Actions" :exportable="false" style="min-width: 150px">
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
                  <Button
                    icon="pi pi-reply"
                    severity="success"
                    rounded
                    text
                    :disabled="data.isAnonymous || !data.email"
                    @click="handleRespond(data)"
                    v-tooltip.top="data.isAnonymous || !data.email ? 'Cannot respond to anonymous submissions' : 'Respond via Email'"
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

      <!-- View Submission Dialog -->
      <Dialog
        v-model:visible="viewDialogVisible"
        header="Submission Details"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '800px' }"
        :closable="true"
      >
        <div v-if="viewingSubmission" class="space-y-6">
          <!-- Header -->
          <div class="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 class="text-lg font-bold text-zaccBlack">Contact Submission</h3>
              <p class="text-sm text-gray-500">Submitted: {{ formatDateTime(viewingSubmission.createdAt) }}</p>
              <p v-if="viewingSubmission.category" class="text-sm mt-1">
                <span class="text-gray-600">Category:</span>
                <Tag :value="formatCategory(viewingSubmission.category)" severity="info" class="ml-2" />
              </p>
            </div>
            <Tag
              :value="formatStatus(viewingSubmission.status)"
              :severity="getStatusSeverity(viewingSubmission.status)"
            />
          </div>

          <!-- Contact Information -->
          <div>
            <h4 class="font-semibold text-zaccBlack mb-2">Contact Information</h4>
            <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span class="text-sm text-gray-600">Name:</span>
                <span class="ml-2 font-semibold">{{ viewingSubmission.isAnonymous ? 'Anonymous' : viewingSubmission.name }}</span>
              </div>
              <div v-if="!viewingSubmission.isAnonymous">
                <span class="text-sm text-gray-600">Email:</span>
                <span class="ml-2 font-semibold">{{ viewingSubmission.email }}</span>
              </div>
              <div v-if="viewingSubmission.phone">
                <span class="text-sm text-gray-600">Phone:</span>
                <span class="ml-2 font-semibold">{{ viewingSubmission.phone }}</span>
              </div>
              <div>
                <span class="text-sm text-gray-600">Anonymous:</span>
                <span class="ml-2 font-semibold">{{ viewingSubmission.isAnonymous ? 'Yes' : 'No' }}</span>
              </div>
            </div>
          </div>

          <!-- Message -->
          <div>
            <h4 class="font-semibold text-zaccBlack mb-2">Message</h4>
            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="mb-3">
                <span class="text-sm text-gray-600 font-semibold">Subject:</span>
                <p class="mt-1 text-zaccBlack font-semibold">{{ viewingSubmission.subject }}</p>
              </div>
              <div>
                <span class="text-sm text-gray-600 font-semibold">Message:</span>
                <div class="mt-2 text-zaccBlack prose prose-sm max-w-none" v-html="viewingSubmission.message"></div>
              </div>
            </div>
          </div>

          <!-- Response -->
          <div v-if="viewingSubmission.response">
            <h4 class="font-semibold text-zaccBlack mb-2">Response</h4>
            <div class="p-4 bg-green-50 rounded-lg border border-green-200">
              <div class="mb-2">
                <span class="text-sm text-gray-600">Responded:</span>
                <span class="ml-2 font-semibold">{{ formatDateTime(viewingSubmission.respondedAt) }}</span>
              </div>
              <div class="text-zaccBlack prose prose-sm max-w-none" v-html="viewingSubmission.response"></div>
            </div>
          </div>
        </div>
      </Dialog>

      <!-- Response Dialog -->
      <Dialog
        v-model:visible="responseDialogVisible"
        header="Respond to Submission"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '700px' }"
        :closable="true"
      >
        <form @submit.prevent="handleResponse" class="space-y-4">
          <div>
            <label for="status" class="block text-sm font-semibold text-zaccBlack mb-2">
              Status <span class="text-red-500">*</span>
            </label>
            <Dropdown
              id="status"
              v-model="responseForm.status"
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
            <label for="response" class="block text-sm font-semibold text-zaccBlack mb-2">
              Response <span class="text-red-500">*</span>
            </label>
            <Textarea
              id="response"
              v-model="responseForm.response"
              placeholder="Enter your response to the submission..."
              :rows="8"
              class="w-full"
              :class="{ 'p-invalid': errors.response }"
            />
            <small v-if="errors.response" class="p-error">{{ errors.response }}</small>
            <small class="text-gray-500">This response will be sent to the submitter (if not anonymous).</small>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button
              label="Cancel"
              severity="secondary"
              outlined
              @click="closeResponseDialog"
            />
            <Button
              type="submit"
              label="Send Response"
              :loading="responding"
              icon="pi pi-send"
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
  title: 'Contact Submissions - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'Manage and respond to contact form submissions'
    }
  ]
})

definePageMeta({
  middleware: 'admin'
})

const confirm = useConfirm()
const toast = useToast()

// State
const submissions = ref([])
const loading = ref(false)
const viewDialogVisible = ref(false)
const responseDialogVisible = ref(false)
const viewingSubmission = ref<any>(null)
const responding = ref(false)
const selectedStatus = ref<string | null>(null)
const selectedCategory = ref<string | null>(null)
const filters = ref({
  global: { value: null, matchMode: 'contains' }
})

const responseForm = reactive({
  id: '',
  status: 'RESPONDED',
  response: ''
})

const errors = reactive({
  status: '',
  response: ''
})

const statusOptions = [
  { label: 'All', value: null },
  { label: 'New', value: 'NEW' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Responded', value: 'RESPONDED' },
  { label: 'Closed', value: 'CLOSED' }
]

const categoryOptions = [
  { label: 'All', value: null },
  { label: 'General', value: 'GENERAL' },
  { label: 'Complaint', value: 'COMPLAINT' },
  { label: 'Compliment', value: 'COMPLIMENT' },
  { label: 'Inquiry', value: 'INQUIRY' },
  { label: 'Other', value: 'OTHER' }
]

// Helper functions
const truncateText = (text: string, length: number) => {
  if (!text) return ''
  const plain = text.replace(/<[^>]*>/g, '')
  return plain.length > length ? plain.substring(0, length) + '...' : plain
}

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

const formatCategory = (cat: string) => {
  const labels: Record<string, string> = {
    GENERAL: 'General',
    COMPLAINT: 'Complaint',
    COMPLIMENT: 'Compliment',
    INQUIRY: 'Inquiry',
    OTHER: 'Other'
  }
  return labels[cat] || cat
}

const getStatusSeverity = (status: string) => {
  const severityMap: Record<string, string> = {
    NEW: 'info',
    IN_PROGRESS: 'warning',
    RESPONDED: 'success',
    CLOSED: 'secondary'
  }
  return severityMap[status] || 'secondary'
}

// Fetch submissions
const fetchSubmissions = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedStatus.value) {
      params.status = selectedStatus.value
    }
    if (selectedCategory.value) {
      params.category = selectedCategory.value
    }

    const data = await $fetch('/api/contact', { params })
    submissions.value = data
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load submissions',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Dialog handlers
const openViewDialog = async (submission: any) => {
  try {
    const data = await $fetch(`/api/contact/${submission.id}`)
    viewingSubmission.value = data
    viewDialogVisible.value = true
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load submission details',
      life: 3000
    })
  }
}

const handleRespond = (submission: any) => {
  if (submission.isAnonymous || !submission.email) {
    toast.add({
      severity: 'warn',
      summary: 'Cannot Respond',
      detail: 'This submission is anonymous or has no email address',
      life: 3000
    })
    return
  }

  // Create mailto link with subject and body
  const subject = encodeURIComponent(`Re: ${submission.subject}`)
  const body = encodeURIComponent(
    `Dear ${submission.name},\n\n` +
    `Thank you for contacting ZACC regarding: "${submission.subject}"\n\n` +
    `Your message:\n${submission.message}\n\n` +
    `Best regards,\nZACC Team`
  )
  const mailtoLink = `mailto:${submission.email}?subject=${subject}&body=${body}`
  
  // Open email client
  window.location.href = mailtoLink
}

const openResponseDialog = (submission: any) => {
  responseForm.id = submission.id
  responseForm.status = submission.status === 'RESPONDED' ? submission.status : 'RESPONDED'
  responseForm.response = submission.response || ''
  errors.status = ''
  errors.response = ''
  responseDialogVisible.value = true
}

const closeResponseDialog = () => {
  responseDialogVisible.value = false
  responseForm.id = ''
  responseForm.status = 'RESPONDED'
  responseForm.response = ''
  errors.status = ''
  errors.response = ''
}

// Response handler
const handleResponse = async () => {
  // Clear errors
  errors.status = ''
  errors.response = ''

  // Validate
  let isValid = true
  if (!responseForm.status) {
    errors.status = 'Status is required'
    isValid = false
  }
  if (!responseForm.response.trim()) {
    errors.response = 'Response is required'
    isValid = false
  }

  if (!isValid) {
    return
  }

  responding.value = true
  try {
    const payload: any = {
      status: responseForm.status,
      response: responseForm.response
    }

    await $fetch(`/api/contact/${responseForm.id}`, {
      method: 'PUT',
      body: payload
    })

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Response sent successfully',
      life: 3000
    })

    await fetchSubmissions()
    closeResponseDialog()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to send response',
      life: 3000
    })
  } finally {
    responding.value = false
  }
}

// Delete handler
const handleDelete = (submission: any) => {
  confirm.require({
    message: `Are you sure you want to delete this submission from ${submission.isAnonymous ? 'Anonymous' : submission.name}? This action cannot be undone.`,
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
        await $fetch(`/api/contact/${submission.id}`, {
          method: 'DELETE'
        })
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Submission deleted successfully',
          life: 3000
        })
        await fetchSubmissions()
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.data?.message || 'Failed to delete submission',
          life: 3000
        })
      }
    }
  })
}

const clearFilters = () => {
  selectedStatus.value = null
  selectedCategory.value = null
  fetchSubmissions()
}

// Lifecycle
onMounted(() => {
  fetchSubmissions()
})
</script>

