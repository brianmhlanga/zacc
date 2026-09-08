<template>
  <NuxtLayout name="portal">
    <div>
      <div class="flex flex-wrap items-start justify-between gap-4 mb-2">
        <h1 class="text-2xl font-extrabold text-zaccBlack">My profile</h1>
        <Button label="Save profile" icon="pi pi-check" :loading="saving"
          style="background:#209341;border-color:#209341" @click="save" />
      </div>

      <p class="text-zaccBlack/60 max-w-2xl mb-8">
        Fill this in once. Every application you start is pre-filled from it, so applying for a
        second post is a few minutes rather than half an hour. Editing an application never
        changes what is stored here.
      </p>

      <div v-if="loading" class="py-16 text-center text-zaccBlack/50">
        <i class="pi pi-spin pi-spinner text-2xl" />
      </div>

      <template v-else>
        <!-- Completion, and what is still missing. A bare percentage tells you
             there is work left without saying what it is. -->
        <Card class="border-0 shadow-sm mb-6">
          <template #content>
            <div class="flex flex-wrap items-center gap-4">
              <div class="text-3xl font-extrabold tabular-nums"
                :class="completion === 100 ? 'text-zaccGreen' : 'text-zaccBlack'">
                {{ completion }}%
              </div>
              <div class="flex-1 min-w-[180px]">
                <div class="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div class="h-full bg-zaccGreen transition-all" :style="{ width: completion + '%' }" />
                </div>
                <p v-if="gaps.length" class="mt-2 text-sm text-zaccBlack/60">
                  Still to add: <strong>{{ gaps.map(g => g.label).join(', ') }}</strong>
                </p>
                <p v-else class="mt-2 text-sm text-zaccGreen font-semibold">
                  Complete. Applications will pre-fill from every section.
                </p>
              </div>
            </div>
          </template>
        </Card>

        <Message v-if="saved" severity="success" class="mb-6">Profile saved.</Message>
        <Message v-if="error" severity="error" class="mb-6">{{ error }}</Message>

        <div class="space-y-5">
          <!-- ── Personal ─────────────────────────────────────────── -->
          <section :id="`panel-personal`" v-show="activePanel === 'personal'"
            class="rounded-xl border border-gray-200 bg-white p-5">
            <div class="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <h2 class="font-bold text-zaccBlack">Personal details</h2>
              <Tag v-if="sectionDone('identity') && sectionDone('contact')" value="Done" severity="success" class="ml-3" />
            </div>
            <div>
              <div class="grid md:grid-cols-2 gap-4 pt-2">
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">First name</span>
                  <InputText :modelValue="account.firstName" class="w-full mt-1" disabled />
                  <small class="text-zaccBlack/50">Change this from your account settings.</small>
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Surname</span>
                  <InputText :modelValue="account.lastName" class="w-full mt-1" disabled />
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Middle name</span>
                  <InputText v-model="form.middleName" class="w-full mt-1" />
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Date of birth</span>
                  <InputText v-model="form.dateOfBirth" type="date" class="w-full mt-1" />
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Identity document</span>
                  <Dropdown v-model="form.nationalIdType" :options="ID_TYPES" class="w-full mt-1" />
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">ID / passport number</span>
                  <InputText v-model="form.nationalId" class="w-full mt-1" placeholder="63-123456A-12" />
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Gender</span>
                  <Dropdown v-model="form.gender" :options="GENDERS" showClear class="w-full mt-1" />
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Nationality</span>
                  <InputText v-model="form.nationality" class="w-full mt-1" />
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Place of birth</span>
                  <InputText v-model="form.placeOfBirth" class="w-full mt-1" />
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Primary phone</span>
                  <InputText v-model="form.phone" class="w-full mt-1" placeholder="+263 77 000 0000" />
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Alternative phone</span>
                  <InputText v-model="form.altPhone" class="w-full mt-1" />
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Province</span>
                  <Dropdown v-model="form.province" :options="PROVINCES" showClear class="w-full mt-1" />
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">City or town</span>
                  <InputText v-model="form.city" class="w-full mt-1" />
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Driver's licence class</span>
                  <InputText v-model="form.driversLicenceClass" class="w-full mt-1" placeholder="4" />
                </label>
                <label class="block md:col-span-2">
                  <span class="text-sm font-semibold text-zaccBlack">Current address</span>
                  <Textarea v-model="form.currentAddress" rows="2" class="w-full mt-1" />
                </label>
                <label class="block md:col-span-2">
                  <span class="text-sm font-semibold text-zaccBlack">Permanent address</span>
                  <Textarea v-model="form.permanentAddress" rows="2" class="w-full mt-1" />
                </label>

                <div class="md:col-span-2">
                  <label class="flex items-center gap-2 text-sm text-zaccBlack">
                    <Checkbox v-model="form.hasDisability" binary />
                    I have a disability and may need an adjustment during recruitment
                  </label>
                  <!-- Asked only when relevant, and framed as an adjustment
                       rather than a diagnosis. -->
                  <Textarea v-if="form.hasDisability" v-model="form.disabilityDetail" rows="2"
                    class="w-full mt-2" placeholder="What adjustment would help?" />
                </div>
              </div>
            </div>
          </section>

          <!-- ── Qualifications ───────────────────────────────────── -->
          <section :id="`panel-qualifications`" v-show="activePanel === 'qualifications'"
            class="rounded-xl border border-gray-200 bg-white p-5">
            <div class="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <h2 class="font-bold text-zaccBlack">Qualifications</h2>
              <Tag :value="`${form.qualifications.length}`" severity="secondary" class="ml-3" />
            </div>
            <div>
              <div v-for="(q, i) in form.qualifications" :key="i"
                class="rounded-xl border border-gray-200 p-4 mb-3">
                <div class="grid md:grid-cols-2 gap-3">
                  <label class="block">
                    <span class="text-xs font-semibold text-zaccBlack/70">Level</span>
                    <Dropdown v-model="q.level" :options="LEVELS" optionLabel="label" optionValue="level"
                      class="w-full mt-1" />
                  </label>
                  <label class="block">
                    <span class="text-xs font-semibold text-zaccBlack/70">Field of study</span>
                    <InputText v-model="q.fieldOfStudy" class="w-full mt-1" />
                  </label>
                  <label class="block">
                    <span class="text-xs font-semibold text-zaccBlack/70">Institution</span>
                    <InputText v-model="q.institution" class="w-full mt-1" />
                  </label>
                  <label class="block">
                    <span class="text-xs font-semibold text-zaccBlack/70">Year obtained</span>
                    <Dropdown v-model="q.yearObtained" :options="YEARS" filter showClear
                      placeholder="Select a year" class="w-full mt-1" />
                  </label>
                  <label class="block">
                    <span class="text-xs font-semibold text-zaccBlack/70">Class or grade</span>
                    <InputText v-model="q.classGrade" class="w-full mt-1" />
                  </label>
                  <div class="flex items-end">
                    <Button label="Remove" icon="pi pi-trash" text severity="danger"
                      @click="form.qualifications.splice(i, 1)" />
                  </div>
                </div>
              </div>
              <Button label="Add a qualification" icon="pi pi-plus" outlined class="w-full"
                @click="addQualification" />
            </div>
          </section>

          <!-- ── Employment ───────────────────────────────────────── -->
          <section :id="`panel-employment`" v-show="activePanel === 'employment'"
            class="rounded-xl border border-gray-200 bg-white p-5">
            <div class="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <h2 class="font-bold text-zaccBlack">Employment history</h2>
              <Tag :value="`${form.employment.length}`" severity="secondary" class="ml-3" />
            </div>
            <div>
              <div v-for="(e, i) in form.employment" :key="i"
                class="rounded-xl border border-gray-200 p-4 mb-3">
                <div class="grid md:grid-cols-2 gap-3">
                  <label class="block">
                    <span class="text-xs font-semibold text-zaccBlack/70">Employer</span>
                    <InputText v-model="e.employer" class="w-full mt-1" />
                  </label>
                  <label class="block">
                    <span class="text-xs font-semibold text-zaccBlack/70">Job title</span>
                    <InputText v-model="e.jobTitle" class="w-full mt-1" />
                  </label>
                  <label class="block">
                    <span class="text-xs font-semibold text-zaccBlack/70">From</span>
                    <InputText v-model="e.fromMonth" type="month" class="w-full mt-1" />
                  </label>
                  <label class="block">
                    <span class="text-xs font-semibold text-zaccBlack/70">To</span>
                    <InputText v-model="e.toMonth" type="month" class="w-full mt-1" :disabled="e.isCurrent" />
                    <label class="flex items-center gap-2 mt-2 text-sm text-zaccBlack">
                      <Checkbox v-model="e.isCurrent" binary />
                      I still work here
                    </label>
                  </label>
                  <label class="block md:col-span-2">
                    <span class="text-xs font-semibold text-zaccBlack/70">Responsibilities</span>
                    <Textarea v-model="e.responsibilities" rows="3" class="w-full mt-1"
                      placeholder="What you actually did. Vacancy keywords are matched against this." />
                  </label>
                  <label class="block">
                    <span class="text-xs font-semibold text-zaccBlack/70">Reason for leaving</span>
                    <InputText v-model="e.reasonForLeaving" class="w-full mt-1" />
                  </label>
                  <div class="flex items-end">
                    <Button label="Remove" icon="pi pi-trash" text severity="danger"
                      @click="form.employment.splice(i, 1)" />
                  </div>
                </div>
              </div>
              <Button label="Add a post" icon="pi pi-plus" outlined class="w-full" @click="addEmployment" />
            </div>
          </section>

          <!-- ── Skills, memberships, languages ───────────────────── -->
          <section :id="`panel-skills`" v-show="activePanel === 'skills'"
            class="rounded-xl border border-gray-200 bg-white p-5">
            <div class="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <h2 class="font-bold text-zaccBlack">Skills, memberships and languages</h2>
              
            </div>
            <div>
              <label class="block mb-5">
                <span class="text-sm font-semibold text-zaccBlack">Skills</span>
                <Chips v-model="form.skills" class="w-full mt-1" separator="," />
                <small class="text-zaccBlack/50">
                  Press enter or comma after each. These are matched against the keywords a vacancy
                  asks for, so use the words your field actually uses.
                </small>
              </label>

              <div class="mb-5">
                <span class="text-sm font-semibold text-zaccBlack">Professional memberships</span>
                <div v-for="(m, i) in form.memberships" :key="i" class="flex gap-2 mt-2">
                  <InputText v-model="m.bodyName" class="flex-1" placeholder="Institute of Chartered Accountants of Zimbabwe" />
                  <InputText v-model="m.status" class="w-40" placeholder="Member" />
                  <Button icon="pi pi-trash" text severity="danger" @click="form.memberships.splice(i, 1)" />
                </div>
                <Button label="Add a membership" icon="pi pi-plus" text class="mt-2"
                  @click="form.memberships.push({ bodyName: '', status: '' })" />
              </div>

              <div>
                <span class="text-sm font-semibold text-zaccBlack">Languages</span>
                <div class="overflow-x-auto mt-2">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="text-xs uppercase tracking-wide text-zaccBlack/50">
                        <th class="text-left pb-2">Language</th>
                        <th class="text-left pb-2 px-2">Read</th>
                        <th class="text-left pb-2 px-2">Write</th>
                        <th class="text-left pb-2 px-2">Speak</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(l, i) in form.languages" :key="i">
                        <td class="py-1 pr-2"><InputText v-model="l.language" class="w-full" /></td>
                        <td class="py-1 px-1">
                          <Dropdown v-model="l.read" :options="PROFICIENCY" class="w-full" />
                        </td>
                        <td class="py-1 px-1">
                          <Dropdown v-model="l.write" :options="PROFICIENCY" class="w-full" />
                        </td>
                        <td class="py-1 px-1">
                          <Dropdown v-model="l.speak" :options="PROFICIENCY" class="w-full" />
                        </td>
                        <td class="py-1">
                          <Button icon="pi pi-trash" text severity="danger"
                            @click="form.languages.splice(i, 1)" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <Button label="Add a language" icon="pi pi-plus" text class="mt-2"
                  @click="form.languages.push({ language: '', read: 'NONE', write: 'NONE', speak: 'NONE' })" />
              </div>
            </div>
          </section>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 mt-6">
          <div class="flex gap-2">
            <Button v-if="prevPanel" :label="prevPanel.label" icon="pi pi-arrow-left"
              text severity="secondary" @click="goTo(prevPanel.key)" />
            <Button v-if="nextPanel" :label="nextPanel.label" icon="pi pi-arrow-right"
              iconPos="right" outlined @click="goTo(nextPanel.key)" />
          </div>
          <Button label="Save profile" icon="pi pi-check" :loading="saving"
            style="background:#209341;border-color:#209341" @click="save" />
        </div>
      </template>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { QUALIFICATION_LEVELS } from '#shared/recruitment/qualifications'
