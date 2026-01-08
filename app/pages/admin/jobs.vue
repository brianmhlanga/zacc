<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- Page Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Jobs Management</h1>
          <p class="mt-2 text-gray-600">Manage job postings and applications</p>
        </div>
        <Button
          label="Add Job"
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
              <label for="departmentFilter" class="text-sm font-semibold text-zaccBlack whitespace-nowrap">
                Department:
              </label>
              <Dropdown
                id="departmentFilter"
                v-model="selectedDepartment"
                :options="departmentOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All Departments"
                class="w-48"
                @change="fetchJobs"
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
                @change="fetchJobs"
              />
            </div>
            <div class="flex items-center gap-2">
              <label for="activeFilter" class="text-sm font-semibold text-zaccBlack whitespace-nowrap">
                Active:
              </label>
              <Dropdown
                id="activeFilter"
                v-model="selectedActive"
                :options="activeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All"
                class="w-48"
                @change="fetchJobs"
              />
            </div>
            <Button
              v-if="selectedDepartment || selectedStatus !== null || selectedActive !== null"
              label="Clear Filters"
              icon="pi pi-times"
              severity="secondary"
              outlined
              @click="clearFilters"
            />
          </div>
        </template>
      </Card>

      <!-- Jobs Table -->
      <Card class="border-0 shadow-md">
        <template #content>
          <DataTable
            v-model:filters="filters"
            :value="jobs"
            :loading="loading"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            :globalFilterFields="['title', 'summary', 'location', 'department']"
            dataKey="id"
            stripedRows
            class="text-sm"
          >
            <template #header>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xl font-semibold text-zaccBlack">All Jobs</span>
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText
                    v-model="filters.global.value"
                    placeholder="Search jobs..."
                    class="w-64"
                  />
                </span>
              </div>
            </template>

            <Column field="title" header="Title" sortable>
              <template #body="{ data }">
                <div class="max-w-md">
                  <div class="font-semibold text-zaccBlack">{{ data.title }}</div>
                  <div class="text-xs text-gray-500 truncate mt-1">
                    {{ truncateText(data.summary, 80) }}
                  </div>
                </div>
              </template>
            </Column>

            <Column field="department" header="Department" sortable>
              <template #body="{ data }">
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                  {{ formatDepartment(data.department) }}
                </span>
              </template>
            </Column>

            <Column field="location" header="Location" sortable />

            <Column field="type" header="Type" sortable />

            <Column field="closingDate" header="Closing Date" sortable>
              <template #body="{ data }">
                {{ formatDate(data.closingDate) }}
              </template>
            </Column>

            <Column field="isPublished" header="Published" sortable>
              <template #body="{ data }">
                <Tag
                  :value="data.isPublished ? 'Yes' : 'No'"
                  :severity="data.isPublished ? 'success' : 'secondary'"
                />
              </template>
            </Column>

            <Column field="isActive" header="Active" sortable>
              <template #body="{ data }">
                <Tag
                  :value="data.isActive ? 'Yes' : 'No'"
                  :severity="data.isActive ? 'success' : 'danger'"
                />
              </template>
            </Column>

            <Column field="_count.applications" header="Applications" sortable>
              <template #body="{ data }">
                <span class="font-semibold">{{ data._count?.applications || 0 }}</span>
              </template>
            </Column>

            <Column header="Actions" :exportable="false" style="min-width: 200px">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <Button
                    icon="pi pi-users"
                    severity="success"
                    rounded
                    text
                    @click="viewApplications(data)"
                    v-tooltip.top="'View Applications'"
                    :disabled="!data._count?.applications || data._count.applications === 0"
                  />
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

      <!-- Create/Edit Job Dialog -->
      <Dialog
        v-model:visible="dialogVisible"
        :header="isEditMode ? 'Edit Job' : 'Create New Job'"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '900px' }"
        :closable="true"
      >
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="title" class="block text-sm font-semibold text-zaccBlack mb-2">
                Title <span class="text-red-500">*</span>
              </label>
              <InputText
                id="title"
                v-model="jobForm.title"
                placeholder="Job title"
                class="w-full"
                :class="{ 'p-invalid': errors.title }"
                @blur="generateSlug"
              />
              <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
            </div>

            <div>
              <label for="slug" class="block text-sm font-semibold text-zaccBlack mb-2">
                Slug <span class="text-red-500">*</span>
              </label>
              <InputText
                id="slug"
                v-model="jobForm.slug"
                placeholder="job-slug"
                class="w-full"
                :class="{ 'p-invalid': errors.slug }"
              />
              <small v-if="errors.slug" class="p-error">{{ errors.slug }}</small>
              <small class="text-gray-500">URL-friendly identifier</small>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label for="department" class="block text-sm font-semibold text-zaccBlack mb-2">
                Department <span class="text-red-500">*</span>
              </label>
              <Dropdown
                id="department"
                v-model="jobForm.department"
                :options="departmentOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select department"
                class="w-full"
                :class="{ 'p-invalid': errors.department }"
              />
              <small v-if="errors.department" class="p-error">{{ errors.department }}</small>
            </div>

            <div>
              <label for="location" class="block text-sm font-semibold text-zaccBlack mb-2">
                Location <span class="text-red-500">*</span>
              </label>
              <InputText
                id="location"
                v-model="jobForm.location"
                placeholder="e.g., Harare"
                class="w-full"
                :class="{ 'p-invalid': errors.location }"
              />
              <small v-if="errors.location" class="p-error">{{ errors.location }}</small>
            </div>

            <div>
              <label for="type" class="block text-sm font-semibold text-zaccBlack mb-2">
                Type <span class="text-red-500">*</span>
              </label>
              <Dropdown
                id="type"
                v-model="jobForm.type"
                :options="typeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select type"
                class="w-full"
                :class="{ 'p-invalid': errors.type }"
              />
              <small v-if="errors.type" class="p-error">{{ errors.type }}</small>
            </div>
          </div>

          <div>
            <label for="summary" class="block text-sm font-semibold text-zaccBlack mb-2">
              Summary <span class="text-red-500">*</span>
            </label>
            <Textarea
              id="summary"
              v-model="jobForm.summary"
              placeholder="Brief summary of the job"
              :rows="3"
              class="w-full"
              :class="{ 'p-invalid': errors.summary }"
            />
            <small v-if="errors.summary" class="p-error">{{ errors.summary }}</small>
          </div>

          <div>
            <label for="description" class="block text-sm font-semibold text-zaccBlack mb-2">
              Description <span class="text-red-500">*</span>
            </label>
            <Editor
              v-model="jobForm.description"
              editorStyle="height: 200px"
              :class="{ 'p-invalid': errors.description }"
            />
            <small v-if="errors.description" class="p-error">{{ errors.description }}</small>
          </div>

          <div>
            <label class="block text-sm font-semibold text-zaccBlack mb-2">
              Key Requirements <span class="text-red-500">*</span>
            </label>
            <div class="space-y-2">
              <div
                v-for="(req, index) in jobForm.keyRequirements"
                :key="index"
                class="flex items-center gap-2"
              >
                <InputText
                  v-model="jobForm.keyRequirements[index]"
                  placeholder="Enter requirement"
                  class="flex-1"
                />
                <Button
                  icon="pi pi-times"
                  severity="danger"
                  rounded
                  text
                  @click="removeRequirement(index)"
                  v-tooltip.top="'Remove'"
                />
              </div>
              <Button
                label="Add Requirement"
                icon="pi pi-plus"
                severity="secondary"
                outlined
                size="small"
                @click="addRequirement"
              />
            </div>
            <small v-if="errors.keyRequirements" class="p-error">{{ errors.keyRequirements }}</small>
          </div>

          <div>
            <label class="block text-sm font-semibold text-zaccBlack mb-2">
              Responsibilities <span class="text-red-500">*</span>
            </label>
            <div class="space-y-2">
              <div
                v-for="(resp, index) in jobForm.responsibilities"
                :key="index"
                class="flex items-center gap-2"
              >
                <InputText
                  v-model="jobForm.responsibilities[index]"
                  placeholder="Enter responsibility"
                  class="flex-1"
                />
                <Button
                  icon="pi pi-times"
                  severity="danger"
                  rounded
                  text
                  @click="removeResponsibility(index)"
                  v-tooltip.top="'Remove'"
                />
              </div>
              <Button
                label="Add Responsibility"
                icon="pi pi-plus"
                severity="secondary"
                outlined
                size="small"
                @click="addResponsibility"
              />
            </div>
            <small v-if="errors.responsibilities" class="p-error">{{ errors.responsibilities }}</small>
          </div>

          <div>
            <label for="benefits" class="block text-sm font-semibold text-zaccBlack mb-2">
              Benefits
            </label>
            <Textarea
              id="benefits"
              v-model="jobForm.benefits"
              placeholder="Job benefits and perks"
              :rows="3"
              class="w-full"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="closingDate" class="block text-sm font-semibold text-zaccBlack mb-2">
                Closing Date <span class="text-red-500">*</span>
              </label>
              <Calendar
                id="closingDate"
                v-model="jobForm.closingDate"
                dateFormat="yy-mm-dd"
                showTime
                hourFormat="24"
                class="w-full"
                :class="{ 'p-invalid': errors.closingDate }"
              />
              <small v-if="errors.closingDate" class="p-error">{{ errors.closingDate }}</small>
            </div>

            <div class="space-y-3 pt-6">
              <div class="flex items-center gap-2">
                <Checkbox
                  id="isPublished"
                  v-model="jobForm.isPublished"
                  :binary="true"
                />
                <label for="isPublished" class="text-sm font-semibold text-zaccBlack">
                  Published
                </label>
              </div>
              <div class="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  v-model="jobForm.isActive"
                  :binary="true"
                />
                <label for="isActive" class="text-sm font-semibold text-zaccBlack">
                  Active
                </label>
              </div>
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

      <!-- Applications Dialog -->
      <Dialog
        v-model:visible="applicationsDialogVisible"
        :header="`Applications for ${selectedJob?.title || 'Job'}`"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '1000px' }"
        :closable="true"
      >
        <div v-if="applications.length > 0" class="space-y-4">
          <!-- Filters -->
          <div class="flex items-center gap-4 mb-4 pb-4 border-b">
            <div class="flex items-center gap-2">
              <label for="applicationStatusFilter" class="text-sm font-semibold text-zaccBlack whitespace-nowrap">
                Status:
              </label>
              <Dropdown
                id="applicationStatusFilter"
                v-model="selectedApplicationStatus"
                :options="applicationStatusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All Status"
                class="w-48"
                @change="fetchApplications"
              />
            </div>
            <div class="text-sm text-zaccBlack/60">
              Total: {{ applications.length }} application(s)
            </div>
          </div>

          <!-- Applications List -->
          <DataTable
            :value="applications"
            :loading="loadingApplications"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            dataKey="id"
            stripedRows
            class="text-sm"
          >
            <Column field="name" header="Name" sortable>
              <template #body="{ data }">
                <div>
                  <div class="font-semibold text-zaccBlack">{{ data.name }}</div>
                  <div class="text-xs text-gray-500">{{ data.email }}</div>
                </div>
              </template>
            </Column>

            <Column field="phone" header="Phone" sortable />

            <Column field="qualification" header="Qualification">
              <template #body="{ data }">
                <span v-if="data.qualification">{{ data.qualification }}</span>
                <span v-else class="text-gray-400">-</span>
              </template>
            </Column>

            <Column field="experience" header="Experience">
              <template #body="{ data }">
                <span v-if="data.experience !== null">{{ data.experience }} years</span>
                <span v-else class="text-gray-400">-</span>
              </template>
            </Column>

            <Column field="status" header="Status" sortable>
              <template #body="{ data }">
                <Tag
                  :value="formatApplicationStatus(data.status)"
                  :severity="getApplicationStatusSeverity(data.status)"
                />
              </template>
            </Column>

            <Column field="createdAt" header="Applied" sortable>
              <template #body="{ data }">
                {{ formatDate(data.createdAt) }}
              </template>
            </Column>

            <Column header="Actions" :exportable="false" style="min-width: 120px">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <Button
                    icon="pi pi-eye"
                    severity="info"
                    rounded
                    text
                    @click="viewApplicationDetails(data)"
                    v-tooltip.top="'View Details'"
                  />
                  <Button
                    icon="pi pi-download"
                    severity="secondary"
                    rounded
                    text
                    @click="downloadCV(data)"
                    v-tooltip.top="'Download CV'"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>

        <div v-else-if="!loadingApplications" class="text-center py-12">
          <i class="pi pi-inbox text-6xl text-zaccBlack/20 mb-4"></i>
          <h3 class="text-xl font-semibold text-zaccBlack mb-2">No Applications</h3>
          <p class="text-zaccBlack/60">No applications have been submitted for this job yet.</p>
        </div>
      </Dialog>

      <!-- Application Details Dialog -->
      <Dialog
        v-model:visible="applicationDetailsDialogVisible"
        header="Application Details"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '800px' }"
        :closable="true"
      >
        <div v-if="selectedApplication" class="space-y-6">
          <!-- Header -->
          <div class="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 class="text-lg font-bold text-zaccBlack">{{ selectedApplication.name }}</h3>
              <p class="text-sm text-gray-500">Applied: {{ formatDateTime(selectedApplication.createdAt) }}</p>
            </div>
            <Tag
              :value="formatApplicationStatus(selectedApplication.status)"
              :severity="getApplicationStatusSeverity(selectedApplication.status)"
            />
          </div>

          <!-- Contact Information -->
          <div>
            <h4 class="font-semibold text-zaccBlack mb-2">Contact Information</h4>
            <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span class="text-sm text-gray-600">Email:</span>
                <span class="ml-2 font-semibold">{{ selectedApplication.email }}</span>
              </div>
              <div>
                <span class="text-sm text-gray-600">Phone:</span>
                <span class="ml-2 font-semibold">{{ selectedApplication.phone }}</span>
              </div>
              <div v-if="selectedApplication.qualification">
                <span class="text-sm text-gray-600">Qualification:</span>
                <span class="ml-2 font-semibold">{{ selectedApplication.qualification }}</span>
              </div>
              <div v-if="selectedApplication.experience !== null">
                <span class="text-sm text-gray-600">Experience:</span>
                <span class="ml-2 font-semibold">{{ selectedApplication.experience }} years</span>
              </div>
            </div>
          </div>

          <!-- Cover Letter -->
          <div>
            <h4 class="font-semibold text-zaccBlack mb-2">Cover Letter</h4>
            <div class="p-4 bg-gray-50 rounded-lg">
              <p class="text-zaccBlack/80 whitespace-pre-wrap">{{ selectedApplication.coverLetter }}</p>
            </div>
          </div>

          <!-- CV Download -->
          <div>
            <h4 class="font-semibold text-zaccBlack mb-2">CV/Resume</h4>
            <Button
              label="Download CV"
              icon="pi pi-download"
              severity="secondary"
              outlined
              @click="downloadCV(selectedApplication)"
            />
          </div>

          <!-- Notes -->
          <div v-if="selectedApplication.notes">
            <h4 class="font-semibold text-zaccBlack mb-2">Notes</h4>
            <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p class="text-zaccBlack/80 whitespace-pre-wrap">{{ selectedApplication.notes }}</p>
            </div>
          </div>
        </div>
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
  title: 'Jobs Management - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'Manage job postings and applications'
    }
  ]
})

