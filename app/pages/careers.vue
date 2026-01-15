<template>
  <NuxtLayout name="main">
    <div>
      <!-- Hero Section -->
    <section class="relative isolate overflow-hidden bg-zaccBlack text-white py-24">
      <div class="absolute inset-0">
        <img src="/businessman.jpg" alt="Careers" class="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div class="absolute inset-0 bg-zaccBlack/90"></div>
      </div>
      <div class="relative mx-auto max-w-7xl px-6">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Careers at ZACC</h1>
          <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
            Join us in the fight against corruption. Build a meaningful career while serving Zimbabwe.
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="relative py-20">
      <div
        class="absolute inset-0 -z-10 opacity-20"
        style="background: radial-gradient(40% 40% at 50% 0%, rgba(212,175,55,0.15), transparent)"
      ></div>
      <div class="mx-auto max-w-7xl px-6">
        <!-- Why Work at ZACC -->
        <div class="mb-16">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">Why Work at ZACC?</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
            <p class="text-zaccBlack/70 max-w-3xl mx-auto">
              Join a team dedicated to integrity, transparency, and justice. Make a real difference in Zimbabwe's future.
            </p>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card class="text-center border-l-4 border-l-zaccGreen">
              <template #content>
                <div class="p-6">
                  <div class="w-16 h-16 rounded-full bg-zaccBlack/10 flex items-center justify-center mx-auto mb-4">
                    <i class="pi pi-heart text-zaccGreen text-3xl"></i>
                  </div>
                  <h3 class="font-extrabold text-lg mb-2">Purpose-Driven</h3>
                  <p class="text-sm text-zaccBlack/70">Work that makes a meaningful impact on society</p>
                </div>
              </template>
            </Card>
            <Card class="text-center border-l-4 border-l-zaccGold">
              <template #content>
                <div class="p-6">
                  <div class="w-16 h-16 rounded-full bg-zaccGold/10 flex items-center justify-center mx-auto mb-4">
                    <i class="pi pi-graduation-cap text-zaccGold text-3xl"></i>
                  </div>
                  <h3 class="font-extrabold text-lg mb-2">Professional Growth</h3>
                  <p class="text-sm text-zaccBlack/70">Continuous learning and development opportunities</p>
                </div>
              </template>
            </Card>
            <Card class="text-center border-l-4 border-l-zaccGreen">
              <template #content>
                <div class="p-6">
                  <div class="w-16 h-16 rounded-full bg-zaccBlack/10 flex items-center justify-center mx-auto mb-4">
                    <i class="pi pi-users text-zaccGreen text-3xl"></i>
                  </div>
                  <h3 class="font-extrabold text-lg mb-2">Team Environment</h3>
                  <p class="text-sm text-zaccBlack/70">Collaborative and supportive workplace culture</p>
                </div>
              </template>
            </Card>
            <Card class="text-center border-l-4 border-l-zaccGold">
              <template #content>
                <div class="p-6">
                  <div class="w-16 h-16 rounded-full bg-zaccGold/10 flex items-center justify-center mx-auto mb-4">
                    <i class="pi pi-shield text-zaccGold text-3xl"></i>
                  </div>
                  <h3 class="font-extrabold text-lg mb-2">Competitive Benefits</h3>
                  <p class="text-sm text-zaccBlack/70">Comprehensive benefits and compensation package</p>
                </div>
              </template>
            </Card>
          </div>
        </div>

        <!-- Search and Filter -->
        <div class="mb-12 rounded-2xl bg-white p-6 shadow-lg border border-zaccGreen/10">
          <div class="grid gap-6 lg:grid-cols-3">
            <div class="lg:col-span-2">
              <label for="jobSearch" class="block text-sm font-semibold text-zaccBlack mb-2">
                Search Jobs
              </label>
              <div class="relative">
                <InputText
                  id="jobSearch"
                  v-model="searchQuery"
                  placeholder="Search by job title, department, or keywords..."
                  class="w-full pl-10"
                />
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-zaccBlack/40"></i>
              </div>
            </div>
            <div>
              <label for="departmentFilter" class="block text-sm font-semibold text-zaccBlack mb-2">
                Filter by Department
              </label>
              <Dropdown
                id="departmentFilter"
                v-model="selectedDepartment"
                :options="departments"
                optionLabel="label"
                optionValue="value"
                placeholder="All Departments"
                class="w-full"
                showClear
              />
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="space-y-6 mb-12">
          <Card v-for="i in 3" :key="i" class="animate-pulse">
            <template #content>
              <div class="p-6">
                <div class="h-6 bg-zaccBlack/10 rounded w-3/4 mb-4"></div>
                <div class="h-4 bg-zaccBlack/10 rounded w-1/2 mb-2"></div>
                <div class="h-4 bg-zaccBlack/10 rounded w-2/3"></div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Job Listings -->
        <div v-else-if="filteredJobs.length > 0" class="space-y-6 mb-12">
          <Card
            v-for="job in paginatedJobs"
            :key="job.id"
            class="hover:shadow-lg transition-all"
          >
            <template #content>
              <div class="p-6">
                <div class="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div class="flex-1">
                    <div class="flex items-start justify-between gap-4 mb-3">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <h3 class="text-xl font-extrabold text-zaccBlack hover:text-zaccGreen transition-colors">
                            {{ job.title }}
                          </h3>
                          <Badge :value="job.type" :severity="getJobTypeSeverity(job.type)" />
                        </div>
                        <div class="flex flex-wrap items-center gap-4 text-sm text-zaccBlack/60 mb-3">
                          <div class="flex items-center gap-2">
                            <i class="pi pi-building"></i>
                            <span>{{ job.department }}</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <i class="pi pi-map-marker"></i>
                            <span>{{ job.location }}</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <i class="pi pi-calendar"></i>
                            <span>Closes: {{ formatDate(job.closingDate) }}</span>
                          </div>
                        </div>
                        <p class="text-zaccBlack/70 leading-relaxed mb-4">
                          {{ job.summary }}
                        </p>
                        <div class="flex flex-wrap gap-2">
                          <Tag 
                            v-for="(requirement, idx) in (Array.isArray(job.keyRequirements) ? job.keyRequirements : []).slice(0, 3)" 
                            :key="idx" 
                            :value="requirement" 
                            severity="secondary" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex-shrink-0 flex flex-col gap-2">
                    <Button
                      label="View Details"
                      icon="pi pi-eye"
                      severity="secondary"
                      outlined
                      @click="viewJob(job)"
                    />
                    <Button
                      label="Apply Now"
                      icon="pi pi-send"
                      @click="applyForJob(job)"
                      style="background: #209341; border-color: #209341;"
                    />
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- No Results -->
        <div v-else-if="!loading" class="text-center py-20">
          <i class="pi pi-briefcase text-6xl text-zaccBlack/20 mb-4"></i>
          <h3 class="text-xl font-semibold text-zaccBlack mb-2">No Jobs Found</h3>
          <p class="text-zaccBlack/60">Try adjusting your search or filter criteria.</p>
        </div>

        <!-- Pagination -->
        <div v-if="filteredJobs.length > itemsPerPage" class="flex justify-center mt-12">
          <Paginator
            :rows="itemsPerPage"
            :totalRecords="filteredJobs.length"
            :first="(currentPage - 1) * itemsPerPage"
            @page="onPageChange"
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          />
        </div>

        <!-- How to Apply Section -->
        <div class="mt-16 rounded-2xl bg-gradient-to-r from-zaccGreen/10 to-zaccGold/10 p-8 border border-zaccGreen/20">
          <h2 class="text-2xl font-extrabold mb-6 text-center">How to Apply</h2>
          <div class="grid gap-6 sm:grid-cols-3">
            <div class="text-center">
              <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span class="text-2xl font-extrabold text-zaccGreen">1</span>
              </div>
              <h3 class="font-semibold mb-2">Find a Position</h3>
              <p class="text-sm text-zaccBlack/70">Browse available positions and find the role that matches your skills</p>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span class="text-2xl font-extrabold text-zaccGreen">2</span>
              </div>
              <h3 class="font-semibold mb-2">Submit Application</h3>
              <p class="text-sm text-zaccBlack/70">Complete the application form and upload your CV and cover letter</p>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span class="text-2xl font-extrabold text-zaccGreen">3</span>
              </div>
              <h3 class="font-semibold mb-2">Interview Process</h3>
              <p class="text-sm text-zaccBlack/70">Selected candidates will be contacted for interviews and assessments</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Job Detail Dialog -->
    <Dialog
      v-model:visible="showJobDialog"
      :header="selectedJob?.title"
      :modal="true"
      :style="{ width: '90vw', maxWidth: '900px' }"
      :closable="true"
    >
      <div v-if="selectedJob" class="space-y-6">
        <div class="flex flex-wrap items-center gap-4 text-sm text-zaccBlack/60 pb-4 border-b">
          <div class="flex items-center gap-2">
            <i class="pi pi-building"></i>
            <span class="font-semibold">Department:</span>
            <span>{{ selectedJob.department }}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-map-marker"></i>
            <span class="font-semibold">Location:</span>
            <span>{{ selectedJob.location }}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar"></i>
            <span class="font-semibold">Closing Date:</span>
            <span>{{ formatDate(selectedJob.closingDate) }}</span>
          </div>
          <Badge :value="selectedJob.type" :severity="getJobTypeSeverity(selectedJob.type)" />
        </div>

        <div class="prose max-w-none">
          <h4 class="font-extrabold text-lg mb-3">Job Description</h4>
          <p class="text-zaccBlack/80 leading-relaxed mb-6">{{ selectedJob.description }}</p>

          <h4 class="font-extrabold text-lg mb-3">Key Requirements</h4>
          <ul class="space-y-2 mb-6">
            <li v-for="(req, index) in (Array.isArray(selectedJob.keyRequirements) ? selectedJob.keyRequirements : [])" :key="index" class="flex items-start gap-2 text-zaccBlack/80">
              <i class="pi pi-check-circle text-zaccGreen mt-0.5"></i>
              <span>{{ req }}</span>
            </li>
          </ul>

          <h4 class="font-extrabold text-lg mb-3">Responsibilities</h4>
          <ul class="space-y-2 mb-6">
            <li v-for="(resp, index) in (Array.isArray(selectedJob.responsibilities) ? selectedJob.responsibilities : [])" :key="index" class="flex items-start gap-2 text-zaccBlack/80">
              <i class="pi pi-circle-fill text-zaccGold text-xs mt-1.5"></i>
              <span>{{ resp }}</span>
            </li>
          </ul>

          <div v-if="selectedJob.benefits" class="rounded-lg bg-zaccBlack/5 p-4 border border-zaccGreen/20 mb-6">
            <h4 class="font-extrabold text-lg mb-3 text-zaccGreen">Benefits</h4>
            <p class="text-zaccBlack/70">{{ selectedJob.benefits }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-4 border-t">
          <Button
            label="Apply for This Position"
            icon="pi pi-send"
            @click="applyForJob(selectedJob)"
            style="background: #209341; border-color: #209341;"
          />
          <Button
            label="Close"
            severity="secondary"
            outlined
            @click="showJobDialog = false"
          />
        </div>
      </div>
    </Dialog>

    <!-- Application Form Dialog -->
    <Dialog
      v-model:visible="showApplicationDialog"
      header="Job Application"
      :modal="true"
      :style="{ width: '90vw', maxWidth: '800px' }"
      :closable="true"
    >
      <div v-if="applicationJob" class="space-y-6">
        <Message severity="info" :closable="false">
          <template #icon>
            <i class="pi pi-info-circle"></i>
          </template>
          <div>
            <div class="font-semibold mb-1">Applying for: {{ applicationJob.title }}</div>
            <p class="text-sm">Please fill out the form below to submit your application.</p>
          </div>
        </Message>

        <form @submit.prevent="handleApplicationSubmit" class="space-y-6">
          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <label for="applicantName" class="block text-sm font-semibold text-zaccBlack mb-2">
                Full Name <span class="text-red-500">*</span>
              </label>
              <InputText
                id="applicantName"
                v-model="applicationForm.name"
                placeholder="Enter your full name"
                class="w-full"
                :class="{ 'p-invalid': !applicationForm.name && applicationSubmitted }"
                required
              />
              <small v-if="!applicationForm.name && applicationSubmitted" class="p-error">Name is required.</small>
            </div>
            <div>
              <label for="applicantEmail" class="block text-sm font-semibold text-zaccBlack mb-2">
                Email Address <span class="text-red-500">*</span>
              </label>
              <InputText
                id="applicantEmail"
                v-model="applicationForm.email"
                type="email"
                placeholder="your.email@example.com"
                class="w-full"
                :class="{ 'p-invalid': !applicationForm.email && applicationSubmitted }"
                required
              />
              <small v-if="!applicationForm.email && applicationSubmitted" class="p-error">Valid email is required.</small>
            </div>
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <label for="applicantPhone" class="block text-sm font-semibold text-zaccBlack mb-2">
                Phone Number <span class="text-red-500">*</span>
              </label>
              <InputText
                id="applicantPhone"
                v-model="applicationForm.phone"
                type="tel"
                placeholder="+263 XX XXX XXXX"
                class="w-full"
                :class="{ 'p-invalid': !applicationForm.phone && applicationSubmitted }"
                required
              />
              <small v-if="!applicationForm.phone && applicationSubmitted" class="p-error">Phone number is required.</small>
            </div>
            <div>
              <label for="applicantQualification" class="block text-sm font-semibold text-zaccBlack mb-2">
                Highest Qualification
              </label>
              <InputText
                id="applicantQualification"
                v-model="applicationForm.qualification"
                placeholder="e.g., Bachelor's Degree, Master's, etc."
                class="w-full"
              />
            </div>
          </div>

          <div>
            <label for="applicantExperience" class="block text-sm font-semibold text-zaccBlack mb-2">
              Years of Experience
            </label>
            <InputNumber
              id="applicantExperience"
              v-model="applicationForm.experience"
              :min="0"
              :max="50"
              placeholder="Years"
              class="w-full"
            />
          </div>

          <div>
            <label for="coverLetter" class="block text-sm font-semibold text-zaccBlack mb-2">
              Cover Letter <span class="text-red-500">*</span>
            </label>
            <Textarea
              id="coverLetter"
              v-model="applicationForm.coverLetter"
              rows="6"
              placeholder="Tell us why you're interested in this position and what you can bring to ZACC..."
              class="w-full"
              :class="{ 'p-invalid': !applicationForm.coverLetter && applicationSubmitted }"
              required
            />
            <small v-if="!applicationForm.coverLetter && applicationSubmitted" class="p-error">Cover letter is required.</small>
          </div>

          <div>
            <label class="block text-sm font-semibold text-zaccBlack mb-2">
              Upload CV/Resume <span class="text-red-500">*</span>
            </label>
            <FileUpload
              mode="basic"
              :multiple="false"
              accept=".pdf,.doc,.docx"
              :maxFileSize="5000000"
              :auto="false"
              chooseLabel="Upload CV"
              @select="onCVSelect"
              class="w-full"
            />
            <small class="text-zaccBlack/60">PDF, DOC, or DOCX format. Maximum 5MB.</small>
          </div>

          <div class="flex items-center justify-between pt-4 border-t">
            <div class="text-sm text-zaccBlack/70">
              <span class="text-red-500">*</span> Required fields
            </div>
            <div class="flex gap-2">
              <Button
                label="Cancel"
                severity="secondary"
                outlined
                @click="showApplicationDialog = false"
              />
              <Button
                type="submit"
                label="Submit Application"
                icon="pi pi-send"
                :loading="isSubmitting"
                style="background: #209341; border-color: #209341;"
              />
            </div>
          </div>
        </form>
      </div>
    </Dialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

const toast = useToast()
useHead({
  title: 'Careers - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Join ZACC in the fight against corruption. Explore career opportunities and make a meaningful impact on Zimbabwe\'s future.'
    }
  ]
})

