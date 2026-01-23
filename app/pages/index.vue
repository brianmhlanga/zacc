<template>
  <NuxtLayout name="main">
    <div>
      <Hero />
      <Statistics />
    </div>
  </NuxtLayout>
</template>

<script setup>
useHead({
  title: 'Zimbabwe Anti-Corruption Commission (ZACC)',
  htmlAttrs: {
    lang: 'en',
    class: 'scroll-smooth'
  }
})
</script>
