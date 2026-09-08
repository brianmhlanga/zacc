<template>
  <div v-if="loading" class="py-16 text-center text-gray-500">
    <i class="pi pi-spin pi-spinner text-2xl" />
  </div>

  <div v-else-if="!c" class="py-16 text-center text-gray-500">Candidate not found.</div>

  <div v-else>
    <!-- Account state first: it is the reason someone opens this record. -->
    <div class="mb-5 rounded-xl border border-gray-200 bg-white p-4">
      <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div class="flex flex-wrap items-center gap-2">
          <Tag v-if="!c.isActive" value="Deactivated" severity="danger" />
          <Tag v-else-if="c.isLocked" value="Locked out" severity="warn" />
          <Tag v-else-if="!c.emailVerified" value="Email unconfirmed" severity="secondary" />
          <Tag v-else value="Active" severity="success" />
          <span class="text-xs text-gray-500">
            Registered {{ formatDate(c.createdAt) }}
            · {{ c.lastLoginAt ? 'last signed in ' + formatDate(c.lastLoginAt) : 'never signed in' }}
          </span>
        </div>
        <div class="text-right">
          <div class="text-2xl font-extrabold tabular-nums text-zaccBlack">{{ c.profileCompletion }}%</div>
          <div class="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Profile</div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button v-if="!c.emailVerified" label="Resend confirmation" icon="pi pi-envelope" size="small" outlined
          :loading="busy === 'resend_verification'" @click="act('resend_verification')" />
        <Button label="Send password reset" icon="pi pi-key" size="small" outlined severity="secondary"
          :loading="busy === 'send_password_reset'" @click="act('send_password_reset')" />
        <Button v-if="c.isLocked" label="Unlock" icon="pi pi-lock-open" size="small" outlined severity="warn"
          :loading="busy === 'unlock'" @click="act('unlock')" />
        <Button v-if="c.isActive" label="Deactivate" icon="pi pi-ban" size="small" outlined severity="danger"
          :loading="busy === 'deactivate'" @click="confirmDeactivate" />
        <Button v-else label="Reactivate" icon="pi pi-check" size="small" outlined severity="success"
          :loading="busy === 'reactivate'" @click="act('reactivate')" />
      </div>

      <p class="mt-3 text-[11px] text-gray-400">
        A candidate's profile and application answers are their own record and cannot be edited here.
      </p>
    </div>

    <Tabs value="applications">
      <TabList>
        <Tab value="applications">Applications ({{ c.applications?.length || 0 }})</Tab>
        <Tab value="profile">Profile</Tab>
        <Tab value="documents">Documents ({{ c.documents?.length || 0 }})</Tab>
        <Tab value="email">Email ({{ c.notifications?.length || 0 }})</Tab>
        <Tab value="access">Access</Tab>
      </TabList>

      <TabPanels>
        <TabPanel value="applications">
          <div v-if="c.drafts?.length" class="mb-4">
            <h3 class="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Unfinished</h3>
            <div v-for="d in c.drafts" :key="d.id"
              class="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 mb-2 text-sm">
              <div class="font-semibold text-zaccBlack">{{ d.job?.title }}</div>
              <div class="text-xs text-gray-500">
                Last edited {{ formatDate(d.updatedAt) }} · closes {{ formatDate(d.job?.closingDate) }}
              </div>
            </div>
          </div>

          <div v-if="!c.applications?.length" class="text-sm text-gray-400">
            This person has an account but has not applied for anything.
          </div>
          <NuxtLink v-for="a in c.applications" :key="a.id"
            :to="`/admin/recruitment/application-${a.id}`" target="_blank"
            class="block rounded-lg border border-gray-200 px-3 py-2.5 mb-2 hover:border-zaccGreen">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="font-semibold text-zaccBlack truncate">{{ a.job?.title }}</div>
                <div class="text-xs font-mono text-gray-500">{{ a.referenceNumber }}</div>
              </div>
              <div class="text-right flex-shrink-0">
                <div v-if="a.finalScore != null" class="font-extrabold tabular-nums"
                  :class="scoreClass(a.finalScore)">{{ Math.round(a.finalScore) }}</div>
                <div class="text-[11px] text-gray-500">{{ a.stage?.internalLabel }}</div>
              </div>
            </div>
            <div class="mt-1 flex flex-wrap gap-1">
              <Tag v-if="a.isWithdrawn" value="Withdrawn" severity="secondary" />
              <Tag v-else-if="a.isAutoRejected" value="Auto-rejected" severity="danger" />
              <Tag v-else-if="a.isShortlisted" value="Shortlisted" severity="success" />
            </div>
          </NuxtLink>
        </TabPanel>

        <TabPanel value="profile">
          <div v-if="!c.profile" class="text-sm text-gray-400">No profile saved yet.</div>
          <template v-else>
            <div class="mb-4 flex flex-wrap gap-2">
              <span v-for="s in c.profileSections" :key="s.key"
                class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                :class="s.complete ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'">
                {{ s.label }}
              </span>
            </div>
            <dl class="text-sm space-y-2">
              <div v-for="f in profileFields" :key="f.label" class="flex justify-between gap-3">
                <dt class="text-gray-500">{{ f.label }}</dt>
                <dd class="font-semibold text-right">{{ f.value ?? '—' }}</dd>
              </div>
            </dl>
          </template>
        </TabPanel>

        <TabPanel value="documents">
          <div v-if="!c.documents?.length" class="text-sm text-gray-400">
            No documents in this candidate's locker.
          </div>
          <div v-for="d in c.documents" :key="d.id"
            class="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 mb-2">
            <i class="pi pi-file text-zaccGreen" />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate">{{ d.fileName }}</div>
              <div class="text-xs text-gray-500">
                <span v-if="d.label">{{ d.label }} · </span>{{ formatSize(d.fileSize) }}
                · {{ formatDate(d.createdAt) }}
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel value="email">
          <!-- Answers "did they ever get the email" without going to the outbox
               and searching by address. -->
          <div v-if="!c.notifications?.length" class="text-sm text-gray-400">
            Nothing has been sent to this address.
          </div>
          <div v-for="n in c.notifications" :key="n.id"
            class="rounded-lg border border-gray-200 px-3 py-2 mb-2">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="text-sm font-medium truncate">{{ n.subject }}</div>
                <div class="text-[11px] font-mono text-gray-400">{{ n.templateKey }}</div>
              </div>
              <Tag :value="n.status" :severity="outboxSeverity(n.status)" />
            </div>
            <div class="mt-1 text-xs text-gray-500">
              Due {{ formatDateTime(n.scheduledFor) }}
              <span v-if="n.sentAt"> · sent {{ formatDateTime(n.sentAt) }}</span>
            </div>
            <p v-if="n.lastError" class="mt-1 text-xs text-red-600">{{ n.lastError }}</p>
          </div>
        </TabPanel>

        <TabPanel value="access">
          <dl class="text-sm space-y-2 mb-4">
            <div class="flex justify-between gap-3">
              <dt class="text-gray-500">Failed sign-in attempts</dt>
              <dd class="font-semibold tabular-nums">{{ c.failedLoginCount }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-gray-500">Locked until</dt>
              <dd class="font-semibold">{{ c.lockedUntil ? formatDateTime(c.lockedUntil) : '—' }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-gray-500">Email confirmed</dt>
              <dd class="font-semibold">{{ c.emailVerifiedAt ? formatDateTime(c.emailVerifiedAt) : 'Not confirmed' }}</dd>
            </div>
          </dl>

          <h3 class="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Active sessions</h3>
          <div v-if="!c.sessions?.length" class="text-sm text-gray-400">No active sessions.</div>
          <div v-for="s in c.sessions" :key="s.id"
            class="rounded-lg border border-gray-200 px-3 py-2 mb-2 text-xs">
            <div class="text-gray-700">Last used {{ formatDateTime(s.lastUsedAt) }}</div>
            <div class="text-gray-400 truncate">{{ s.ipAddress || 'unknown IP' }} · {{ s.userAgent || 'unknown device' }}</div>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const props = defineProps<{ id: string }>()
const emit = defineEmits<{ changed: [] }>()

const toast = useToast()
const confirm = useConfirm()

const c = ref<any>(null)
const loading = ref(true)
const busy = ref<string | null>(null)

const formatDate = (d: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const formatDateTime = (d: string | Date | null) =>
  d ? new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '—'
const formatSize = (b: number) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`

const scoreClass = (s: number) =>
  s >= 80 ? 'text-green-600' : s >= 65 ? 'text-lime-600' : s >= 50 ? 'text-amber-600' : 'text-red-600'

const outboxSeverity = (status: string) =>
  status === 'SENT' ? 'success'
    : status === 'FAILED' ? 'danger'
    : status === 'CANCELLED' ? 'secondary'
    : status === 'SKIPPED' ? 'warn'
    : 'info'

const profileFields = computed(() => {
  const p = c.value?.profile ?? {}
  return [
    { label: 'Phone', value: c.value?.phone },
    { label: 'Gender', value: p.gender },
    { label: 'Date of birth', value: p.dateOfBirth ? formatDate(p.dateOfBirth) : null },
    { label: 'National ID', value: p.nationalId },
    { label: 'Province', value: p.province },
    { label: 'City', value: p.city },
    { label: 'Qualifications', value: p.qualifications?.length ? `${p.qualifications.length} listed` : null },
    { label: 'Employment', value: p.employment?.length ? `${p.employment.length} post(s)` : null },
    { label: 'Skills', value: p.skills?.length ? `${p.skills.length} listed` : null }
  ]
})

const load = async () => {
  loading.value = true
  try {
    c.value = await $fetch<any>(`/api/recruitment/candidates/${props.id}`)
  } catch (e: any) {
    c.value = null
    toast.add({
      severity: 'error', summary: 'Error',
      detail: e.data?.statusMessage || 'Failed to load', life: 4000
    })
  } finally {
    loading.value = false
  }
}

const act = async (action: string) => {
  busy.value = action
  try {
    const res = await $fetch<any>(`/api/recruitment/candidates/${props.id}/action`, {
      method: 'POST',
      body: { action }
    })
    toast.add({ severity: 'success', summary: 'Done', detail: res.message, life: 6000 })
    await load()
    emit('changed')
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Could not complete',
      detail: e.data?.statusMessage || 'Failed', life: 5000
    })
  } finally {
    busy.value = null
  }
}

// Deactivation signs the person out everywhere, so it is confirmed rather than
// being one click away from a misfire.
const confirmDeactivate = () => {
  confirm.require({
    header: 'Deactivate this account?',
    message:
      `${c.value?.firstName} ${c.value?.lastName} will be signed out everywhere and unable to ` +
      'sign in or submit an application. Their existing applications are unaffected.',
    acceptLabel: 'Deactivate',
    rejectLabel: 'Cancel',
    acceptProps: { severity: 'danger' },
    accept: () => act('deactivate')
  })
}

watch(() => props.id, load)
onMounted(load)
</script>
