<template>
  <NuxtLayout name="main">
    <div>
      <section class="relative isolate overflow-hidden bg-zaccBlack text-white py-20">
        <div class="absolute inset-0">
          <img src="/gavel.jpg" alt="" class="absolute inset-0 h-full w-full object-cover opacity-20" />
          <div class="absolute inset-0 bg-zaccBlack/90"></div>
        </div>
        <div class="relative mx-auto max-w-7xl px-6 text-center">
          <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">Track your report</h1>
          <p class="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            Enter the report reference you received after submission. If you did not report anonymously, enter the same email you used on the form.
          </p>
        </div>
      </section>

      <section class="relative py-16">
        <div class="mx-auto max-w-lg px-6">
          <Card class="shadow-lg">
            <template #content>
              <form class="space-y-4" @submit.prevent="lookup">
                <div>
                  <label for="reportNumber" class="block text-sm font-semibold text-zaccBlack mb-2">Report reference</label>
                  <InputText
                    id="reportNumber"
                    v-model="form.reportNumber"
                    class="w-full font-mono"
                    placeholder="e.g. ZACC-2026-01234567"
                  />
                </div>
                <div>
                  <label for="email" class="block text-sm font-semibold text-zaccBlack mb-2">
                    Email <span class="text-zaccBlack/50 font-normal">(required if you provided contact details)</span>
                  </label>
                  <InputText
                    id="email"
                    v-model="form.email"
                    type="email"
                    class="w-full"
                    placeholder="Optional for anonymous reports"
                  />
                </div>
                <Button
                  type="submit"
                  label="Check status"
                  :loading="loading"
                  class="w-full"
                  style="background: #209341; border-color: #209341;"
                />
              </form>
            </template>
          </Card>

          <Card v-if="result" class="mt-8 shadow-lg border border-zaccGreen/20">
            <template #content>
              <div class="space-y-4">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <span class="text-sm text-zaccBlack/70">Your reference</span>
                  <span class="font-mono text-sm font-semibold text-zaccBlack break-all">{{ result.reportNumber }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm text-zaccBlack/70">Current status</span>
                  <Tag :value="result.statusLabel" severity="info" />
                </div>
                <p class="text-xs text-zaccBlack/60">Last updated: {{ formatDate(result.lastUpdated) }}</p>
                <div v-if="result.timeline?.length" class="pt-4 border-t border-zaccBlack/10">
                  <h3 class="text-sm font-semibold text-zaccBlack mb-3">Timeline</h3>
                  <ul class="space-y-2 text-sm">
                    <li
                      v-for="(ev, i) in result.timeline"
                      :key="i"
                      class="flex justify-between gap-4 border-l-2 border-zaccGold pl-3"
                    >
                      <span>{{ ev.label }}</span>
                      <span class="text-zaccBlack/60 whitespace-nowrap">{{ formatDate(ev.at) }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </section>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const form = reactive({
  reportNumber: '',
  email: ''
})

const loading = ref(false)
const result = ref<{
  reportNumber: string
  status: string
  statusLabel: string
  lastUpdated: string
  submittedAt: string
  timeline: { status: string; label: string; at: string }[]
} | null>(null)

const route = useRoute()
onMounted(() => {
  const q = route.query.ref as string | undefined
  if (q) form.reportNumber = q
})

const lookup = async () => {
  loading.value = true
  result.value = null
  try {
    const data = await $fetch('/api/public/reports/track', {
      method: 'POST',
      body: {
        reportNumber: form.reportNumber.trim(),
        email: form.email.trim()
      }
    })
    result.value = data as any
  } catch (e: any) {
    const msg = e.data?.statusMessage || e?.message || 'Could not find that report'
    toast.add({ severity: 'error', summary: 'Lookup failed', detail: msg, life: 5000 })
  } finally {
    loading.value = false
  }
}

const formatDate = (iso: string | Date) => {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

useHead({
  title: 'Track report status - ZACC',
  meta: [{ name: 'description', content: 'Check the status of a corruption report using your reference number.' }]
})
</script>
