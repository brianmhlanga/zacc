<template>
  <NuxtLayout name="dashboard">
    <div>
      <div class="mb-6">
        <h1 class="text-3xl font-extrabold text-zaccBlack">My panel reviews</h1>
        <p class="mt-2 text-gray-600">
          Applications assigned to you for scoring. What you can see of each candidate depends on
          the masking set for you on that vacancy.
        </p>
      </div>

      <div v-if="loading" class="py-16 text-center text-gray-500">
        <i class="pi pi-spin pi-spinner text-2xl" />
      </div>

      <div v-else-if="!panelCount" class="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
        <i class="pi pi-check-square text-4xl text-gray-300 mb-3 block" />
        <h3 class="text-lg font-semibold text-zaccBlack mb-1">You are not on any panel</h3>
        <p class="text-gray-500 max-w-md mx-auto">
          Panel members are assigned per vacancy, on the Panel tab of the vacancy configuration.
        </p>
      </div>

      <template v-else>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card v-for="t in tiles" :key="t.label" class="border-0 shadow-sm">
            <template #content>
              <div class="text-2xl font-extrabold" :class="t.accent">{{ t.value }}</div>
              <div class="text-xs uppercase tracking-wide text-gray-500 font-semibold mt-1">{{ t.label }}</div>
            </template>
          </Card>
        </div>

        <Card class="border-0 shadow-md">
          <template #content>
            <div class="flex flex-wrap items-center gap-3 mb-4">
              <Dropdown v-model="jobFilter" :options="vacancies" optionLabel="title" optionValue="id"
                placeholder="All my panels" showClear class="w-72" />
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <Checkbox v-model="outstandingOnly" binary /> Outstanding only
              </label>
            </div>

            <DataTable :value="filtered" paginator :rows="15" stripedRows dataKey="id">
              <Column header="Candidate" style="min-width:200px">
                <template #body="{ data }">
                  <div class="font-semibold text-zaccBlack">{{ data.displayName }}</div>
                  <div class="text-xs text-gray-500 font-mono" v-if="data.referenceNumber">
                    {{ data.referenceNumber }}
                  </div>
                  <div class="text-xs text-gray-400" v-else>Identity withheld from this panel</div>
                </template>
              </Column>

              <Column field="vacancy" header="Vacancy" sortable>
                <template #body="{ data }">
                  <div class="text-sm">{{ data.vacancy }}</div>
                  <div class="text-xs text-gray-500">{{ data.department }}</div>
                </template>
              </Column>

              <Column header="Profile">
                <template #body="{ data }">
                  <div class="text-xs text-gray-600">
                    {{ data.highestQualification ? qualLabel(data.highestQualification) : '—' }}
                    <span v-if="data.totalYearsExperience != null"> · {{ data.totalYearsExperience }} yrs</span>
                  </div>
                </template>
              </Column>

              <Column header="Stage">
                <template #body="{ data }">
                  <Tag v-if="data.stage" :value="data.stage.internalLabel"
                    :style="{ background: data.stage.colorHex, color: '#fff' }" />
                </template>
              </Column>

              <Column header="My progress" style="min-width:160px">
                <template #body="{ data }">
                  <div class="flex items-center gap-2">
                    <ProgressBar
                      :value="data.expectedCriteria ? (data.submittedCriteria / data.expectedCriteria) * 100 : 0"
                      :showValue="false" style="height:6px" class="flex-1" />
                    <span class="text-xs text-gray-500 whitespace-nowrap">
                      {{ data.submittedCriteria }}/{{ data.expectedCriteria }}
                    </span>
                  </div>
                </template>
              </Column>

              <Column header="" style="width:130px">
                <template #body="{ data }">
                  <Button :label="data.isComplete ? 'Review' : 'Score'"
                    :severity="data.isComplete ? 'secondary' : undefined"
                    :outlined="data.isComplete" size="small"
                    :style="data.isComplete ? undefined : 'background:#209341;border-color:#209341'"
                    @click="navigateTo(`/admin/recruitment/review-${data.id}`)" />
                </template>
              </Column>

              <template #empty>
                <div class="text-center py-10 text-gray-500">
                  Nothing awaiting your review.
                </div>
              </template>
            </DataTable>
          </template>
        </Card>
      </template>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { qualificationLabel } from '#shared/recruitment/qualifications'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'My panel reviews - ZACC CMS' })

const toast = useToast()
const assignments = ref<any[]>([])
const vacancies = ref<any[]>([])
const panelCount = ref(0)
const loading = ref(true)
const jobFilter = ref<string | null>(null)
const outstandingOnly = ref(true)

const qualLabel = (l: string) => qualificationLabel(l as any)

const filtered = computed(() =>
  assignments.value.filter((a) => {
    if (jobFilter.value && a.jobId !== jobFilter.value) return false
    if (outstandingOnly.value && a.isComplete) return false
    return true
  })
)

const tiles = computed(() => {
  const done = assignments.value.filter((a) => a.isComplete).length
  return [
    { label: 'Assigned to me', value: assignments.value.length, accent: 'text-zaccBlack' },
    { label: 'Outstanding', value: assignments.value.length - done, accent: assignments.value.length - done ? 'text-amber-600' : 'text-gray-400' },
    { label: 'Completed', value: done, accent: 'text-zaccGreen' },
    { label: 'Panels', value: panelCount.value, accent: 'text-zaccBlack' }
  ]
})

onMounted(async () => {
  try {
    const data = await $fetch<any>('/api/recruitment/panel')
    assignments.value = data.assignments
    vacancies.value = data.vacancies ?? []
    panelCount.value = data.panelCount
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Error',
      detail: e.data?.statusMessage || 'Failed to load your panel queue', life: 4000
    })
  } finally {
    loading.value = false
  }
})
</script>
