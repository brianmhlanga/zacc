<template>
  <NuxtLayout name="portal">
    <div v-if="loading" class="py-24 text-center text-zaccBlack/50">
      <i class="pi pi-spin pi-spinner text-3xl" />
    </div>

    <div v-else-if="!a" class="py-20 text-center">
      <h1 class="text-2xl font-extrabold text-zaccBlack mb-2">Application not found</h1>
      <p class="text-zaccBlack/60 mb-6">We could not find that reference on your account.</p>
      <NuxtLink to="/candidate"><Button label="My applications" outlined /></NuxtLink>
    </div>

    <div v-else>
      <Message v-if="justSubmitted" severity="success" :closable="false" class="mb-6">
        <span class="font-bold">Application submitted.</span>
        Keep your reference number — it is how you track progress.
      </Message>

      <NuxtLink to="/candidate" class="text-sm text-zaccBlack/50 hover:text-zaccGreen">
        <i class="pi pi-arrow-left text-xs" /> My applications
      </NuxtLink>

      <div class="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5 mb-6">
        <div>
          <span class="font-mono text-xs text-zaccBlack/50">{{ a.referenceNumber }}</span>
          <h1 class="text-3xl font-extrabold text-zaccBlack">{{ a.job.title }}</h1>
          <p class="text-zaccBlack/60">
            {{ a.job.department }}<span v-if="a.job.grade"> · Grade {{ a.job.grade }}</span><br>
            Submitted {{ formatDateTime(a.submittedAt || a.createdAt) }}
          </p>
        </div>
        <span v-if="a.stage" class="rounded-full px-4 py-2 text-sm font-bold text-white"
          :style="{ background: a.stage.colorHex }">
          {{ a.stage.publicLabel }}
        </span>
      </div>

      <p v-if="a.stage?.publicDescription"
        class="border-l-4 border-zaccGold pl-4 py-2 text-lg mb-8">
        {{ a.stage.publicDescription }}
      </p>

      <!-- Progress stepper, public labels only -->
      <ol class="flex flex-wrap gap-y-4 mb-10">
        <li v-for="(s, i) in visibleStages" :key="s.key"
          class="flex-1 min-w-[120px] relative text-center text-xs font-semibold"
          :class="stageState(s, i) === 'done' ? 'text-zaccBlack/70'
            : stageState(s, i) === 'current' ? 'text-zaccBlack' : 'text-zaccBlack/35'">
          <div class="h-1 mb-3" :class="stageState(s, i) === 'upcoming' ? 'bg-gray-200' : 'bg-zaccGreen'" />
          <span :class="stageState(s, i) === 'current' ? 'font-extrabold' : ''">{{ s.publicLabel }}</span>
        </li>
      </ol>

      <div class="grid md:grid-cols-[1fr_320px] gap-8 items-start">
        <div>
          <!-- Interview invitation -->
          <div v-for="inv in a.invitations" :key="inv.id"
            class="rounded-xl border border-zaccGold/50 bg-zaccGold/5 p-5 mb-6">
            <h3 class="font-extrabold text-zaccBlack mb-3">Interview invitation</h3>
            <dl class="grid grid-cols-[90px_1fr] gap-y-2 text-sm mb-4">
              <dt class="text-zaccBlack/50">Date</dt>
              <dd class="font-semibold">{{ formatFullDate(inv.event.scheduledAt) }}</dd>
              <dt class="text-zaccBlack/50">Time</dt>
              <dd class="font-semibold">
                {{ formatTime(inv.event.scheduledAt) }} · {{ inv.event.durationMinutes }} minutes
              </dd>
              <dt class="text-zaccBlack/50">{{ inv.event.mode === 'VIRTUAL' ? 'Link' : 'Venue' }}</dt>
              <dd class="font-semibold">{{ inv.event.venue || inv.event.meetingUrl || 'To be confirmed' }}</dd>
              <template v-if="inv.event.bringItems?.length">
                <dt class="text-zaccBlack/50">Bring</dt>
                <dd>
                  <span v-for="b in inv.event.bringItems" :key="b" class="block">• {{ b }}</span>
                </dd>
              </template>
            </dl>
            <div class="flex flex-wrap items-center gap-3">
              <Button v-if="inv.response === 'PENDING'" label="Confirm attendance" :loading="responding"
                style="background:#209341;border-color:#209341"
                @click="respond(inv.id, 'CONFIRMED')" />
              <Tag v-else :value="responseLabel(inv.response)"
                :severity="inv.response === 'CONFIRMED' ? 'success' : 'secondary'" />
              <Button v-if="inv.response === 'PENDING'" label="Request another date" outlined
                severity="secondary" :loading="responding"
                @click="respond(inv.id, 'RESCHEDULE_REQUESTED')" />
              <span v-if="inv.confirmByDate" class="text-xs font-semibold text-red-600">
                Respond by {{ formatDate(inv.confirmByDate) }}
              </span>
            </div>
          </div>

          <h3 class="text-sm font-bold uppercase tracking-wider text-zaccBlack/50 mb-3">Progress</h3>
          <ol class="relative border-l-2 border-gray-200 ml-2 mb-8">
            <li v-for="e in a.stageEvents" :key="e.id" class="ml-6 pb-6 last:pb-0 relative">
              <span class="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full bg-zaccGreen border-2 border-white" />
              <div class="font-semibold text-zaccBlack">{{ e.toPublicLabel }}</div>
              <time class="text-xs text-zaccBlack/50">{{ formatDateTime(e.createdAt) }}</time>
            </li>
            <li v-if="!a.stageEvents.length" class="ml-6 text-sm text-zaccBlack/50">
              Your application has been received.
            </li>
          </ol>

          <template v-if="a.messages.length">
            <h3 class="text-sm font-bold uppercase tracking-wider text-zaccBlack/50 mb-3">
              Messages from the Commission
            </h3>
            <div v-for="m in a.messages" :key="m.id"
              class="rounded-xl border border-gray-200 p-4 mb-3">
              <div class="flex justify-between gap-3 mb-1">
                <span class="text-sm font-bold">{{ m.fromLabel }}</span>
                <time class="text-xs text-zaccBlack/50">{{ formatDateTime(m.createdAt) }}</time>
              </div>
              <p class="text-sm text-zaccBlack/80 whitespace-pre-wrap">{{ m.body }}</p>
            </div>
          </template>
        </div>

        <aside>
          <h3 class="text-sm font-bold uppercase tracking-wider text-zaccBlack/50 mb-3">
            Your documents
          </h3>
          <a v-for="d in a.documents" :key="d.id" :href="d.signedUrl" target="_blank" rel="noopener"
            class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 mb-2 text-sm hover:border-zaccGreen">
            <i class="pi pi-file text-zaccGreen" />
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">{{ d.fileName }}</div>
              <div class="text-xs text-zaccBlack/50">{{ verificationLabel(d.verification) }}</div>
            </div>
          </a>

          <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 mt-6">
            <h4 class="font-bold text-zaccBlack text-sm mb-1">Need help?</h4>
            <p class="text-xs text-zaccBlack/60 leading-relaxed">
              recruitment@zacc.co.zw<br>
              The Commission charges no fee at any stage of recruitment. Report anyone who asks
              you for payment.
            </p>
            <Button v-if="!a.isWithdrawn" label="Withdraw this application" text size="small"
              severity="danger" class="mt-2 px-0" @click="withdraw" />
          </div>
        </aside>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'candidate' })