const departments = [
  { label: 'All Departments', value: null },
  { label: 'Investigations', value: 'investigations' },
  { label: 'Legal', value: 'legal' },
  { label: 'Compliance', value: 'compliance' },
  { label: 'Administration', value: 'administration' },
  { label: 'IT & Technology', value: 'it' },
  { label: 'Finance', value: 'finance' },
  { label: 'Human Resources', value: 'hr' },
  { label: 'Communications', value: 'communications' }
]

const jobs = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')
const selectedDepartment = ref(null)
const currentPage = ref(1)
const itemsPerPage = 6
const showJobDialog = ref(false)
const selectedJob = ref(null)
const showApplicationDialog = ref(false)
const applicationJob = ref(null)
const applicationSubmitted = ref(false)
const isSubmitting = ref(false)

const applicationForm = reactive({
  name: '',
  email: '',
  phone: '',
  qualification: '',
  experience: null,
  coverLetter: '',
  cv: null
})

// Fetch jobs from API
const fetchJobs = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedDepartment.value) {
      params.department = selectedDepartment.value
    }
    
    const data = await $fetch('/api/public/jobs', { params })
    jobs.value = data
  } catch (error: any) {
    console.error('Error fetching jobs:', error)
    jobs.value = []
  } finally {
    loading.value = false
  }
}

