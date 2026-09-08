<template>
  <NuxtLayout name="dashboard">
    <div>
      <div class="flex items-start justify-between gap-4 mb-6">
        <div class="min-w-0">
          <NuxtLink to="/admin/recruitment" class="text-sm text-gray-500 hover:text-zaccGreen">
            <i class="pi pi-arrow-left text-xs" /> Vacancies
          </NuxtLink>
          <h1 class="text-3xl font-extrabold text-zaccBlack truncate">{{ job?.title || 'Vacancy' }}</h1>
          <p class="mt-1 text-gray-600">
            {{ job?.department }}<span v-if="job?.grade"> · Grade {{ job.grade }}</span>
            <span v-if="job"> · closes {{ formatDate(job.closingDate) }}</span>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Button label="Preview scoring" icon="pi pi-play" outlined severity="secondary"
            :disabled="!criteria.length" @click="runPreview" />
          <Button label="Save configuration" icon="pi pi-check" :loading="saving"
            style="background:#209341;border-color:#209341" @click="save" />
        </div>
      </div>

      <Message v-if="job && !job.canEditScheme" severity="warn" :closable="false" class="mb-4">
        {{ job.schemeLockReason }}
      </Message>

      <Message v-if="weightError" severity="error" :closable="false" class="mb-4">{{ weightError }}</Message>

      <Message v-if="rescoreOffer" severity="warn" class="mb-4" @close="rescoreOffer = false">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="font-semibold">Existing applications still hold older scores</div>
            <div class="text-sm">
              They were scored under an earlier version of this scheme, so the console is ranking
              them against different rules. Rescoring reorders any shortlist already in progress.
            </div>
          </div>
          <Button label="Rescore now" icon="pi pi-refresh" size="small" :loading="rescoring"
            style="background:#209341;border-color:#209341" @click="runRescore" />
        </div>
      </Message>

      <div v-if="loading" class="py-16 text-center text-gray-500">
        <i class="pi pi-spin pi-spinner text-2xl" />
      </div>

      <Tabs v-else v-model:value="activeTab">
        <TabList>
          <Tab value="screening">Screening &amp; scoring</Tab>
          <Tab value="rules">Disqualification rules</Tab>
          <Tab value="documents">Documents</Tab>
          <Tab value="panel">Panel</Tab>
        </TabList>

        <TabPanels>
          <!-- ---------------- Screening ---------------- -->
          <TabPanel value="screening">
            <Card class="border-0 shadow-sm mb-4">
              <template #content>
                <h3 class="font-bold text-zaccBlack mb-1">Weighting</h3>
                <p class="text-sm text-gray-600 mb-4">
                  How the 100 available points are split. Each bucket's share is divided between
                  its criteria according to their weights.
                </p>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label v-for="b in bucketKeys" :key="b.key" class="block">
                    <span class="text-xs font-semibold text-gray-600">{{ b.label }}</span>
                    <InputNumber v-model="bucketWeights[b.key]" :min="0" :max="100" suffix=" %"
                      class="w-full mt-1" />
                    <small :class="criteriaByBucket[b.key]?.length ? 'text-gray-400' : 'text-red-500'">
                      {{ criteriaByBucket[b.key]?.length || 0 }} criteria
                    </small>
                  </label>
                </div>
                <div class="mt-3 text-sm font-semibold"
                  :class="weightTotal === 100 ? 'text-zaccGreen' : 'text-red-600'">
                  Total: {{ weightTotal }}%
                  <span v-if="weightTotal !== 100"> — must be exactly 100</span>
                </div>
              </template>
            </Card>

            <Card class="border-0 shadow-sm mb-4">
              <template #content>
                <div class="flex items-center justify-between mb-1">
                  <h3 class="font-bold text-zaccBlack">Job description keywords</h3>
                </div>
                <p class="text-sm text-gray-600 mb-3">
                  Matched against the applicant's skills, employment history and qualifications.
                </p>
                <div class="grid md:grid-cols-2 gap-4">
                  <label class="block">
                    <span class="text-xs font-semibold text-gray-600">Required</span>
                    <Chips v-model="keywords.required" class="w-full mt-1" separator="," />
                  </label>
                  <label class="block">
                    <span class="text-xs font-semibold text-gray-600">Preferred</span>
                    <Chips v-model="keywords.preferred" class="w-full mt-1" separator="," />
                  </label>
                </div>
              </template>
            </Card>

            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 class="font-bold text-zaccBlack">Scoring criteria</h3>
                <!-- The ceiling has to be visible while editing, or it is only
                     discovered when a real applicant scores against it. -->
                <p class="mt-0.5 text-xs text-gray-500">
                  <span class="font-semibold text-zaccBlack tabular-nums">{{ criteria.length }}</span> criteria
                  <span v-if="criteria.length">
                    · <span class="tabular-nums">{{ autoScoredCount }}</span> automatic
                    · <span class="tabular-nums">{{ panelScoredCount }}</span> panel-scored
                  </span>
                  ·
                  <span :class="weightTotal === 100 ? 'font-semibold text-zaccGreen' : 'font-semibold text-amber-600'">
                    weights <span class="tabular-nums">{{ weightTotal }}</span>/100
                  </span>
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Button v-if="editingUid" label="Collapse" icon="pi pi-chevron-up" text size="small"
                  @click="editingUid = null" />
                <Button label="Add criterion" icon="pi pi-plus" outlined @click="addCriterion" />
              </div>
            </div>

            <div class="space-y-3">
              <template v-for="(c, i) in criteria" :key="c._uid">
                <AdminRecruitmentCriterionEditor v-if="isEditing(c)" v-model="criteria[i]"
                  :index="i" :bucket-total-weight="bucketTotalWeight(c.bucket)" :error="criterionErrors[i]"
                  class="crit-open" @remove="removeCriterion(i)" />

                <!-- Collapsed. A whole scheme is auditable without opening a card,
                     which is the only way anyone actually checks one. -->
                <button v-else type="button"
                  class="crit-row w-full rounded-xl border bg-white p-3 text-left"
                  :class="criterionErrors[i] ? 'border-red-300 bg-red-50/40' : 'border-gray-200'"
                  @click="openCriterion(c)">
                  <div class="flex items-start gap-3">
                    <span
                      class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-zaccGreen/10 text-xs font-bold text-zaccGreen tabular-nums">
                      {{ i + 1 }}
                    </span>
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="font-semibold text-zaccBlack">{{ c.label || 'Untitled criterion' }}</span>
                        <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                          {{ bucketLabel(c.bucket) }}
                        </span>
                        <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                          {{ typeLabel(c.type) }}
                        </span>
                        <span v-if="isDemographicCriterion(c)"
                          class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          <i class="pi pi-exclamation-triangle" style="font-size: 9px" /> Protected characteristic
                        </span>
                      </div>
                      <div v-if="summaryChips(c).length" class="mt-1.5 flex flex-wrap gap-1">
                        <span v-for="(chip, ci) in summaryChips(c)" :key="ci"
                          class="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-600 tabular-nums">
                          {{ chip }}
                        </span>
                      </div>
                      <p v-if="criterionErrors[i]" class="mt-1.5 text-xs font-semibold text-red-600">
                        {{ criterionErrors[i] }}
                      </p>
                    </div>
                    <div class="flex flex-shrink-0 items-center gap-3">
                      <span class="text-xs text-gray-400 tabular-nums">
                        {{ sharePct(c) }}% of bucket
                      </span>
                      <i class="pi pi-pencil text-sm text-gray-400" />
                    </div>
                  </div>
                </button>
              </template>

              <div v-if="!criteria.length"
                class="rounded-xl border-2 border-dashed border-gray-300 p-10 text-center text-gray-500">
                No criteria yet. Without them every application scores zero.
              </div>
            </div>
          </TabPanel>

          <!-- ---------------- Disqualification rules ---------------- -->
          <TabPanel value="rules">
            <Card class="border-0 shadow-sm mb-4">
              <template #content>
                <label class="flex items-center gap-2 text-sm font-semibold text-zaccBlack">
                  <Checkbox v-model="autoRejectEnabled" binary />
                  Automatically reject applications that fail a rule below
                </label>
                <p class="text-sm text-gray-600 mt-2">
                  Rejection notices are held back by the delay configured on the
                  <NuxtLink to="/admin/recruitment/stages" class="text-zaccGreen underline">rejection stage</NuxtLink>,
                  so they never arrive the instant someone applies.
                </p>
              </template>
            </Card>

            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold text-zaccBlack">Rules ({{ disqualifiers.length }})</h3>
              <Button label="Add rule" icon="pi pi-plus" outlined @click="addDisqualifier" />
            </div>

            <div class="space-y-3">
              <Card v-for="(d, i) in disqualifiers" :key="d._uid" class="border-0 shadow-sm">
                <template #content>
                  <div class="grid md:grid-cols-3 gap-3">
                    <label class="block">
                      <span class="text-xs font-semibold text-gray-600">Label</span>
                      <InputText v-model="d.label" class="w-full mt-1" placeholder="Under corruption investigation" />
                    </label>
                    <label class="block">
                      <span class="text-xs font-semibold text-gray-600">Condition</span>
                      <Dropdown v-model="d.type" :options="disqualifierTypes" optionLabel="label" optionValue="value"
                        class="w-full mt-1" />
                    </label>
                    <label class="block">
                      <span class="text-xs font-semibold text-gray-600">Application field</span>
                      <InputText v-model="d.sourceField" class="w-full mt-1"
                        placeholder="declarations.corruption.answer" />
                    </label>
                  </div>
                  <div class="grid md:grid-cols-3 gap-3 mt-3">
                    <label class="block">
                      <span class="text-xs font-semibold text-gray-600">Action</span>
                      <Dropdown v-model="d.action" :options="actionOptions" optionLabel="label" optionValue="value"
                        class="w-full mt-1" />
                    </label>
                    <label class="block md:col-span-2">
                      <span class="text-xs font-semibold text-gray-600">Reason shown to the candidate</span>
                      <InputText v-model="d.publicReason" class="w-full mt-1"
                        placeholder="Your application could not be progressed at this time." />
                      <small class="text-gray-400">Kept separate from the internal reason.</small>
                    </label>
                  </div>
                  <div class="flex justify-end mt-2">
                    <Button icon="pi pi-trash" text rounded severity="danger" @click="disqualifiers.splice(i, 1)" />
                  </div>
                </template>
              </Card>
              <div v-if="!disqualifiers.length"
                class="rounded-xl border-2 border-dashed border-gray-300 p-10 text-center text-gray-500">
                No automatic rejection rules.
              </div>
            </div>
          </TabPanel>

          <!-- ---------------- Documents ---------------- -->
          <TabPanel value="documents">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold text-zaccBlack">Required documents ({{ documentSlots.length }})</h3>
              <Button label="Add document" icon="pi pi-plus" outlined @click="addSlot" />
            </div>
            <div class="space-y-3">
              <Card v-for="(s, i) in documentSlots" :key="s._uid" class="border-0 shadow-sm">
                <template #content>
                  <div class="grid md:grid-cols-4 gap-3 items-end">
                    <label class="block">
                      <span class="text-xs font-semibold text-gray-600">Label</span>
                      <InputText v-model="s.label" class="w-full mt-1" placeholder="Certified certificates" />
                    </label>
                    <label class="block">
                      <span class="text-xs font-semibold text-gray-600">File types</span>
                      <Chips v-model="s.allowedExtensions" class="w-full mt-1" separator="," />
                    </label>
                    <label class="block">
                      <span class="text-xs font-semibold text-gray-600">Max size (MB)</span>
                      <InputNumber :modelValue="s.maxSizeBytes / 1048576" :min="1" :max="50" class="w-full mt-1"
                        @update:modelValue="s.maxSizeBytes = (($event as number) || 5) * 1048576" />
                    </label>
                    <div class="flex items-center gap-3 pb-2">
                      <label class="flex items-center gap-2 text-sm">
                        <Checkbox v-model="s.isMandatory" binary /> Required
                      </label>
                      <Button icon="pi pi-trash" text rounded severity="danger" @click="documentSlots.splice(i, 1)" />
                    </div>
                  </div>
                </template>
              </Card>
              <div v-if="!documentSlots.length"
                class="rounded-xl border-2 border-dashed border-gray-300 p-10 text-center text-gray-500">
                No document slots — candidates would have no way to attach a CV.
              </div>
            </div>
          </TabPanel>

          <!-- ---------------- Panel ---------------- -->
          <TabPanel value="panel">
            <Card class="border-0 shadow-sm mb-4">
              <template #content>
                <h3 class="font-bold text-zaccBlack mb-3">Panel scoring</h3>
                <div class="grid md:grid-cols-2 gap-4">
                  <label class="block">
                    <span class="text-xs font-semibold text-gray-600">Combine reviewer scores by</span>
                    <Dropdown v-model="panelAggregation" :options="aggregationOptions" optionLabel="label"
                      optionValue="value" class="w-full mt-1" />
                  </label>
                  <label class="block">
                    <span class="text-xs font-semibold text-gray-600">Flag disagreement above</span>
                    <InputNumber v-model="panelSpreadThreshold" :min="0" :max="100" suffix=" pts"
                      class="w-full mt-1" />
                  </label>
                </div>
              </template>
            </Card>

            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold text-zaccBlack">Panel members ({{ panelMembers.length }})</h3>
              <Button label="Add member" icon="pi pi-plus" outlined :disabled="!availableUsers.length"
                @click="addPanelMember" />
            </div>

            <Message v-if="availableUsers.length <= 1" severity="info" :closable="false" class="mb-3">
              Panel scoring needs more than one admin account. Add users under
              <NuxtLink to="/admin/users" class="underline">User management</NuxtLink> to assign reviewers.
            </Message>

            <div class="space-y-3">
              <Card v-for="(m, i) in panelMembers" :key="m._uid" class="border-0 shadow-sm">
                <template #content>
                  <div class="grid md:grid-cols-3 gap-3 items-end">
                    <label class="block">
                      <span class="text-xs font-semibold text-gray-600">Reviewer</span>
                      <Dropdown v-model="m.userId" :options="availableUsers" optionLabel="label" optionValue="value"
                        class="w-full mt-1" />
                    </label>
                    <label class="block">
                      <span class="text-xs font-semibold text-gray-600">Role</span>
                      <Dropdown v-model="m.role" :options="panelRoles" optionLabel="label" optionValue="value"
                        class="w-full mt-1" />
                    </label>
                    <div class="flex justify-end">
                      <Button icon="pi pi-trash" text rounded severity="danger" @click="panelMembers.splice(i, 1)" />
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-4 mt-3 text-sm">
                    <label class="flex items-center gap-2"><Checkbox v-model="m.canSeeIdentity" binary /> Can see name</label>
                    <label class="flex items-center gap-2"><Checkbox v-model="m.canSeeDemographics" binary /> Can see gender / DOB / disability</label>
                    <label class="flex items-center gap-2"><Checkbox v-model="m.canSeeOtherScores" binary /> Can see other reviewers' scores</label>
                  </div>
                </template>
              </Card>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Dialog v-model:visible="previewVisible" header="Scoring preview" modal class="w-[92vw] max-w-2xl">
        <AdminRecruitmentSchemePreview v-if="previewVisible" :criteria="criteria" :bucket-weights="bucketWeights"
          :keywords="keywords" :disqualifiers="disqualifiers" />
      </Dialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { QUALIFICATION_LEVELS } from '#shared/recruitment/qualifications'
