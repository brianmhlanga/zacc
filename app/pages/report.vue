<template>
  <NuxtLayout name="main">
    <div>
      <!-- Hero Section -->
    <section class="relative isolate overflow-hidden bg-zaccBlack text-white py-24">
      <div class="absolute inset-0">
        <img src="/gavel.jpg" alt="Report corruption" class="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div class="absolute inset-0 bg-zaccBlack/90"></div>
      </div>
      <div class="relative mx-auto max-w-7xl px-6">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Report Corruption</h1>
          <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
            Your report helps us build a corruption-free Zimbabwe. All reports are treated with strict confidentiality.
          </p>
          <p class="mt-4">
            <NuxtLink
              to="/track"
              class="inline-flex items-center gap-2 text-zaccGold font-semibold hover:underline"
            >
              Already submitted? Track your report status
              <i class="pi pi-arrow-right text-sm"></i>
            </NuxtLink>
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
      <div class="mx-auto max-w-4xl px-6">
        <!-- Information Cards -->
        <Card
          v-if="lastSuccessReportNumber"
          class="mb-10 border-2 border-zaccGold shadow-lg"
        >
          <template #content>
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p class="text-sm font-semibold text-zaccGreen uppercase tracking-wide">Submission received</p>
                <p class="mt-1 text-zaccBlack">
                  Save your reference:
                  <span class="font-mono font-bold text-lg">{{ lastSuccessReportNumber }}</span>
                </p>
              </div>
              <NuxtLink
                :to="{ path: '/track', query: { ref: lastSuccessReportNumber } }"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-zaccBlack px-5 py-2.5 text-sm font-semibold text-white hover:bg-zaccBlack/90"
              >
                Track status
                <i class="pi pi-external-link text-xs"></i>
              </NuxtLink>
            </div>
          </template>
        </Card>

        <div class="grid gap-6 mb-12 sm:grid-cols-3">
          <Card class="border-l-4 border-l-zaccGreen">
            <template #content>
              <div class="text-center">
                <div class="w-12 h-12 rounded-full bg-zaccBlack/10 flex items-center justify-center mx-auto mb-3">
                  <i class="pi pi-lock text-zaccGreen text-2xl"></i>
                </div>
                <div class="font-semibold text-sm mb-1">Confidential</div>
                <div class="text-xs text-zaccBlack/70">Your identity is protected</div>
              </div>
            </template>
          </Card>
          <Card class="border-l-4 border-l-zaccGold">
            <template #content>
              <div class="text-center">
                <div class="w-12 h-12 rounded-full bg-zaccGold/10 flex items-center justify-center mx-auto mb-3">
                  <i class="pi pi-shield text-zaccGold text-2xl"></i>
                </div>
                <div class="font-semibold text-sm mb-1">Safe</div>
                <div class="text-xs text-zaccBlack/70">Secure reporting system</div>
              </div>
            </template>
          </Card>
          <Card class="border-l-4 border-l-zaccGreen">
            <template #content>
              <div class="text-center">
                <div class="w-12 h-12 rounded-full bg-zaccBlack/10 flex items-center justify-center mx-auto mb-3">
                  <i class="pi pi-bolt text-zaccGreen text-2xl"></i>
                </div>
                <div class="font-semibold text-sm mb-1">Fast</div>
                <div class="text-xs text-zaccBlack/70">Quick response time</div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Report Form -->
        <Card class="shadow-lg">
          <template #header>
            <div class="bg-gradient-to-r from-zaccGreen/10 to-zaccGold/10 px-8 py-6 border-b border-zaccGreen/20">
              <h2 class="text-2xl font-extrabold mb-2">Corruption Report Form</h2>
              <p class="text-sm text-zaccBlack/70">
                Please provide as much detail as possible. All information will be kept confidential and used for investigation purposes only.
              </p>
            </div>
          </template>
          <template #content>
            <form @submit.prevent="handleSubmit" class="space-y-8">
              <!-- Anonymous Reporting Toggle -->
              <div class="rounded-xl bg-zaccBlack/5 p-6 border border-zaccGreen/20">
                <div class="flex items-start gap-4">
                  <Checkbox
                    v-model="form.isAnonymous"
                    inputId="anonymous"
                    :binary="true"
                    class="mt-1"
                  />
                  <label for="anonymous" class="flex-1 cursor-pointer">
                    <div class="font-semibold text-zaccBlack mb-1">Report Anonymously</div>
                    <div class="text-sm text-zaccBlack/70">
                      By default, your report will be anonymous. Uncheck this box if you wish to provide your contact details for follow-up.
                    </div>
                  </label>
                </div>
              </div>

              <!-- Personal Details Section (shown when not anonymous) -->
              <Panel v-if="!form.isAnonymous" header="Your Contact Information (Optional)" class="mb-6" toggleable>
                <template #icons>
                  <i class="pi pi-user text-zaccGold"></i>
                </template>
                <div class="grid gap-6 sm:grid-cols-2 mt-4">
                  <div>
                    <label for="name" class="block text-sm font-semibold text-zaccBlack mb-2">
                      Full Name <span class="text-zaccBlack/50 font-normal">(Optional)</span>
                    </label>
                    <InputText
                      id="name"
                      v-model="form.name"
                      placeholder="Enter your full name"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label for="email" class="block text-sm font-semibold text-zaccBlack mb-2">
                      Email Address <span class="text-zaccBlack/50 font-normal">(Optional)</span>
                    </label>
                    <InputText
                      id="email"
                      v-model="form.email"
                      type="email"
                      placeholder="your.email@example.com"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label for="phone" class="block text-sm font-semibold text-zaccBlack mb-2">
                      Phone Number <span class="text-zaccBlack/50 font-normal">(Optional)</span>
                    </label>
                    <InputText
                      id="phone"
                      v-model="form.phone"
                      type="tel"
                      placeholder="+263 XX XXX XXXX"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label for="organization" class="block text-sm font-semibold text-zaccBlack mb-2">
                      Organization <span class="text-zaccBlack/50 font-normal">(Optional)</span>
                    </label>
                    <InputText
                      id="organization"
                      v-model="form.organization"
                      placeholder="Your organization (if applicable)"
                      class="w-full"
                    />
                  </div>
                </div>
              </Panel>

              <!-- Type of Corruption -->
              <div>
                <label for="corruptionType" class="block text-sm font-semibold text-zaccBlack mb-2">
                  Type of Corruption <span class="text-red-500">*</span>
                </label>
                <Dropdown
                  id="corruptionType"
                  v-model="form.corruptionType"
                  :options="corruptionTypes"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select type of corruption"
                  class="w-full"
                  :class="{ 'p-invalid': !form.corruptionType && submitted }"
                />
                <small v-if="!form.corruptionType && submitted" class="p-error">Type of corruption is required.</small>
              </div>

              <!-- Incident Details - Using Editor -->
              <div>
                <label for="incidentDescription" class="block text-sm font-semibold text-zaccBlack mb-2">
                  Describe the Incident <span class="text-red-500">*</span>
                </label>
                <Editor
                  id="incidentDescription"
                  ref="incidentDescriptionEditor"
                  v-model="form.incidentDescription"
                  editorStyle="height: 300px"
                  :class="{ 'p-invalid': !form.incidentDescription && submitted }"
                >
                  <template #toolbar>
                    <span class="ql-formats">
                      <button class="ql-bold"></button>
                      <button class="ql-italic"></button>
                      <button class="ql-underline"></button>
                    </span>
                    <span class="ql-formats">
                      <button class="ql-list" value="ordered"></button>
                      <button class="ql-list" value="bullet"></button>
                    </span>
                    <span class="ql-formats">
                      <button class="ql-link"></button>
                    </span>
                  </template>
                </Editor>
                <small v-if="!form.incidentDescription && submitted" class="p-error">Incident description is required.</small>
                <div class="mt-1 text-xs text-zaccBlack/60">Be as specific as possible. Include dates, amounts, and names if known.</div>
              </div>

              <!-- Location -->
              <div class="grid gap-6 sm:grid-cols-2">
                <div>
                  <label for="location" class="block text-sm font-semibold text-zaccBlack mb-2">
                    Location <span class="text-red-500">*</span>
                  </label>
                  <InputText
                    id="location"
                    v-model="form.location"
                    placeholder="City, Province, or specific address"
                    class="w-full"
                    :class="{ 'p-invalid': !form.location && submitted }"
                  />
                  <small v-if="!form.location && submitted" class="p-error">Location is required.</small>
                </div>
                <div>
                  <label for="province" class="block text-sm font-semibold text-zaccBlack mb-2">
                    Province
                  </label>
                  <Dropdown
                    id="province"
                    v-model="form.province"
                    :options="provinces"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select province"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Date and Time -->
              <div class="grid gap-6 sm:grid-cols-2">
                <div>
                  <label for="incidentDate" class="block text-sm font-semibold text-zaccBlack mb-2">
                    Date of Incident <span class="text-zaccBlack/50 font-normal">(If known)</span>
                  </label>
                  <Calendar
                    id="incidentDate"
                    v-model="form.incidentDate"
                    dateFormat="yy-mm-dd"
                    showIcon
                    iconDisplay="input"
                    inputId="incidentDate"
                    class="w-full"
                  />
                </div>
                <div>
                  <label for="incidentTime" class="block text-sm font-semibold text-zaccBlack mb-2">
                    Time of Incident <span class="text-zaccBlack/50 font-normal">(If known)</span>
                  </label>
                  <Calendar
                    id="incidentTime"
                    v-model="form.incidentTime"
                    timeOnly
                    hourFormat="24"
                    showIcon
                    iconDisplay="input"
                    inputId="incidentTime"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- People Involved -->
              <div>
                <label class="block text-sm font-semibold text-zaccBlack mb-2">
                  People Involved <span class="text-zaccBlack/50 font-normal">(If known)</span>
                </label>
                <div class="space-y-3">
                  <div
                    v-for="(person, idx) in form.peopleList"
                    :key="idx"
                    class="rounded-lg border border-zaccBlack/10 p-3 bg-zaccBlack/[0.02]"
                  >
                    <div class="mb-2 flex items-center justify-between">
                      <div class="text-xs font-semibold text-zaccBlack/70 uppercase">Person {{ idx + 1 }}</div>
                      <Button
                        v-if="form.peopleList.length > 1"
                        type="button"
                        icon="pi pi-trash"
                        text
                        rounded
                        severity="danger"
                        @click="removePerson(idx)"
                      />
                    </div>
                    <div class="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label class="block text-xs font-semibold text-zaccBlack/70 mb-1">Name</label>
                        <InputText v-model="person.name" class="w-full" placeholder="First name" />
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zaccBlack/70 mb-1">Surname</label>
                        <InputText v-model="person.surname" class="w-full" placeholder="Surname" />
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zaccBlack/70 mb-1">Position</label>
                        <InputText v-model="person.position" class="w-full" placeholder="Position (if known)" />
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-zaccBlack/70 mb-1">Organization</label>
                        <InputText v-model="person.organization" class="w-full" placeholder="Organization (if known)" />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="mt-3">
                  <Button
                    type="button"
                    label="Add another person"
                    icon="pi pi-plus"
                    size="small"
                    outlined
                    @click="addPerson"
                  />
                </div>
                <small class="text-zaccBlack/60">Add each person separately for clearer investigation records.</small>
              </div>

              <!-- Evidence Upload -->
              <div>
                <label class="block text-sm font-semibold text-zaccBlack mb-2">
                  Evidence / Supporting Documents <span class="text-zaccBlack/50 font-normal">(Optional)</span>
                </label>
                <FileUpload
                  mode="basic"
                  :multiple="true"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                  :maxFileSize="10000000"
                  :auto="false"
                  chooseLabel="Upload Files"
                  @select="onFileSelect"
                  class="w-full"
                />
                <div v-if="form.files.length > 0" class="mt-4 space-y-2">
                  <div
                    v-for="(file, index) in form.files"
                    :key="index"
                    class="flex items-center justify-between rounded-lg bg-zaccBlack/5 p-3 border border-zaccGreen/20"
                  >
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                      <i class="pi pi-file text-zaccGreen"></i>
                      <span class="text-sm text-zaccBlack truncate">{{ file.name }}</span>
                      <span class="text-xs text-zaccBlack/60">({{ formatFileSize(file.size) }})</span>
                    </div>
                    <Button
                      icon="pi pi-times"
                      severity="danger"
                      text
                      rounded
                      @click="removeFile(index)"
                      aria-label="Remove file"
                    />
                  </div>
                </div>
                <small class="text-zaccBlack/60">PDF, DOC, DOCX, JPG, PNG, XLS, XLSX (Max 10MB per file)</small>
              </div>

              <!-- Additional Information - Using Editor -->
              <div>
                <label for="additionalInfo" class="block text-sm font-semibold text-zaccBlack mb-2">
                  Additional Information <span class="text-zaccBlack/50 font-normal">(Optional)</span>
                </label>
                <Editor
                  id="additionalInfo"
                  ref="additionalInfoEditor"
                  v-model="form.additionalInfo"
                  editorStyle="height: 200px"
                >
                  <template #toolbar>
                    <span class="ql-formats">
                      <button class="ql-bold"></button>
                      <button class="ql-italic"></button>
                      <button class="ql-underline"></button>
                    </span>
                    <span class="ql-formats">
                      <button class="ql-list" value="ordered"></button>
                      <button class="ql-list" value="bullet"></button>
                    </span>
                    <span class="ql-formats">
                      <button class="ql-link"></button>
                    </span>
                  </template>
                </Editor>
              </div>

              <!-- Privacy Notice -->
              <Message severity="info" :closable="false">
                <template #icon>
                  <i class="pi pi-info-circle"></i>
                </template>
                <div>
                  <div class="font-semibold mb-1">Privacy & Confidentiality</div>
                  <p class="text-sm">
                    Your report will be treated with strict confidentiality. If you choose to report anonymously, your identity will not be disclosed. 
                    All information provided will be used solely for investigation purposes and in accordance with the Anti-Corruption Commission Act.
                  </p>
                </div>
              </Message>

              <!-- Submit Button -->
              <div class="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t border-zaccBlack/10">
                <div class="text-sm text-zaccBlack/70">
                  <span class="text-red-500">*</span> Required fields
                </div>
                <Button
                  type="submit"
                  label="Submit Report"
                  icon="pi pi-send"
                  :loading="isSubmitting"
                  class="w-full sm:w-auto"
                  style="background: #209341; border-color: #209341;"
                />
              </div>

              <Card
                v-if="lastSuccessReportNumber"
                class="border-2 border-zaccGold shadow-lg"
              >
                <template #content>
                  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p class="text-sm font-semibold text-zaccGreen uppercase tracking-wide">Submission received</p>
                      <p class="mt-1 text-zaccBlack">
                        Save your reference:
                        <span class="font-mono font-bold text-lg">{{ lastSuccessReportNumber }}</span>
                      </p>
                    </div>
                    <NuxtLink
                      :to="{ path: '/track', query: { ref: lastSuccessReportNumber } }"
                      class="inline-flex items-center justify-center gap-2 rounded-lg bg-zaccBlack px-5 py-2.5 text-sm font-semibold text-white hover:bg-zaccBlack/90"
                    >
                      Track status
                      <i class="pi pi-external-link text-xs"></i>
                    </NuxtLink>
                  </div>
                </template>
              </Card>
            </form>
          </template>
        </Card>

        <!-- Alternative Contact Methods -->
        <div class="mt-12 rounded-2xl bg-gradient-to-r from-zaccGreen/10 to-zaccGold/10 p-8 border border-zaccGreen/20">
          <h3 class="text-xl font-extrabold mb-4 text-center">Alternative Ways to Report</h3>
          <div class="grid gap-6 sm:grid-cols-3">
            <div class="text-center">
              <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                <i class="pi pi-phone text-zaccGreen text-2xl"></i>
              </div>
              <div class="font-semibold mb-1">Phone</div>
              <div class="text-sm text-zaccBlack/70">Call our hotline</div>
              <a href="tel:+263242000000" class="text-zaccGreen hover:text-zaccGreen/80 text-sm font-semibold mt-2 inline-block">
                +263 24 200 0000
              </a>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                <i class="pi pi-envelope text-zaccGreen text-2xl"></i>
              </div>
              <div class="font-semibold mb-1">Email</div>
              <div class="text-sm text-zaccBlack/70">Send us an email</div>
              <a href="mailto:report@zacc.org.zw" class="text-zaccGreen hover:text-zaccGreen/80 text-sm font-semibold mt-2 inline-block">
                report@zacc.org.zw
              </a>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                <i class="pi pi-map-marker text-zaccGreen text-2xl"></i>
              </div>
              <div class="font-semibold mb-1">In Person</div>
              <div class="text-sm text-zaccBlack/70">Visit our offices</div>
              <NuxtLink to="/contact" class="text-zaccGreen hover:text-zaccGreen/80 text-sm font-semibold mt-2 inline-block">
                View Address
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Emergency Notice -->
        <Message severity="warn" :closable="false" class="mt-8">
          <template #icon>
            <i class="pi pi-exclamation-triangle"></i>
          </template>
          <div>
            <div class="font-semibold mb-1">Emergency Situation?</div>
            <p class="text-sm">
              If you are in immediate danger or facing a life-threatening situation, please contact local law enforcement (Police) first at <strong>999</strong> or <strong>+263 4 703 631</strong> before submitting this report.
            </p>
          </div>
        </Message>

        <!-- Back to Home -->
        <div class="text-center pt-8">
          <Button
            label="Back to Home"
            icon="pi pi-arrow-left"
            severity="secondary"
            outlined
            @click="navigateTo('/')"
          />
        </div>
      </div>
    </section>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

