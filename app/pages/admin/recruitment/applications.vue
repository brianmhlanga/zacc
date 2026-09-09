<template>
  <NuxtLayout name="dashboard">
    <div>
      <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Applications</h1>
          <p class="mt-2 text-gray-600">
            Ranked by score. Moving someone off a rejection stage cancels their queued notice.
          </p>
        </div>
        <Button label="Export CSV" icon="pi pi-download" outlined severity="secondary" :loading="exporting"
          :disabled="!total" v-tooltip.bottom="'Exports exactly what the filters above are showing'"
          @click="exportCsv" />
      </div>

      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card v-for="t in tiles" :key="t.label" class="border-0 shadow-sm">
          <template #content>
            <!-- Same box the figure will occupy, so nothing moves when it lands.
                 A tile reading "0" before the first response is a wrong number
                 stated confidently, which is worse than an obvious placeholder. -->
            <div v-if="firstLoad" class="shimmer h-8 w-16 rounded" />
            <div v-else class="text-2xl font-extrabold tabular-nums" :class="t.accent">{{ t.value }}</div>
            <div class="text-xs uppercase tracking-wide text-gray-500 font-semibold mt-1">{{ t.label }}</div>
          </template>
        </Card>
      </div>

      <Card class="border-0 shadow-md">
        <template #content>
          <AdminRecruitmentFilterBar
            v-model:search="filters.search"
            :chips="filterChips"
            :active-count="activeFilterCount"
            :loading="loading"
            search-placeholder="Reference, name or email"
            @search-input="applyFiltersDebounced()"
            @apply="applyFilters"
            @refresh="load"
            @clear="clearFilter"
            @clear-all="clearAll"
          >
            <template #primary>
              <Dropdown v-model="filters.jobId" :options="vacancies" optionLabel="title" optionValue="id"
                placeholder="All vacancies" showClear class="w-56" filter @change="applyFilters" />
              <Dropdown v-model="filters.stageId" :options="stages" optionLabel="internalLabel" optionValue="id"
                placeholder="All stages" showClear class="w-48" @change="applyFilters" />
            </template>

            <template #advanced>
              <div class="grid gap-4 md:grid-cols-3">
                <label class="block">
                  <span class="text-xs font-semibold text-gray-600">Score between</span>
                  <div class="mt-1 flex gap-2">
                    <InputNumber v-model="filters.minScore" :min="0" :max="100" placeholder="Min"
                      class="w-full" @blur="applyFilters" />
                    <InputNumber v-model="filters.maxScore" :min="0" :max="100" placeholder="Max"
                      class="w-full" @blur="applyFilters" />
                  </div>
                </label>
                <label class="block">
                  <span class="text-xs font-semibold text-gray-600">Highest qualification</span>
                  <Dropdown v-model="filters.highestQualification" :options="qualificationOptions"
                    optionLabel="label" optionValue="value" placeholder="Any" showClear
                    class="w-full mt-1" @change="applyFilters" />
                </label>
                <label class="block">
                  <span class="text-xs font-semibold text-gray-600">Province</span>
                  <Dropdown v-model="filters.province" :options="provinceOptions" placeholder="Any"
                    showClear class="w-full mt-1" @change="applyFilters" />
                </label>
                <div class="flex flex-wrap items-center gap-4 md:col-span-3">
                  <label class="flex items-center gap-2 text-sm text-gray-700">
                    <Checkbox v-model="filters.includeAutoRejected" binary @change="applyFilters" />
                    Show auto-rejected
                  </label>
                  <label class="flex items-center gap-2 text-sm text-gray-700">
                    <Checkbox v-model="filters.flaggedOnly" binary @change="applyFilters" />
                    Integrity flags only
                  </label>
                  <label class="flex items-center gap-2 text-sm text-gray-700">
                    <Checkbox v-model="filters.shortlistedOnly" binary @change="applyFilters" />
                    Shortlisted only
                  </label>
                </div>
              </div>
            </template>
          </AdminRecruitmentFilterBar>

          <DataTable :value="rows" :loading="loading" lazy paginator :rows="pageSize" :totalRecords="total"
            :first="(page - 1) * pageSize" dataKey="id" stripedRows :rowsPerPageOptions="[25, 50, 100]"
            :sortField="sortField" :sortOrder="sortOrder === 'desc' ? -1 : 1"
            @page="onPage" @sort="onSort">
            <Column field="referenceNumber" header="Reference" style="min-width:170px">
              <template #body="{ data }">
                <div class="font-mono text-xs text-gray-600">{{ data.referenceNumber || '—' }}</div>
                <Tag v-if="data.mode === 'LEGACY'" value="Legacy" severity="secondary" class="mt-1" />
                <Tag v-if="data.wasTestModeAtSubmit" value="Test" severity="warn" class="mt-1"
                  v-tooltip.top="'Submitted while the vacancy was in test mode'" />
              </template>
            </Column>

            <Column header="Applicant" style="min-width:200px">
              <template #body="{ data }">
                <div class="font-semibold text-zaccBlack">
                  {{ [data.firstName, data.lastName].filter(Boolean).join(' ') || data.name }}
                </div>
                <div class="text-xs text-gray-500">{{ data.job?.title }}</div>
              </template>
            </Column>

            <Column header="Profile">
              <template #body="{ data }">
                <div class="text-xs text-gray-600">
                  {{ data.highestQualification ? qualLabel(data.highestQualification) : '—' }}<br>
                  <span v-if="data.totalYearsExperience != null" class="tabular-nums">{{ data.totalYearsExperience }} yrs</span>
                </div>
              </template>
            </Column>

            <Column field="finalScore" header="Score" sortable>
              <template #body="{ data }">
                <div v-if="data.finalScore == null" class="text-gray-400 text-sm">—</div>
                <div v-else class="flex items-center gap-2">
                  <span class="text-lg font-extrabold tabular-nums" :class="scoreClass(data.finalScore)">
                    {{ Math.round(data.finalScore) }}
                  </span>
                  <i v-if="data.panelDisagreement" class="pi pi-exclamation-triangle text-amber-500 text-xs"
                    v-tooltip.top="`Panel disagreement — spread ${Math.round(data.panelScoreSpread)} pts`" />
                </div>
                <div v-if="data.panelReviewCount" class="text-[11px] text-gray-500">
                  {{ data.panelReviewCount }} reviewer(s)
                </div>
              </template>
            </Column>

            <Column field="keywordMatchPct" header="Keywords" sortable>
              <template #body="{ data }">
                <span v-if="data.keywordMatchPct == null" class="text-gray-400">—</span>
                <span v-else class="text-sm tabular-nums">{{ Math.round(data.keywordMatchPct) }}%</span>
              </template>
            </Column>

            <Column header="Integrity">
              <template #body="{ data }">
                <Tag v-if="data.isAutoRejected" value="Auto-rejected" severity="danger" />
                <Tag v-else-if="data.integrityFlagCount > 0" :value="`${data.integrityFlagCount} flag(s)`"
                  severity="warn" />
                <Tag v-else value="Clean" severity="success" />
              </template>
            </Column>

            <Column header="Stage" style="min-width:200px">
              <template #body="{ data }">
                <Dropdown :modelValue="data.stage?.id" :options="stages" optionLabel="internalLabel" optionValue="id"
                  placeholder="Unassigned" class="w-full text-sm"
                  @update:modelValue="changeStage(data, $event)" />
                <div v-if="data.stage" class="text-[11px] text-gray-500 mt-1">
                  Candidate sees "{{ data.stage.publicLabel }}"
                </div>
              </template>
            </Column>

            <Column header="" style="width:90px">
              <template #body="{ data }">
                <Button icon="pi pi-eye" text rounded severity="info" v-tooltip.top="'Open dossier'"
                  @click="openDossier(data)" />
                <!-- The full page is still there. Middle-click, bookmark and
                     the links inside notification emails all land on it. -->
                <NuxtLink :to="`/admin/recruitment/application-${data.id}`" target="_blank"
                  class="inline-grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:text-zaccGreen"
                  v-tooltip.top="'Open in a new tab'" @click.stop>
                  <i class="pi pi-external-link text-sm" />
                </NuxtLink>
              </template>
            </Column>

            <template #empty>
              <!-- Filter-aware: "nothing exists" and "you filtered it away" are
                   different problems with different next actions. -->
              <div class="text-center py-12">
                <i class="pi pi-inbox text-4xl text-gray-300 mb-3 block" />
                <template v-if="hasActiveFilters">
                  <p class="font-semibold text-zaccBlack">No applicants match the current filters.</p>
                  <Button label="Clear all filters" text size="small" class="mt-2" @click="clearAll" />
                </template>
                <p v-else class="text-gray-500">No applications yet.</p>
              </div>
            </template>
          </DataTable>
        </template>
      </Card>

      <!-- Reviewing is a sequence of decisions against one list. A drawer keeps
           the list, its filters and the scroll position in place between them. -->
      <AdminUiDrawerPanel v-model:visible="dossierVisible" :title="dossierTitle" :subtitle="dossierSubtitle">
        <template #actions>
          <NuxtLink v-if="dossierId" :to="`/admin/recruitment/application-${dossierId}`"
            class="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-zaccGreen"
            v-tooltip.bottom="'Open as a full page'">
            <i class="pi pi-external-link text-sm" />
          </NuxtLink>
        </template>
        <AdminRecruitmentApplicationDossier v-if="dossierId" :id="dossierId" dense
          @loaded="onDossierLoaded" @changed="load" />
      </AdminUiDrawerPanel>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { qualificationLabel, QUALIFICATION_LEVELS } from '#shared/recruitment/qualifications'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Applications - ZACC CMS' })

