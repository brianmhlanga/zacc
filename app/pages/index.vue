<template>
  <NuxtLayout name="main">
    <div>
      <Hero />
    <About />
    <Statistics />
    <WhatWeDo />
    <News />
    <Commissioners />
    <Downloads />
    <Contact />
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
