<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-zaccGreen/10 via-white to-zaccGold/10 px-4">
    <div class="w-full max-w-md">
      <!-- Logo Section -->
      <div class="text-center mb-8">
        <div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zaccGreen mb-4 shadow-lg">
          <i class="pi pi-shield text-white text-3xl"></i>
        </div>
        <h1 class="text-3xl font-extrabold text-zaccBlack">Reset Password</h1>
        <p class="mt-2 text-gray-600">Enter your email to receive reset instructions</p>
      </div>

      <!-- Forgot Password Card -->
      <Card class="shadow-xl border-0">
        <template #content>
          <form @submit.prevent="handleForgotPassword" class="space-y-6">
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
                  placeholder="admin@zacc.gov.zw"
                  class="w-full"
                  :class="{ 'p-invalid': errors.email }"
                  required
                />
              </span>
              <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
              <small class="text-gray-500 mt-1 block">
                We'll send you a link to reset your password
              </small>
            </div>

            <!-- Success Message -->
            <Message
              v-if="successMessage"
              severity="success"
              :closable="false"
            >
              {{ successMessage }}
            </Message>

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
              label="Send Reset Link"
              icon="pi pi-send"
              :loading="isLoading"
              class="w-full"
              style="background: #209341; border-color: #209341;"
              size="large"
            />

            <!-- Back to Login -->
            <div class="text-center pt-4 border-t border-gray-200">
              <NuxtLink
                to="/admin/login"
                class="inline-flex items-center gap-2 text-sm font-semibold text-zaccGreen hover:underline"
              >
                <i class="pi pi-arrow-left"></i>
                Back to Login
              </NuxtLink>
            </div>
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
  title: 'Forgot Password - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'Reset your ZACC CMS password'
    }
  ]
})

definePageMeta({
  layout: false
})

const form = reactive({
  email: ''
})

const errors = reactive({
  email: ''
})

const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)
const currentYear = new Date().getFullYear()

const handleForgotPassword = async () => {
  // Reset messages
  errors.email = ''
  errorMessage.value = ''
  successMessage.value = ''

  // Validation
  if (!form.email) {
    errors.email = 'Email is required'
    return
  }

  isLoading.value = true

  try {
    // TODO: Implement actual password reset
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Simulate successful reset
    successMessage.value = 'Password reset link has been sent to your email address. Please check your inbox.'
    form.email = ''
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to send reset link. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