import { useToast } from 'primevue/usetoast'

const route = useRoute()
const toast = useToast()
const { candidate, fetchSession } = useCandidateAuth()

const a = ref<any>(null)
const stages = ref<any[]>([])
const loading = ref(true)
const responding = ref(false)
const justSubmitted = computed(() => route.query.submitted === '1')

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const formatFullDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
const formatDateTime = (d: string) =>
  new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const responseLabel = (r: string) =>
  ({ CONFIRMED: 'Attendance confirmed', DECLINED: 'Declined', RESCHEDULE_REQUESTED: 'Reschedule requested' }[r] ?? r)

const verificationLabel = (v: string) =>
  ({ VERIFIED: 'Verified', RECEIVED: 'Received', AWAITING_REFEREE: 'Awaiting referee', ACTION_NEEDED: 'Action needed', REJECTED: 'Not accepted' }[v] ?? v)

/** A closed application stops the stepper rather than implying more to come. */
const visibleStages = computed(() => {
  if (!a.value?.stage) return stages.value
  if (a.value.stage.category === 'CLOSED') {
    const upTo = stages.value.filter((s) => s.sortOrder <= a.value.stage.sortOrder && !s.isRejection)
    return [...upTo, a.value.stage]
  }
  return stages.value.filter((s) => !s.isRejection)
})

const stageState = (s: any, i: number) => {
  const current = a.value?.stage
  if (!current) return 'upcoming'
  if (s.key === current.key) return 'current'
  return s.sortOrder < current.sortOrder ? 'done' : 'upcoming'
}

const load = async () => {
  try {
    const data = await $fetch<any>(`/api/public/candidates/applications/${route.params.reference}`)
    a.value = data.application
    stages.value = data.stages
  } catch {
    a.value = null
  } finally {
    loading.value = false
  }
}

const respond = async (invitationId: string, response: string) => {
  responding.value = true
  try {
    await $fetch(`/api/public/candidates/invitations/${invitationId}`, {
      method: 'PUT', body: { response }
    })
    toast.add({
      severity: 'success', summary: 'Thank you',
      detail: response === 'CONFIRMED' ? 'Your attendance is confirmed.' : 'We will be in touch about another date.',
      life: 5000
    })
    await load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Could not respond', detail: e.data?.statusMessage || 'Please try again.', life: 5000 })
  } finally {
    responding.value = false
  }
}

const withdraw = async () => {
  if (!confirm('Withdraw this application? This cannot be undone.')) return
  try {
    await $fetch(`/api/public/candidates/applications/${route.params.reference}/withdraw`, { method: 'POST' })
    toast.add({ severity: 'success', summary: 'Withdrawn', detail: 'Your application has been withdrawn.', life: 5000 })
    await load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Could not withdraw', detail: e.data?.statusMessage || 'Please try again.', life: 5000 })
  }
}

onMounted(async () => {
  await fetchSession()
  if (!candidate.value) {
    await navigateTo({ path: '/candidate/login', query: { returnTo: route.fullPath } })
    return
  }
  await load()
})

useHead({ title: 'Application - ZACC Careers' })
</script>
