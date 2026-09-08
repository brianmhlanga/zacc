<template>
  <NuxtLayout name="portal">
    <div>
      <div class="mb-6">
        <h1 class="text-2xl font-extrabold text-zaccBlack">My applications</h1>
        <p class="mt-1 text-sm text-zaccBlack/60">
          Everything you have sent, and anything still unfinished.
        </p>
      </div>

      <div v-if="loading" class="py-16 text-center text-zaccBlack/50">
        <i class="pi pi-spin pi-spinner text-2xl" />
      </div>

      <template v-else>
        <!-- Unfinished drafts first: these are the ones with a deadline. -->
        <section v-if="drafts.length" class="mb-8">
          <h2 class="text-sm font-bold uppercase tracking-wider text-zaccBlack/50 mb-3">
            Unfinished applications
          </h2>
          <div class="space-y-3">
            <div v-for="d in drafts" :key="d.job.slug"
              class="flex flex-wrap items-center gap-4 rounded-xl border border-zaccGold/40 bg-zaccGold/5 p-4">
              <div class="flex-1 min-w-0">
                <div class="font-bold text-zaccBlack">{{ d.job.title }}</div>
                <div class="text-sm text-zaccBlack/60">
                  Step {{ d.currentStep }} of 8 · last saved {{ formatDateTime(d.updatedAt) }}
                </div>
                <div class="text-sm font-semibold" :class="daysLeft(d.job.closingDate) <= 3 ? 'text-red-600' : 'text-zaccBlack/60'">
                  {{ daysLeft(d.job.closingDate) > 0
                    ? `Closes in ${daysLeft(d.job.closingDate)} day(s)`
                    : 'This vacancy has closed' }}
                </div>
              </div>
              <NuxtLink v-if="daysLeft(d.job.closingDate) > 0" :to="`/careers/apply/${d.job.slug}`">
                <Button label="Continue" style="background:#209341;border-color:#209341" />
              </NuxtLink>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-sm font-bold uppercase tracking-wider text-zaccBlack/50 mb-3">
            Submitted
          </h2>

          <div v-if="!applications.length"
            class="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <i class="pi pi-inbox text-4xl text-gray-300 mb-3 block" />
            <h3 class="text-lg font-semibold text-zaccBlack mb-1">No applications yet</h3>
            <p class="text-zaccBlack/60 mb-5">Browse the open posts and apply.</p>
            <NuxtLink to="/careers">
              <Button label="See vacancies" style="background:#209341;border-color:#209341" />
            </NuxtLink>
          </div>

          <div v-else class="space-y-3">
            <NuxtLink v-for="a in applications" :key="a.id"
              :to="`/candidate/applications/${a.referenceNumber}`"
              class="block rounded-xl border border-gray-200 p-4 hover:border-zaccGreen transition-colors">
              <div class="flex flex-wrap items-center gap-4">
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-zaccBlack">{{ a.job.title }}</div>
                  <div class="text-sm text-zaccBlack/60">
                    {{ a.job.department }} · submitted {{ formatDate(a.submittedAt || a.createdAt) }}
                  </div>
                  <div class="font-mono text-xs text-zaccBlack/40 mt-1">{{ a.referenceNumber }}</div>
                </div>
                <Tag v-if="a.isWithdrawn" value="Withdrawn" severity="secondary" />
                <span v-else-if="a.stage"
                  class="rounded-full px-3 py-1 text-xs font-bold text-white"
                  :style="{ background: a.stage.colorHex }">
                  {{ a.stage.publicLabel }}
                </span>
                <i class="pi pi-chevron-right text-zaccBlack/30" />
              </div>
            </NuxtLink>
          </div>
        </section>
      </template>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'candidate' })

useHead({ title: 'My applications - ZACC Careers' })

const { candidate, fetchSession } = useCandidateAuth()
const applications = ref<any[]>([])
const drafts = ref<any[]>([])
const loading = ref(true)

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const formatDateTime = (d: string) =>
  new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const daysLeft = (d: string) =>
  Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)

onMounted(async () => {
  await fetchSession()
  if (!candidate.value) {
    await navigateTo({ path: '/candidate/login', query: { returnTo: '/candidate' } })
    return
  }
  try {
    const data = await $fetch<any>('/api/public/candidates/applications')
    applications.value = data.applications
    drafts.value = data.drafts
  } finally {
    loading.value = false
  }
})
</script>