const filteredJobs = computed(() => {
  let filtered = jobs.value

  // Filter by search query (department is already filtered by API)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(job => {
      const keyReqs = Array.isArray(job.keyRequirements) ? job.keyRequirements : []
      const responsibilities = Array.isArray(job.responsibilities) ? job.responsibilities : []
      
      return (
        job.title.toLowerCase().includes(query) ||
        job.summary.toLowerCase().includes(query) ||
        job.department.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query) ||
        keyReqs.some((req: string) => req.toLowerCase().includes(query)) ||
        responsibilities.some((resp: string) => resp.toLowerCase().includes(query))
      )
    })
  }

  return filtered
})

const paginatedJobs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredJobs.value.slice(start, end)
})

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const getJobTypeSeverity = (type) => {
  return type === 'Full-time' ? 'success' : 'info'
}

const viewJob = (job) => {
  selectedJob.value = job
  showJobDialog.value = true
}

const applyForJob = (job) => {
  applicationJob.value = job
  showApplicationDialog.value = true
  showJobDialog.value = false
  // Reset form
  Object.assign(applicationForm, {
    name: '',
    email: '',
    phone: '',
    qualification: '',
    experience: null,
    coverLetter: '',
    cv: null
  })
  applicationSubmitted.value = false
}

const onCVSelect = (event) => {
  const file = event.files[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }
    applicationForm.cv = file
  }
}

