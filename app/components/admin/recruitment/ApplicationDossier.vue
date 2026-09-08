<template>
  <div v-if="loading" class="py-16 text-center text-gray-500">
    <i class="pi pi-spin pi-spinner text-2xl" />
  </div>

  <div v-else-if="!a" class="py-16 text-center text-gray-500">Application not found.</div>

  <div v-else>
    <!-- A queued rejection changes what the decision below means, so it sits
         above the control that would cancel it. -->
    <Message v-if="pending.length" severity="warn" :closable="false" class="mb-4">
      <div class="font-semibold">{{ pending.length }} notification(s) queued</div>
      <div v-for="p in pending" :key="p.id" class="text-sm">
        "{{ p.subject }}" — due {{ formatDateTime(p.scheduledFor) }}. Changing stage cancels it.
      </div>
    </Message>

    <Message v-if="a.isAutoRejected" severity="error" :closable="false" class="mb-4">
      <span class="font-semibold">Auto-rejected.</span>
      {{ (a.autoRejectReasons || []).map((r: any) => r.label).join(', ') }}
    </Message>

    <!-- Decision first. A reviewer opens this to decide, not to read. -->
    <div class="mb-5 rounded-xl border border-gray-200 bg-white p-4">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <span class="text-xs font-bold uppercase tracking-wide text-gray-500">Stage</span>
          <Dropdown :modelValue="a.stage?.id" :options="stages" optionLabel="internalLabel" optionValue="id"
            class="mt-1 w-full max-w-xs" :loading="changing" @update:modelValue="changeStage" />
          <p v-if="a.stage" class="mt-2 text-sm text-gray-500">
            Candidate sees "<strong class="text-zaccBlack">{{ a.stage.publicLabel }}</strong>"
            <span v-if="heldFromCandidate" class="text-amber-600">
              — held until the queued notice sends
            </span>
          </p>
        </div>
        <div class="text-right">
          <div class="text-4xl font-extrabold tabular-nums" :class="scoreClass(a.finalScore)">
            {{ a.finalScore != null ? Math.round(a.finalScore) : '—' }}
          </div>
          <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Score</div>
        </div>
      </div>
    </div>

    <Tabs value="profile">
      <TabList>
        <Tab value="profile">Profile</Tab>
        <Tab value="scoring">Scoring</Tab>
        <Tab value="documents">Documents ({{ a.documents?.length || 0 }})</Tab>
        <Tab value="panel">Panel ({{ a.panelScores?.length || 0 }})</Tab>
        <Tab value="history">History</Tab>
      </TabList>

      <TabPanels>
        <TabPanel value="profile">
          <div class="grid gap-5" :class="dense ? '' : 'md:grid-cols-2'">
            <Card class="border-0 shadow-sm">
              <template #content>
                <h3 class="font-bold text-zaccBlack mb-3">Personal</h3>
                <dl class="text-sm space-y-2">
                  <div v-for="f in personalFields" :key="f.label" class="flex justify-between gap-3">
                    <dt class="text-gray-500">{{ f.label }}</dt>
                    <dd class="font-semibold text-right">{{ f.value ?? '—' }}</dd>
                  </div>
                </dl>
              </template>
            </Card>

            <Card class="border-0 shadow-sm">
              <template #content>
                <h3 class="font-bold text-zaccBlack mb-3">Qualifications</h3>
                <div v-if="!a.qualifications?.length" class="text-sm text-gray-400">None recorded.</div>
                <div v-for="q in a.qualifications" :key="q.id" class="mb-2 text-sm">
                  <span class="font-semibold">{{ qualLabel(q.level) }}</span>
                  <span v-if="q.fieldOfStudy" class="text-gray-600"> — {{ q.fieldOfStudy }}</span>
                  <div class="text-xs text-gray-500">
                    {{ q.institution }}<span v-if="q.yearObtained"> · {{ q.yearObtained }}</span>
                  </div>
                </div>
              </template>
            </Card>

            <Card class="border-0 shadow-sm" :class="dense ? '' : 'md:col-span-2'">
              <template #content>
                <h3 class="font-bold text-zaccBlack mb-3">Employment history</h3>
                <div v-if="!a.employments?.length" class="text-sm text-gray-400">None recorded.</div>
                <div v-for="e in a.employments" :key="e.id" class="mb-4 last:mb-0">
                  <div class="font-semibold">
                    {{ e.jobTitle }} <span class="font-normal text-gray-500">at {{ e.employer }}</span>
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ e.fromMonth || '?' }} – {{ e.isCurrent ? 'present' : (e.toMonth || '?') }}
                    <span v-if="e.reasonForLeaving"> · left: {{ e.reasonForLeaving }}</span>
                  </div>
                  <p v-if="e.responsibilities" class="text-sm text-gray-600 mt-1">{{ e.responsibilities }}</p>
                </div>
              </template>
            </Card>

            <Card v-if="a.declarations?.length" class="border-0 shadow-sm" :class="dense ? '' : 'md:col-span-2'">
              <template #content>
                <h3 class="font-bold text-zaccBlack mb-3">Integrity declarations</h3>
                <div v-for="d in a.declarations" :key="d.id" class="mb-3 last:mb-0 rounded-lg p-3"
                  :class="d.isAdverse ? 'bg-red-50 border border-red-200' : 'bg-gray-50'">
                  <div class="flex items-start justify-between gap-3">
                    <span class="text-sm">{{ d.question }}</span>
                    <Tag :value="d.answer ? 'Yes' : 'No'" :severity="d.isAdverse ? 'danger' : 'success'" />
                  </div>
                  <p v-if="d.explanation" class="text-sm text-gray-700 mt-2">{{ d.explanation }}</p>
                </div>
              </template>
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="scoring">
          <Card class="border-0 shadow-sm mb-4">
            <template #content>
              <h3 class="font-bold text-zaccBlack mb-3">How the score was reached</h3>
              <DataTable :value="a.criterionScores" stripedRows>
                <Column field="criterionKey" header="Criterion" />
                <Column v-if="!dense" field="bucket" header="Bucket" />
                <Column header="Raw" bodyClass="tabular-nums">
                  <template #body="{ data }">
                    {{ Math.round(data.rawPoints) }}/{{ Math.round(data.maxPoints) }}
                  </template>
                </Column>
                <Column header="Weighted" bodyClass="tabular-nums">
                  <template #body="{ data }">
                    <span v-if="data.pending" class="text-amber-600 text-xs">pending panel</span>
                    <span v-else class="font-semibold">{{ data.weightedPoints.toFixed(1) }}</span>
                  </template>
                </Column>
                <Column v-if="!dense" field="explanation" header="Why" />
              </DataTable>
            </template>
          </Card>

          <Card v-if="a.keywordHits?.length" class="border-0 shadow-sm">
            <template #content>
              <h3 class="font-bold text-zaccBlack mb-3">
                Keyword match — {{ a.keywordMatchPct != null ? Math.round(a.keywordMatchPct) : 0 }}%
              </h3>
              <div class="flex flex-wrap gap-2">
                <span v-for="k in a.keywordHits" :key="k.id" class="rounded-full border px-3 py-1 text-xs"
                  :class="k.matched
                    ? 'border-green-300 bg-green-50 text-green-800'
                    : k.isRequired ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 text-gray-400'">
                  {{ k.keyword }}
                  <span v-if="k.isRequired" class="font-bold">*</span>
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-2">* required keyword</p>
            </template>
          </Card>
        </TabPanel>

        <TabPanel value="documents">
          <Card class="border-0 shadow-sm">
            <template #content>
              <div v-if="!a.documents?.length" class="text-sm text-gray-400">No documents attached.</div>
              <a v-for="d in a.documents" :key="d.id" :href="d.signedUrl" target="_blank" rel="noopener"
                class="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 mb-2 hover:border-zaccGreen">
                <i class="pi pi-file text-zaccGreen text-lg" />
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate">{{ d.fileName }}</div>
                  <div class="text-xs text-gray-500">
                    <span v-if="d.label">{{ d.label }} · </span>
                    {{ d.fileType?.toUpperCase() }} · {{ formatSize(d.fileSize) }}
                  </div>
                </div>
                <Tag :value="d.verification" :severity="d.verification === 'VERIFIED' ? 'success' : 'secondary'" />
              </a>
              <p class="text-xs text-gray-400 mt-3">Links are signed and expire after 30 minutes.</p>
            </template>
          </Card>
        </TabPanel>

        <TabPanel value="panel">
          <Card class="border-0 shadow-sm">
            <template #content>
              <div v-if="!a.panelScores?.length" class="text-sm text-gray-400">
                No panel scores submitted yet.
              </div>
              <div v-else>
                <div class="flex flex-wrap gap-6 mb-4">
                  <div v-for="s in panelSummary" :key="s.label">
                    <div class="text-xl font-extrabold tabular-nums" :class="s.accent">{{ s.value }}</div>
                    <div class="text-xs uppercase tracking-wide text-gray-500 font-semibold">{{ s.label }}</div>
                  </div>
                </div>
                <DataTable :value="a.panelScores" stripedRows>
                  <Column header="Reviewer">
                    <template #body="{ data }">{{ data.reviewer?.name || data.reviewer?.email }}</template>
                  </Column>
                  <Column header="Criterion">
                    <template #body="{ data }">{{ data.criterion?.label }}</template>
                  </Column>
                  <Column header="Score" bodyClass="tabular-nums">
                    <template #body="{ data }">{{ data.points }}/{{ data.maxPoints }}</template>
                  </Column>
                  <Column v-if="!dense" field="comment" header="Comment" />
                </DataTable>
              </div>
            </template>
          </Card>
        </TabPanel>

        <TabPanel value="history">
          <Card class="border-0 shadow-sm">
            <template #content>
              <h3 class="font-bold text-zaccBlack mb-3">Stage history</h3>
              <Timeline :value="a.stageEvents" class="mt-2">
                <template #content="{ item }">
                  <div class="pb-4">
                    <div class="font-semibold text-sm">{{ item.toInternalLabel }}</div>
                    <div class="text-xs text-gray-500">
                      {{ formatDateTime(item.createdAt) }}
                      <span v-if="item.changedByName"> · {{ item.changedByName }}</span>
                      <span v-if="item.isAutomated"> · automatic</span>
                    </div>
                    <p v-if="item.note" class="text-sm text-gray-600 mt-1">{{ item.note }}</p>
                  </div>
                </template>
              </Timeline>
              <div v-if="!a.stageEvents?.length" class="text-sm text-gray-400">No transitions recorded.</div>
            </template>
          </Card>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { qualificationLabel } from '#shared/recruitment/qualifications'