useHead({
  title: 'Report Corruption - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Report corruption confidentially and securely. Your identity is protected. Help us build a corruption-free Zimbabwe.'
    }
  ]
})

const toast = useToast()
const createEmptyPerson = () => ({
  name: '',
  surname: '',
  position: '',
  organization: ''
})

// Editor refs
const incidentDescriptionEditor = ref()
const additionalInfoEditor = ref()

// Form reset helper
const resetForm = async () => {
  form.isAnonymous = true
  form.name = ''
  form.email = ''
  form.phone = ''
  form.organization = ''
  form.corruptionType = null
  form.incidentDescription = ''
  form.location = ''
  form.province = null
  form.incidentDate = null
  form.incidentTime = null
  form.peopleList = [createEmptyPerson()]
  form.files = []
  form.additionalInfo = ''
  submitted.value = false
  
  // Reset Editor components
  await nextTick()
  if (incidentDescriptionEditor.value) {
    incidentDescriptionEditor.value.setContent('')
  }
  if (additionalInfoEditor.value) {
    additionalInfoEditor.value.setContent('')
  }
}

const corruptionTypes = [
  { label: 'Bribery', value: 'bribery' },
  { label: 'Embezzlement', value: 'embezzlement' },
  { label: 'Fraud', value: 'fraud' },
  { label: 'Nepotism / Favoritism', value: 'nepotism' },
  { label: 'Extortion', value: 'extortion' },
  { label: 'Abuse of Power', value: 'abuse-of-power' },
  { label: 'Conflict of Interest', value: 'conflict-of-interest' },
  { label: 'Procurement Fraud', value: 'procurement-fraud' },
  { label: 'Money Laundering', value: 'money-laundering' },
  { label: 'Other', value: 'other' }
]

