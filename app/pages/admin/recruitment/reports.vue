<template>
  <NuxtLayout name="dashboard">
    <div>
      <div class="mb-6">
        <h1 class="text-3xl font-extrabold text-zaccBlack">Recruitment reports</h1>
        <p class="mt-2 text-gray-600">
          Build a report, review it here, then export it.
        </p>
      </div>

      <Card class="border-0 shadow-md mb-5">
        <template #content>
          <div class="grid md:grid-cols-4 gap-4">
            <label class="block md:col-span-2">
              <span class="text-xs font-semibold text-gray-600">Report</span>
              <Dropdown v-model="query.type" :options="reportTypes" optionLabel="label" optionValue="value"
                class="w-full mt-1" @change="rows = []" />
              <small class="text-gray-500">{{ activeDescription }}</small>
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-gray-600">Vacancies</span>
              <MultiSelect v-model="query.jobIds" :options="vacancies" optionLabel="title" optionValue="id"
                placeholder="All vacancies" class="w-full mt-1" filter :maxSelectedLabels="1" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-gray-600">Submitted between</span>
              <div class="flex gap-2 mt-1">
                <DatePicker v-model="dateFrom" dateFormat="dd M yy" placeholder="From" class="w-full" showIcon />
                <DatePicker v-model="dateTo" dateFormat="dd M yy" placeholder="To" class="w-full" showIcon />
              </div>
            </label>
          </div>

          <div class="flex flex-wrap items-center gap-4 mt-4">
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <Checkbox v-model="query.includeAutoRejected" binary /> Include auto-rejected
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <Checkbox v-model="query.includeWithdrawn" binary /> Include withdrawn
            </label>
            <div class="flex-1"></div>
            <Button label="Run report" icon="pi pi-play" :loading="running"
              style="background:#209341;border-color:#209341" @click="run" />
            <Button label="Export CSV" icon="pi pi-download" outlined :disabled="!rows.length"
              :loading="exporting" @click="exportCsv" />
          </div>
        </template>
      </Card>

      <Card v-if="rows.length || ran" class="border-0 shadow-md">
        <template #content>
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="font-bold text-zaccBlack">{{ title }}</h3>
              <p class="text-xs text-gray-500">
                {{ rows.length }} row(s) · generated {{ generatedAt }}
              </p>
            </div>
          </div>

          <DataTable :value="rows" paginator :rows="25" stripedRows :rowsPerPageOptions="[25, 50, 100]"
            scrollable scrollHeight="60vh">
            <Column v-for="col in columns" :key="col" :field="col" :header="col" sortable>
              <template #body="{ data }">
                <span v-if="data[col] === null || data[col] === undefined" class="text-gray-300">—</span>
                <span v-else-if="typeof data[col] === 'boolean'">{{ data[col] ? 'Yes' : 'No' }}</span>
                <span v-else>{{ format(data[col]) }}</span>
              </template>
            </Column>
            <template #empty>
              <div class="text-center py-10 text-gray-500">
                No rows. There may be no applications yet, or the filters exclude them all.
              </div>
            </template>
          </DataTable>
        </template>
      </Card>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Recruitment reports - ZACC CMS' })

const toast = useToast()

const reportTypes = [
  { value: 'APPLICANT_REGISTER', label: 'Applicant register', description: 'Every applicant, one row each — the exportable master list.' },
  { value: 'APPLICATION_PIPELINE', label: 'Pipeline by stage', description: 'How applications are distributed across the pipeline, with both labels.' },
  { value: 'VACANCY_PERFORMANCE', label: 'Vacancy performance', description: 'Volume, shortlist and rejection rates per vacancy.' },
  { value: 'CANDIDATE_DEMOGRAPHICS', label: 'Demographics', description: 'Gender and province split, with shortlist rate per group.' },
  { value: 'SCORE_DISTRIBUTION', label: 'Score distribution', description: 'Applicants per 10-point band — where to set a cut-off.' },
  { value: 'QUALIFICATION_PROFILE', label: 'Qualification profile', description: 'Highest qualification attained, and how each group scores.' },
  { value: 'KEYWORD_COVERAGE', label: 'Keyword coverage', description: 'Match rate per keyword, most-missed first.' },
  { value: 'INTEGRITY_FLAGS', label: 'Integrity flags', description: 'Flags raised, by code and severity.' },
  { value: 'SOURCE_OF_APPLICATION', label: 'Source of application', description: 'Where applicants heard about the post, and the quality of each channel.' }
]

const query = reactive({
  type: 'APPLICANT_REGISTER',
  jobIds: [] as string[],
  includeAutoRejected: false,
  includeWithdrawn: false
})
const dateFrom = ref<Date | null>(null)
const dateTo = ref<Date | null>(null)

const vacancies = ref<any[]>([])
const rows = ref<any[]>([])
const columns = ref<string[]>([])
const title = ref('')
const generatedAt = ref('')
const running = ref(false)
const exporting = ref(false)
const ran = ref(false)

const activeDescription = computed(
  () => reportTypes.find((r) => r.value === query.type)?.description ?? ''
)

const format = (v: any) => {
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    return new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return v
}

const body = () => ({
  ...query,
  jobIds: query.jobIds.length ? query.jobIds : undefined,
  dateFrom: dateFrom.value ? dateFrom.value.toISOString().slice(0, 10) : undefined,
  dateTo: dateTo.value ? dateTo.value.toISOString().slice(0, 10) : undefined
})

const run = async () => {
  running.value = true
  try {
    const data = await $fetch<any>('/api/recruitment/reports/run', {
      method: 'POST',
      body: { ...body(), format: 'json' }
    })
    rows.value = data.rows
    columns.value = data.columns
    title.value = data.title
    generatedAt.value = new Date(data.generatedAt).toLocaleString('en-GB')
    ran.value = true
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Report failed',
      detail: e.data?.statusMessage || 'Could not run the report', life: 5000
    })
  } finally {
    running.value = false
  }
}

const exportCsv = async () => {
  exporting.value = true
  try {
    // Same download idiom as the corruption-report PDF export.
    const blob = await $fetch<Blob>('/api/recruitment/reports/run', {
      method: 'POST',
      body: { ...body(), format: 'csv' },
      responseType: 'blob'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zacc-${query.type.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Export failed', detail: 'Could not export CSV', life: 4000 })
  } finally {
    exporting.value = false
  }
}

onMounted(async () => {
  vacancies.value = await $fetch<any[]>('/api/recruitment/vacancies').catch(() => [])
})
</script>
