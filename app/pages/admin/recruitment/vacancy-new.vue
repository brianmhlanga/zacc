<template>
  <NuxtLayout name="dashboard">
    <div class="max-w-4xl">
      <div class="mb-6">
        <NuxtLink to="/admin/recruitment" class="text-sm text-gray-500 hover:text-zaccGreen">
          <i class="pi pi-arrow-left text-xs" /> Vacancies
        </NuxtLink>
        <h1 class="text-3xl font-extrabold text-zaccBlack">New vacancy</h1>
        <p class="mt-2 text-gray-600">
          Create the posting first. Screening and scoring are configured next.
        </p>
      </div>

      <Card class="border-0 shadow-md">
        <template #content>
          <div class="grid md:grid-cols-2 gap-4">
            <label class="block md:col-span-2">
              <span class="text-xs font-semibold text-gray-600">Title <span class="text-red-500">*</span></span>
              <InputText v-model="form.title" class="w-full mt-1" placeholder="Senior Investigations Officer"
                @blur="deriveSlug" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-gray-600">URL slug <span class="text-red-500">*</span></span>
              <InputText v-model="form.slug" class="w-full mt-1" placeholder="senior-investigations-officer" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-gray-600">Department <span class="text-red-500">*</span></span>
              <Dropdown v-model="form.department" :options="departments" class="w-full mt-1" editable />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-gray-600">Location <span class="text-red-500">*</span></span>
              <InputText v-model="form.location" class="w-full mt-1" placeholder="Harare" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-gray-600">Duty station</span>
              <InputText v-model="form.dutyStation" class="w-full mt-1" placeholder="Head Office" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-gray-600">Grade</span>
              <InputText v-model="form.grade" class="w-full mt-1" placeholder="D3" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-gray-600">Number of posts</span>
              <InputNumber v-model="form.numberOfPosts" :min="1" :max="100" class="w-full mt-1" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-gray-600">Employment type</span>
              <Dropdown v-model="form.type" :options="types" class="w-full mt-1" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-gray-600">Closing date <span class="text-red-500">*</span></span>
              <DatePicker v-model="form.closingDate" showTime hourFormat="24" dateFormat="dd M yy"
                class="w-full mt-1" showIcon />
            </label>

            <label class="block md:col-span-2">
              <span class="text-xs font-semibold text-gray-600">Summary <span class="text-red-500">*</span></span>
              <Textarea v-model="form.summary" rows="2" autoResize class="w-full mt-1"
                placeholder="One or two sentences shown on the careers listing." />
            </label>
            <div class="md:col-span-2">
              <span class="text-xs font-semibold text-gray-600">Description <span class="text-red-500">*</span></span>
              <Editor v-model="form.description" editorStyle="height:180px" class="mt-1" />
            </div>

            <div class="md:col-span-2 grid md:grid-cols-2 gap-4">
              <div>
                <span class="text-xs font-semibold text-gray-600">Key requirements <span class="text-red-500">*</span></span>
                <Chips v-model="form.keyRequirements" class="w-full mt-1" separator="," />
                <small class="text-gray-400">Press enter after each.</small>
              </div>
              <div>
                <span class="text-xs font-semibold text-gray-600">Responsibilities <span class="text-red-500">*</span></span>
                <Chips v-model="form.responsibilities" class="w-full mt-1" separator="," />
              </div>
            </div>

            <label class="block md:col-span-2">
              <span class="text-xs font-semibold text-gray-600">Benefits</span>
              <Textarea v-model="form.benefits" rows="2" autoResize class="w-full mt-1" />
            </label>
          </div>

          <div class="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <span class="text-xs font-bold uppercase tracking-wide text-gray-500">Application method</span>
            <div class="mt-2 space-y-2">
              <label class="flex items-start gap-3 cursor-pointer">
                <RadioButton v-model="form.applicationMode" value="STRUCTURED" />
                <span class="text-sm">
                  <strong>Screened application</strong> — the multi-step form with automatic scoring.
                  Comes with a starter scheme you can edit.
                </span>
              </label>
              <label class="flex items-start gap-3 cursor-pointer">
                <RadioButton v-model="form.applicationMode" value="LEGACY" />
                <span class="text-sm">
                  <strong>Simple form</strong> — name, CV and cover letter only. No scoring.
                </span>
              </label>
            </div>
          </div>

          <div class="flex items-center justify-between mt-5">
            <label class="flex items-center gap-2 text-sm">
              <Checkbox v-model="form.isPublished" binary />
              Publish immediately
              <span class="text-gray-400">— leave off while you configure screening</span>
            </label>
            <div class="flex gap-2">
              <Button label="Cancel" severity="secondary" outlined @click="navigateTo('/admin/recruitment')" />
              <Button label="Create vacancy" icon="pi pi-check" :loading="saving"
                style="background:#209341;border-color:#209341" @click="save" />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'New vacancy - ZACC CMS' })

const toast = useToast()
const saving = ref(false)

const departments = [
  'Investigations', 'Legal Services', 'Asset Recovery', 'Prevention & Corporate Governance',
  'Compliance', 'Administration', 'Information & Communication Technology', 'Finance',
  'Human Capital', 'Communications'
]
const types = ['Full-time', 'Part-time', 'Contract', 'Internship']

const form = reactive<any>({
  title: '', slug: '', department: '', location: 'Harare', dutyStation: '', grade: '',
  numberOfPosts: 1, type: 'Full-time', closingDate: null,
  summary: '', description: '', keyRequirements: [], responsibilities: [], benefits: '',
  applicationMode: 'STRUCTURED', isPublished: false, isActive: true
})

const deriveSlug = () => {
  if (form.slug) return
  form.slug = String(form.title || '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

const save = async () => {
  const missing: string[] = []
  if (!form.title?.trim()) missing.push('title')
  if (!form.slug?.trim()) missing.push('slug')
  if (!form.department?.trim()) missing.push('department')
  if (!form.location?.trim()) missing.push('location')
  if (!form.closingDate) missing.push('closing date')
  if (!form.summary?.trim()) missing.push('summary')
  if (!form.description?.trim()) missing.push('description')
  if (!form.keyRequirements.length) missing.push('at least one requirement')
  if (!form.responsibilities.length) missing.push('at least one responsibility')

  if (missing.length) {
    toast.add({
      severity: 'warn', summary: 'Missing information',
      detail: `Please provide: ${missing.join(', ')}.`, life: 5000
    })
    return
  }

  saving.value = true
  try {
    const res = await $fetch<any>('/api/recruitment/vacancies', {
      method: 'POST',
      body: { ...form, closingDate: new Date(form.closingDate).toISOString() }
    })
    toast.add({ severity: 'success', summary: 'Created', detail: res.message, life: 6000 })
    // Straight into the builder — a structured vacancy is not ready to publish
    // until its scheme has been reviewed.
    await navigateTo(`/admin/recruitment/vacancy-${res.id}`)
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Could not create',
      detail: e.data?.statusMessage || 'Failed', life: 6000
    })
  } finally {
    saving.value = false
  }
}
</script>