import { isRejectionTemplate } from '#shared/recruitment/notifications'

const props = defineProps<{
  id: string
  /** Single-column layout and fewer table columns, for the drawer. */
  dense?: boolean
}>()

/** `loaded` carries the record up so a host can title itself from it. */
const emit = defineEmits<{ loaded: [any]; changed: [] }>()

const toast = useToast()

const a = ref<any>(null)
const stages = ref<any[]>([])
const pending = ref<any[]>([])
const loading = ref(true)
const changing = ref(false)

const fullName = computed(
  () => [a.value?.firstName, a.value?.lastName].filter(Boolean).join(' ') || a.value?.name || 'Applicant'
)

/** True while the candidate is being shown something other than this stage. */
const heldFromCandidate = computed(() =>
  Boolean(a.value?.stage?.isRejection) && pending.value.some((p: any) => isRejectionTemplate(p.templateKey))
)

const qualLabel = (l: string) => qualificationLabel(l as any)

const scoreClass = (s: number | null) =>
  s == null ? 'text-gray-300'
    : s >= 80 ? 'text-green-600' : s >= 65 ? 'text-lime-600' : s >= 50 ? 'text-amber-600' : 'text-red-600'

const personalFields = computed(() => [
  { label: 'Email', value: a.value?.email },
  { label: 'Phone', value: a.value?.phone },
  { label: 'Gender', value: a.value?.gender },
  { label: 'Province', value: a.value?.province },
  { label: 'Experience', value: a.value?.totalYearsExperience != null ? `${a.value.totalYearsExperience} years` : null },
  { label: 'Notice period', value: a.value?.noticePeriodDays != null ? `${a.value.noticePeriodDays} days` : null },
  { label: 'Heard via', value: a.value?.howHeard },
  { label: 'Submitted', value: a.value?.submittedAt ? formatDateTime(a.value.submittedAt) : null }
])

