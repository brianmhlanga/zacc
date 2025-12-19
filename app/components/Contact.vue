<template>
  <section id="contact" class="relative py-20 bg-[#d4af37e6]">
    <div class="mx-auto max-w-7xl px-6">
      <div class="grid gap-10 lg:grid-cols-2">
        <div>
          <h2 class="text-2xl font-extrabold text-white">Contact Us</h2>
          <div class="mt-2 h-1 w-20 rounded bg-white/70"></div>
          <p class="mt-2 text-white/90">Share information or request assistance. You can also report anonymously.</p>
          <div class="mt-6 grid gap-4">
            <div class="rounded-xl border border-black/10 bg-white p-5">
              <div class="font-semibold">Head Office</div>
              <div class="text-sm text-zaccBlack/70">Address line • City • Zimbabwe</div>
              <div class="text-sm text-zaccBlack/70">Tel: (000) 000 000 • Email: info@zacc.org.zw</div>
            </div>
            <div class="rounded-xl border border-black/10 bg-white p-5">
              <div class="font-semibold">Report Centre</div>
              <div class="text-sm text-zaccBlack/70">Submit tips by phone, email, or in person.</div>
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
                class="w-full rounded-md border border-white/20 bg-white px-3 py-2 outline-none placeholder:text-zaccBlack/40 focus:border-zaccGold"
                placeholder="Your name"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm text-white/90">Email</label>
              <input
                v-model="form.email"
                type="email"
                class="w-full rounded-md border border-white/20 bg-white px-3 py-2 outline-none placeholder:text-zaccBlack/40 focus:border-zaccGold"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-sm text-white/90">Subject</label>
            <input
              v-model="form.subject"
              type="text"
              class="w-full rounded-md border border-white/20 bg-white px-3 py-2 outline-none placeholder:text-zaccBlack/40 focus:border-zaccGold"
              placeholder="How can we help?"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm text-white/90">Message</label>
            <textarea
              v-model="form.message"
              rows="4"
              class="w-full rounded-md border border-white/20 bg-white px-3 py-2 outline-none placeholder:text-zaccBlack/40 focus:border-zaccGold"
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
              class="inline-flex items-center gap-2 rounded-md bg-zaccBlack px-5 py-2.5 font-semibold text-white shadow-glow hover:opacity-90"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
  anonymous: false,
})

const handleSubmit = () => {
  // Handle form submission
  console.log('Form submitted:', form)
}
</script>
