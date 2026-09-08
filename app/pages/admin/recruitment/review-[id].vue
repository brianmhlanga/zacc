<template>
  <NuxtLayout name="dashboard">
    <div v-if="loading" class="py-16 text-center text-gray-500">
      <i class="pi pi-spin pi-spinner text-2xl" />
    </div>

    <div v-else-if="!data" class="py-16 text-center text-gray-500">
      This application is not available to you.
    </div>

    <div v-else>
      <div class="flex items-start justify-between gap-4 mb-6">
        <div class="min-w-0">
          <NuxtLink to="/admin/recruitment/panel" class="text-sm text-gray-500 hover:text-zaccGreen">
            <i class="pi pi-arrow-left text-xs" /> My panel reviews
          </NuxtLink>
          <h1 class="text-3xl font-extrabold text-zaccBlack truncate">{{ displayName }}</h1>
          <p class="mt-1 text-gray-600">
            {{ app.job?.title }}<span v-if="app.job?.department"> · {{ app.job.department }}</span>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Button label="Save draft" icon="pi pi-save" outlined severity="secondary" :loading="saving"
            @click="save(false)" />
          <Button label="Submit scores" icon="pi pi-check" :loading="submitting"
            style="background:#209341;border-color:#209341" @click="save(true)" />
        </div>
      </div>

      <Message v-if="maskNotice" severity="info" :closable="false" class="mb-4">{{ maskNotice }}</Message>
      <Message v-if="hasSubmitted" severity="success" :closable="false" class="mb-4">
        You have submitted your scores. Editing and resubmitting will recalculate the panel aggregate.
      </Message>

      <div class="grid lg:grid-cols-3 gap-5">
        <!-- Scoring -->
        <div class="lg:col-span-2 space-y-4">
          <Card v-for="c in criteria" :key="c.id" class="border-0 shadow-sm">
            <template #content>
              <div class="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 class="font-bold text-zaccBlack">{{ c.label }}</h3>
                  <p v-if="c.description" class="text-sm text-gray-600 mt-1">{{ c.description }}</p>
                </div>
                <div class="text-right whitespace-nowrap">
                  <span class="text-2xl font-extrabold text-zaccBlack">{{ scores[c.id]?.points ?? 0 }}</span>
                  <span class="text-sm text-gray-400">/{{ c.maxPoints }}</span>
                </div>
              </div>

              <Slider :modelValue="scores[c.id]?.points ?? 0" :min="0" :max="c.maxPoints" class="mb-3"
                @update:modelValue="setPoints(c.id, $event as number)" />

              <!-- The rubric configured on the vacancy, as clickable presets -->
              <div v-if="c.config?.rubric?.length" class="flex flex-wrap gap-2 mb-3">
                <button v-for="r in c.config.rubric" :key="r.label" type="button"
                  class="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
                  :class="scores[c.id]?.points === r.points
                    ? 'border-zaccGreen bg-zaccGreen/10 text-zaccGreen'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'"
                  :title="r.guidance" @click="setPoints(c.id, r.points)">
                  {{ r.label }} · {{ r.points }}
                </button>
              </div>

              <Textarea :modelValue="scores[c.id]?.comment ?? ''" rows="2" autoResize class="w-full"
                placeholder="Why this score? Visible to the panel."
                @update:modelValue="setComment(c.id, $event as string)" />

              <!-- Colleagues' scores, once released -->
              <div v-if="othersFor(c.id).length" class="mt-3 border-t border-gray-100 pt-3">
                <p class="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Other reviewers</p>
                <div v-for="o in othersFor(c.id)" :key="o.reviewer.id" class="flex items-start gap-2 text-sm mb-1">
                  <span class="font-semibold w-40 truncate">{{ o.reviewer.name || o.reviewer.email }}</span>
                  <span class="font-bold">{{ o.points }}/{{ o.maxPoints }}</span>
                  <span class="text-gray-500 flex-1">{{ o.comment }}</span>
                </div>
              </div>
            </template>
          </Card>

          <div v-if="!criteria.length"
            class="rounded-xl border-2 border-dashed border-gray-300 p-10 text-center text-gray-500">
            This vacancy has no panel-scored criteria. Add a manual criterion in the vacancy
            configuration for the panel to score.
          </div>

          <Card class="border-0 shadow-sm">
            <template #content>
              <h3 class="font-bold text-zaccBlack mb-3">Overall recommendation</h3>
              <SelectButton v-model="recommendation" :options="recommendationOptions" optionLabel="label"
                optionValue="value" class="mb-3" />
              <Textarea v-model="comments" rows="3" autoResize class="w-full"
                placeholder="Summary for the panel record." />
            </template>
          </Card>
        </div>

        <!-- Candidate detail -->
        <div class="space-y-4">
          <Card class="border-0 shadow-sm">
            <template #content>
              <h3 class="font-bold text-zaccBlack mb-3">Candidate</h3>
              <dl class="text-sm space-y-2">
                <div v-if="app.highestQualification" class="flex justify-between gap-3">
                  <dt class="text-gray-500">Qualification</dt>
                  <dd class="font-semibold text-right">{{ qualLabel(app.highestQualification) }}</dd>
                </div>
                <div v-if="app.totalYearsExperience != null" class="flex justify-between gap-3">
                  <dt class="text-gray-500">Experience</dt>
                  <dd class="font-semibold">{{ app.totalYearsExperience }} years</dd>
                </div>
                <div v-if="app.keywordMatchPct != null" class="flex justify-between gap-3">
                  <dt class="text-gray-500">Keyword match</dt>
                  <dd class="font-semibold">{{ Math.round(app.keywordMatchPct) }}%</dd>
                </div>
                <div v-if="app.province" class="flex justify-between gap-3">
                  <dt class="text-gray-500">Province</dt>
                  <dd class="font-semibold">{{ app.province }}</dd>
                </div>
              </dl>
            </template>
          </Card>

          <Card v-if="app.employments?.length" class="border-0 shadow-sm">
            <template #content>
              <h3 class="font-bold text-zaccBlack mb-3">Employment history</h3>
              <div v-for="e in app.employments" :key="e.id" class="mb-3 last:mb-0">
                <div class="font-semibold text-sm">{{ e.jobTitle }}</div>
                <div class="text-xs text-gray-500">
                  {{ e.employer }} · {{ e.fromMonth || '?' }} – {{ e.isCurrent ? 'present' : (e.toMonth || '?') }}
                </div>
                <p v-if="e.responsibilities" class="text-xs text-gray-600 mt-1">{{ e.responsibilities }}</p>
              </div>
            </template>
          </Card>

          <Card v-if="app.documents?.length" class="border-0 shadow-sm">
            <template #content>
              <h3 class="font-bold text-zaccBlack mb-3">Documents</h3>
              <a v-for="d in app.documents" :key="d.id" :href="resolveUploadUrl(d.fileUrl)" target="_blank"
                rel="noopener"
                class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 mb-2 text-sm hover:border-zaccGreen">
                <i class="pi pi-file text-zaccGreen" />
                <span class="flex-1 truncate">{{ d.fileName }}</span>
                <i class="pi pi-external-link text-xs text-gray-400" />
              </a>
            </template>
          </Card>

          <Card v-if="app.criterionScores?.length" class="border-0 shadow-sm">
            <template #content>
              <h3 class="font-bold text-zaccBlack mb-3">Automated scoring</h3>
              <div v-for="s in app.criterionScores.filter((x: any) => !x.pending)" :key="s.criterionKey"
                class="text-xs mb-2">
                <div class="flex justify-between">
                  <span class="text-gray-600">{{ s.criterionKey }}</span>
                  <span class="font-semibold">{{ Math.round(s.normalizedPct) }}%</span>
                </div>
                <p class="text-gray-400">{{ s.explanation }}</p>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { qualificationLabel } from '#shared/recruitment/qualifications'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Panel review - ZACC CMS' })

