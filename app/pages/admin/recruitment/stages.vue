<template>
  <NuxtLayout name="dashboard">
    <div>
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-extrabold text-zaccBlack">Recruitment settings</h1>
          <p class="mt-2 text-gray-600 max-w-3xl">
            Each stage has an internal name your staff work with and a separate label the
            candidate sees. Delays hold a notification back so an outcome never lands the
            instant a decision is recorded.
          </p>
        </div>
        <Button label="Save settings" icon="pi pi-check" :loading="saving"
          style="background:#209341;border-color:#209341" @click="save" />
      </div>

      <div class="flex gap-2 mb-5">
        <NuxtLink to="/admin/recruitment/stages"
          class="px-4 py-2 rounded-lg text-sm font-semibold bg-zaccBlack/10 text-zaccGreen">Pipeline stages</NuxtLink>
        <NuxtLink to="/admin/recruitment/templates"
          class="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">Notification templates</NuxtLink>
        <NuxtLink to="/admin/recruitment/outbox"
          class="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">Send queue</NuxtLink>
      </div>

      <div v-if="loading" class="py-16 text-center text-gray-500">
        <i class="pi pi-spin pi-spinner text-2xl" />
      </div>

      <div v-else class="space-y-3">
        <Card v-for="(s, i) in stages" :key="s.id" class="border-0 shadow-sm">
          <template #content>
            <div class="flex items-start gap-3">
              <div class="mt-1 h-8 w-1.5 rounded-full flex-shrink-0" :style="{ background: s.colorHex }" />

              <div class="flex-1 min-w-0">
                <div class="grid md:grid-cols-2 gap-3">
                  <label class="block">
                    <span class="text-xs font-semibold text-gray-600">
                      Internal name <span class="text-gray-400">— staff only</span>
                    </span>
                    <InputText v-model="s.internalLabel" class="w-full mt-1" />
                  </label>
                  <label class="block">
                    <span class="text-xs font-semibold text-zaccGreen">
                      Candidate sees <span class="text-gray-400">— public</span>
                    </span>
                    <InputText v-model="s.publicLabel" class="w-full mt-1" />
                  </label>
                </div>

                <label class="block mt-3">
                  <span class="text-xs font-semibold text-gray-600">Explanation shown on the candidate's timeline</span>
                  <Textarea v-model="s.publicDescription" rows="2" class="w-full mt-1" autoResize />
                </label>

                <div class="flex flex-wrap items-center gap-4 mt-3">
                  <label class="flex items-center gap-2 text-sm">
                    <Checkbox v-model="s.showOnCandidateTimeline" binary /> Show on timeline
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <Checkbox v-model="s.notifyCandidate" binary /> Email the candidate
                  </label>
                  <Tag v-if="s.isRejection" value="Rejection" severity="danger" />
                  <Tag v-if="s.isAutoRejectTarget" value="Auto-reject target" severity="warn" />
                  <span v-if="s._count?.applications" class="text-xs text-gray-500">
                    {{ s._count.applications }} application(s) here
                  </span>
                </div>

                <!-- Notification timing, only relevant when this stage emails -->
                <div v-if="s.notifyCandidate"
                  class="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 grid md:grid-cols-4 gap-3">
                  <label class="block md:col-span-2">
                    <span class="text-xs font-semibold text-gray-600">Template</span>
                    <Dropdown v-model="s.notificationTemplateId" :options="templates" optionLabel="name"
                      optionValue="id" class="w-full mt-1" placeholder="Choose a template" showClear />
                  </label>
                  <label class="block">
                    <span class="text-xs font-semibold text-gray-600">Hold back by</span>
                    <Dropdown v-model="s.notificationDelayMinutes" :options="delayOptions" optionLabel="label"
                      optionValue="value" editable class="w-full mt-1" />
                  </label>
                  <label class="block">
                    <span class="text-xs font-semibold text-gray-600">Random extra, up to</span>
                    <Dropdown v-model="s.notificationDelayJitterMinutes" :options="jitterOptions" optionLabel="label"
                      optionValue="value" editable class="w-full mt-1" />
                  </label>
                  <div class="md:col-span-4 flex items-center justify-between gap-4">
                    <label class="flex items-center gap-2 text-sm">
                      <Checkbox v-model="s.respectSendWindow" binary /> Only send during working hours
                    </label>
                    <span class="text-xs text-gray-500">{{ describeTiming(s) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Recruitment settings - ZACC CMS' })

const toast = useToast()
const stages = ref<any[]>([])
const templates = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)

const delayOptions = [
  { label: 'Send immediately', value: 0 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '1 day', value: 1440 },
  { label: '2 days', value: 2880 },
  { label: '3 days', value: 4320 },
  { label: '5 days', value: 7200 }
]
const jitterOptions = [
  { label: 'None', value: 0 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '8 hours', value: 480 }
]

const humanise = (mins: number) => {
  if (!mins) return 'immediately'
  if (mins < 60) return `${mins} min`
  if (mins < 1440) return `${Math.round(mins / 60)}h`
  return `${Math.round((mins / 1440) * 10) / 10} days`
}

const describeTiming = (s: any) => {
  if (!s.notificationDelayMinutes && !s.notificationDelayJitterMinutes) {
    return s.respectSendWindow ? 'Sent at the next working hour' : 'Sent immediately'
  }
  const base = humanise(s.notificationDelayMinutes)
  const jitter = s.notificationDelayJitterMinutes
    ? ` plus up to ${humanise(s.notificationDelayJitterMinutes)}`
    : ''
  const window = s.respectSendWindow ? ', then the next working hour' : ''
  return `Held ${base}${jitter}${window}`
}

const load = async () => {
  loading.value = true
  try {
    const data = await $fetch<any>('/api/recruitment/config/stages')
    stages.value = data.stages
    templates.value = data.templates
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Error',
      detail: e.data?.statusMessage || 'Failed to load settings', life: 4000
    })
  } finally {
    loading.value = false
  }
}

const save = async () => {
  saving.value = true
  try {
    const res = await $fetch<any>('/api/recruitment/config/stages', {
      method: 'PUT',
      body: {
        stages: stages.value.map((s, i) => ({
          id: s.id,
          internalLabel: s.internalLabel,
          publicLabel: s.publicLabel,
          internalDescription: s.internalDescription,
          publicDescription: s.publicDescription,
          colorHex: s.colorHex,
          sortOrder: (i + 1) * 10,
          showOnCandidateTimeline: s.showOnCandidateTimeline,
          notifyCandidate: s.notifyCandidate,
          notificationTemplateId: s.notificationTemplateId,
          notificationDelayMinutes: Number(s.notificationDelayMinutes) || 0,
          notificationDelayJitterMinutes: Number(s.notificationDelayJitterMinutes) || 0,
          respectSendWindow: s.respectSendWindow,
          isActive: s.isActive
        }))
      }
    })
    toast.add({ severity: 'success', summary: 'Saved', detail: res.message, life: 3000 })
  } catch (e: any) {
    toast.add({
      severity: 'error', summary: 'Could not save',
      detail: e.data?.statusMessage || 'Failed to save settings', life: 6000
    })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
