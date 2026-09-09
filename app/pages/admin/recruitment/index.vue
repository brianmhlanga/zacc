<template>
  <NuxtLayout name="dashboard">
    <div>
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Vacancies</h1>
          <p class="mt-2 text-gray-600">
            Advertise posts and configure how applications are screened and scored.
          </p>
        </div>
        <Button label="New vacancy" icon="pi pi-plus" @click="createVacancy"
          style="background:#209341;border-color:#209341" />
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card v-for="tile in tiles" :key="tile.label" class="border-0 shadow-sm">
          <template #content>
            <div class="text-2xl font-extrabold" :class="tile.accent">{{ tile.value }}</div>
            <div class="text-xs uppercase tracking-wide text-gray-500 font-semibold mt-1">
              {{ tile.label }}
            </div>
          </template>
        </Card>
      </div>

      <Message v-if="needsAttention.length" severity="warn" :closable="false" class="mb-4">
        <span class="font-semibold">{{ needsAttention.length }} vacancy(ies) need configuration.</span>
        A published vacancy with no scoring criteria will accept applications and score every one of them zero.
      </Message>

      <Card class="border-0 shadow-md">
        <template #content>
          <div class="flex flex-wrap gap-3 mb-4">
            <Dropdown v-model="filters.mode" :options="modeOptions" optionLabel="label" optionValue="value"
              placeholder="All modes" showClear class="w-52" @change="load" />
            <Dropdown v-model="filters.isPublished" :options="publishOptions" optionLabel="label" optionValue="value"
              placeholder="All statuses" showClear class="w-44" @change="load" />
            <InputText v-model="search" placeholder="Search title or department" class="w-64" />
          </div>

          <DataTable :value="filtered" :loading="loading" paginator :rows="10" stripedRows dataKey="id"
            :rowsPerPageOptions="[10, 25, 50]">
            <Column field="title" header="Vacancy" sortable>
              <template #body="{ data }">
                <div class="font-semibold text-zaccBlack">{{ data.title }}</div>
                <div class="text-xs text-gray-500">
                  {{ data.department }}
                  <span v-if="data.grade"> · Grade {{ data.grade }}</span>
                  <span v-if="data.numberOfPosts > 1"> · {{ data.numberOfPosts }} posts</span>
                </div>
              </template>
            </Column>

            <Column header="Mode">
              <template #body="{ data }">
                <Tag :value="data.applicationMode === 'STRUCTURED' ? 'Screened' : 'Legacy'"
                  :severity="data.applicationMode === 'STRUCTURED' ? 'success' : 'secondary'" />
              </template>
            </Column>

            <Column header="Screening">
              <template #body="{ data }">
                <div v-if="data.applicationMode !== 'STRUCTURED'" class="text-gray-400 text-sm">—</div>
                <div v-else-if="!data.schemeReady" class="flex items-center gap-1 text-sm text-red-600 font-semibold">
                  <i class="pi pi-exclamation-triangle text-xs" /> Not configured
                </div>
                <div v-else class="text-xs text-gray-600 leading-relaxed">
                  {{ data._count.criteria }} criteria · {{ data._count.disqualifiers }} rules<br>
                  {{ data._count.documentSlots }} documents · {{ data._count.panelMembers }} panel
                </div>
              </template>
            </Column>

            <Column field="closingDate" header="Closes" sortable>
              <template #body="{ data }">
                <div>{{ formatDate(data.closingDate) }}</div>
                <div class="text-xs" :class="data.daysToClose < 0 ? 'text-gray-400' : 'text-gray-500'">
                  {{ data.daysToClose < 0 ? 'Closed' : `${data.daysToClose} days left` }}
                </div>
              </template>
            </Column>

            <Column header="Status">
              <template #body="{ data }">
                <div class="flex flex-col items-start gap-1">
                  <Tag :value="data.isOpen ? 'Open' : data.isPublished ? 'Closed' : 'Draft'"
                    :severity="data.isOpen ? 'success' : data.isPublished ? 'secondary' : 'warn'" />
                  <!-- Test mode is a property of the vacancy, not a lifecycle
                       state, so it sits beside the state rather than replacing it. -->
                  <Tag v-if="data.isTestMode" value="Test mode" severity="warn"
                    v-tooltip.top="'Visible on the careers site to signed-in staff only'" />
                </div>
              </template>
            </Column>

            <Column field="applicationCount" header="Applications" sortable>
              <template #body="{ data }">
                <span class="font-semibold">{{ data._count.applications }}</span>
              </template>
            </Column>

            <Column header="Actions" style="min-width:150px">
              <template #body="{ data }">
                <div class="flex items-center gap-1">
                  <Button icon="pi pi-sliders-h" text rounded severity="success"
                    v-tooltip.top="'Configure screening'"
                    @click="navigateTo(`/admin/recruitment/vacancy-${data.id}`)" />
                  <Button icon="pi pi-users" text rounded severity="info"
                    v-tooltip.top="'View applications'" :disabled="data._count.applications === 0"
                    @click="navigateTo(`/admin/recruitment/shortlist-${data.id}`)" />
                  <Button icon="pi pi-pencil" text rounded severity="secondary"
                    v-tooltip.top="'Edit posting details'"
                    @click="navigateTo(`/admin/recruitment/vacancy-${data.id}?tab=details`)" />
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="text-center py-10 text-gray-500">
                No vacancies yet. Create one to configure screening.
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
useHead({ title: 'Vacancies - ZACC CMS' })

const toast = useToast()
const items = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const filters = reactive<{ mode: string | null; isPublished: string | null }>({
  mode: null,
  isPublished: null
})

const modeOptions = [
  { label: 'Screened (wizard)', value: 'STRUCTURED' },
  { label: 'Legacy form', value: 'LEGACY' }
]
const publishOptions = [
  { label: 'Published', value: 'true' },
  { label: 'Draft', value: 'false' }
]

const load = async () => {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filters.mode) params.mode = filters.mode
    if (filters.isPublished) params.isPublished = filters.isPublished
    items.value = await $fetch('/api/recruitment/vacancies', { params })
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Error',
      detail: e.data?.statusMessage || e.data?.message || 'Failed to load vacancies', life: 4000
    })
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter((j) =>
    [j.title, j.department, j.location, j.grade].filter(Boolean).some((v: string) => v.toLowerCase().includes(q))
  )
})

const needsAttention = computed(() => items.value.filter((j) => !j.schemeReady))

const tiles = computed(() => {
  const open = items.value.filter((j) => j.isOpen).length
  const apps = items.value.reduce((sum, j) => sum + (j._count?.applications ?? 0), 0)
  return [
    { label: 'Open vacancies', value: open, accent: 'text-zaccGreen' },
    { label: 'Total vacancies', value: items.value.length, accent: 'text-zaccBlack' },
    { label: 'Applications', value: apps, accent: 'text-zaccBlack' },
    {
      label: 'Need configuration',
      value: needsAttention.value.length,
      accent: needsAttention.value.length ? 'text-red-600' : 'text-gray-400'
    }
  ]
})

const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const createVacancy = () => navigateTo('/admin/recruitment/vacancy-new')

onMounted(load)
</script>