const route = useRoute()
const toast = useToast()
const id = computed(() => String(route.params.id))

const data = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const submitting = ref(false)

const scores = reactive<Record<string, { points: number; comment: string }>>({})
const recommendation = ref<string | null>(null)
const comments = ref('')

const recommendationOptions = [
  { label: 'Shortlist', value: 'SHORTLIST' },
  { label: 'Reserve', value: 'RESERVE' },
  { label: 'Reject', value: 'REJECT' }
]

const app = computed(() => data.value?.application ?? {})
const criteria = computed(() => data.value?.criteria ?? [])
const hasSubmitted = computed(() => data.value?.hasSubmitted ?? false)

const displayName = computed(
  () => app.value.displayLabel
    || [app.value.firstName, app.value.lastName].filter(Boolean).join(' ')
    || app.value.name
    || 'Candidate'
)

const maskNotice = computed(() => {
  const m = data.value?.viewer?.masked
  if (!m) return null
  const parts: string[] = []
  if (m.identity) parts.push("the candidate's identity")
  if (m.demographics) parts.push('gender, date of birth and disability')
  if (m.otherScores) parts.push("other reviewers' scores until you submit")
  if (!parts.length) return null
  return `To keep this assessment impartial, ${parts.join(', ')} ${parts.length > 1 ? 'are' : 'is'} withheld from you on this panel.`
})