const provinces = [
  { label: 'Bulawayo', value: 'bulawayo' },
  { label: 'Harare', value: 'harare' },
  { label: 'Manicaland', value: 'manicaland' },
  { label: 'Mashonaland Central', value: 'mashonaland-central' },
  { label: 'Mashonaland East', value: 'mashonaland-east' },
  { label: 'Mashonaland West', value: 'mashonaland-west' },
  { label: 'Masvingo', value: 'masvingo' },
  { label: 'Matabeleland North', value: 'matabeleland-north' },
  { label: 'Matabeleland South', value: 'matabeleland-south' },
  { label: 'Midlands', value: 'midlands' }
]

const form = reactive({
  isAnonymous: true,
  name: '',
  email: '',
  phone: '',
  organization: '',
  corruptionType: null,
  incidentDescription: '',
  location: '',
  province: null,
  incidentDate: null,
  incidentTime: null,
  peopleList: [createEmptyPerson()],
  files: [],
  additionalInfo: ''
})

const isSubmitting = ref(false)
const submitted = ref(false)
const lastSuccessReportNumber = ref('')

const onFileSelect = (event) => {
  const files = Array.from(event.files)
  files.forEach(file => {
    if (file.size > 10 * 1024 * 1024) {
      alert(`File ${file.name} is too large. Maximum size is 10MB.`)
      return
    }
    form.files.push(file)
  })
}