definePageMeta({
  middleware: 'admin'
})

const confirm = useConfirm()
const toast = useToast()

// State
const jobs = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const selectedDepartment = ref<string | null>(null)
const selectedStatus = ref<string | null>(null)
const selectedActive = ref<string | null>(null)
const filters = ref({
  global: { value: null, matchMode: 'contains' }
})

// Applications state
const applicationsDialogVisible = ref(false)
const applicationDetailsDialogVisible = ref(false)
const selectedJob = ref<any>(null)
const applications = ref<any[]>([])
const loadingApplications = ref(false)
const selectedApplicationStatus = ref<string | null>(null)
const selectedApplication = ref<any>(null)

const jobForm = reactive({
  id: '',
  title: '',
  slug: '',
  department: '',
  location: '',
  type: '',
  summary: '',
  description: '',
  keyRequirements: [''],
  responsibilities: [''],
  benefits: '',
  closingDate: null as Date | null,
  isPublished: false,
  isActive: true
})

const errors = reactive({
  title: '',
  slug: '',
  department: '',
  location: '',
  type: '',
  summary: '',
  description: '',
  keyRequirements: '',
  responsibilities: '',
  closingDate: ''
})

const departmentOptions = [
  { label: 'Investigations', value: 'investigations' },
  { label: 'Legal', value: 'legal' },
  { label: 'Compliance', value: 'compliance' },
  { label: 'Administration', value: 'administration' },
  { label: 'IT', value: 'it' },
  { label: 'Finance', value: 'finance' },
  { label: 'HR', value: 'hr' },
  { label: 'Communications', value: 'communications' }
]

