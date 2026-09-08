<script setup lang="ts">
/**
 * Per-vacancy shortlisting.
 *
 * The applications console already does this and takes a `jobId` filter, so
 * rather than maintaining a second copy of that table this route forwards to it
 * pre-filtered. Keeping the URL means the link from the vacancy list stays
 * meaningful and can be bookmarked.
 */
definePageMeta({ middleware: 'admin' })

const route = useRoute()

await navigateTo(
  { path: '/admin/recruitment/applications', query: { jobId: String(route.params.id) } },
  { replace: true }
)
</script>

<template>
  <NuxtLayout name="dashboard">
    <div class="py-16 text-center text-gray-500">
      <i class="pi pi-spin pi-spinner text-2xl" />
      <p class="mt-3 text-sm">Opening applications for this vacancy…</p>
    </div>
  </NuxtLayout>
</template>