const panelSummary = computed(() => [
  {
    label: 'Mean',
    value: a.value?.panelScoreMean != null ? Math.round(a.value.panelScoreMean) : '—',
    accent: 'text-zaccBlack'
  },
  {
    label: 'Spread',
    value: a.value?.panelScoreSpread != null ? Math.round(a.value.panelScoreSpread) : '—',
    accent: a.value?.panelScoreSpread > (a.value?.job?.panelSpreadThreshold ?? 20)
      ? 'text-amber-600'
      : 'text-gray-400'
  },
  { label: 'Reviewers', value: a.value?.panelReviewCount ?? 0, accent: 'text-zaccBlack' }
])

function formatDateTime(d: string | Date) {
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
const formatSize = (b: number) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`

const load = async () => {
  loading.value = true
  try {
    const data = await $fetch<any>(`/api/recruitment/applications/${props.id}`)
    a.value = data
    stages.value = data.stages
    pending.value = data.pendingNotifications ?? []
    emit('loaded', { ...data, fullName: fullName.value })
  } catch (e: any) {
    a.value = null
    toast.add({
      severity: 'error', summary: 'Error',
      detail: e.data?.statusMessage || 'Failed to load', life: 4000
    })
  } finally {
    loading.value = false
  }
}

const changeStage = async (stageId: string) => {
  if (!stageId || stageId === a.value?.stage?.id) return
  changing.value = true
  try {
    const res = await $fetch<any>(`/api/recruitment/applications/${props.id}/stage`, {
      method: 'PUT', body: { stageId }
    })
    const cancelled = res.cancelledNotifications
      ? ` ${res.cancelledNotifications} queued notice(s) cancelled.`
      : ''
    toast.add({
      severity: 'success', summary: 'Stage updated',
      detail: (res.message || '') + cancelled, life: 6000
    })
    await load()
    emit('changed')
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Could not change stage',
      detail: e.data?.statusMessage || 'Failed', life: 5000
    })
  } finally {
    changing.value = false
  }
}

// Reloads when the host swaps to a different application without remounting.
watch(() => props.id, load)
onMounted(load)

defineExpose({ reload: load, fullName })
</script>
