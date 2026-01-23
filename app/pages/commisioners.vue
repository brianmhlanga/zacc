<script setup lang="ts">
// Redirect typo to correct spelling
definePageMeta({
  layout: false
})

// Permanent redirect to correct URL (works in both SSR and client)
navigateTo('/commissioners', { redirectCode: 301, replace: true })
</script>
