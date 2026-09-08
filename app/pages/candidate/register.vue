<template>
  <NuxtLayout name="main">
    <div class="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div class="w-full max-w-lg">
        <div class="mb-6 text-center">
          <h1 class="text-3xl font-extrabold text-zaccBlack">Create your account</h1>
          <p class="mt-2 text-zaccBlack/70">
            One account lets you apply for any post and track every application.
          </p>
        </div>

        <Card v-if="done" class="border-0 shadow-lg">
          <template #content>
            <div class="text-center py-6">
              <i class="pi pi-envelope text-4xl text-zaccGreen mb-3 block" />
              <h2 class="text-xl font-bold text-zaccBlack mb-2">Check your email</h2>
              <p class="text-zaccBlack/70">{{ message }}</p>
              <NuxtLink to="/candidate/login">
                <Button label="Go to sign in" outlined class="mt-5" />
              </NuxtLink>
            </div>
          </template>
        </Card>

        <Card v-else class="border-0 shadow-lg">
          <template #content>
            <form @submit.prevent="submit">
              <div class="grid grid-cols-2 gap-3 mb-4">
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">First name</span>
                  <InputText v-model="form.firstName" class="w-full mt-1" autocomplete="given-name" />
                </label>
                <label class="block">
                  <span class="text-sm font-semibold text-zaccBlack">Surname</span>
                  <InputText v-model="form.lastName" class="w-full mt-1" autocomplete="family-name" />
                </label>
              </div>

              <label class="block mb-4">
                <span class="text-sm font-semibold text-zaccBlack">Email address</span>
                <InputText v-model="form.email" type="email" class="w-full mt-1" autocomplete="email" />
                <small class="text-zaccBlack/50">All correspondence goes here, including interview invitations.</small>
              </label>

              <label class="block mb-4">
                <span class="text-sm font-semibold text-zaccBlack">Phone number</span>
                <InputText v-model="form.phone" class="w-full mt-1" placeholder="+263 77 000 0000"
                  autocomplete="tel" />
              </label>

              <label class="block mb-4">
                <span class="text-sm font-semibold text-zaccBlack">Password</span>
                <Password v-model="form.password" class="w-full mt-1" inputClass="w-full" toggleMask
                  autocomplete="new-password" />
                <small class="text-zaccBlack/50">At least 10 characters.</small>
              </label>

              <label class="flex items-start gap-2 text-sm text-zaccBlack/80 mb-4">
                <Checkbox v-model="form.acceptTerms" binary class="mt-0.5" />
                <span>
                  I understand that information I provide will be verified with the institutions,
                  employers and authorities I name.
                </span>
              </label>

              <Message v-if="error" severity="error" :closable="false" class="mb-4">{{ error }}</Message>

              <Button type="submit" label="Create account" class="w-full" :loading="loading"
                style="background:#209341;border-color:#209341" />
            </form>

            <p class="text-center text-sm text-zaccBlack/70 mt-5">
              Already registered?
              <NuxtLink to="/candidate/login" class="text-zaccGreen font-semibold hover:underline">Sign in</NuxtLink>
            </p>
          </template>
        </Card>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({ title: 'Create an account - ZACC Careers' })

const { register } = useCandidateAuth()

const form = reactive({
  firstName: '', lastName: '', email: '', phone: '', password: '', acceptTerms: false
})
const loading = ref(false)
const error = ref('')
const done = ref(false)
const message = ref('')

const submit = async () => {
  error.value = ''
  if (!form.firstName || !form.lastName || !form.email || !form.password) {
    error.value = 'Please complete every field.'
    return
  }
  if (form.password.length < 10) {
    error.value = 'Your password must be at least 10 characters.'
    return
  }
  if (!form.acceptTerms) {
    error.value = 'Please accept the declaration to continue.'
    return
  }

  loading.value = true
  try {
    const res = await register({ ...form, acceptTerms: true })
    message.value = res.message
    done.value = true
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Could not create your account.'
  } finally {
    loading.value = false
  }
}
</script>
