<template>
  <NuxtLayout name="main">
    <div v-if="loading" class="py-24 text-center text-zaccBlack/60">
      <i class="pi pi-spin pi-spinner text-3xl" />
    </div>

    <div v-else-if="blocked" class="max-w-2xl mx-auto px-4 py-20 text-center">
      <i :class="['pi', blocked.icon, 'text-5xl mb-4 block', blocked.tone]" />
      <h1 class="text-2xl font-extrabold text-zaccBlack mb-2">{{ blocked.title }}</h1>
      <p class="text-zaccBlack/70 mb-6">{{ blocked.body }}</p>
      <NuxtLink :to="blocked.to">
        <Button :label="blocked.cta" style="background:#209341;border-color:#209341" />
      </NuxtLink>
    </div>

    <div v-else class="wrap max-w-7xl mx-auto px-4 py-10">
      <div class="mb-6">
        <NuxtLink to="/careers" class="text-sm text-zaccBlack/50 hover:text-zaccGreen">
          <i class="pi pi-arrow-left text-xs" /> All vacancies
        </NuxtLink>
        <h1 class="text-3xl font-extrabold text-zaccBlack">{{ vacancy.title }}</h1>
        <p class="text-zaccBlack/60">
          {{ vacancy.department }}<span v-if="vacancy.grade"> · Grade {{ vacancy.grade }}</span>
          · closes {{ formatDate(vacancy.closingDate) }}
        </p>
      </div>

      <!-- Says what was filled in for them, because silently populated fields
           are fields nobody checks. -->
      <Message v-if="prefilledSections.length" severity="info" class="mb-5"
        @close="prefilledSections = []">
        <span class="font-semibold">Filled in from your profile:</span>
        {{ prefilledSections.join(', ') }}.
        Check each is right for this post — you can change anything here without
        altering your profile.
      </Message>

      <div class="grid lg:grid-cols-[260px_1fr_280px] gap-6 items-start">
        <!-- Steps -->
        <aside class="lg:sticky lg:top-24">
          <ol class="space-y-1">
            <li v-for="s in wizard.steps" :key="s.n">
              <button type="button" class="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition-colors"
                :class="stepClass(s.n)" @click="wizard.goTo(s.n)">
                <span class="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border text-xs font-bold"
                  :class="badgeClass(s.n)">
                  <i v-if="wizard.statusFor(s.n) === 'complete'" class="pi pi-check text-[10px]" />
                  <i v-else-if="wizard.statusFor(s.n) === 'problem'" class="pi pi-exclamation-triangle text-[10px]" />
                  <template v-else>{{ s.n }}</template>
                </span>
                <span>{{ s.label }}</span>
              </button>
            </li>
          </ol>

          <div class="mt-4 px-3 text-xs text-zaccBlack/50">
            <span v-if="draft.saving.value"><i class="pi pi-spin pi-spinner" /> Saving…</span>
            <span v-else-if="draft.error.value" class="text-red-600 font-semibold">
              <i class="pi pi-exclamation-circle" /> {{ draft.error.value }}
            </span>
            <span v-else-if="draft.savedAt.value">
              Saved {{ draft.savedAt.value.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }}
            </span>
            <span v-else>Your progress saves automatically.</span>
          </div>
        </aside>

        <!-- Form -->
        <div class="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div class="h-1.5 bg-gray-100 rounded-t-2xl overflow-hidden">
            <div class="h-full bg-zaccGold transition-all duration-300"
              :style="{ width: `${(wizard.currentStep.value / wizard.steps.length) * 100}%` }" />
          </div>

          <div class="p-6">
            <CareersStepPersonal v-if="wizard.currentStep.value === 1" v-model="answers.personal" />

            <div v-else-if="wizard.currentStep.value === 2">
              <h2 class="text-xl font-extrabold text-zaccBlack">2. Position &amp; application specifics</h2>
              <p class="text-sm text-zaccBlack/60 mt-1 mb-5">You are applying for the post below.</p>
              <div class="rounded-xl border border-zaccGold/40 bg-zaccGold/5 p-4 mb-5">
                <div class="font-bold text-zaccBlack">{{ vacancy.title }}</div>
                <div class="text-sm text-zaccBlack/60">
                  {{ vacancy.department }} · {{ vacancy.dutyStation || vacancy.location }}
                  <span v-if="vacancy.grade"> · Grade {{ vacancy.grade }}</span>
                </div>
              </div>
              <div class="grid md:grid-cols-2 gap-4">
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">How did you hear about this vacancy? <b class="text-red-500">*</b></span>
                  <Dropdown v-model="answers.position.howHeard" :options="sources" class="w-full mt-1"
                    placeholder="Select…" />
                </label>
                <label v-if="answers.position.howHeard === 'Other'" class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Please specify</span>
                  <InputText v-model="answers.position.howHeardOther" class="w-full mt-1" />
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Notice period <b class="text-red-500">*</b></span>
                  <Dropdown v-model="answers.position.noticePeriodDays" :options="noticeOptions"
                    optionLabel="label" optionValue="value" class="w-full mt-1" placeholder="Select…" />
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Willing to relocate?</span>
                  <Dropdown v-model="answers.position.willingToRelocate" :options="yesNo"
                    optionLabel="label" optionValue="value" class="w-full mt-1" placeholder="Select…" />
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Expected gross salary (USD/month)</span>
                  <InputNumber v-model="answers.position.expectedSalary" :min="0" class="w-full mt-1" />
                </label>
              </div>
            </div>

            <CareersStepQualifications v-else-if="wizard.currentStep.value === 3"
              :qualifications="answers.qualifications" :memberships="answers.memberships" />

            <CareersStepEmployment v-else-if="wizard.currentStep.value === 4"
              v-model="answers.employment" />

            <CareersStepIntegrity v-else-if="wizard.currentStep.value === 5"
              v-model="answers.declarations"
              v-model:truthDeclaration="answers.personal.truthDeclaration" />

            <div v-else-if="wizard.currentStep.value === 6">
              <h2 class="text-xl font-extrabold text-zaccBlack">6. Skills &amp; competencies</h2>
              <p class="text-sm text-zaccBlack/60 mt-1 mb-5">
                Matched against the job description — the chips turn green on a match.
              </p>
              <label class="block">
                <span class="text-sm font-semibold text-zaccBlack">Software and systems you are proficient in</span>
                <Chips v-model="answers.skills.list" class="w-full mt-1" separator=","
                  @update:modelValue="answers.skills.raw = answers.skills.list.join(', ')" />
                <small class="block text-xs text-zaccBlack/50 mt-1">Press enter after each.</small>
              </label>

              <h3 class="font-bold text-zaccBlack mt-6 mb-3">Language proficiency</h3>
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-xs uppercase tracking-wide text-zaccBlack/50">
                    <th class="text-left py-2">Language</th>
                    <th class="text-left py-2">Read</th>
                    <th class="text-left py-2">Write</th>
                    <th class="text-left py-2">Speak</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="l in answers.languages" :key="l.language" class="border-t border-gray-100">
                    <td class="py-2 font-semibold">{{ l.language }}</td>
                    <td class="py-2 pr-2"><Dropdown v-model="l.read" :options="proficiencies" optionLabel="label" optionValue="value" class="w-full" /></td>
                    <td class="py-2 pr-2"><Dropdown v-model="l.write" :options="proficiencies" optionLabel="label" optionValue="value" class="w-full" /></td>
                    <td class="py-2"><Dropdown v-model="l.speak" :options="proficiencies" optionLabel="label" optionValue="value" class="w-full" /></td>
                  </tr>
                </tbody>
              </table>

              <h3 class="font-bold text-zaccBlack mt-6 mb-3">Driver's licence</h3>
              <div class="grid md:grid-cols-3 gap-4">
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Do you hold one?</span>
                  <Dropdown v-model="answers.personal.hasLicence" :options="yesNo" optionLabel="label"
                    optionValue="value" class="w-full mt-1" placeholder="Select…" />
                </label>
                <label v-if="answers.personal.hasLicence" class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Class</span>
                  <Dropdown v-model="answers.personal.licenceClass"
                    :options="['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5']" class="w-full mt-1" />
                </label>
              </div>
            </div>

            <CareersStepAttachments v-else-if="wizard.currentStep.value === 7"
              :slots="schema.documentSlots" :documents="answers.documents" />

            <div v-else-if="wizard.currentStep.value === 8">
              <h2 class="text-xl font-extrabold text-zaccBlack">8. Review &amp; submit</h2>
              <p class="text-sm text-zaccBlack/60 mt-1 mb-5">
                Check every section. Once submitted, an application cannot be edited.
              </p>

              <div v-if="wizard.blockingSteps.value.length"
                class="rounded-xl border border-red-300 bg-red-50 p-4 mb-5">
                <p class="font-bold text-red-700 mb-2">Before you can submit:</p>
                <ul class="space-y-1">
                  <li v-for="s in wizard.blockingSteps.value" :key="s.n" class="text-sm">
                    <button type="button" class="text-red-700 underline font-semibold"
                      @click="wizard.goTo(s.n)">{{ s.label }}</button>
                    — {{ wizard.problemsFor(s.n).join(', ') }}
                  </li>
                </ul>
              </div>

              <div class="space-y-3">
                <div v-for="sec in reviewSections" :key="sec.step"
                  class="rounded-xl border border-gray-200 p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-zaccBlack/50">{{ sec.title }}</h4>
                    <button type="button" class="text-xs font-bold text-zaccGold hover:underline"
                      @click="wizard.goTo(sec.step)">Edit</button>
                  </div>
                  <dl class="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    <div v-for="f in sec.fields" :key="f.label" class="flex justify-between gap-3">
                      <dt class="text-zaccBlack/50">{{ f.label }}</dt>
                      <dd class="font-semibold text-right" :class="{ 'text-red-600': !f.value }">
                        {{ f.value || 'Not provided' }}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <label class="flex items-start gap-3 mt-6 pt-5 border-t border-gray-200">
                <Checkbox v-model="finalConfirm" binary class="mt-0.5" />
                <span class="text-sm text-zaccBlack/80">
                  I confirm the above is correct and understand that ZACC will verify these details.
                </span>
              </label>

              <Button label="Submit application" icon="pi pi-send" class="mt-5"
                :disabled="!finalConfirm || !wizard.canSubmit.value" :loading="submitting"
                style="background:#209341;border-color:#209341" @click="submit" />
            </div>
          </div>

          <div class="flex items-center gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-2xl">
            <Button v-if="wizard.currentStep.value > 1" label="Back" outlined severity="secondary"
              @click="wizard.previous()" />
            <div class="flex-1" />
            <Button label="Save and exit" text @click="saveAndExit" />
            <Button v-if="wizard.currentStep.value < 8"
              :label="wizard.currentStep.value === 7 ? 'Review application' : 'Continue'"
              style="background:#209341;border-color:#209341" @click="advance" />
          </div>
        </div>

        <!-- Live scorecard -->
        <aside class="lg:sticky lg:top-24">
          <CareersScorecardPanel :result="scoreResult" />
        </aside>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { scoreApplication } from '#shared/recruitment/scoring'
