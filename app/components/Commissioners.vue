<template>
  <section id="commissioners" class="relative py-20 bg-zaccGreen">
    <div class="mx-auto max-w-7xl px-6">
      <div class="mb-8 flex items-end justify-between">
        <div>
          <h2 class="text-2xl font-extrabold text-white">ZACC Commissioners</h2>
          <div class="mt-2 h-1 w-20 rounded bg-white/70"></div>
          <p class="mt-2 text-white/90">Leadership team guiding Zimbabwe's anti‑corruption mandate.</p>
        </div>
      </div>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="(commissioner, index) in commissioners"
          :key="index"
          class="rounded-[5px] bg-white overflow-hidden shadow-[0_5px_10px_0_rgba(41,61,102,0.2)]"
        >
          <img :src="commissioner.image" :alt="commissioner.name" class="h-48 w-full object-cover" />
          <div class="p-5">
            <div class="font-semibold">{{ commissioner.name }}</div>
            <div class="text-sm text-zaccBlack/70">{{ commissioner.role }}</div>
            <p class="mt-2 text-sm text-zaccBlack/70">{{ commissioner.description }}</p>
            <NuxtLink
              to="#"
              class="mt-3 inline-flex items-center gap-2 rounded-md bg-zaccBlack px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              View More
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="h-3.5 w-3.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5l6 6-6 6M3 12h16.5" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const commissioners = [
  {
    name: 'Commissioner Name',
    role: 'Chairperson',
    description: 'Provides strategic direction and ensures mandate execution with integrity.',
    image: '/portraitone.png',
  },
  {
    name: 'Commissioner Name',
    role: 'Vice Chairperson',
    description: 'Coordinates cross‑functional priorities across directorates.',
    image: '/portraittwo.png',
  },
  {
    name: 'Commissioner Name',
    role: 'Investigations',
    description: 'Oversees investigations, evidence management, and asset tracing.',
    image: '/portraitthree.png',
  },
  {
    name: 'Commissioner Name',
    role: 'Corruption Prevention',
    description: 'Leads risk assessments, integrity audits, and systems strengthening.',
    image: '/portraitfour.png',
  },
  {
    name: 'Commissioner Name',
    role: 'Legal & Prosecution Support',
    description: 'Provides legal advisory, case preparation, and liaison with ODPP.',
    image: '/portraittwo.png',
  },
  {
    name: 'Commissioner Name',
    role: 'Public Education',
    description: 'Drives civic education and nationwide awareness programmes.',
    image: '/portraitone.png',
  },
  {
    name: 'Commissioner Name',
    role: 'Policy & Research',
    description: 'Develops policy guidance and research insights for reforms.',
    image: '/portraitfour.png',
  },
  {
    name: 'Commissioner Name',
    role: 'Finance & Administration',
    description: 'Ensures transparent governance and effective administration.',
    image: '/portraitthree.png',
  },
]
</script>
