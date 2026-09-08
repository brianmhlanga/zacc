<template>
  <div>
    <p class="text-sm text-gray-600 mb-4">
      Runs the scheme against a sample applicant using the same engine that scores real
      submissions, so you can see how it behaves before publishing.
    </p>

    <div class="grid md:grid-cols-3 gap-3 mb-5">
      <label class="block">
        <span class="text-xs font-semibold text-gray-600">Years of experience</span>
        <InputNumber v-model="sample.years" :min="0" :max="40" class="w-full mt-1" />
      </label>
      <label class="block">
        <span class="text-xs font-semibold text-gray-600">Highest qualification</span>
        <Dropdown v-model="sample.qualification" :options="qualOptions" optionLabel="label" optionValue="value"
          class="w-full mt-1" />
      </label>
      <label class="block">
        <span class="text-xs font-semibold text-gray-600">Skills</span>
        <InputText v-model="sample.skills" class="w-full mt-1" placeholder="fraud, excel" />
      </label>
    </div>

    <div class="flex flex-wrap gap-4 mb-5 text-sm">
      <label class="flex items-center gap-2"><Checkbox v-model="sample.vetting" binary /> Consents to vetting</label>
      <label class="flex items-center gap-2"><Checkbox v-model="sample.corruption" binary /> Under investigation</label>
      <label class="flex items-center gap-2"><Checkbox v-model="sample.criminal" binary /> Criminal record</label>
    </div>

    <div v-if="result" class="rounded-xl border border-gray-200 overflow-hidden">
      <div class="flex items-center gap-4 p-4"
        :class="result.disqualified ? 'bg-red-50' : 'bg-gray-50'">
        <div class="text-4xl font-extrabold"
          :class="result.disqualified ? 'text-red-600' : result.total >= 65 ? 'text-zaccGreen' : 'text-amber-600'">
          {{ result.total }}
        </div>
        <div class="text-sm">
          <div class="font-semibold text-zaccBlack">out of 100</div>
          <div v-if="result.disqualified" class="text-red-600 font-semibold">
            Auto-rejected — {{ result.disqualificationReasons.map((r: any) => r.label).join(', ') }}
          </div>
          <div v-else class="text-gray-600">Keyword match {{ result.keyword.percent }}%</div>
        </div>
      </div>

      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th class="text-left px-4 py-2">Criterion</th>
            <th class="text-right px-4 py-2">Raw</th>
            <th class="text-right px-4 py-2">Weighted</th>
            <th class="text-left px-4 py-2">Why</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in result.criterionResults" :key="r.criterionId" class="border-t border-gray-100">
            <td class="px-4 py-2 font-medium text-zaccBlack">{{ r.label }}</td>
            <td class="px-4 py-2 text-right">{{ r.rawPoints }}/{{ r.maxPoints }}</td>
            <td class="px-4 py-2 text-right font-semibold">
              <span v-if="r.pending" class="text-amber-600 text-xs">pending panel</span>
              <span v-else>{{ r.weightedPoints.toFixed(1) }}</span>
            </td>
            <td class="px-4 py-2 text-gray-500 text-xs">{{ r.explanation }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Message v-if="error" severity="error" :closable="false" class="mt-3">{{ error }}</Message>
  </div>
</template>

<script setup lang="ts">
import { scoreApplication } from '#shared/recruitment/scoring'
import { QUALIFICATION_LEVELS } from '#shared/recruitment/qualifications'

const props = defineProps<{
  criteria: any[]
  bucketWeights: Record<string, number>
  keywords: { required: string[]; preferred: string[] }
  disqualifiers: any[]
}>()

const sample = reactive({
  years: 6,
  qualification: 'FIRST_DEGREE',
  skills: 'fraud, asset tracing, excel',
  vetting: true,
  corruption: false,
  criminal: false
})

const qualOptions = QUALIFICATION_LEVELS.map((q) => ({ label: q.label, value: q.level }))

const error = ref<string | null>(null)

const result = computed(() => {
  error.value = null
  try {
    return scoreApplication({
      vacancy: {
        id: 'preview',
        bucketWeights: props.bucketWeights as any,
        keywords: props.keywords,
        closingDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        documentSlots: []
      },
      criteria: props.criteria.map((c, i) => ({ ...c, id: c.id ?? `preview-${i}` })),
      disqualifiers: props.disqualifiers.map((d, i) => ({ ...d, id: d.id ?? `preview-d-${i}` })),
      application: {
        personal: { province: 'Harare' },
        position: { jobId: 'preview', noticePeriodDays: 30, willingToRelocate: true },
        qualifications: [{ level: sample.qualification as any }],
        memberships: [],
        employment: {
          totalYears: sample.years,
          isCurrentlyEmployed: true,
          positions: [{ employer: 'Sample', jobTitle: 'Officer', responsibilities: sample.skills }]
        },
        declarations: {
          vetting: { answer: sample.vetting },
          corruption: { answer: sample.corruption },
          criminal: { answer: sample.criminal }
        },
        skills: { raw: sample.skills, list: sample.skills.split(',').map((s) => s.trim()).filter(Boolean) },
        languages: [],
        documents: []
      }
    })
  } catch (e: any) {
    error.value = e?.message || 'Could not score the sample applicant'
    return null
  }
})
</script>