import { emptyAnswers } from '~/composables/useApplicationWizard'

const route = useRoute()
const toast = useToast()
const slug = String(route.params.slug)
const { candidate, fetchSession } = useCandidateAuth()

const loading = ref(true)
const submitting = ref(false)
const finalConfirm = ref(false)
const schema = ref<any>({ documentSlots: [], criteria: [], disqualifiers: [] })
const vacancy = ref<any>({})
const answers = ref(emptyAnswers())

const wizard = useApplicationWizard(answers, computed(() => schema.value.documentSlots ?? []))
const draft = useApplicationDraft(slug, answers, wizard.currentStep)

const yesNo = [{ label: 'No', value: false }, { label: 'Yes', value: true }]
const sources = ['ZACC Website', 'Social Media', 'Print Media', 'Employee Referral', 'Recruitment Agency', 'Other']
const noticeOptions = [
  { label: 'Immediately', value: 0 }, { label: '1 month', value: 30 },
  { label: '2 months', value: 60 }, { label: '3 months or more', value: 90 }
]
const proficiencies = [
  { label: '—', value: 'NONE' }, { label: 'Basic', value: 'BASIC' },
  { label: 'Good', value: 'GOOD' }, { label: 'Fluent', value: 'FLUENT' },
  { label: 'Native', value: 'NATIVE' }
]

