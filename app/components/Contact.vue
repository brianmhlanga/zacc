<template>
  <section id="contact" class="relative py-20 bg-[#d4af37e6]">
    <div class="mx-auto max-w-7xl px-6">
      <div class="grid gap-10 lg:grid-cols-2">
        <div>
          <h2 class="text-2xl font-extrabold text-white">{{ contactContent.title || 'Contact Us' }}</h2>
          <div class="mt-2 h-1 w-20 rounded bg-white/70"></div>
          <p class="mt-2 text-white/90">{{ contactContent.description || 'Share information or request assistance. You can also report anonymously.' }}</p>
          <div class="mt-6 grid gap-4">
            <div
              v-for="contact in contactInfo"
              :key="contact.id"
              class="rounded-xl border border-black/10 bg-white p-5"
            >
              <div class="font-semibold">{{ contact.title }}</div>
              <div class="text-sm text-zaccBlack/70">{{ contact.content }}</div>
              <div v-if="contact.metadata?.phone" class="text-sm text-zaccBlack/70 mt-2">
                Tel: <a
                  v-for="(phone, index) in contact.metadata.phone"
                  :key="index"
                  :href="`tel:+263${phone.replace(/[^0-9]/g, '')}`"
                  class="hover:text-zaccGreen"
                >
                  {{ phone }}<span v-if="index < contact.metadata.phone.length - 1"> / </span>
                </a>
              </div>
              <div v-if="contact.metadata?.email" class="text-sm text-zaccBlack/70">
                Email: <a :href="`mailto:${contact.metadata.email}`" class="hover:text-zaccGreen">{{ contact.metadata.email }}</a>
              </div>
            </div>
          </div>
        </div>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm text-white/90">Name</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full rounded-md border border-white/20 bg-white px-3 py-2 outline-none placeholder:text-zaccBlack/40 focus:border-zaccGold"
                :class="{ 'border-red-300': submitted && !form.name }"
                placeholder="Your name"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm text-white/90">Email</label>
              <input
                v-model="form.email"
                type="email"
                required
                class="w-full rounded-md border border-white/20 bg-white px-3 py-2 outline-none placeholder:text-zaccBlack/40 focus:border-zaccGold"
                :class="{ 'border-red-300': submitted && !form.email }"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-sm text-white/90">Subject</label>
            <input
              v-model="form.subject"
              type="text"
              required
              class="w-full rounded-md border border-white/20 bg-white px-3 py-2 outline-none placeholder:text-zaccBlack/40 focus:border-zaccGold"
              :class="{ 'border-red-300': submitted && !form.subject }"
              placeholder="How can we help?"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm text-white/90">Message</label>
            <textarea
              v-model="form.message"
              rows="4"
              required
              class="w-full rounded-md border border-white/20 bg-white px-3 py-2 outline-none placeholder:text-zaccBlack/40 focus:border-zaccGold"
              :class="{ 'border-red-300': submitted && !form.message }"
              placeholder="Write your message..."
            ></textarea>
          </div>
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 text-xs text-white/90">
              <input
                v-model="form.anonymous"
                type="checkbox"
                class="h-4 w-4 rounded border-white/30 bg-white text-zaccGreen focus:ring-zaccGreen"
              />
              Report anonymously
            </label>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 rounded-md bg-zaccGold px-5 py-2.5 font-semibold text-white shadow-glow hover:bg-zaccGold/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isSubmitting" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              <span v-else>Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const contactContent = ref<any>({
  title: '',
  description: ''
})
const contactInfo = ref<any[]>([])

// Fetch contact content
const fetchContactContent = async () => {
  try {
    const content = await $fetch('/api/public/page-content', {
      params: { pageKey: 'home' }
    })
    
    const titleContent = content.find((item: any) => item.sectionKey === 'contact-title')
    const descContent = content.find((item: any) => item.sectionKey === 'contact-description')
    
    contactContent.value = {
      title: titleContent?.content || '',
      description: descContent?.content || ''
    }
    
    // Get contact info cards
    const headOffice = content.find((item: any) => item.sectionKey === 'contact-head-office')
    const reportCentre = content.find((item: any) => item.sectionKey === 'contact-report-centre')
    
    contactInfo.value = [headOffice, reportCentre].filter(Boolean)
  } catch (error) {
    console.error('Error fetching contact content:', error)
  }
}

onMounted(() => {
  fetchContactContent()
})

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
  anonymous: false,
})

const isSubmitting = ref(false)
const submitted = ref(false)

const handleSubmit = async () => {
  submitted.value = true

  // Validation
  if (!form.name || !form.email || !form.subject || !form.message) {
    await nextTick()
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in all required fields.',
      life: 3000
    })
    return
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.email)) {
    await nextTick()
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please enter a valid email address.',
      life: 3000
    })
    return
  }

  isSubmitting.value = true

  try {
    const response = await $fetch('/api/public/contact', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        phone: null,
        subject: form.subject,
        message: form.message,
        anonymous: form.anonymous
      }
    })

    await nextTick()
    toast.add({
      severity: 'success',
      summary: 'Message Sent Successfully',
      detail: response.message || 'Thank you for your message. We will get back to you as soon as possible.',
      life: 5000
    })

    // Reset form
    form.name = ''
    form.email = ''
    form.subject = ''
    form.message = ''
    form.anonymous = false
    submitted.value = false

    // Scroll to top of section
    setTimeout(() => {
      const contactSection = document.getElementById('contact')
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  } catch (error: any) {
    console.error('Error submitting form:', error)
    await nextTick()
    toast.add({
      severity: 'error',
      summary: 'Submission Failed',
      detail: error.data?.message || 'There was an error sending your message. Please try again or contact us directly.',
      life: 5000
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
