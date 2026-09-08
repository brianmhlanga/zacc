<template>
  <div v-if="loading" class="py-16 text-center text-gray-500">
    <i class="pi pi-spin pi-spinner text-2xl" />
  </div>

  <div v-else-if="!u" class="py-16 text-center text-gray-500">User not found.</div>

  <div v-else>
    <div class="mb-5 rounded-xl border border-gray-200 bg-white p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-zaccBlack text-white font-bold">
            {{ initials }}
          </div>
          <div class="min-w-0">
            <div class="font-bold text-zaccBlack truncate">{{ u.name || 'Unnamed' }}</div>
            <div class="text-xs text-gray-500 truncate">{{ u.email }}</div>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Tag :value="String(u.role).replace('_', ' ')" :severity="roleSeverity(u.role)" />
          <Tag :value="u.isActive ? 'Active' : 'Inactive'" :severity="u.isActive ? 'success' : 'danger'" />
        </div>
      </div>

      <div class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div v-for="s in stats" :key="s.label">
          <div class="text-lg font-extrabold tabular-nums" :class="s.accent">{{ s.value }}</div>
          <div class="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">{{ s.label }}</div>
        </div>
      </div>

      <p class="mt-3 text-xs text-gray-500">
        Added {{ formatDate(u.createdAt) }}
        · {{ u.lastLoginAt ? 'last signed in ' + formatDateTime(u.lastLoginAt) : 'has never signed in' }}
      </p>
    </div>

    <Tabs value="activity">
      <TabList>
        <Tab value="activity">Activity ({{ u.auditTotal }})</Tab>
        <Tab value="panels">Panels ({{ u.panelMemberships?.length || 0 }})</Tab>
        <Tab value="reviews">Reviews ({{ u.reviews?.length || 0 }})</Tab>
        <Tab value="permissions">Permissions</Tab>
      </TabList>

      <TabPanels>
        <!-- What this person has actually done. The list and the edit dialog
             both answer "what may they do"; nothing answered this. -->
        <TabPanel value="activity">
          <div v-if="u.actionCounts?.length" class="flex flex-wrap gap-2 mb-4">
            <span v-for="a in u.actionCounts" :key="a.action"
              class="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-700">
              {{ humanAction(a.action) }} <b class="tabular-nums">{{ a.count }}</b>
            </span>
          </div>

          <div v-if="!u.auditTrail?.length" class="text-sm text-gray-400">
            No recorded actions yet. Stage changes, exports, rescores and candidate
            account actions all appear here once taken.
          </div>

          <div v-for="e in u.auditTrail" :key="e.id"
            class="border-l-2 border-gray-200 pl-3 pb-3 last:pb-0">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <span class="text-sm font-semibold text-zaccBlack">{{ humanAction(e.action) }}</span>
              <span class="text-[11px] text-gray-500 tabular-nums">{{ formatDateTime(e.createdAt) }}</span>
            </div>
            <p v-if="e.summary" class="text-xs text-gray-600 mt-0.5">{{ e.summary }}</p>
            <p v-if="e.ipAddress" class="text-[11px] text-gray-400 mt-0.5 font-mono">{{ e.ipAddress }}</p>
          </div>

          <p v-if="u.auditTotal > (u.auditTrail?.length || 0)" class="mt-3 text-xs text-gray-500">
            Showing the most recent {{ u.auditTrail.length }} of {{ u.auditTotal }}.
          </p>
        </TabPanel>

        <TabPanel value="panels">
          <div v-if="!u.panelMemberships?.length" class="text-sm text-gray-400">
            Not assigned to any interview panel.
          </div>
          <div v-for="m in u.panelMemberships" :key="m.id"
            class="rounded-lg border border-gray-200 px-3 py-2.5 mb-2">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <NuxtLink :to="`/admin/recruitment/vacancy-${m.job.id}?tab=panel`" target="_blank"
                  class="font-semibold text-zaccBlack hover:text-zaccGreen truncate block">
                  {{ m.job.title }}
                </NuxtLink>
                <div class="text-xs text-gray-500">
                  {{ m.job.department }} · {{ m.job._count.applications }} applicant(s)
                </div>
              </div>
              <Tag :value="m.role" :severity="m.role === 'CHAIR' ? 'warn' : 'secondary'" />
            </div>
            <!-- Masking is per-member per-vacancy, so it belongs here rather
                 than as one blanket statement about the person. -->
            <div class="mt-1.5 flex flex-wrap gap-1">
              <span v-for="f in masking(m)" :key="f.label"
                class="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                :class="f.on ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'">
                {{ f.label }}
              </span>
            </div>
          </div>
        </TabPanel>

        <TabPanel value="reviews">
          <div v-if="!u.reviews?.length" class="text-sm text-gray-400">
            No submitted reviews.
          </div>
          <div v-for="r in u.reviews" :key="r.id"
            class="rounded-lg border border-gray-200 px-3 py-2.5 mb-2">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="font-semibold text-zaccBlack truncate">{{ r.application?.job?.title }}</div>
                <div class="text-xs font-mono text-gray-500">{{ r.application?.referenceNumber }}</div>
              </div>
              <div class="text-right flex-shrink-0">
                <Tag :value="r.recommendation || '—'" :severity="recSeverity(r.recommendation)" />
                <div v-if="r.application?.finalScore != null"
                  class="text-[11px] text-gray-500 mt-1 tabular-nums">
                  scored {{ Math.round(r.application.finalScore) }}
                </div>
              </div>
            </div>
            <p v-if="r.comments" class="text-xs text-gray-600 mt-1">{{ r.comments }}</p>
          </div>
        </TabPanel>

        <TabPanel value="permissions">
          <Message v-if="u.hasImplicitFullAccess" severity="info" :closable="false" class="mb-3">
            Super admins have every permission implicitly. The grants below are not consulted.
          </Message>

          <div class="rounded-lg border border-gray-200 overflow-hidden">
            <div v-for="p in u.permissions" :key="p.key"
              class="flex items-center justify-between gap-3 px-3 py-2 border-b border-gray-100 last:border-b-0">
              <span class="text-sm" :class="p.actions.length ? 'text-zaccBlack' : 'text-gray-400'">
                {{ p.label }}
              </span>
              <div v-if="p.actions.length" class="flex gap-1">
                <span v-for="a in p.actions" :key="a"
                  class="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                  {{ a }}
                </span>
              </div>
              <span v-else class="text-[11px] text-gray-400">no access</span>
            </div>
          </div>

          <NuxtLink to="/admin/permissions" target="_blank"
            class="inline-block mt-3 text-xs font-semibold text-zaccGreen hover:underline">
            Change permissions →
          </NuxtLink>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