import { summaryChips, isDemographicCriterion } from '#shared/recruitment/describe'

definePageMeta({ middleware: 'admin' })

const route = useRoute()
const toast = useToast()
const jobId = computed(() => String(route.params.id))

const loading = ref(true)
const saving = ref(false)
const previewVisible = ref(false)
const activeTab = ref((route.query.tab as string) || 'screening')

const job = ref<any>(null)
const criteria = ref<any[]>([])
const disqualifiers = ref<any[]>([])
const documentSlots = ref<any[]>([])
const panelMembers = ref<any[]>([])
const availableUsers = ref<Array<{ label: string; value: string }>>([])

const bucketWeights = reactive<Record<string, number>>({
  QUALIFICATIONS_EXPERIENCE: 40, SKILLS: 30, INTEGRITY: 20, FIT: 10
})
const keywords = reactive<{ required: string[]; preferred: string[] }>({ required: [], preferred: [] })
const autoRejectEnabled = ref(true)
const panelAggregation = ref('MEAN')
const panelSpreadThreshold = ref(20)

const bucketKeys = [
  { key: 'QUALIFICATIONS_EXPERIENCE', label: 'Qualifications & experience' },
  { key: 'SKILLS', label: 'Skills' },
  { key: 'INTEGRITY', label: 'Integrity' },
  { key: 'FIT', label: 'Fit' }
]
const disqualifierTypes = [
  { label: 'Must be false (adverse declaration)', value: 'REQUIRED_FALSE' },
  { label: 'Must be true', value: 'REQUIRED_TRUE' },
  { label: 'At least (number)', value: 'MIN_NUMERIC' },
  { label: 'At most (number)', value: 'MAX_NUMERIC' },
  { label: 'Minimum qualification', value: 'REQUIRED_QUALIFICATION' },
  { label: 'Missing a required document', value: 'MISSING_DOCUMENT' }
]
const actionOptions = [
  { label: 'Auto-reject', value: 'AUTO_REJECT' },
  { label: 'Flag for review only', value: 'FLAG_ONLY' }
]
const aggregationOptions = [
  { label: 'Mean', value: 'MEAN' },
  { label: 'Median', value: 'MEDIAN' },
  { label: 'Trimmed mean', value: 'TRIMMED_MEAN' },
  { label: "Chair's score", value: 'CHAIR_OVERRIDE' }
]
const panelRoles = [
  { label: 'Chair', value: 'CHAIR' },
  { label: 'Member', value: 'MEMBER' },
  { label: 'Observer', value: 'OBSERVER' },
  { label: 'HR coordinator', value: 'HR_COORDINATOR' }
]

