<template>
  <div class="rounded-xl border p-4" :class="hasError ? 'border-red-300 bg-red-50/40' : 'border-gray-200 bg-white'">
    <div class="flex items-start gap-3 mb-3">
      <div class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-zaccGreen/10 text-xs font-bold text-zaccGreen">
        {{ index + 1 }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="grid md:grid-cols-2 gap-3">
          <label class="block">
            <span class="text-xs font-semibold text-gray-600">Label <span class="text-red-500">*</span></span>
            <InputText v-model="model.label" class="w-full mt-1" placeholder="Years of relevant experience"
              @blur="autoKey" />
          </label>
          <label class="block">
            <span class="text-xs font-semibold text-gray-600">Key</span>
            <InputText v-model="model.key" class="w-full mt-1" placeholder="years_experience" />
            <small class="text-gray-400">Stable identifier used by scores and reports.</small>
          </label>
        </div>
      </div>
      <Button icon="pi pi-trash" text rounded severity="danger" v-tooltip.top="'Remove'" @click="$emit('remove')" />
    </div>

    <div class="grid md:grid-cols-4 gap-3 mb-3">
      <label class="block">
        <span class="text-xs font-semibold text-gray-600">Bucket</span>
        <Dropdown v-model="model.bucket" :options="bucketOptions" optionLabel="label" optionValue="value"
          class="w-full mt-1" />
      </label>
      <label class="block">
        <span class="text-xs font-semibold text-gray-600">How it is scored</span>
        <Dropdown v-model="model.type" :options="typeOptions" optionLabel="label" optionValue="value"
          class="w-full mt-1" @change="onTypeChange" />
      </label>
      <label class="block">
        <span class="text-xs font-semibold text-gray-600">Weight in bucket</span>
        <InputNumber v-model="model.weight" :min="0" :max="100" :step="0.5" class="w-full mt-1" />
        <small class="text-gray-400">{{ sharePct }}% of {{ bucketLabel }}</small>
      </label>
      <label class="block">
        <span class="text-xs font-semibold text-gray-600">Max points</span>
        <InputNumber v-model="model.maxPoints" :min="1" :max="1000" class="w-full mt-1" />
      </label>
    </div>

    <!-- Where the value comes from. Meaningless for KEYWORD and MANUAL. -->
    <label v-if="needsSourceField" class="block mb-3">
      <span class="text-xs font-semibold text-gray-600">Application field <span class="text-red-500">*</span></span>
      <Dropdown v-model="model.sourceField" :options="sourceFieldOptions" optionLabel="label" optionValue="value"
        editable class="w-full mt-1" placeholder="employment.totalYears" />
      <small class="text-gray-400">Which answer from the application this criterion reads.</small>
    </label>

    <!-- Type-specific configuration -->
    <div class="rounded-lg bg-gray-50 border border-gray-200 p-3 mb-3">
      <!-- BANDED: the "5-10 years = N points" case -->
      <div v-if="model.type === 'BANDED'">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wide text-gray-500">Scoring bands</span>
          <Button label="Add band" icon="pi pi-plus" text size="small" @click="addBand" />
        </div>
        <div v-for="(band, bi) in model.config.bands" :key="bi" class="grid grid-cols-12 gap-2 items-center mb-2">
          <InputText v-model="band.label" placeholder="5-10 years" class="col-span-4" />
          <InputNumber v-model="band.min" placeholder="From" class="col-span-2" :min="0" />
          <InputNumber v-model="band.max" placeholder="To" class="col-span-2" :min="0" />
          <div class="col-span-3 flex items-center gap-1">
            <InputNumber v-model="band.points" placeholder="Points" class="flex-1" :min="0" />
            <span class="text-xs text-gray-400">pts</span>
          </div>
          <Button icon="pi pi-times" text rounded severity="danger" class="col-span-1"
            @click="model.config.bands.splice(bi, 1)" />
        </div>
        <!-- Spelled out because interval semantics are the thing people get
             wrong about bands — an overlap silently awards the earlier band. -->
        <small class="text-gray-500">
          A band matches when the value is <b>≥ From</b> and <b>≤ To</b>. Leave "To" empty on the
          top band for "and above". Bands are matched in order, so put the narrowest first.
        </small>
      </div>

      <!-- KEYWORD -->
      <div v-else-if="model.type === 'KEYWORD'">
        <span class="text-xs font-bold uppercase tracking-wide text-gray-500">Keyword matching</span>
        <div class="grid md:grid-cols-2 gap-3 mt-2">
          <label class="block">
            <span class="text-xs font-semibold text-gray-600">Required keywords</span>
            <Chips v-model="model.config.required" class="w-full mt-1" separator="," />
            <small class="text-gray-400">Carry the most weight.</small>
          </label>
          <label class="block">
            <span class="text-xs font-semibold text-gray-600">Preferred keywords</span>
            <Chips v-model="model.config.preferred" class="w-full mt-1" separator="," />
            <small class="text-gray-400">Nice to have.</small>
          </label>
        </div>
      </div>

      <!-- QUALIFICATION_LADDER -->
      <div v-else-if="model.type === 'QUALIFICATION_LADDER'">
        <span class="text-xs font-bold uppercase tracking-wide text-gray-500">Qualification points</span>
        <div class="grid md:grid-cols-2 gap-2 mt-2">
          <div v-for="rung in model.config.ladder" :key="rung.level" class="flex items-center gap-2">
            <span class="flex-1 text-sm text-gray-700">{{ qualificationLabel(rung.level) }}</span>
            <InputNumber v-model="rung.points" :min="0" :max="1000" class="w-24" />
          </div>
        </div>
      </div>

      <!-- BOOLEAN -->
      <div v-else-if="model.type === 'BOOLEAN'" class="grid md:grid-cols-2 gap-3">
        <label class="block">
          <span class="text-xs font-semibold text-gray-600">Points if yes</span>
          <InputNumber v-model="model.config.truePoints" class="w-full mt-1" />
        </label>
        <label class="block">
          <span class="text-xs font-semibold text-gray-600">Points if no</span>
          <InputNumber v-model="model.config.falsePoints" class="w-full mt-1" />
        </label>
      </div>

      <!-- MANUAL: the rubric panel members score against -->
      <div v-else-if="model.type === 'MANUAL'">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wide text-gray-500">Reviewer rubric</span>
          <Button label="Add level" icon="pi pi-plus" text size="small" @click="addRubric" />
        </div>
        <div v-for="(r, ri) in model.config.rubric" :key="ri" class="grid grid-cols-12 gap-2 items-center mb-2">
          <InputText v-model="r.label" placeholder="Strong" class="col-span-4" />
          <InputNumber v-model="r.points" placeholder="Points" class="col-span-2" :min="0" />
          <InputText v-model="r.guidance" placeholder="Guidance for reviewers" class="col-span-5" />
          <Button icon="pi pi-times" text rounded severity="danger" class="col-span-1"
            @click="model.config.rubric.splice(ri, 1)" />
        </div>
        <Message severity="info" :closable="false" class="mt-2">
          Scored by the panel, not the system. Until reviewers submit, this criterion is
          <strong>excluded from the total</strong> rather than counted as zero.
        </Message>
      </div>

      <!-- CHOICE -->
      <div v-else-if="model.type === 'CHOICE'">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wide text-gray-500">Value → points</span>
          <Button label="Add value" icon="pi pi-plus" text size="small" @click="addChoice" />
        </div>
        <div v-for="(entry, ci) in choiceEntries" :key="ci" class="grid grid-cols-12 gap-2 items-center mb-2">
          <InputText :modelValue="entry.key" class="col-span-6" placeholder="Harare"
            @update:modelValue="renameChoice(entry.key, $event)" />
          <InputNumber :modelValue="entry.value" class="col-span-4" :min="0"
            @update:modelValue="model.config.map[entry.key] = $event ?? 0" />
          <Button icon="pi pi-times" text rounded severity="danger" class="col-span-2"
            @click="removeChoice(entry.key)" />
        </div>
      </div>
    </div>

    <!-- Plain-English restatement of the rule as configured. The cheapest
         correctness check there is on something someone just wrote. -->
    <p v-if="preview" class="mb-3 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-gray-700">
      <i class="pi pi-eye mt-0.5 text-blue-500" />
      <span>{{ preview }}</span>
    </p>

    <!-- A demographic criterion is lawful in some contexts and not others.
         The warning belongs in the tool that creates it, not in a policy doc. -->
    <p v-if="isDemographic" class="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <i class="pi pi-exclamation-triangle mt-0.5" />
      <span>
        This criterion scores a protected characteristic. Scoring on age, gender or disability
        carries legal and fairness risk — keep a written justification, and check it against the
        demographics report once applications arrive.
      </span>
    </p>

    <div class="flex flex-wrap items-center gap-4">
      <label class="flex items-center gap-2 text-sm text-gray-700">
        <Checkbox v-model="model.showToCandidate" binary />
        Show on the candidate's live scorecard
      </label>
      <label v-if="model.type !== 'MANUAL'" class="flex items-center gap-2 text-sm text-gray-700">
        <Checkbox v-model="model.isPanelScored" binary />
        Panel can also score this
      </label>
    </div>

    <p v-if="hasError" class="mt-2 text-xs font-semibold text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { QUALIFICATION_LEVELS, qualificationLabel } from '#shared/recruitment/qualifications'
import { describeCriterion, isDemographicCriterion } from '#shared/recruitment/describe'

const props = defineProps<{
  modelValue: any
  index: number
  /** Combined weight of every criterion in this criterion's bucket. */
  bucketTotalWeight: number
  error?: string | null
}>()

const emit = defineEmits<{ 'update:modelValue': [any]; remove: [] }>()

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const hasError = computed(() => Boolean(props.error))

const bucketOptions = [
  { label: 'Qualifications & experience', value: 'QUALIFICATIONS_EXPERIENCE' },
  { label: 'Skills', value: 'SKILLS' },
  { label: 'Integrity', value: 'INTEGRITY' },
  { label: 'Fit (location, notice)', value: 'FIT' }
]

const typeOptions = [
  { label: 'Banded value (e.g. years)', value: 'BANDED' },
  { label: 'Qualification ladder', value: 'QUALIFICATION_LADDER' },
  { label: 'Keyword match', value: 'KEYWORD' },
  { label: 'Yes / no', value: 'BOOLEAN' },
  { label: 'Choice from a list', value: 'CHOICE' },
  { label: 'Manual (panel scores)', value: 'MANUAL' }
]

const sourceFieldOptions = [
  { label: 'Total years of experience', value: 'employment.totalYears' },
  { label: 'Currently employed', value: 'employment.isCurrentlyEmployed' },
  { label: 'Notice period (days)', value: 'position.noticePeriodDays' },
  { label: 'Willing to relocate', value: 'position.willingToRelocate' },
  { label: 'Expected salary', value: 'position.expectedSalary' },
  { label: 'Province', value: 'personal.province' },
  { label: 'Consents to vetting', value: 'declarations.vetting.answer' },
  { label: 'Criminal record declared', value: 'declarations.criminal.answer' },
  { label: 'Under corruption investigation', value: 'declarations.corruption.answer' },
  { label: 'Relatives at ZACC', value: 'declarations.relatives.answer' }
]

const needsSourceField = computed(() => ['BANDED', 'BOOLEAN', 'CHOICE'].includes(model.value.type))

const bucketLabel = computed(
  () => bucketOptions.find((b) => b.value === model.value.bucket)?.label ?? model.value.bucket
)

/** Empty until the rule is complete enough to describe, which is the point. */
const preview = computed(() => describeCriterion(model.value))
const isDemographic = computed(() => isDemographicCriterion(model.value))

const sharePct = computed(() => {
  const total = props.bucketTotalWeight
  if (!total) return 0
  return Math.round(((model.value.weight ?? 0) / total) * 100)
})

/** Fills the key from the label, but never overwrites one already set. */
const autoKey = () => {
  if (model.value.key) return
  model.value.key = String(model.value.label || '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40)
}

/** Swaps in a valid default config, since the shapes are not interchangeable. */
const onTypeChange = () => {
  const defaults: Record<string, any> = {
    BANDED: { kind: 'BANDED', bands: [{ label: '', min: 0, max: null, points: 0 }] },
    QUALIFICATION_LADDER: {
      kind: 'QUALIFICATION_LADDER',
      ladder: QUALIFICATION_LEVELS.map((q) => ({ level: q.level, points: q.points }))
    },
    KEYWORD: { kind: 'KEYWORD', required: [], preferred: [] },
    BOOLEAN: { kind: 'BOOLEAN', truePoints: 100, falsePoints: 0 },
    CHOICE: { kind: 'CHOICE', map: {} },
    MANUAL: { kind: 'MANUAL', rubric: [{ label: 'Meets expectations', points: 50 }] }
  }
  model.value.config = defaults[model.value.type]
  if (model.value.type === 'MANUAL') {
    model.value.isAutoScored = false
    model.value.isPanelScored = true
  } else {
    model.value.isAutoScored = true
  }
  if (!needsSourceField.value) model.value.sourceField = null
}

const addBand = () => model.value.config.bands.push({ label: '', min: null, max: null, points: 0 })
const addRubric = () => model.value.config.rubric.push({ label: '', points: 0, guidance: '' })

const choiceEntries = computed(() =>
  Object.entries(model.value.config?.map ?? {}).map(([key, value]) => ({ key, value: value as number }))
)
const addChoice = () => {
  model.value.config.map = { ...model.value.config.map, [`value_${choiceEntries.value.length + 1}`]: 0 }
}
const renameChoice = (oldKey: string, newKey: string) => {
  if (!newKey || newKey === oldKey) return
  const next: Record<string, number> = {}
  for (const [k, v] of Object.entries(model.value.config.map)) next[k === oldKey ? newKey : k] = v as number
  model.value.config.map = next
}
const removeChoice = (key: string) => {
  const next = { ...model.value.config.map }
  delete next[key]
  model.value.config.map = next
}
</script>