const props = defineProps<{ id: string }>()
const toast = useToast()

const u = ref<any>(null)
const loading = ref(true)

const initials = computed(() => {
  const name = u.value?.name || u.value?.email || ''
  return name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p: string) => p[0]).join('').toUpperCase() || '·'
})

const stats = computed(() => [
  { label: 'Panels', value: u.value?._count?.panelMemberships ?? 0, accent: 'text-zaccBlack' },
  { label: 'Scores given', value: u.value?._count?.panelScores ?? 0, accent: 'text-zaccBlack' },
  { label: 'Reviews', value: u.value?._count?.applicationReviews ?? 0, accent: 'text-zaccBlack' },
  {
    label: 'Audited actions',
    value: u.value?.auditTotal ?? 0,
    accent: (u.value?.auditTotal ?? 0) > 0 ? 'text-zaccGreen' : 'text-gray-400'
  }
])

const roleSeverity = (role: string) =>
  role === 'SUPER_ADMIN' ? 'danger' : role === 'ADMIN' ? 'warn' : role === 'REPORTS_ADMIN' ? 'info' : 'secondary'

const recSeverity = (r: string | null) =>
  r === 'SHORTLIST' ? 'success' : r === 'REJECT' ? 'danger' : r === 'RESERVE' ? 'warn' : 'secondary'

/** `vacancy.scheme_updated` reads as "Vacancy scheme updated". */
const humanAction = (action: string) => {
  const text = String(action).replace(/[._]/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const masking = (m: any) => [
  { label: 'Sees identity', on: m.canSeeIdentity },
  { label: 'Sees demographics', on: m.canSeeDemographics },
  { label: 'Sees other scores', on: m.canSeeOtherScores }
]

const formatDate = (d: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const formatDateTime = (d: string | Date | null) =>
  d ? new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '—'

const load = async () => {
  loading.value = true
  try {
    u.value = await $fetch<any>(`/api/users/${props.id}/detail`)
  } catch (e: any) {
    u.value = null
    toast.add({
      severity: 'error', summary: 'Error',
      detail: e.data?.statusMessage || 'Failed to load', life: 4000
    })
  } finally {
    loading.value = false
  }
}

watch(() => props.id, load)
onMounted(load)
</script>