let uid = 0
const withUid = <T extends object>(o: T) => ({ ...o, _uid: ++uid })

const criteriaByBucket = computed(() => {
  const map: Record<string, any[]> = {}
  for (const c of criteria.value) (map[c.bucket] ??= []).push(c)
  return map
})
const bucketTotalWeight = (bucket: string) =>
  (criteriaByBucket.value[bucket] ?? []).reduce((s, c) => s + (c.weight ?? 0), 0)

/**
 * One criterion is open at a time. Twelve stacked forms is not a list anyone can
 * read, and the collapsed rows carry enough to audit the scheme without opening
 * anything.
 */
const editingUid = ref<number | null>(null)
const isEditing = (c: any) => c._uid === editingUid.value
const openCriterion = (c: any) => { editingUid.value = c._uid }
const removeCriterion = (i: number) => {
  if (criteria.value[i]?._uid === editingUid.value) editingUid.value = null
  criteria.value.splice(i, 1)
}

const autoScoredCount = computed(() => criteria.value.filter((c) => c.type !== 'MANUAL').length)
const panelScoredCount = computed(() => criteria.value.filter((c) => c.type === 'MANUAL' || c.isPanelScored).length)

const CRITERION_TYPE_LABELS: Record<string, string> = {
  BANDED: 'Banded',
  QUALIFICATION_LADDER: 'Qualification ladder',
  KEYWORD: 'Keywords',
  BOOLEAN: 'Yes / no',
  CHOICE: 'Choice',
  MANUAL: 'Panel scored'
}
const typeLabel = (t: string) => CRITERION_TYPE_LABELS[t] ?? t
const bucketLabel = (b: string) => bucketKeys.find((k) => k.key === b)?.label ?? b

