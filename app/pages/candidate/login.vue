<template>
  <NuxtLayout name="main">
    <div class="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div class="w-full max-w-md">
        <div class="mb-6 text-center">
          <h1 class="text-3xl font-extrabold text-zaccBlack">Sign in</h1>
          <p class="mt-2 text-zaccBlack/70">
            Track your applications and apply for new posts.
          </p>
        </div>

        <Card class="border-0 shadow-lg">
          <template #content>
            <form @submit.prevent="submit">
              <label class="block mb-4">
                <span class="text-sm font-semibold text-zaccBlack">Email address</span>
                <InputText v-model="form.email" type="email" class="w-full mt-1" autocomplete="email"
                  :class="{ 'p-invalid': submitted && !form.email }" />
              </label>

              <label class="block mb-2">
                <span class="text-sm font-semibold text-zaccBlack">Password</span>
                <Password v-model="form.password" class="w-full mt-1" inputClass="w-full" toggleMask
                  :feedback="false" autocomplete="current-password" />
              </label>

              <NuxtLink to="/candidate/forgot-password"
                class="text-sm text-zaccGreen hover:underline">Forgotten your password?</NuxtLink>

              <Message v-if="error" severity="error" :closable="false" class="mt-4">{{ error }}</Message>

              <Button type="submit" label="Sign in" class="w-full mt-5" :loading="loading"
                style="background:#209341;border-color:#209341" />
            </form>

            <p class="text-center text-sm text-zaccBlack/70 mt-5">
              No account?
              <NuxtLink to="/candidate/register" class="text-zaccGreen font-semibold hover:underline">
                Create one
              </NuxtLink>
            </p>
          </template>
        </Card>

        <p class="text-center text-xs text-zaccBlack/50 mt-6">
          The Commission charges no fee at any stage of recruitment.
        </p>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({ title: 'Sign in - ZACC Careers' })

const route = useRoute()
const { login } = useCandidateAuth()

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const submitted = ref(false)
const error = ref('')

const submit = async () => {
  submitted.value = true
  error.value = ''
  if (!form.email || !form.password) {
    error.value = 'Enter your email and password.'
    return
  }

  loading.value = true
  try {
    await login(form.email, form.password)
    // Return the candidate to whatever they were trying to reach.
    const returnTo = typeof route.query.returnTo === 'string' ? route.query.returnTo : '/candidate'
    await navigateTo(returnTo)
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Could not sign you in. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
