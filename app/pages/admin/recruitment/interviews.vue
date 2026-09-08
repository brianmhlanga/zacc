<template>
  <NuxtLayout name="dashboard">
    <div>
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Interviews</h1>
          <p class="mt-2 text-gray-600">
            Schedule panels and invite shortlisted candidates. Invitations go through the send
            queue, so they arrive in working hours.
          </p>
        </div>
        <Button label="Schedule interview" icon="pi pi-plus"
          style="background:#209341;border-color:#209341" @click="openCreate" />
      </div>

      <div class="flex flex-wrap items-center gap-3 mb-4">
        <Dropdown v-model="jobFilter" :options="vacancies" optionLabel="title" optionValue="id"
          placeholder="All vacancies" showClear class="w-64" filter @change="load" />
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <Checkbox v-model="includePast" binary @change="load" /> Include past interviews
        </label>
      </div>

      <div v-if="loading" class="py-16 text-center text-gray-500">
        <i class="pi pi-spin pi-spinner text-2xl" />
      </div>

      <div v-else-if="!events.length" class="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
        <i class="pi pi-calendar text-4xl text-gray-300 mb-3 block" />
        <h3 class="text-lg font-semibold text-zaccBlack mb-1">Nothing scheduled</h3>
        <p class="text-gray-500">Shortlist candidates first, then schedule a panel here.</p>
      </div>

      <div v-else class="space-y-4">
        <Card v-for="e in events" :key="e.id" class="border-0 shadow-sm">
          <template #content>
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-zaccBlack">{{ e.title }}</h3>
                  <Tag :value="modeLabel(e.mode)" severity="secondary" />
                </div>
                <p class="text-sm text-gray-600 mt-1">
                  {{ e.job?.title }} · {{ e.job?.department }}
                </p>
                <p class="text-sm text-zaccBlack font-semibold mt-2">
                  <i class="pi pi-calendar text-xs" /> {{ formatDateTime(e.scheduledAt) }}
                  <span class="font-normal text-gray-500">· {{ e.durationMinutes }} min</span>
                </p>
                <p v-if="e.venue" class="text-sm text-gray-600 mt-1">
                  <i class="pi pi-map-marker text-xs" /> {{ e.venue }}
                </p>
              </div>

              <div class="flex items-center gap-4">
                <div v-for="c in responseCounts(e)" :key="c.label" class="text-center">
                  <div class="text-xl font-extrabold" :class="c.accent">{{ c.value }}</div>
                  <div class="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">{{ c.label }}</div>
                </div>
              </div>
            </div>

            <div v-if="e.invitations.length" class="mt-4 border-t border-gray-100 pt-3">
              <div class="flex flex-wrap gap-2">
                <span v-for="inv in e.invitations" :key="inv.id"
                  class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                  :class="responseClass(inv.response)">
                  {{ [inv.application?.firstName, inv.application?.lastName].filter(Boolean).join(' ')
                     || inv.application?.name }}
                  <span class="opacity-70">{{ responseLabel(inv.response) }}</span>
                </span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Schedule dialog -->
      <Dialog v-model:visible="dialogVisible" header="Schedule an interview" modal class="w-[94vw] max-w-3xl">
        <div class="grid md:grid-cols-2 gap-4">
          <label class="block md:col-span-2">
            <span class="text-xs font-semibold text-gray-600">Vacancy <span class="text-red-500">*</span></span>
            <Dropdown v-model="form.jobId" :options="vacancies" optionLabel="title" optionValue="id"
              class="w-full mt-1" filter @change="loadCandidates" />
          </label>
          <label class="block md:col-span-2">
            <span class="text-xs font-semibold text-gray-600">Title <span class="text-red-500">*</span></span>
            <InputText v-model="form.title" class="w-full mt-1" placeholder="Panel interview — Senior Investigations Officer" />
          </label>
          <label class="block">
            <span class="text-xs font-semibold text-gray-600">Date &amp; time <span class="text-red-500">*</span></span>
            <DatePicker v-model="form.scheduledAt" showTime hourFormat="24" dateFormat="dd M yy"
              class="w-full mt-1" showIcon />
          </label>
          <label class="block">
            <span class="text-xs font-semibold text-gray-600">Duration (minutes)</span>
            <InputNumber v-model="form.durationMinutes" :min="5" :max="600" class="w-full mt-1" />
          </label>
          <label class="block">
            <span class="text-xs font-semibold text-gray-600">Format</span>
            <Dropdown v-model="form.mode" :options="modeOptions" optionLabel="label" optionValue="value"
              class="w-full mt-1" />
          </label>
          <label class="block">
            <span class="text-xs font-semibold text-gray-600">Confirm by</span>
            <DatePicker v-model="form.confirmByDate" dateFormat="dd M yy" class="w-full mt-1" showIcon />
          </label>
          <label class="block md:col-span-2">
            <span class="text-xs font-semibold text-gray-600">
              {{ form.mode === 'VIRTUAL' ? 'Meeting link' : 'Venue' }}
            </span>
            <InputText v-model="form.venue" class="w-full mt-1"
              placeholder="ZACC Head Office, Block C Boardroom, Harare" />
          </label>
          <label class="block md:col-span-2">
            <span class="text-xs font-semibold text-gray-600">Panel (shown to the candidate)</span>
            <Chips v-model="form.panelSummary" class="w-full mt-1" separator="," />
          </label>
          <label class="block md:col-span-2">
            <span class="text-xs font-semibold text-gray-600">What to bring</span>
            <Chips v-model="form.bringItems" class="w-full mt-1" separator="," />
          </label>
          <label class="block md:col-span-2">
            <span class="text-xs font-semibold text-gray-600">Invite candidates</span>
            <MultiSelect v-model="form.applicationIds" :options="candidates" optionLabel="label" optionValue="value"
              class="w-full mt-1" filter placeholder="Choose shortlisted candidates" :maxSelectedLabels="3" />
            <small v-if="form.jobId && !candidates.length" class="text-amber-600">
              No shortlisted candidates on this vacancy yet.
            </small>
          </label>
          <label class="flex items-center gap-2 text-sm md:col-span-2">
            <Checkbox v-model="form.sendInvitations" binary /> Email invitations now
          </label>
        </div>

        <template #footer>
          <Button label="Cancel" severity="secondary" outlined @click="dialogVisible = false" />
          <Button label="Schedule" icon="pi pi-check" :loading="saving"
            style="background:#209341;border-color:#209341" @click="save" />
        </template>
      </Dialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Interviews - ZACC CMS' })

