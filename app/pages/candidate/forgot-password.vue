<template>
  <NuxtLayout name="main">
    <div class="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div class="w-full max-w-md">
        <h1 class="text-3xl font-extrabold text-zaccBlack text-center mb-2">Reset your password</h1>
        <p class="text-center text-zaccBlack/70 mb-6">
          We will email you a link to choose a new one.
        </p>

        <Card class="border-0 shadow-lg">
          <template #content>
            <Message v-if="sent" severity="success" :closable="false">{{ message }}</Message>
            <form v-else @submit.prevent="submit">
              <label class="block mb-4">
                <span class="text-sm font-semibold text-zaccBlack">Email address</span>
                <InputText v-model="email" type="email" class="w-full mt-1" autocomplete="email" />
              </label>
              <Message v-if="error" severity="error" :closable="false" class="mb-4">{{ error }}</Message>
              <Button type="submit" label="Send reset link" class="w-full" :loading="loading"
                style="background:#209341;border-color:#209341" />
            </form>
            <p class="text-center text-sm text-zaccBlack/70 mt-5">
              <NuxtLink to="/candidate/login" class="text-zaccGreen font-semibold hover:underline">
                Back to sign in
              </NuxtLink>
            </p>
          </template>
        </Card>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({ title: 'Reset your password - ZACC Careers' })

const email = ref('')
const loading = ref(false)
const sent = ref(false)
const error = ref('')
const message = ref('')

const submit = async () => {
  error.value = ''
  if (!email.value) { error.value = 'Enter your email address.'; return }
  loading.value = true
  try {
    const res = await $fetch<any>('/api/public/candidates/forgot-password', {
      method: 'POST', body: { email: email.value }
    })
    message.value = res.message
    sent.value = true
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Could not process the request.'
  } finally {
    loading.value = false
  }
}
</script>
