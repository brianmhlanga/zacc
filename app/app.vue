<template>
  <NuxtPage />
  <Toast />
  <ConfirmDialog />
</template>

<script setup>
useHead({
  htmlAttrs: {
    lang: 'en',
    class: 'scroll-smooth'
  }
})
</script>

<style>
input.p-password-input {
    width: 100% !important;
}

html, body {
    overflow-x: hidden !important;
    max-width: 100vw !important;
    box-sizing: border-box;
}

*, *::before, *::after {
    box-sizing: border-box;
}
</style>