<template>
  <NuxtLayout name="dashboard">
    <div>
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Send queue</h1>
          <p class="mt-2 text-gray-600">
            Candidate notifications waiting to go out. Delayed messages sit here until they are due.
          </p>
        </div>
        <Button label="Refresh" icon="pi pi-refresh" outlined @click="load" />
      </div>

      <div class="flex gap-2 mb-5">
        <NuxtLink to="/admin/recruitment/stages"
          class="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">Pipeline stages</NuxtLink>
        <NuxtLink to="/admin/recruitment/templates"
          class="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">Notification templates</NuxtLink>
        <NuxtLink to="/admin/recruitment/outbox"
          class="px-4 py-2 rounded-lg text-sm font-semibold bg-zaccBlack/10 text-zaccGreen">Send queue</NuxtLink>
      </div>

      <!-- The failure this page exists to make visible. -->
      <Message v-if="!mailConfigured" severity="error" :closable="false" class="mb-4">
        <span class="font-semibold">No mail transport configured.</span>
        Set <code>RESEND_API_KEY</code> or <code>SMTP_HOST</code> in the environment. Notices are
        parked as <strong>Skipped</strong> rather than lost — requeue them once mail works.
      </Message>
      <Message v-if="pollerDisabled" severity="warn" :closable="false" class="mb-4">
        The send poller is disabled on this instance (<code>RECRUITMENT_OUTBOX_DISABLED=1</code>).
        Nothing will be delivered from here.
      </Message>

      <div class="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
        <button v-for="s in statusTiles" :key="s.key" type="button"
          class="rounded-xl border p-3 text-left transition-colors"
          :class="statusFilter === s.key ? 'border-zaccGreen bg-zaccGreen/5' : 'border-gray-200 bg-white hover:border-gray-300'"
          @click="statusFilter = statusFilter === s.key ? null : s.key; load()">
          <div class="text-xl font-extrabold" :class="s.accent">{{ counts[s.key] ?? 0 }}</div>
          <div class="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">{{ s.label }}</div>
        </button>
      </div>

      <Card class="border-0 shadow-md">
        <template #content>
          <div v-if="selected.length" class="flex items-center gap-3 mb-3 rounded-lg bg-gray-50 p-3">
            <span class="text-sm font-semibold">{{ selected.length }} selected</span>
            <Button label="Requeue" icon="pi pi-replay" size="small" outlined @click="act('requeue')" />
            <Button label="Cancel" icon="pi pi-times" size="small" outlined severity="danger"
              @click="act('cancel')" />
          </div>

          <DataTable v-model:selection="selected" :value="rows" :loading="loading" paginator :rows="25"
            stripedRows dataKey="id">
            <Column selectionMode="multiple" style="width:44px" />
            <Column header="Recipient">
              <template #body="{ data }">
                <div class="text-sm">{{ data.toName || '—' }}</div>
                <div class="text-xs text-gray-500">{{ data.toEmail }}</div>
              </template>
            </Column>
            <Column field="subject" header="Subject">
              <template #body="{ data }">
                <div class="text-sm truncate max-w-md">{{ data.subject }}</div>
                <code class="text-[11px] text-gray-400">{{ data.templateKey }}</code>
              </template>
            </Column>
            <Column header="Status">
              <template #body="{ data }">
                <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
                <div v-if="data.attempts" class="text-[11px] text-gray-500 mt-1">
                  {{ data.attempts }}/{{ data.maxAttempts }} attempts
                </div>
              </template>
            </Column>
            <Column field="scheduledFor" header="Due" sortable>
              <template #body="{ data }">
                <div class="text-sm">{{ formatDateTime(data.scheduledFor) }}</div>
                <div v-if="data.status === 'SCHEDULED'" class="text-[11px]"
                  :class="isDue(data.scheduledFor) ? 'text-amber-600' : 'text-gray-500'">
                  {{ relative(data.scheduledFor) }}
                </div>
                <div v-else-if="data.sentAt" class="text-[11px] text-gray-500">
                  sent {{ formatDateTime(data.sentAt) }}
                </div>
              </template>
            </Column>
            <Column header="Error">
              <template #body="{ data }">
                <span v-if="data.lastError" class="text-xs text-red-600">{{ data.lastError }}</span>
              </template>
            </Column>

            <template #empty>
              <div class="text-center py-10 text-gray-500">Nothing in the queue.</div>
            </template>
          </DataTable>
        </template>
      </Card>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Send queue - ZACC CMS' })

const toast = useToast()
const rows = ref<any[]>([])
const counts = ref<Record<string, number>>({})
const selected = ref<any[]>([])
const loading = ref(true)
const mailConfigured = ref(true)
const pollerDisabled = ref(false)
const statusFilter = ref<string | null>(null)

const statusTiles = [
  { key: 'SCHEDULED', label: 'Scheduled', accent: 'text-zaccBlack' },
  { key: 'SENT', label: 'Sent', accent: 'text-zaccGreen' },
  { key: 'SKIPPED', label: 'Skipped', accent: 'text-amber-600' },
  { key: 'FAILED', label: 'Failed', accent: 'text-red-600' },
  { key: 'CANCELLED', label: 'Cancelled', accent: 'text-gray-400' },
  { key: 'CLAIMED', label: 'Sending', accent: 'text-blue-600' }
]

const statusLabel = (s: string) =>
  statusTiles.find((t) => t.key === s)?.label ?? s

const statusSeverity = (s: string) =>
  ({ SENT: 'success', SCHEDULED: 'info', SKIPPED: 'warn', FAILED: 'danger', CANCELLED: 'secondary' }[s] ?? 'secondary')

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

const isDue = (d: string) => new Date(d).getTime() <= Date.now()

const relative = (d: string) => {
  const diff = new Date(d).getTime() - Date.now()
  if (diff <= 0) return 'due now'
  const hours = diff / 3_600_000
  if (hours < 1) return `in ${Math.round(diff / 60_000)} min`
  if (hours < 48) return `in ${Math.round(hours)}h`
  return `in ${Math.round(hours / 24)} days`
}

const load = async () => {
  loading.value = true
  selected.value = []
  try {
    const data = await $fetch<any>('/api/recruitment/config/outbox', {
      params: statusFilter.value ? { status: statusFilter.value } : {}
    })
    rows.value = data.rows
    counts.value = data.counts
    mailConfigured.value = data.mailConfigured
    pollerDisabled.value = data.pollerDisabled
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Error',
      detail: e.data?.statusMessage || 'Failed to load the queue', life: 4000
    })
  } finally {
    loading.value = false
  }
}

const act = async (action: 'requeue' | 'cancel') => {
  try {
    const res = await $fetch<any>('/api/recruitment/config/outbox', {
      method: 'POST',
      body: { action, ids: selected.value.map((r) => r.id) }
    })
    toast.add({ severity: 'success', summary: 'Done', detail: res.message, life: 4000 })
    await load()
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Failed',
      detail: e.data?.statusMessage || 'Could not update the queue', life: 5000
    })
  }
}

onMounted(load)
</script>
