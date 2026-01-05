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
</style>