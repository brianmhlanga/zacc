<template>
  <NuxtLayout name="main">
    <div class="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <Card class="border-0 shadow-lg w-full max-w-md">
        <template #content>
          <div class="text-center py-6">
            <template v-if="pending">
              <ProgressSpinner style="width:44px;height:44px" />
              <p class="mt-4 text-zaccBlack/70">Confirming your email…</p>
            </template>
            <template v-else-if="ok">
              <i class="pi pi-check-circle text-5xl text-zaccGreen mb-3 block" />
              <h1 class="text-2xl font-extrabold text-zaccBlack mb-2">Email confirmed</h1>
              <p class="text-zaccBlack/70 mb-5">You are signed in and ready to apply.</p>
              <NuxtLink to="/careers">
                <Button label="Browse vacancies" style="background:#209341;border-color:#209341" />
              </NuxtLink>
            </template>
            <template v-else>
              <i class="pi pi-times-circle text-5xl text-red-500 mb-3 block" />
              <h1 class="text-2xl font-extrabold text-zaccBlack mb-2">Link not valid</h1>
              <p class="text-zaccBlack/70 mb-5">{{ error }}</p>
              <NuxtLink to="/candidate/login">
                <Button label="Go to sign in" outlined />
              </NuxtLink>
            </template>
          </div>
        </template>
      </Card>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({ title: 'Confirm your email - ZACC Careers' })

const route = useRoute()
const { fetchSession } = useCandidateAuth()

const pending = ref(true)
const ok = ref(false)
const error = ref('')

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : ''
  if (!token) {
    pending.value = false
    error.value = 'This link is missing its confirmation code.'
    return
  }
  try {
    await $fetch('/api/public/candidates/verify', { method: 'POST', body: { token } })
    await fetchSession(true)
    ok.value = true
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'This confirmation link is invalid or has expired.'
  } finally {
    pending.value = false
  }
})
</script>