const toast = useToast()
const stages = ref<any[]>([])
const vacancies = ref<any[]>([])

const qualLabel = (l: string) => qualificationLabel(l as any)

const scoreClass = (s: number) =>
  s >= 80 ? 'text-green-600' : s >= 65 ? 'text-lime-600' : s >= 50 ? 'text-amber-600' : 'text-red-600'

const qualificationOptions = QUALIFICATION_LEVELS.map((q) => ({ label: q.label, value: q.level }))
const provinceOptions = [
  'Harare', 'Bulawayo', 'Manicaland', 'Mashonaland Central', 'Mashonaland East',
  'Mashonaland West', 'Masvingo', 'Matabeleland North', 'Matabeleland South', 'Midlands'
]

/**
 * Server-paginated, URL-backed and race-guarded. The guard matters here: typing
 * in the search box fires a request per keystroke, and a stale response would
 * paint rows carrying scores a reviewer may act on.
 */
const {
  rows, total, extra, loading, page, pageSize, sortField, sortOrder, filters,
  activeFilterCount, hasActiveFilters, currentQuery,
  load, applyFilters, applyFiltersDebounced, setPage, setPageSize, setSort,
  clearFilter, clearAll
} = useTableQuery({
  endpoint: '/api/recruitment/applications',
  pageSize: 25,
  sortField: 'finalScore',
  sortOrder: 'desc',
  defaults: {
    jobId: null as string | null,
    stageId: null as string | null,
    search: '',
    includeAutoRejected: false,
    flaggedOnly: false,
    shortlistedOnly: false,
    minScore: null as number | null,
    maxScore: null as number | null,
    highestQualification: null as string | null,
    province: null as string | null
  },
  transform: (data) => ({ rows: data.rows, total: data.total, extra: data })
})