const sharePct = (c: any) => {
  const total = bucketTotalWeight(c.bucket)
  return total ? Math.round(((c.weight ?? 0) / total) * 100) : 0
}

const weightTotal = computed(() =>
  Math.round(bucketKeys.reduce((s, b) => s + (bucketWeights[b.key] ?? 0), 0))
)

const weightError = computed(() => {
  if (weightTotal.value !== 100) return null // already shown inline
  const empty = bucketKeys.filter((b) => (bucketWeights[b.key] ?? 0) > 0 && !criteriaByBucket.value[b.key]?.length)
  if (!empty.length) return null
  return `${empty.map((b) => b.label).join(', ')} carry weight but have no criteria — that share of the score would be unreachable.`
})

const criterionErrors = computed(() =>
  criteria.value.map((c) => {
    if (!c.label?.trim()) return 'A label is required.'
    if (!c.key?.trim()) return 'A key is required.'
    if (['BANDED', 'BOOLEAN', 'CHOICE'].includes(c.type) && !c.sourceField) return 'Choose the application field this reads.'
    if (c.type === 'BANDED' && !c.config?.bands?.length) return 'Add at least one band.'
    if (c.type === 'MANUAL' && !c.config?.rubric?.length) return 'Add at least one rubric level.'
    return null
  })
)