const blocked = ref<any>(null)

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

/** The same engine the server runs, so the number shown is the number recorded. */
const scoreResult = computed(() => {
  if (!schema.value.criteria?.length) return null
  try {
    return scoreApplication({
      vacancy: {
        id: vacancy.value.id,
        bucketWeights: schema.value.bucketWeights,
        keywords: schema.value.keywords,
        province: vacancy.value.province,
        dutyStation: vacancy.value.dutyStation,
        minYearsExperience: vacancy.value.minYearsExperience,
        closingDate: vacancy.value.closingDate,
        documentSlots: schema.value.documentSlots ?? []
      },
      criteria: schema.value.criteria,
      disqualifiers: schema.value.disqualifiers ?? [],
      application: answers.value as any
    })
  } catch {
    return null
  }
})

const stepClass = (n: number) => {
  const s = wizard.statusFor(n)
  if (s === 'current') return 'bg-zaccGold/10 text-zaccBlack font-semibold'
  if (s === 'problem') return 'text-red-600 hover:bg-gray-50'
  return 'text-zaccBlack/60 hover:bg-gray-50'
}
const badgeClass = (n: number) => {
  const s = wizard.statusFor(n)
  if (s === 'current') return 'border-zaccGold bg-zaccGold text-zaccBlack'
  if (s === 'complete') return 'border-zaccGreen bg-zaccGreen text-white'
  if (s === 'problem') return 'border-red-400 text-red-600'
  return 'border-gray-300 text-zaccBlack/40'
}

