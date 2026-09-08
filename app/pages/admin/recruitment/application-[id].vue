<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- The console opens this in a drawer; the route stays for deep links,
           bookmarks and the links inside notification emails. -->
      <div class="mb-6">
        <NuxtLink to="/admin/recruitment/applications" class="text-sm text-gray-500 hover:text-zaccGreen">
          <i class="pi pi-arrow-left text-xs" /> Applications
        </NuxtLink>
        <h1 class="truncate text-3xl font-extrabold text-zaccBlack">{{ heading }}</h1>
        <p v-if="subheading" class="mt-1 text-gray-600">{{ subheading }}</p>
      </div>

      <AdminRecruitmentApplicationDossier :id="id" @loaded="onLoaded" />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const route = useRoute()
const id = computed(() => String(route.params.id))

const heading = ref('Application')
const subheading = ref('')

const onLoaded = (a: any) => {
  heading.value = a.fullName || 'Applicant'
  subheading.value = [a.referenceNumber, a.job?.title].filter(Boolean).join(' · ')
  useHead({ title: `${heading.value} - ZACC CMS` })
}
</script>