const removeFile = (index) => {
  form.files.splice(index, 1)
}
const addPerson = () => {
  form.peopleList.push(createEmptyPerson())
}
const removePerson = (index) => {
  form.peopleList.splice(index, 1)
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handleSubmit = async () => {
  submitted.value = true
  
  if (!form.corruptionType || !form.incidentDescription || !form.location) {
    return
  }

  isSubmitting.value = true

  try {
    // Prepare form data
    const formData = new FormData()
    
    // Add form fields
    formData.append('isAnonymous', form.isAnonymous.toString())
    formData.append('corruptionType', form.corruptionType)
    formData.append('incidentDescription', form.incidentDescription)
    formData.append('location', form.location)
    
    if (form.province) {
      formData.append('province', form.province)
    }
    
    if (form.incidentDate) {
      formData.append('incidentDate', form.incidentDate instanceof Date 
        ? form.incidentDate.toISOString() 
        : new Date(form.incidentDate).toISOString())
    }
    
    if (form.incidentTime) {
      formData.append('incidentTime', typeof form.incidentTime === 'string' 
        ? form.incidentTime 
        : form.incidentTime.toString())
    }
    
    const peopleInvolvedText = form.peopleList
      .map((p) => ({
        name: p.name?.trim(),
        surname: p.surname?.trim(),
        position: p.position?.trim(),
        organization: p.organization?.trim()
      }))
      .filter((p) => p.name || p.surname || p.position || p.organization)
      .map((p, i) => {
        const fullName = [p.name, p.surname].filter(Boolean).join(' ').trim()
        const parts = [fullName || 'Unknown name']
        if (p.position) parts.push(`Position: ${p.position}`)
        if (p.organization) parts.push(`Organization: ${p.organization}`)
        return `${i + 1}. ${parts.join(' | ')}`
      })
      .join('\n')
    if (peopleInvolvedText) {
      formData.append('peopleInvolved', peopleInvolvedText)
    }
    
    if (form.additionalInfo) {
      formData.append('additionalInfo', form.additionalInfo)
    }
    
    // Add contact info only if not anonymous
    if (!form.isAnonymous) {
      if (form.name) formData.append('name', form.name)
      if (form.email) formData.append('email', form.email)
      if (form.phone) formData.append('phone', form.phone)
      if (form.organization) formData.append('organization', form.organization)
    }
    
    // Add files
    form.files.forEach((file) => {
      formData.append('files', file)
    })
    
    // Submit to API
    const response = await $fetch('/api/public/reports', {
      method: 'POST',
      body: formData
    })
    
    // Reset form first
    resetForm()
    
    lastSuccessReportNumber.value = response.reportNumber
    // Show success message with report number
    await nextTick()
    toast.add({
      severity: 'success',
      summary: 'Report Submitted Successfully',
      detail: `Your report has been received. Reference: ${response.reportNumber}. You can track status anytime from this page.`,
      life: 10000
    })
    
    // Scroll to top to show success message
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  } catch (error: any) {
    console.error('Error submitting form:', error)
    await nextTick()
    toast.add({
      severity: 'error',
      summary: 'Submission Failed',
      detail: error.data?.message || 'There was an error submitting your report. Please try again or contact us directly.',
      life: 5000
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
:deep(.p-card) {
  box-shadow: 0 10px 30px 0 rgba(41, 61, 102, 0.2);
}

:deep(.p-inputtext),
:deep(.p-dropdown),
:deep(.p-calendar),
:deep(.p-fileupload) {
  width: 100%;
}

:deep(.p-editor-container) {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

:deep(.p-editor-container .p-editor-toolbar) {
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}

:deep(.p-editor-container .ql-editor) {
  min-height: 200px;
}

:deep(.p-panel-header) {
  background: rgba(212, 175, 55, 0.05);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

:deep(.p-button) {
  font-weight: 600;
}

:deep(.p-message) {
  border-radius: 0.75rem;
}
</style>
