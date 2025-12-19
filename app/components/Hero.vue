<template>
  <section id="home" class="relative isolate overflow-hidden text-white">
    <div id="hero-slides" class="absolute inset-0 -z-10">
      <img
        src="/flag.jpg"
        alt="Zimbabwe flag"
        class="absolute inset-0 h-full w-full object-cover opacity-100 transition-opacity duration-1000 ease-in-out"
      />
      <img
        src="/businessman.jpg"
        alt="Teamwork"
        class="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-1000 ease-in-out"
      />
      <img
        src="/gavel.jpg"
        alt="Gavel"
        class="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-1000 ease-in-out"
      />
      <img
        src="/gavelmoney.jpg"
        alt="Asset recovery"
        class="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-1000 ease-in-out"
      />
    </div>
    <div class="absolute inset-0 -z-10 bg-black/60 pointer-events-none"></div>
    <div class="mx-auto max-w-7xl px-6 pb-24 pt-16 lg:pb-32 lg:pt-24">
      <div class="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span
            class="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white"
          >
            Integrity First
          </span>
          <h1 class="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl text-white">
            Zimbabwe Anti-Corruption Commission
          </h1>
          <p class="mt-4 text-base leading-relaxed text-white/90">
            Preventing and combating corruption through enforcement, public education, research, and partnerships. We
            work with citizens and institutions to promote accountability and uphold the rule of law.
          </p>
          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <NuxtLink
              to="#report"
              class="inline-flex items-center justify-center gap-2 rounded-md bg-zaccGreen px-6 py-3 font-semibold text-white shadow-glow hover:brightness-110"
            >
              Report Corruption
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                class="h-4 w-4"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5l6 6-6 6M3 12h16.5" />
              </svg>
            </NuxtLink>
            <NuxtLink
              to="#about"
              class="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 font-semibold text-zaccBlack hover:bg-white/90"
            >
              Learn More
            </NuxtLink>
          </div>
          <div class="mt-8 grid grid-cols-3 gap-6 text-center">
            <div class="rounded-lg bg-zaccGreen p-4 shadow-sm text-white">
              <div class="text-2xl font-extrabold">
                <span class="countup" data-target="1200" data-suffix="+">0</span>
              </div>
              <div class="text-xs text-white/90">Tips Received</div>
            </div>
            <div class="rounded-lg bg-zaccGold p-4 shadow-sm text-white">
              <div class="text-2xl font-extrabold">
                <span class="countup" data-target="480" data-suffix="+">0</span>
              </div>
              <div class="text-xs text-white/90">Cases Concluded</div>
            </div>
            <div class="rounded-lg bg-zaccBlack p-4 shadow-sm text-white">
              <div class="text-2xl font-extrabold">
                <span class="countup" data-target="25" data-prefix="$" data-suffix="m">0</span>
              </div>
              <div class="text-xs text-white/90">Assets Recovered</div>
            </div>
          </div>
        </div>
        <div class="relative"></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { startSlideshow } = useHeroSlides()
const { observeStats } = useCountUp()

onMounted(() => {
  startSlideshow('hero-slides')
  observeStats()
})
</script>
