<template>
  <div class="relative min-h-screen flex items-center justify-center px-4">
    <!-- Background Image -->
    <div class="absolute inset-0 z-0">
      <img
        src="/businessman.jpg"
        alt="Background"
        class="h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-black/60"></div>
      <div class="absolute inset-0 bg-gradient-to-br from-zaccGreen/20 via-transparent to-zaccGold/20"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 w-full max-w-md">
      <!-- Logo Section -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center mb-4">
          <img
            src="/logo.png"
            alt="ZACC Logo"
            class="h-24 w-24 object-contain drop-shadow-lg"
          />
        </div>
        <h1 class="text-3xl font-extrabold text-white">ZACC CMS</h1>
        <p class="mt-2 text-white/90">Sign in to your admin account</p>
      </div>

      <!-- Login Card -->
      <Card class="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <template #content>
          <form @submit.prevent="handleLogin" class="space-y-6">
            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-semibold text-zaccBlack mb-2">
                Email Address
              </label>
              <span class="p-input-icon-left w-full">
                <i class="pi pi-envelope" />
                <InputText
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="Enter your email"
                  class="w-full"
                  :class="{ 'p-invalid': errors.email }"
                  required
                />
              </span>
              <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="block text-sm font-semibold text-zaccBlack mb-2">
                Password
              </label>
              <Password
                id="password"
                v-model="form.password"
                placeholder="Enter your password"
                :feedback="false"
                toggleMask
                class="w-full"
                inputClass="w-full"
                :class="{ 'p-invalid': errors.password }"
                required
              />
              <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
            </div>

            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Checkbox
                  v-model="form.rememberMe"
                  inputId="remember"
                  :binary="true"
                />
                <label for="remember" class="text-sm text-gray-700 cursor-pointer">
                  Remember me
                </label>
              </div>
              <NuxtLink
                to="/admin/forgot-password"
                class="text-sm font-semibold text-zaccGreen hover:underline"
              >
                Forgot password?
              </NuxtLink>
            </div>

            <!-- Error Message -->
            <Message
              v-if="errorMessage"
              severity="error"
              :closable="false"
            >
              {{ errorMessage }}
            </Message>

            <!-- Submit Button -->
            <Button
              type="submit"
              label="Sign In"
              icon="pi pi-sign-in"
              :loading="isLoading"
              class="w-full"
              style="background: #209341; border-color: #209341;"
              size="large"
            />
          </form>
        </template>
      </Card>

      <!-- Footer -->
      <div class="mt-6 text-center text-sm text-gray-600">
        <p>
          © {{ currentYear }} Zimbabwe Anti-Corruption Commission.
          <br />
          All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Login - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'Sign in to ZACC Content Management System'
    }
  ]
})

definePageMeta({
  layout: false
})

const form = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const errors = reactive({
  email: '',
  password: ''
})

const errorMessage = ref('')
const isLoading = ref(false)
const currentYear = new Date().getFullYear()

const handleLogin = async () => {
  // Reset errors
  errors.email = ''
  errors.password = ''
  errorMessage.value = ''

  // Validation
  if (!form.email) {
    errors.email = 'Email is required'
    return
  }

  if (!form.password) {
    errors.password = 'Password is required'
    return
  }

  isLoading.value = true

  try {
    // Call login API
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: form.email,
        password: form.password
      }
    })

    // Fetch user session to update the auth state
    const { fetch: fetchUserSession } = useUserSession()
    await fetchUserSession()

    // Redirect to dashboard
    navigateTo('/admin')
  } catch (error: any) {
    errorMessage.value = error.data?.message || error.message || 'Invalid email or password'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
:deep(.p-password) {
  width: 100%;
}
:deep(.p-password-input) {
  width: 100%;
}
</style>