const qualLabel = (l: string) => qualificationLabel(l as any)

const resolveUploadUrl = (url: string) => {
  if (!url) return '#'
  if (url.startsWith('http') || url.startsWith('/api/')) return url
  return url.startsWith('/') ? `/api${url}` : `/api/uploads/${url}`
}

const othersFor = (criterionId: string) =>
  (data.value?.otherScores ?? []).filter((o: any) => o.criterionId === criterionId)

const setPoints = (criterionId: string, points: number) => {
  scores[criterionId] = { points, comment: scores[criterionId]?.comment ?? '' }
}
const setComment = (criterionId: string, comment: string) => {
  scores[criterionId] = { points: scores[criterionId]?.points ?? 0, comment }
}

const load = async () => {
  loading.value = true
  try {
    const res = await $fetch<any>(`/api/recruitment/panel/${id.value}`)
    data.value = res
    for (const s of res.myScores ?? []) {
      scores[s.criterionId] = { points: Number(s.points), comment: s.comment ?? '' }
    }
    recommendation.value = res.myReview?.recommendation ?? null
    comments.value = res.myReview?.comments ?? ''
  } catch (e: any) {
    if (e.statusCode !== 404) {
      toast.add({
        severity: 'error', summary: 'Error',
        detail: e.data?.statusMessage || 'Failed to load', life: 4000
      })
    }
  } finally {
    loading.value = false
  }
}

const save = async (submit: boolean) => {
  const flag = submit ? submitting : saving
  flag.value = true
  try {
    const res = await $fetch<any>(`/api/recruitment/panel/${id.value}/scores`, {
      method: 'PUT',
      body: {
        scores: criteria.value
          .filter((c: any) => scores[c.id] !== undefined)
          .map((c: any) => ({
            criterionId: c.id,
            points: scores[c.id]!.points,
            comment: scores[c.id]!.comment || null
          })),
        recommendation: recommendation.value,
        comments: comments.value || null,
        submit
      }
    })
    toast.add({
      severity: 'success', summary: submit ? 'Submitted' : 'Saved',
      detail: res.message, life: 5000
    })
    if (submit) await load()
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Could not save',
      detail: e.data?.statusMessage || 'Failed', life: 6000
    })
  } finally {
    flag.value = false
  }
}

onMounted(load)
</script>