// The endpoint returns the stage catalogue and the summary alongside the rows.
watch(extra, (d: any) => {
  if (d?.stages) stages.value = d.stages
})
const summary = computed<any>(() => (extra.value as any)?.summary ?? {})

const FILTER_LABELS: Record<string, string> = {
  jobId: 'Vacancy',
  stageId: 'Stage',
  search: 'Search',
  includeAutoRejected: 'Auto-rejected',
  flaggedOnly: 'Integrity flags',
  shortlistedOnly: 'Shortlisted',
  minScore: 'Min score',
  maxScore: 'Max score',
  highestQualification: 'Qualification',
  province: 'Province'
}

/** Resolves ids to names so a chip reads as something a person recognises. */
const chipValue = (key: string, value: any): string => {
  if (key === 'jobId') return vacancies.value.find((v) => v.id === value)?.title ?? 'Selected'
  if (key === 'stageId') return stages.value.find((s) => s.id === value)?.internalLabel ?? 'Selected'
  if (key === 'highestQualification') return qualLabel(value)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

const filterChips = computed(() =>
  Object.keys(FILTER_LABELS)
    .filter((k) => {
      const v = (filters as any)[k]
      return v !== null && v !== undefined && v !== '' && v !== false
    })
    .map((k) => ({ key: k, label: FILTER_LABELS[k]!, value: chipValue(k, (filters as any)[k]) }))
)

const tiles = computed(() => [
  { label: 'Applications', value: summary.value.total ?? 0, accent: 'text-zaccBlack' },
  { label: 'Shortlisted', value: summary.value.shortlisted ?? 0, accent: 'text-zaccGreen' },
  {
    label: 'Integrity flags', value: summary.value.flagged ?? 0,
    accent: summary.value.flagged ? 'text-red-600' : 'text-gray-400'
  },
  { label: 'Average score', value: summary.value.averageScore ?? '—', accent: 'text-zaccBlack' },
  {
    label: 'Female applicants',
    value: summary.value.femalePct != null ? `${summary.value.femalePct}%` : '—',
    accent: 'text-zaccBlack'
  }
])

/** True until the first response lands, so tiles can hold their shape. */
const firstLoad = ref(true)
watch(loading, (isLoading) => { if (!isLoading) firstLoad.value = false })

const exporting = ref(false)

/**
 * Posts the list's own query object, so the file and the screen cannot disagree.
 * Fetched as a blob rather than opened as a link because the endpoint refuses an
 * over-cap export with a 413, and a plain link would navigate away to show it.
 */
const exportCsv = async () => {
  exporting.value = true
  try {
    const blob = await $fetch<Blob>('/api/recruitment/applications/export', {
      // Sort included too, so the rows land in the order they were read on screen.
      query: { ...currentQuery.value, sortField: sortField.value, sortOrder: sortOrder.value },
      responseType: 'blob'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `zacc-applicants-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.add({
      severity: 'success', summary: 'Export ready',
      detail: `${total.value} applicant record(s). The download is logged.`, life: 5000
    })
  } catch (e: any) {
    toast.add({
      severity: 'warn', summary: 'Export not produced',
      detail: e.data?.statusMessage || 'The export failed.', life: 8000
    })
  } finally {
    exporting.value = false
  }
}

const dossierId = ref<string | null>(null)
const dossierVisible = ref(false)
const dossierTitle = ref('')
const dossierSubtitle = ref('')

const openDossier = (row: any) => {
  dossierId.value = row.id
  // Seeded from the row so the header is right before the fetch returns.
  dossierTitle.value = [row.firstName, row.lastName].filter(Boolean).join(' ') || row.name || 'Applicant'
  dossierSubtitle.value = [row.referenceNumber, row.job?.title].filter(Boolean).join(' · ')
  dossierVisible.value = true
}

const onDossierLoaded = (a: any) => {
  dossierTitle.value = a.fullName || dossierTitle.value
  dossierSubtitle.value = [a.referenceNumber, a.job?.title].filter(Boolean).join(' · ')
}

const onPage = (e: any) => {
  if (e.rows !== pageSize.value) setPageSize(e.rows)
  else setPage(Math.floor(e.first / e.rows) + 1)
}

const onSort = (e: any) => {
  if (!e.sortField) return
  setSort(e.sortField, e.sortOrder === 1 ? 'asc' : 'desc')
}

const changeStage = async (row: any, stageId: string) => {
  if (!stageId || stageId === row.stage?.id) return
  try {
    const res = await $fetch<any>(`/api/recruitment/applications/${row.id}/stage`, {
      method: 'PUT',
      body: { stageId }
    })
    // The cancellation is the reassuring bit — say so explicitly rather than
    // leaving the reviewer to wonder whether a rejection is still in flight.
    const cancelled = res.cancelledNotifications
      ? ` ${res.cancelledNotifications} queued notice(s) cancelled.`
      : ''
    toast.add({
      severity: 'success', summary: 'Stage updated',
      detail: (res.message || '') + cancelled, life: 6000
    })
    await load()
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Could not change stage',
      detail: e.data?.statusMessage || 'Failed', life: 5000
    })
    await load()
  }
}

onMounted(async () => {
  // useTableQuery already hydrated the filters from the URL, which is how
  // /admin/recruitment/shortlist-<id> forwards here pre-filtered by ?jobId=.
  vacancies.value = await $fetch<any[]>('/api/recruitment/vacancies').catch(() => [])
  await load()
})
</script>

<style scoped>
/* Placeholder that occupies the figure's box exactly, so the tile does not
   resize when the number arrives. */
.shimmer {
  background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 37%, #eef2f7 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .shimmer { animation: none; }
}
</style>
