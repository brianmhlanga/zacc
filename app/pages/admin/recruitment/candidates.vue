<template>
  <NuxtLayout name="dashboard">
    <div>
      <div class="mb-6">
        <h1 class="text-3xl font-extrabold text-zaccBlack">Candidate accounts</h1>
        <p class="mt-2 text-gray-600">
          Everyone who holds an account on the careers portal — including those who
          registered but have not applied for anything yet.
        </p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card v-for="t in tiles" :key="t.label" class="border-0 shadow-sm">
          <template #content>
            <div class="text-2xl font-extrabold tabular-nums" :class="t.accent">{{ t.value }}</div>
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
            search-placeholder="Name, email or phone"
            @search-input="applyFiltersDebounced()"
            @apply="applyFilters"
            @refresh="load"
            @clear="clearFilter"
            @clear-all="clearAll"
          >
            <template #primary>
              <Dropdown v-model="filters.verified" :options="YES_NO" optionLabel="label" optionValue="value"
                placeholder="Email confirmed" showClear class="w-48" @change="applyFilters" />
              <Dropdown v-model="filters.hasApplied" :options="YES_NO" optionLabel="label" optionValue="value"
                placeholder="Has applied" showClear class="w-44" @change="applyFilters" />
            </template>

            <template #advanced>
              <div class="flex flex-wrap items-center gap-4">
                <label class="flex items-center gap-2 text-sm text-gray-700">
                  <Checkbox v-model="filters.locked" binary @change="applyFilters" />
                  Locked out only
                </label>
                <Dropdown v-model="filters.active" :options="YES_NO" optionLabel="label" optionValue="value"
                  placeholder="Account active" showClear class="w-48" @change="applyFilters" />
              </div>
            </template>
          </AdminRecruitmentFilterBar>

          <DataTable :value="rows" :loading="loading" lazy paginator :rows="pageSize" :totalRecords="total"
            :first="(page - 1) * pageSize" dataKey="id" stripedRows :rowsPerPageOptions="[25, 50, 100]"
            :sortField="sortField" :sortOrder="sortOrder === 'desc' ? -1 : 1"
            @page="onPage" @sort="onSort">

            <Column header="Candidate" style="min-width:230px">
              <template #body="{ data }">
                <div class="font-semibold text-zaccBlack">{{ data.firstName }} {{ data.lastName }}</div>
                <div class="text-xs text-gray-500">{{ data.email }}</div>
                <div v-if="data.phone" class="text-xs text-gray-400">{{ data.phone }}</div>
              </template>
            </Column>

            <Column header="Account">
              <template #body="{ data }">
                <div class="flex flex-col gap-1 items-start">
                  <Tag v-if="!data.isActive" value="Deactivated" severity="danger" />
                  <Tag v-else-if="data.isLocked" value="Locked out" severity="warn" />
                  <Tag v-else-if="!data.emailVerified" value="Unconfirmed" severity="secondary" />
                  <Tag v-else value="Active" severity="success" />
                  <span v-if="data.failedLoginCount" class="text-[11px] text-gray-500">
                    {{ data.failedLoginCount }} failed attempt(s)
                  </span>
                </div>
              </template>
            </Column>

            <Column header="Profile">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <div class="h-1.5 w-16 rounded-full bg-gray-200 overflow-hidden">
                    <div class="h-full bg-zaccGreen" :style="{ width: data.profileCompletion + '%' }" />
                  </div>
                  <span class="text-xs text-gray-600 tabular-nums">{{ data.profileCompletion }}%</span>
                </div>
                <div v-if="data.province" class="text-xs text-gray-400 mt-1">{{ data.province }}</div>
              </template>
            </Column>

            <Column header="Activity">
              <template #body="{ data }">
                <div class="text-sm tabular-nums">
                  <span class="font-semibold">{{ data.applicationCount }}</span>
                  <span class="text-gray-500"> application(s)</span>
                </div>
                <div v-if="data.draftCount" class="text-[11px] text-amber-600">
                  {{ data.draftCount }} unfinished
                </div>
              </template>
            </Column>

            <Column field="createdAt" header="Registered" sortable>
              <template #body="{ data }">
                <div class="text-sm tabular-nums">{{ formatDate(data.createdAt) }}</div>
                <div class="text-[11px] text-gray-500">
                  {{ data.lastLoginAt ? 'Last in ' + formatDate(data.lastLoginAt) : 'Never signed in' }}
                </div>
              </template>
            </Column>

            <Column header="" style="width:60px">
              <template #body="{ data }">
                <Button icon="pi pi-eye" text rounded severity="info" v-tooltip.top="'Open'"
                  @click="open(data)" />
              </template>
            </Column>

            <template #empty>
              <div class="text-center py-12">
                <i class="pi pi-users text-4xl text-gray-300 mb-3 block" />
                <template v-if="hasActiveFilters">
                  <p class="font-semibold text-zaccBlack">No accounts match the current filters.</p>
                  <Button label="Clear all filters" text size="small" class="mt-2" @click="clearAll" />
                </template>
                <p v-else class="text-gray-500">Nobody has registered yet.</p>
              </div>
            </template>
          </DataTable>
        </template>
      </Card>

      <AdminUiDrawerPanel v-model:visible="drawerVisible" :title="drawerTitle" :subtitle="drawerSubtitle">
        <AdminRecruitmentCandidateDossier v-if="selectedId" :id="selectedId" @changed="load" />
      </AdminUiDrawerPanel>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useHead({ title: 'Candidate accounts - ZACC CMS' })