import { profileGaps } from '#shared/recruitment/profileCompletion'

definePageMeta({ middleware: 'candidate' })

useHead({ title: 'My profile - ZACC Careers' })

const LEVELS = QUALIFICATION_LEVELS
const ID_TYPES = ['National ID', 'Passport']
const GENDERS = ['Female', 'Male', 'Prefer not to say']
const PROFICIENCY = ['NONE', 'BASIC', 'GOOD', 'FLUENT', 'NATIVE']
const YEARS = yearOptions()
const PROVINCES = [
  'Harare', 'Bulawayo', 'Manicaland', 'Mashonaland Central', 'Mashonaland East',
  'Mashonaland West', 'Masvingo', 'Matabeleland North', 'Matabeleland South', 'Midlands'
]

const route = useRoute()
const router = useRouter()

/**
 * Which section is showing. Held in the URL so a sidebar link lands on a
 * section rather than merely on the page, and so a half-finished profile can be
 * bookmarked at the part still to do.
 */
const activePanel = computed(() => {
  const key = route.hash.replace('#', '')
  return PROFILE_PANELS.some((p) => p.key === key) ? key : PROFILE_PANELS[0]!.key
})

const panelIndex = computed(() => PROFILE_PANELS.findIndex((p) => p.key === activePanel.value))
const prevPanel = computed(() => PROFILE_PANELS[panelIndex.value - 1] ?? null)
const nextPanel = computed(() => PROFILE_PANELS[panelIndex.value + 1] ?? null)