const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const load = async () => {
  loading.value = true
  try {
    const [data, users] = await Promise.all([
      $fetch<any>(`/api/recruitment/vacancies/${jobId.value}`),
      $fetch<any[]>('/api/users').catch(() => [])
    ])
    job.value = data
    useHead({ title: `${data.title} - ZACC CMS` })

    Object.assign(bucketWeights, data.bucketWeights ?? bucketWeights)
    Object.assign(keywords, { required: [], preferred: [], ...(data.keywords ?? {}) })
    autoRejectEnabled.value = data.autoRejectEnabled ?? true
    panelAggregation.value = data.panelAggregation ?? 'MEAN'
    panelSpreadThreshold.value = data.panelSpreadThreshold ?? 20

    criteria.value = (data.criteria ?? []).map((c: any) => withUid({ ...c }))
    disqualifiers.value = (data.disqualifiers ?? []).map((d: any) => withUid({ ...d }))
    documentSlots.value = (data.documentSlots ?? []).map((s: any) => withUid({ ...s }))
    panelMembers.value = (data.panelMembers ?? []).map((m: any) => withUid({ ...m }))

    availableUsers.value = (users ?? [])
      .filter((u: any) => u.isActive)
      .map((u: any) => ({ label: `${u.name || u.email} (${String(u.role).replace('_', ' ')})`, value: u.id }))
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Error',
      detail: e.data?.statusMessage || 'Failed to load vacancy', life: 4000
    })
  } finally {
    loading.value = false
  }
}