const handleApplicationSubmit = async () => {
  applicationSubmitted.value = true

  if (!applicationForm.name || !applicationForm.email || !applicationForm.phone || !applicationForm.coverLetter || !applicationForm.cv) {
    return
  }

  isSubmitting.value = true

  try {
    // Create FormData for file upload
    const formData = new FormData()
    formData.append('jobId', applicationJob.value?.id || '')
    formData.append('name', applicationForm.name)
    formData.append('email', applicationForm.email)
    formData.append('phone', applicationForm.phone)
    if (applicationForm.qualification) {
      formData.append('qualification', applicationForm.qualification)
    }
    if (applicationForm.experience !== null) {
      formData.append('experience', applicationForm.experience.toString())
    }
    formData.append('coverLetter', applicationForm.coverLetter)
    if (applicationForm.cv) {
      formData.append('cv', applicationForm.cv)
    }

    const response = await $fetch('/api/public/jobs/apply', {
      method: 'POST',
      body: formData
    })

    await nextTick()
    toast.add({
      severity: 'success',
      summary: 'Application Submitted',
      detail: response.message || 'Thank you for your application. We will review it and contact you if you are shortlisted.',
      life: 5000
    })

    // Reset and close
    showApplicationDialog.value = false
    Object.assign(applicationForm, {
      name: '',
      email: '',
      phone: '',
      qualification: '',
      experience: null,
      coverLetter: '',
      cv: null
    })
    applicationSubmitted.value = false

    // Refresh jobs to update application count
    await fetchJobs()
  } catch (error: any) {
    console.error('Error submitting application:', error)
    await nextTick()
    toast.add({
      severity: 'error',
      summary: 'Submission Failed',
      detail: error.data?.message || 'There was an error submitting your application. Please try again.',
      life: 5000
    })
  } finally {
    isSubmitting.value = false
  }
}

const onPageChange = (event) => {
  currentPage.value = (event.first / itemsPerPage) + 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Reset to page 1 when filters change
watch([searchQuery], () => {
  currentPage.value = 1
})

watch(selectedDepartment, () => {
  currentPage.value = 1
  fetchJobs()
})

// Fetch jobs on mount
onMounted(() => {
  fetchJobs()
})
</script>

<style scoped>
:deep(.p-card) {
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 5px 10px 0 rgba(41, 61, 102, 0.2);
  transition: all 0.3s ease;
}

:deep(.p-card:hover) {
  transform: translateY(-2px);
  border-color: rgba(32, 147, 65, 0.3);
}

:deep(.p-dialog-header) {
  background: linear-gradient(to right, rgba(32, 147, 65, 0.1), rgba(212, 175, 55, 0.1));
  border-bottom: 1px solid rgba(32, 147, 65, 0.2);
}
</style>