const typeOptions = [
  { label: 'Full-time', value: 'Full-time' },
  { label: 'Part-time', value: 'Part-time' },
  { label: 'Contract', value: 'Contract' },
  { label: 'Internship', value: 'Internship' }
]

const statusOptions = [
  { label: 'All', value: null },
  { label: 'Published', value: 'true' },
  { label: 'Draft', value: 'false' }
]

const activeOptions = [
  { label: 'All', value: null },
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' }
]

const applicationStatusOptions = [
  { label: 'All', value: null },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Reviewing', value: 'REVIEWING' },
  { label: 'Shortlisted', value: 'SHORTLISTED' },
  { label: 'Interviewed', value: 'INTERVIEWED' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Rejected', value: 'REJECTED' }
]

// Helper functions
const truncateText = (text: string, length: number) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
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

const formatApplicationStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getApplicationStatusSeverity = (status: string) => {
  const severityMap: Record<string, string> = {
    PENDING: 'info',
    REVIEWING: 'warning',
    SHORTLISTED: 'success',
    INTERVIEWED: 'success',
    ACCEPTED: 'success',
    REJECTED: 'danger'
  }
  return severityMap[status] || 'secondary'
}

const formatDepartment = (dept: string) => {
  const option = departmentOptions.find(opt => opt.value === dept)
  return option ? option.label : dept
}

const generateSlug = () => {
  if (!jobForm.title || isEditMode.value) return
  jobForm.slug = jobForm.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const addRequirement = () => {
  jobForm.keyRequirements.push('')
}

const removeRequirement = (index: number) => {
  if (jobForm.keyRequirements.length > 1) {
    jobForm.keyRequirements.splice(index, 1)
  }
}

const addResponsibility = () => {
  jobForm.responsibilities.push('')
}

const removeResponsibility = (index: number) => {
  if (jobForm.responsibilities.length > 1) {
    jobForm.responsibilities.splice(index, 1)
  }
}

const clearErrors = () => {
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })
}