const goTo = (key: string) => {
  router.replace({ hash: '#' + key })
  // Back to the top of the section, not wherever the previous one left off.
  nextTick(() => window.scrollTo({
    top: 0,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  }))
}
const loading = ref(true)
const saving = ref(false)
const saved = ref(false)
const error = ref('')

const account = reactive({ firstName: '', lastName: '', email: '', phone: '' })
const sections = ref<any[]>([])

const form = reactive<any>({
  middleName: '', dateOfBirth: '', placeOfBirth: '',
  nationalIdType: 'National ID', nationalId: '', nationality: 'Zimbabwean',
  gender: null, hasDisability: false, disabilityDetail: '',
  currentAddress: '', permanentAddress: '', province: null, city: '',
  phone: '', altPhone: '', driversLicenceClass: '',
  qualifications: [] as any[],
  memberships: [] as any[],
  employment: [] as any[],
  skills: [] as string[],
  languages: [
    { language: 'English', read: 'NONE', write: 'NONE', speak: 'NONE' },
    { language: 'Shona', read: 'NONE', write: 'NONE', speak: 'NONE' },
    { language: 'Ndebele', read: 'NONE', write: 'NONE', speak: 'NONE' }
  ]
})

/** Recomputed in the browser so the meter moves as you type, not only on save. */
const gaps = computed(() => profileGaps(form))
const completion = computed(() => 100 - gaps.value.reduce((s, g) => s + g.weight, 0))
const sectionDone = (key: string) => !gaps.value.some((g) => g.key === key)