const YES_NO = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' }
]

const {
  rows, total, extra, loading, page, pageSize, sortField, sortOrder, filters,
  activeFilterCount, hasActiveFilters,
  load, applyFilters, applyFiltersDebounced, setPage, setPageSize, setSort,
  clearFilter, clearAll
} = useTableQuery({
  endpoint: '/api/recruitment/candidates',
  pageSize: 25,
  sortField: 'createdAt',
  sortOrder: 'desc',
  defaults: {
    search: '',
    verified: null as string | null,
    hasApplied: null as string | null,
    active: null as string | null,
    locked: false
  },
  transform: (data) => ({ rows: data.rows, total: data.total, extra: data })
})

const summary = computed<any>(() => (extra.value as any)?.summary ?? {})

const tiles = computed(() => [
  { label: 'Accounts', value: summary.value.total ?? 0, accent: 'text-zaccBlack' },
  { label: 'Confirmed', value: summary.value.verified ?? 0, accent: 'text-zaccGreen' },
  {
    label: 'Unconfirmed', value: summary.value.unverified ?? 0,
    accent: summary.value.unverified ? 'text-amber-600' : 'text-gray-400'
  },
  { label: 'Have applied', value: summary.value.withApplications ?? 0, accent: 'text-zaccBlack' },
  {
    label: 'Locked out', value: summary.value.lockedOut ?? 0,
    accent: summary.value.lockedOut ? 'text-red-600' : 'text-gray-400'
  }
])

const FILTER_LABELS: Record<string, string> = {
  search: 'Search',
  verified: 'Email confirmed',
  hasApplied: 'Has applied',
  active: 'Account active',
  locked: 'Locked out'
}

const filterChips = computed(() =>
  Object.keys(FILTER_LABELS)
    .filter((k) => {
      const v = (filters as any)[k]
      return v !== null && v !== undefined && v !== '' && v !== false
    })
    .map((k) => ({
      key: k,
      label: FILTER_LABELS[k]!,
      value: typeof (filters as any)[k] === 'boolean'
        ? 'Yes'
        : (filters as any)[k] === 'true' ? 'Yes' : (filters as any)[k] === 'false' ? 'No' : String((filters as any)[k])
    }))
)

const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const selectedId = ref<string | null>(null)
const drawerVisible = ref(false)
const drawerTitle = ref('')
const drawerSubtitle = ref('')

const open = (row: any) => {
  selectedId.value = row.id
  drawerTitle.value = `${row.firstName} ${row.lastName}`.trim()
  drawerSubtitle.value = row.email
  drawerVisible.value = true
}

const onPage = (e: any) => {
  if (e.rows !== pageSize.value) setPageSize(e.rows)
  else setPage(Math.floor(e.first / e.rows) + 1)
}
const onSort = (e: any) => {
  if (!e.sortField) return
  setSort(e.sortField, e.sortOrder === 1 ? 'asc' : 'desc')
}

// useTableQuery hydrates filters from the URL but does not fetch on its own, so
// the first load is the page's job — see applications.vue, which does the same.
onMounted(load)
</script>
