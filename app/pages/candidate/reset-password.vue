<template>
  <NuxtLayout name="main">
    <div class="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div class="w-full max-w-md">
        <h1 class="text-3xl font-extrabold text-zaccBlack text-center mb-6">Choose a new password</h1>

        <Card class="border-0 shadow-lg">
          <template #content>
            <Message v-if="done" severity="success" :closable="false">
              {{ message }}
              <NuxtLink to="/candidate/login" class="block mt-3">
                <Button label="Sign in" style="background:#209341;border-color:#209341" />
              </NuxtLink>
            </Message>

            <form v-else @submit.prevent="submit">
              <label class="block mb-4">
                <span class="text-sm font-semibold text-zaccBlack">New password</span>
                <Password v-model="password" class="w-full mt-1" inputClass="w-full" toggleMask
                  autocomplete="new-password" />
                <small class="text-zaccBlack/50">At least 10 characters.</small>
              </label>
              <label class="block mb-4">
                <span class="text-sm font-semibold text-zaccBlack">Confirm new password</span>
                <Password v-model="confirm" class="w-full mt-1" inputClass="w-full" toggleMask
                  :feedback="false" autocomplete="new-password" />
              </label>
              <Message v-if="error" severity="error" :closable="false" class="mb-4">{{ error }}</Message>
              <Button type="submit" label="Change password" class="w-full" :loading="loading"
                style="background:#209341;border-color:#209341" />
            </form>
          </template>
        </Card>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({ title: 'Choose a new password - ZACC Careers' })

const route = useRoute()
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const done = ref(false)
const error = ref('')
const message = ref('')

const submit = async () => {
  error.value = ''
  const token = typeof route.query.token === 'string' ? route.query.token : ''
  if (!token) { error.value = 'This link is missing its reset code.'; return }
  if (password.value.length < 10) { error.value = 'Use at least 10 characters.'; return }
  if (password.value !== confirm.value) { error.value = 'The two passwords do not match.'; return }

  loading.value = true
  try {
    const res = await $fetch<any>('/api/public/candidates/reset-password', {
      method: 'POST', body: { token, password: password.value }
    })
    message.value = res.message
    done.value = true
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Could not reset your password.'
  } finally {
    loading.value = false
  }
}
</script>
