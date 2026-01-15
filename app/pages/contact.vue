<template>
  <NuxtLayout name="main">
    <div>
      <!-- Hero Section -->
    <section class="relative isolate overflow-hidden bg-zaccGold text-white py-24">
      <div class="absolute inset-0">
        <img src="/harare.JPG" alt="Contact us" class="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div class="absolute inset-0 bg-zaccGold/90"></div>
      </div>
      <div class="relative mx-auto max-w-7xl px-6">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Contact Us</h1>
          <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
            Get in touch with ZACC. We're here to help with inquiries, reports, and assistance.
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="relative py-20">
      <div
        class="absolute inset-0 -z-10 opacity-20"
        style="background: radial-gradient(40% 40% at 50% 0%, rgba(212,175,55,0.15), transparent)"
      ></div>
      <div class="mx-auto max-w-7xl px-6">
        <div class="grid gap-12 lg:grid-cols-3">
          <!-- Contact Information -->
          <div class="lg:col-span-1 space-y-6">
            <div>
              <h2 class="text-2xl font-extrabold mb-4">Get in Touch</h2>
              <div class="h-1 w-20 rounded bg-zaccGold mb-6"></div>
              <p class="text-zaccBlack/70 mb-6">
                Share information or request assistance. You can also report anonymously.
              </p>
            </div>

            <!-- Head Office -->
            <Card class="border-l-4 border-l-zaccGreen">
              <template #content>
                <div class="p-5">
                  <div class="flex items-start gap-3 mb-3">
                    <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-zaccBlack/10 flex items-center justify-center">
                      <i class="pi pi-building text-zaccGreen text-xl"></i>
                    </div>
                    <div class="flex-1">
                      <h3 class="font-extrabold text-lg mb-2">Head Office</h3>
                      <div class="space-y-2 text-sm text-zaccBlack/70">
                        <div class="flex items-start gap-2">
                          <i class="pi pi-map-marker text-zaccGreen mt-0.5"></i>
                          <div>872 Betterment Close, Mt. Pleasant Business Park, Mt. Pleasant, Harare</div>
                        </div>
                        <div v-if="headOfficeMetadata?.phone" class="space-y-1">
                          <div class="flex items-center gap-2">
                            <i class="pi pi-phone text-zaccGreen"></i>
                            <div class="flex flex-wrap gap-1">
                              <a
                                v-for="(phone, index) in headOfficeMetadata.phone"
                                :key="index"
                                :href="`tel:${phone.replace(/[^0-9+]/g, '')}`"
                                class="hover:text-zaccGreen"
                              >
                                {{ phone }}<span v-if="index < headOfficeMetadata.phone.length - 1"> / </span>
                              </a>
                            </div>
                          </div>
                        </div>
                        <div v-if="headOfficeMetadata?.cell" class="flex items-center gap-2">
                          <i class="pi pi-mobile text-zaccGreen"></i>
                          <a
                            v-for="(cell, index) in headOfficeMetadata.cell"
                            :key="index"
                            :href="`tel:${cell.replace(/[^0-9+]/g, '')}`"
                            class="hover:text-zaccGreen"
                          >
                            {{ cell }}<span v-if="index < headOfficeMetadata.cell.length - 1"> / </span>
                          </a>
                        </div>
                        <div v-if="headOfficeMetadata?.email" class="flex items-center gap-2">
                          <i class="pi pi-envelope text-zaccGreen"></i>
                          <a :href="`mailto:${headOfficeMetadata.email}`" class="hover:text-zaccGreen">{{ headOfficeMetadata.email }}</a>
                        </div>
                        <div v-if="headOfficeMetadata?.whatsapp" class="flex items-center gap-2">
                          <i class="pi pi-whatsapp text-zaccGreen"></i>
                          <a :href="`https://wa.me/${headOfficeMetadata.whatsapp.replace(/[^0-9]/g, '')}`" target="_blank" class="hover:text-zaccGreen">{{ headOfficeMetadata.whatsapp }}</a>
                        </div>
                        <div v-if="headOfficeMetadata?.website" class="flex items-center gap-2">
                          <i class="pi pi-globe text-zaccGreen"></i>
                          <a :href="`https://${headOfficeMetadata.website}`" target="_blank" class="hover:text-zaccGreen">{{ headOfficeMetadata.website }}</a>
                        </div>
                        <div v-if="headOfficeMetadata?.tollFree" class="mt-3 pt-3 border-t border-zaccBlack/10">
                          <div class="font-semibold text-xs mb-1">Toll Free:</div>
                          <div class="text-xs">
                            <div>Netone: <a :href="`tel:${headOfficeMetadata.tollFree.netone}`" class="hover:text-zaccGreen">{{ headOfficeMetadata.tollFree.netone }}</a></div>
                            <div>Telone: <a :href="`tel:${headOfficeMetadata.tollFree.telone}`" class="hover:text-zaccGreen">{{ headOfficeMetadata.tollFree.telone }}</a></div>
                          </div>
                        </div>
                        <div v-if="headOfficeMetadata?.social" class="mt-3 pt-3 border-t border-zaccBlack/10">
                          <div class="font-semibold text-xs mb-2">Social Media:</div>
                          <div class="flex flex-wrap gap-2 text-xs">
                            <span v-if="headOfficeMetadata.social.facebook">{{ headOfficeMetadata.social.facebook }}</span>
                            <span v-if="headOfficeMetadata.social.twitter">{{ headOfficeMetadata.social.twitter }}</span>
                            <span v-if="headOfficeMetadata.social.tiktok">{{ headOfficeMetadata.social.tiktok }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Office Hours -->
            <Card class="border-l-4 border-l-zaccGreen">
              <template #content>
                <div class="p-5">
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-zaccBlack/10 flex items-center justify-center">
                      <i class="pi pi-clock text-zaccGreen text-xl"></i>
                    </div>
                    <div class="flex-1">
                      <h3 class="font-extrabold text-lg mb-3">Office Hours</h3>
                      <div class="space-y-2 text-sm text-zaccBlack/70">
                        <div class="flex justify-between">
                          <span class="font-semibold">Monday - Friday</span>
                          <span>08:00 - 16:30</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="font-semibold">Saturday</span>
                          <span>09:00 - 13:00</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="font-semibold">Sunday</span>
                          <span>Closed</span>
                        </div>
                        <div class="mt-3 pt-3 border-t border-zaccBlack/10">
                          <div class="font-semibold text-zaccGreen">24/7 Hotline</div>
                          <div class="text-xs">Emergency reporting available</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Card>

          </div>

          <!-- Contact Form -->
          <div class="lg:col-span-2">
            <Card class="shadow-lg">
              <template #header>
                <div class="bg-gradient-to-r from-zaccGreen/10 to-zaccGold/10 px-6 py-4 border-b border-zaccGreen/20">
                  <h2 class="text-2xl font-extrabold mb-2">Send us a Message</h2>
                  <p class="text-sm text-zaccBlack/70">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </p>
                </div>
              </template>
              <template #content>
                <form @submit.prevent="handleSubmit" class="space-y-6 p-6">
                  <div class="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label for="name" class="block text-sm font-semibold text-zaccBlack mb-2">
                        Full Name <span class="text-red-500">*</span>
                      </label>
                      <InputText
                        id="name"
                        v-model="form.name"
                        placeholder="Enter your full name"
                        class="w-full"
                        :class="{ 'p-invalid': !form.name && submitted }"
                        required
                      />
                      <small v-if="!form.name && submitted" class="p-error">Name is required.</small>
                    </div>
                    <div>
                      <label for="email" class="block text-sm font-semibold text-zaccBlack mb-2">
                        Email Address <span class="text-red-500">*</span>
                      </label>
                      <InputText
                        id="email"
                        v-model="form.email"
                        type="email"
                        placeholder="your.email@example.com"
                        class="w-full"
                        :class="{ 'p-invalid': !form.email && submitted }"
                        required
                      />
                      <small v-if="!form.email && submitted" class="p-error">Valid email is required.</small>
                    </div>
                  </div>

                  <div class="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label for="phone" class="block text-sm font-semibold text-zaccBlack mb-2">
                        Phone Number
                      </label>
                      <InputText
                        id="phone"
                        v-model="form.phone"
                        type="tel"
                        placeholder="+263 XX XXX XXXX"
                        class="w-full"
                      />
                    </div>
                    <div>
                      <label for="subject" class="block text-sm font-semibold text-zaccBlack mb-2">
                        Subject <span class="text-red-500">*</span>
                      </label>
                      <InputText
                        id="subject"
                        v-model="form.subject"
                        placeholder="How can we help?"
                        class="w-full"
                        :class="{ 'p-invalid': !form.subject && submitted }"
                        required
                      />
                      <small v-if="!form.subject && submitted" class="p-error">Subject is required.</small>
                    </div>
                  </div>

                  <div>
                    <label for="message" class="block text-sm font-semibold text-zaccBlack mb-2">
                      Message <span class="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="message"
                      v-model="form.message"
                      rows="6"
                      placeholder="Write your message..."
                      class="w-full"
                      :class="{ 'p-invalid': !form.message && submitted }"
                      required
                    />
                    <small v-if="!form.message && submitted" class="p-error">Message is required.</small>
                  </div>

                  <div class="rounded-xl bg-zaccBlack/5 p-4 border border-zaccGreen/20">
                    <div class="flex items-start gap-3">
                      <Checkbox
                        v-model="form.anonymous"
                        inputId="anonymous"
                        :binary="true"
                        class="mt-1"
                      />
                      <label for="anonymous" class="flex-1 cursor-pointer">
                        <div class="font-semibold text-zaccBlack mb-1">Report Anonymously</div>
                        <div class="text-sm text-zaccBlack/70">
                          Check this box if you prefer to remain anonymous. We'll still respond to your inquiry.
                        </div>
                      </label>
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-4 border-t border-zaccBlack/10">
                    <div class="text-sm text-zaccBlack/70">
                      <span class="text-red-500">*</span> Required fields
                    </div>
                    <Button
                      type="submit"
                      label="Send Message"
                      icon="pi pi-send"
                      :loading="isSubmitting"
                      style="background: #209341; border-color: #209341;"
                    />
                  </div>
                </form>
              </template>
            </Card>

            <!-- Map Section -->
            <Card class="mt-6">
              <template #header>
                <div class="bg-gradient-to-r from-zaccGreen/10 to-zaccGold/10 px-6 py-4 border-b border-zaccGreen/20">
                  <h3 class="text-xl font-extrabold">Find Us</h3>
                </div>
              </template>
              <template #content>
                <div class="p-6">
                  <div class="aspect-video rounded-lg overflow-hidden border border-zaccGreen/20">
                    <iframe
                      :src="`https://www.google.com/maps?q=${mapLatitude},${mapLongitude}&hl=en&z=15&output=embed`"
                      width="100%"
                      height="100%"
                      style="border:0;"
                      allowfullscreen=""
                      loading="lazy"
                      referrerpolicy="no-referrer-when-downgrade"
                      class="w-full h-full"
                    ></iframe>
                  </div>
                  <p class="text-sm text-zaccBlack/60 mt-4 text-center">872 Betterment Close, Mt. Pleasant Business Park, Mt. Pleasant, Harare</p>
                </div>
              </template>
            </Card>
          </div>
        </div>

        <!-- Regional Offices -->
        <div class="mt-16">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">Regional Offices</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
            <p class="text-zaccBlack/70 max-w-3xl mx-auto">
              ZACC has regional offices across Zimbabwe to serve you better.
            </p>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card
              v-for="office in regionalOffices"
              :key="office.id"
              class="hover:shadow-lg transition-shadow"
            >
              <template #content>
                <div class="p-5">
                  <div class="flex items-start gap-3 mb-4">
                    <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-zaccBlack/10 flex items-center justify-center">
                      <i class="pi pi-map-marker text-zaccGreen text-xl"></i>
                    </div>
                    <div class="flex-1">
                      <h3 class="font-extrabold text-lg mb-2">{{ office.name }}</h3>
                      <div class="space-y-2 text-sm text-zaccBlack/70">
                        <div class="flex items-start gap-2">
                          <i class="pi pi-building text-zaccGreen mt-0.5"></i>
                          <div>
                            <div>{{ office.address }}</div>
                            <div v-if="office.address2" class="mt-1">{{ office.address2 }}</div>
                          </div>
                        </div>
                        <div v-if="office.phone && office.phone.length > 0" class="flex items-center gap-2">
                          <i class="pi pi-phone text-zaccGreen"></i>
                          <div class="flex flex-wrap gap-1">
                            <a
                              v-for="(phone, index) in office.phone"
                              :key="index"
                              :href="`tel:${phone.replace(/[^0-9+]/g, '')}`"
                              class="hover:text-zaccGreen"
                            >
                              {{ phone }}<span v-if="index < office.phone.length - 1"> / </span>
                            </a>
                          </div>
                        </div>
                        <div v-if="office.cell && office.cell.length > 0" class="flex items-center gap-2">
                          <i class="pi pi-mobile text-zaccGreen"></i>
                          <div class="flex flex-wrap gap-1">
                            <a
                              v-for="(cell, index) in office.cell"
                              :key="index"
                              :href="`tel:${cell.replace(/[^0-9+]/g, '')}`"
                              class="hover:text-zaccGreen"
                            >
                              {{ cell }}<span v-if="index < office.cell.length - 1"> / </span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>
      </div>
    </section>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

const toast = useToast()

// Google Map coordinates
const mapLatitude = -17.760845011677457
const mapLongitude = 31.035956914647628

useHead({
  title: 'Contact Us - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Contact the Zimbabwe Anti-Corruption Commission. Get in touch via phone, email, or visit our offices.'
    }
  ]
})