const reviewSections = computed(() => {
  const a = answers.value
  const decl = (k: string) => a.declarations[k]?.answer === null || a.declarations[k]?.answer === undefined
    ? '' : (a.declarations[k]!.answer ? 'Yes' : 'No')
  return [
    { step: 1, title: 'Personal', fields: [
      { label: 'Name', value: [a.personal.firstName, a.personal.surname].filter(Boolean).join(' ') },
      { label: 'ID number', value: a.personal.nationalId },
      { label: 'Province', value: a.personal.province },
      { label: 'Phone', value: a.personal.phone }
    ] },
    { step: 3, title: 'Qualifications', fields: [
      { label: 'Levels recorded', value: a.qualifications.length ? String(a.qualifications.length) : '' },
      { label: 'Professional bodies', value: a.memberships.filter((m: any) => m.bodyName).map((m: any) => m.bodyName).join(', ') }
    ] },
    { step: 4, title: 'Employment', fields: [
      { label: 'Total experience', value: a.employment.totalYears != null ? `${a.employment.totalYears} years` : '' },
      { label: 'Positions listed', value: String(a.employment.positions.length) }
    ] },
    { step: 5, title: 'Integrity', fields: [
      { label: 'Under investigation', value: decl('corruption') },
      { label: 'Criminal record', value: decl('criminal') },
      { label: 'Relatives at ZACC', value: decl('relatives') },
      { label: 'Consents to vetting', value: decl('vetting') }
    ] },
    { step: 7, title: 'Attachments', fields: (schema.value.documentSlots ?? []).map((s: any) => ({
      label: s.label + (s.isMandatory ? ' *' : ''),
      value: a.documents.find((d: any) => d.slotKey === s.key)?.fileName ?? ''
    })) }
  ]
})

const advance = async () => {
  const problems = wizard.problemsFor(wizard.currentStep.value)
  if (problems.length) {
    toast.add({
      severity: 'warn', summary: 'Still needed',
      detail: problems.slice(0, 4).join(', '), life: 5000
    })
    return
  }
  await draft.save(true)
  wizard.next()
}

const saveAndExit = async () => {
  await draft.flush()
  toast.add({ severity: 'success', summary: 'Saved', detail: 'Come back any time to finish.', life: 4000 })
  await navigateTo('/candidate')
}

const submit = async () => {
  submitting.value = true
  try {
    const res = await $fetch<any>(`/api/public/vacancies/${slug}/apply`, {
      method: 'POST',
      body: { answers: answers.value, confirmed: true }
    })
    draft.clearLocal()
    await navigateTo(`/candidate/applications/${res.reference}?submitted=1`)
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Could not submit',
      detail: e.data?.statusMessage || 'Please try again.', life: 8000
    })
  } finally {
    submitting.value = false
  }
}

/**
 * Fills the wizard from the candidate's reusable profile.
 *
 * The whole point of holding a profile: qualifications and employment history
 * are long, and retyping them for every post is the single biggest reason a
 * candidate abandons an application halfway.
 *
 * Every write is guarded so it never overwrites something already there — a
 * resumed draft always wins over the profile, because the draft is what this
 * candidate last decided for *this* post.
 */
const prefilledSections = ref<string[]>([])