const addQualification = () =>
  form.qualifications.push({ level: 'FIRST_DEGREE', fieldOfStudy: '', institution: '', yearObtained: null, classGrade: '' })

const addEmployment = () =>
  form.employment.push({ employer: '', jobTitle: '', fromMonth: '', toMonth: '', isCurrent: false, responsibilities: '', reasonForLeaving: '' })

const load = async () => {
  loading.value = true
  try {
    const data = await $fetch<any>('/api/public/candidates/profile')
    Object.assign(account, data.candidate)
    sections.value = data.sections
    form.phone = data.candidate.phone ?? ''

    if (data.profile) {
      for (const key of Object.keys(form)) {
        const value = data.profile[key]
        if (value === null || value === undefined) continue
        if (Array.isArray(form[key])) {
          if (Array.isArray(value) && value.length) form[key] = value
        } else {
          form[key] = value
        }
      }
      // The column is a DateTime; the input wants YYYY-MM-DD.
      if (data.profile.dateOfBirth) form.dateOfBirth = String(data.profile.dateOfBirth).slice(0, 10)
      form.hasDisability = Boolean(data.profile.hasDisability)
    }
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Could not load your profile.'
  } finally {
    loading.value = false
  }
}

const save = async () => {
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    const res = await $fetch<any>('/api/public/candidates/profile', {
      method: 'PUT',
      body: { ...form, dateOfBirth: form.dateOfBirth || null }
    })
    sections.value = res.sections
    saved.value = true
    // Refreshes the sidebar's percentage and its per-section ticks; without
    // this the nav would disagree with the page until a reload.
    await useCandidateAuth().fetchSession(true)
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Could not save your profile.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