const headOfficeMetadata = ref<any>(null)
const regionalOffices = ref<any[]>([])

// Fetch contact information
const fetchContactInfo = async () => {
  try {
    const content = await $fetch('/api/public/page-content', {
      params: { pageKey: 'home' }
    })
    
    const headOffice = content.find((item: any) => item.sectionKey === 'contact-head-office')
    if (headOffice?.metadata) {
      headOfficeMetadata.value = headOffice.metadata
    }
    
    // Fetch reporting offices
    const contactContent = await $fetch('/api/public/page-content', {
      params: { pageKey: 'contact' }
    })
    
    const reportingOffices = contactContent.find((item: any) => item.sectionKey === 'reporting-offices')
    if (reportingOffices?.metadata?.offices) {
      regionalOffices.value = reportingOffices.metadata.offices.map((office: any, index: number) => ({
        id: index + 1,
        ...office
      }))
    }
  } catch (error) {
    console.error('Error fetching contact info:', error)
  }
}

onMounted(() => {
  fetchContactInfo()
})

const form = reactive({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  anonymous: false
})

const isSubmitting = ref(false)
const submitted = ref(false)

const handleSubmit = async () => {
  submitted.value = true

  if (!form.name || !form.email || !form.subject || !form.message) {
    return
  }

  isSubmitting.value = true

  try {
    // Submit to API
    const response = await $fetch('/api/public/contact', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        subject: form.subject,
        message: form.message,
        anonymous: form.anonymous
      }
    })

    // Show success message
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
    form.phone = ''
    form.subject = ''
    form.message = ''
    form.anonymous = false
    submitted.value = false

    // Scroll to top
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
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

<style scoped>
:deep(.p-card) {
  box-shadow: 0 5px 10px 0 rgba(41, 61, 102, 0.2);
}

:deep(.p-card:hover) {
  transform: translateY(-2px);
}
</style>