const addCriterion = () => {
  const c = withUid({
    key: '', label: '', bucket: 'QUALIFICATIONS_EXPERIENCE', type: 'BANDED',
    weight: 1, maxPoints: 100, sourceField: 'employment.totalYears',
    isAutoScored: true, isPanelScored: false, showToCandidate: true,
    sortOrder: criteria.value.length + 1,
    config: { kind: 'BANDED', bands: [{ label: '', min: 0, max: null, points: 0 }] }
  })
  criteria.value.push(c)
  editingUid.value = c._uid
}

const addDisqualifier = () => disqualifiers.value.push(withUid({
  key: `rule_${disqualifiers.value.length + 1}`, label: '', type: 'REQUIRED_FALSE',
  sourceField: '', config: {}, action: 'AUTO_REJECT', severity: 'HIGH',
  publicReason: '', internalReason: '', isActive: true, sortOrder: disqualifiers.value.length + 1
}))

const addSlot = () => documentSlots.value.push(withUid({
  key: `document_${documentSlots.value.length + 1}`, label: '', description: '',
  isMandatory: true, allowMultiple: false, maxFiles: 1,
  allowedExtensions: ['pdf'], maxSizeBytes: 5 * 1048576, sortOrder: documentSlots.value.length + 1
}))

const addPanelMember = () => panelMembers.value.push(withUid({
  userId: availableUsers.value[0]?.value ?? '', role: 'MEMBER',
  canSeeIdentity: true, canSeeDemographics: false, canSeeOtherScores: false
}))