const validateForm = () => {
  clearErrors()
  let isValid = true

  if (!jobForm.title.trim()) {
    errors.title = 'Title is required'
    isValid = false
  }

  if (!jobForm.slug.trim()) {
    errors.slug = 'Slug is required'
    isValid = false
  }

  if (!jobForm.department) {
    errors.department = 'Department is required'
    isValid = false
  }

  if (!jobForm.location.trim()) {
    errors.location = 'Location is required'
    isValid = false
  }

  if (!jobForm.type) {
    errors.type = 'Type is required'
    isValid = false
  }

  if (!jobForm.summary.trim()) {
    errors.summary = 'Summary is required'
    isValid = false
  }

  if (!jobForm.description.trim()) {
    errors.description = 'Description is required'
    isValid = false
  }

  const validRequirements = jobForm.keyRequirements.filter(req => req.trim()).length
  if (validRequirements === 0) {
    errors.keyRequirements = 'At least one requirement is required'
    isValid = false
  }

  const validResponsibilities = jobForm.responsibilities.filter(resp => resp.trim()).length
  if (validResponsibilities === 0) {
    errors.responsibilities = 'At least one responsibility is required'
    isValid = false
  }

  if (!jobForm.closingDate) {
    errors.closingDate = 'Closing date is required'
    isValid = false
  }

  return isValid
}

