<template>
  <section id="stats" class="relative isolate py-20 overflow-hidden text-white">
    <div class="absolute inset-0 -z-10">
      <img src="/el2.jpg" alt="decorative background" class="absolute inset-0 h-full w-full object-cover opacity-70" />
      <div
        class="absolute inset-0"
        style="background: radial-gradient(120% 80% at 50% -20%, rgba(32,147,65,0.06), transparent 60%), radial-gradient(120% 80% at 50% 120%, rgba(212,175,55,0.10), transparent 60%)"
      ></div>
      <div class="absolute inset-0 bg-black/45"></div>
    </div>
    <div class="mx-auto max-w-7xl px-6">
      <div class="text-center">
        <h2 class="text-2xl font-extrabold text-white">ZACC Statistics</h2>
        <p class="mt-2 text-white/80">Key indicators of our anti-corruption work and partnerships.</p>
      </div>
      <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-2xl border border-white/50 bg-transparent p-6 text-center text-white">
          <div class="text-4xl font-extrabold">
            <span class="countup" data-target="8641">8,641</span>
          </div>
          <div class="mt-2 text-sm text-white/85">Constituency & Executive Projects Tracked</div>
        </div>
        <div class="rounded-2xl border border-white/50 bg-transparent p-6 text-center text-white">
          <div class="text-4xl font-extrabold">
            <span class="countup" data-target="2605">2,605</span>
          </div>
          <div class="mt-2 text-sm text-white/85">Prevention Activities</div>
        </div>
        <div class="rounded-2xl border border-white/50 bg-transparent p-6 text-center text-white">
          <div class="text-4xl font-extrabold">
            <span class="countup" data-target="600">600</span>
          </div>
          <div class="mt-2 text-sm text-white/85">Anti-Corruption & Transparency Units</div>
        </div>
        <div class="rounded-2xl border border-white/50 bg-transparent p-6 text-center text-white">
          <div class="text-4xl font-extrabold">
            <span class="countup" data-target="12904">12,904</span>
          </div>
          <div class="mt-2 text-sm text-white/85">Participants Trained</div>
        </div>
        <div class="rounded-2xl border border-white/50 bg-transparent p-6 text-center text-white">
          <div class="text-4xl font-extrabold">
            <span class="countup" data-target="1028">1,028</span>
          </div>
          <div class="mt-2 text-sm text-white/85">Students Anti-Corruption Clubs</div>
        </div>
        <div class="rounded-2xl border border-white/50 bg-transparent p-6 text-center text-white">
          <div class="text-4xl font-extrabold">
            <span class="countup" data-target="111">111</span>
          </div>
          <div class="mt-2 text-sm text-white/85">Collaborations & Partnerships</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { observeStats } = useCountUp()

onMounted(() => {
  observeStats()
})
</script>