const runPreview = () => { previewVisible.value = true }

/**
 * Set after a save that leaves existing applications on an older scheme version.
 * Rescoring is offered rather than done: it reorders a shortlist people may
 * already be working from.
 */
const rescoreOffer = ref(false)
const rescoring = ref(false)

const runRescore = async () => {
  rescoring.value = true
  try {
    const res = await $fetch<any>(`/api/recruitment/vacancies/${jobId.value}/rescore`, { method: 'POST' })
    rescoreOffer.value = false
    toast.add({
      severity: res.skipped ? 'warn' : 'success',
      summary: `Rescored ${res.total} application(s)`,
      detail: res.message, life: 8000
    })
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Rescore failed',
      detail: e.data?.statusMessage || 'No scores were changed.', life: 6000
    })
  } finally {
    rescoring.value = false
  }
}

const save = async () => {
  const firstError = criterionErrors.value.findIndex((e) => e)
  if (firstError >= 0) {
    activeTab.value = 'screening'
    // Naming the criterion in a toast is little use while its row is collapsed.
    editingUid.value = criteria.value[firstError]?._uid ?? null
    toast.add({
      severity: 'warn', summary: 'Check the criteria',
      detail: `Criterion ${firstError + 1}: ${criterionErrors.value[firstError]}`, life: 5000
    })
    return
  }
  if (weightTotal.value !== 100) {
    activeTab.value = 'screening'
    toast.add({ severity: 'warn', summary: 'Weighting', detail: 'Bucket weights must total 100%.', life: 4000 })
    return
  }

  saving.value = true
  try {
    const strip = (o: any) => { const { _uid, user, ...rest } = o; return rest }
    const res = await $fetch<any>(`/api/recruitment/vacancies/${jobId.value}/scheme`, {
      method: 'PUT',
      body: {
        bucketWeights: { ...bucketWeights },
        keywords: { required: keywords.required, preferred: keywords.preferred },
        autoRejectEnabled: autoRejectEnabled.value,
        panelAggregation: panelAggregation.value,
        panelSpreadThreshold: panelSpreadThreshold.value,
        criteria: criteria.value.map((c, i) => ({ ...strip(c), sortOrder: i + 1 })),
        disqualifiers: disqualifiers.value.map((d, i) => ({ ...strip(d), sortOrder: i + 1 })),
        documentSlots: documentSlots.value.map((s, i) => ({ ...strip(s), sortOrder: i + 1 })),
        panelMembers: panelMembers.value.map(strip)
      }
    })
    toast.add({
      severity: res.rescoreRequired ? 'warn' : 'success',
      summary: 'Saved', detail: res.message, life: res.rescoreRequired ? 8000 : 3000
    })
    // A toast that offers an action and then disappears is not an offer. The
    // banner stays until it is acted on or dismissed.
    rescoreOffer.value = Boolean(res.rescoreRequired)
    await load()
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Could not save',
      detail: e.data?.statusMessage || 'Failed to save the screening scheme', life: 6000
    })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
/* Flat until touched: a 1px border at rest, the brand focus ring on keyboard
   focus, shadow only on hover. Matches the console's filter controls. */
.crit-row {
  transition: border-color 0.15s, box-shadow 0.15s;
}
.crit-row:hover {
  border-color: #cbd5e1;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}
.crit-row:focus-visible {
  outline: none;
  border-color: #209341;
  box-shadow: 0 0 0 3px rgba(32, 147, 65, 0.12);
}

/* Marks the one open card so it reads as the thing being edited rather than
   as one more row in the stack. */
.crit-open {
  box-shadow: 0 0 0 3px rgba(32, 147, 65, 0.1);
}
</style>