// Fetch jobs
const fetchJobs = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedDepartment.value) {
      params.department = selectedDepartment.value
    }
    if (selectedStatus.value !== null) {
      params.isPublished = selectedStatus.value
    }
    if (selectedActive.value !== null) {
      params.isActive = selectedActive.value
    }

    const data = await $fetch('/api/jobs', { params })
    jobs.value = data
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load jobs',
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

const openEditDialog = (job: any) => {
  isEditMode.value = true
  jobForm.id = job.id
  jobForm.title = job.title
  jobForm.slug = job.slug
  jobForm.department = job.department
  jobForm.location = job.location
  jobForm.type = job.type
  jobForm.summary = job.summary
  jobForm.description = job.description
  jobForm.keyRequirements = Array.isArray(job.keyRequirements) && job.keyRequirements.length > 0
    ? job.keyRequirements
    : ['']
  jobForm.responsibilities = Array.isArray(job.responsibilities) && job.responsibilities.length > 0
    ? job.responsibilities
    : ['']
  jobForm.benefits = job.benefits || ''
  jobForm.closingDate = job.closingDate ? new Date(job.closingDate) : null
  jobForm.isPublished = job.isPublished
  jobForm.isActive = job.isActive
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  resetForm()
  clearErrors()
}

const resetForm = () => {
  jobForm.id = ''
  jobForm.title = ''
  jobForm.slug = ''
  jobForm.department = ''
  jobForm.location = ''
  jobForm.type = ''
  jobForm.summary = ''
  jobForm.description = ''
  jobForm.keyRequirements = ['']
  jobForm.responsibilities = ['']
  jobForm.benefits = ''
  jobForm.closingDate = null
  jobForm.isPublished = false
  jobForm.isActive = true
}