const prefillFromProfile = (data: any) => {
  const a = answers.value
  const filled: string[] = []

  a.personal.firstName ||= data.candidate?.firstName ?? ''
  a.personal.surname ||= data.candidate?.lastName ?? ''
  a.personal.email ||= data.candidate?.email ?? ''

  const p = data.profile
  if (!p) return

  for (const k of [
    'middleName', 'nationalId', 'nationalIdType', 'nationality', 'gender', 'placeOfBirth',
    'province', 'city', 'currentAddress', 'permanentAddress', 'altPhone',
    'driversLicenceClass'
  ] as const) {
    if (p[k]) a.personal[k] ||= p[k]
  }
  // Dates arrive as ISO strings; the inputs want the date part only.
  if (p.dateOfBirth) a.personal.dateOfBirth ||= String(p.dateOfBirth).slice(0, 10)
  if (typeof p.hasDisability === 'boolean' && a.personal.hasDisability == null) {
    a.personal.hasDisability = p.hasDisability
    if (p.disabilityDetail) a.personal.disabilityDetail ||= p.disabilityDetail
  }

  if (Array.isArray(p.qualifications) && p.qualifications.length && !a.qualifications.length) {
    a.qualifications = p.qualifications.map((q: any) => ({ ...q }))
    filled.push('qualifications')
  }

  if (Array.isArray(p.memberships) && p.memberships.length && !a.memberships.length) {
    a.memberships = p.memberships.map((m: any) => ({ ...m }))
  }

  // The profile stores the positions array directly; the wizard nests it under
  // `employment` alongside the two summary answers, which stay per-application
  // because "years of relevant experience" depends on which post this is.
  if (Array.isArray(p.employment) && p.employment.length && !a.employment.positions.length) {
    a.employment.positions = p.employment.map((e: any) => ({ ...e }))
    filled.push('employment history')
  }

  if (Array.isArray(p.skills) && p.skills.length && !a.skills.list.length) {
    a.skills.list = [...p.skills]
    a.skills.raw = p.skills.join(', ')
    filled.push('skills')
  }

  // Languages are seeded with three rows at NONE, so "already answered" means a
  // proficiency was actually set, not merely that rows exist.
  const answered = a.languages.some(
    (l: any) => [l.read, l.write, l.speak].some((v: string) => v && v !== 'NONE')
  )
  if (Array.isArray(p.languages) && p.languages.length && !answered) {
    a.languages = p.languages.map((l: any) => ({ ...l }))
    filled.push('languages')
  }

  prefilledSections.value = filled
}

// Autosave whenever anything changes.
watch(answers, () => draft.scheduleSave(), { deep: true })

onMounted(async () => {
  await fetchSession()
  if (!candidate.value) {
    await navigateTo({ path: '/candidate/login', query: { returnTo: route.fullPath } })
    return
  }

  try {
    const data = await $fetch<any>(`/api/public/vacancies/${slug}/form-schema`)
    schema.value = data
    vacancy.value = data.vacancy

    if (data.vacancy.closed) {
      blocked.value = {
        icon: 'pi-clock', tone: 'text-amber-500', title: 'This vacancy has closed',
        body: 'Applications are no longer being accepted for this post.',
        cta: 'See open vacancies', to: '/careers'
      }
      return
    }
    if (data.existingApplication) {
      blocked.value = {
        icon: 'pi-check-circle', tone: 'text-zaccGreen', title: 'You have already applied',
        body: `Your reference is ${data.existingApplication.referenceNumber}.`,
        cta: 'Track this application',
        to: `/candidate/applications/${data.existingApplication.referenceNumber}`
      }
      return
    }
    if (data.vacancy.applicationMode !== 'STRUCTURED') {
      blocked.value = {
        icon: 'pi-file-edit', tone: 'text-zaccBlack/40', title: 'This post uses the short form',
        body: 'Apply for this vacancy from the careers listing.',
        cta: 'Go to the listing', to: '/careers'
      }
      return
    }

    // Server draft wins; the local mirror is only a fallback for a failed save.
    if (data.draft?.answers) {
      answers.value = { ...emptyAnswers(), ...(data.draft.answers as any) }
      wizard.currentStep.value = data.draft.currentStep || 1
      draft.version.value = data.draft.version
    } else {
      const local = draft.readLocal()
      if (local?.answers) {
        answers.value = { ...emptyAnswers(), ...local.answers }
        wizard.currentStep.value = local.currentStep || 1
      }
      prefillFromProfile(data)
    }
  } catch (e: any) {
    blocked.value = {
      icon: 'pi-times-circle', tone: 'text-red-500', title: 'Vacancy not found',
      body: e.data?.statusMessage || 'This vacancy is not available.',
      cta: 'See open vacancies', to: '/careers'
    }
  } finally {
    loading.value = false
  }
})

useHead({ title: 'Apply - ZACC Careers' })
</script>