const toast = useToast()
const events = ref<any[]>([])
const vacancies = ref<any[]>([])
const candidates = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const dialogVisible = ref(false)
const jobFilter = ref<string | null>(null)
const includePast = ref(false)

const modeOptions = [
  { label: 'In person', value: 'IN_PERSON' },
  { label: 'Virtual', value: 'VIRTUAL' },
  { label: 'Telephone', value: 'TELEPHONE' }
]

const form = reactive<any>({
  jobId: null, title: '', mode: 'IN_PERSON', venue: '',
  scheduledAt: null, durationMinutes: 45, confirmByDate: null,
  panelSummary: [], bringItems: [], applicationIds: [], sendInvitations: true
})

const modeLabel = (m: string) => modeOptions.find((o) => o.value === m)?.label ?? m

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

const responseLabel = (r: string) =>
  ({ PENDING: 'awaiting', CONFIRMED: 'confirmed', DECLINED: 'declined', RESCHEDULE_REQUESTED: 'reschedule' }[r] ?? r)

const responseClass = (r: string) =>
  ({
    CONFIRMED: 'border-green-300 bg-green-50 text-green-800',
    DECLINED: 'border-red-300 bg-red-50 text-red-800',
    RESCHEDULE_REQUESTED: 'border-amber-300 bg-amber-50 text-amber-800'
  }[r] ?? 'border-gray-200 bg-gray-50 text-gray-700')

const responseCounts = (e: any) => [
  { label: 'Invited', value: e.inviteeCount, accent: 'text-zaccBlack' },
  { label: 'Confirmed', value: e.confirmedCount, accent: 'text-zaccGreen' },
  { label: 'Awaiting', value: e.pendingCount, accent: e.pendingCount ? 'text-amber-600' : 'text-gray-400' },
  { label: 'Declined', value: e.declinedCount, accent: e.declinedCount ? 'text-red-600' : 'text-gray-400' }
]

const load = async () => {
  loading.value = true
  try {
    events.value = await $fetch('/api/recruitment/interviews', {
      params: {
        ...(jobFilter.value ? { jobId: jobFilter.value } : {}),
        ...(includePast.value ? { includePast: 'true' } : {})
      }
    })
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Error',
      detail: e.data?.statusMessage || 'Failed to load interviews', life: 4000
    })
  } finally {
    loading.value = false
  }
}

const loadCandidates = async () => {
  candidates.value = []
  if (!form.jobId) return
  const data = await $fetch<any>('/api/recruitment/applications', {
    params: { jobId: form.jobId, shortlistedOnly: 'true', pageSize: 100 }
  }).catch(() => null)
  candidates.value = (data?.rows ?? []).map((r: any) => ({
    label: `${[r.firstName, r.lastName].filter(Boolean).join(' ') || r.name}${r.finalScore != null ? ` — ${Math.round(r.finalScore)}` : ''}`,
    value: r.id
  }))
}

const openCreate = () => {
  Object.assign(form, {
    jobId: jobFilter.value, title: '', mode: 'IN_PERSON', venue: '',
    scheduledAt: null, durationMinutes: 45, confirmByDate: null,
    panelSummary: [], bringItems: ['Original academic certificates', 'Original national ID'],
    applicationIds: [], sendInvitations: true
  })
  candidates.value = []
  if (form.jobId) loadCandidates()
  dialogVisible.value = true
}

const save = async () => {
  if (!form.jobId || !form.title?.trim() || !form.scheduledAt) {
    toast.add({
      severity: 'warn', summary: 'Validation',
      detail: 'Vacancy, title and date are required.', life: 4000
    })
    return
  }
  saving.value = true
  try {
    const res = await $fetch<any>('/api/recruitment/interviews', {
      method: 'POST',
      body: {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        confirmByDate: form.confirmByDate ? new Date(form.confirmByDate).toISOString() : null
      }
    })
    toast.add({ severity: 'success', summary: 'Scheduled', detail: res.message, life: 5000 })
    dialogVisible.value = false
    await load()
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Could not schedule',
      detail: e.data?.statusMessage || 'Failed', life: 5000
    })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  vacancies.value = await $fetch<any[]>('/api/recruitment/vacancies').catch(() => [])
  await load()
})
</script>