// Submit handler
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  submitting.value = true
  try {
    const payload: any = {
      title: jobForm.title,
      slug: jobForm.slug,
      department: jobForm.department,
      location: jobForm.location,
      type: jobForm.type,
      summary: jobForm.summary,
      description: jobForm.description,
      keyRequirements: jobForm.keyRequirements.filter(req => req.trim()),
      responsibilities: jobForm.responsibilities.filter(resp => resp.trim()),
      benefits: jobForm.benefits || undefined,
      closingDate: jobForm.closingDate?.toISOString(),
      isPublished: jobForm.isPublished,
      isActive: jobForm.isActive
    }

    if (isEditMode.value) {
      await $fetch(`/api/jobs/${jobForm.id}`, {
        method: 'PUT',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Job updated successfully',
        life: 3000
      })
    } else {
      await $fetch('/api/jobs', {
        method: 'POST',
        body: payload
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Job created successfully',
        life: 3000
      })
    }

    await fetchJobs()
    closeDialog()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to save job',
      life: 3000
    })
  } finally {
    submitting.value = false
  }
}

// Delete handler
const handleDelete = (job: any) => {
  confirm.require({
    message: `Are you sure you want to delete "${job.title}"? This action cannot be undone.`,
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
        await $fetch(`/api/jobs/${job.id}`, {
          method: 'DELETE'
        })
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Job deleted successfully',
          life: 3000
        })
        await fetchJobs()
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.data?.message || 'Failed to delete job',
          life: 3000
        })
      }
    }
  })
}

const clearFilters = () => {
  selectedDepartment.value = null
  selectedStatus.value = null
  selectedActive.value = null
  fetchJobs()
}

// Applications handlers
const viewApplications = async (job: any) => {
  selectedJob.value = job
  selectedApplicationStatus.value = null
  applicationsDialogVisible.value = true
  await fetchApplications()
}

const fetchApplications = async () => {
  if (!selectedJob.value) return
  
  loadingApplications.value = true
  try {
    const params: any = {}
    if (selectedApplicationStatus.value) {
      params.status = selectedApplicationStatus.value
    }
    
    const data = await $fetch(`/api/jobs/${selectedJob.value.id}/applications`, { params })
    applications.value = data
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.data?.message || 'Failed to load applications',
      life: 3000
    })
    applications.value = []
  } finally {
    loadingApplications.value = false
  }
}

const viewApplicationDetails = (application: any) => {
  selectedApplication.value = application
  applicationDetailsDialogVisible.value = true
}

const downloadCV = (application: any) => {
  if (application.cvUrl) {
    const link = document.createElement('a')
    link.href = application.cvUrl
    link.target = '_blank'
    link.download = `${application.name}-CV.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Lifecycle
onMounted(() => {
  fetchJobs()
})
</script>

