<template>
  <section id="about" class="relative py-20">
    <div
      class="absolute inset-0 -z-10 opacity-20"
      style="background: radial-gradient(40% 40% at 50% 0%, rgba(212,175,55,0.15), transparent)"
    ></div>
    <div class="mx-auto max-w-7xl px-6">
      <div class="grid gap-10 lg:grid-cols-2">
        <div>
          <div
            class="relative h-[calc(28rem+30px)] sm:h-[calc(32rem+30px)] lg:h-[calc(36rem+30px)] overflow-hidden rounded-2xl border border-black/10 shadow-sm"
          >
            <img src="/gavel2.jpg" alt="Judicial gavel" class="h-full w-full object-cover" />
            <div class="absolute inset-0 bg-black/55 pointer-events-none"></div>
            <div
              class="absolute inset-0 pointer-events-none mix-blend-screen"
              style="background: radial-gradient(65% 55% at 100% 0%, rgba(212,175,55,0.35), transparent 60%)"
            ></div>
            <!-- Overlaid mini stats on image bottom -->
            <div class="absolute inset-x-4 bottom-4 grid gap-3 sm:grid-cols-3">
              <div class="rounded-lg bg-zaccGreen/95 p-4 text-center text-white shadow-glow">
                <div class="text-2xl font-extrabold">
                  <span class="countup" data-target="20">0</span>+
                </div>
                <div class="text-xs text-white/90">Years Serving Zimbabwe</div>
              </div>
              <div class="rounded-lg bg-zaccGold/95 p-4 text-center text-white shadow-glow">
                <div class="text-2xl font-extrabold">
                  <span class="countup" data-target="300">0</span>+
                </div>
                <div class="text-xs text-white/90">Institutions Engaged</div>
              </div>
              <div class="rounded-lg bg-zaccBlack/95 p-4 text-center text-white shadow-glow">
                <div class="text-2xl font-extrabold">
                  <span class="countup" data-target="120">0</span>+
                </div>
                <div class="text-xs text-white/90">Public Education Forums</div>
              </div>
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <div>
            <h2 class="text-2xl font-extrabold">About ZACC</h2>
            <div class="mt-2 h-1 w-20 rounded bg-zaccGold"></div>
          </div>
          <p class="text-zaccBlack/70">
            ZACC investigates and combats corruption, promotes integrity, and advises on anti-corruption policy and
            legislation. We work with citizens and institutions to strengthen accountability across Zimbabwe.
          </p>
          <p class="text-zaccBlack/70">
            Through investigations, asset recovery, and prosecution support, we disrupt networks that enable graft and
            misuse of public resources. Our teams collaborate with justice sector partners to ensure due process,
            robust evidence handling, and timely resolution of cases.
          </p>
          <p class="text-zaccBlack/70">
            Beyond enforcement, we prioritize prevention and public education. ZACC conducts risk assessments, integrity
            audits, and civic awareness campaigns to help ministries, agencies, and communities establish stronger
            controls, transparent workflows, and a culture of ethics.
          </p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-[5px] bg-white p-5 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)]">
              <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-zaccGreen/10 text-zaccGreen">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class="h-5 w-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 6v6l4 2M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15z"
                  />
                </svg>
              </div>
              <div class="font-semibold">Our Mission</div>
              <p class="mt-1 text-sm text-zaccBlack/70">
                To rid Zimbabwe of corruption through lawful enforcement and robust prevention.
              </p>
            </div>
            <div class="rounded-[5px] bg-white p-5 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)]">
              <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-zaccGold/15 text-zaccBlack">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class="h-5 w-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 3l2.5 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 6.1 18l.9-5.4L3 8.7l5.4-.8L12 3z"
                  />
                </svg>
              </div>
              <div class="font-semibold">Our Vision</div>
              <p class="mt-1 text-sm text-zaccBlack/70">A Zimbabwe free from all forms of corruption.</p>
            </div>
          </div>
          <div class="mt-4">
            <NuxtLink
              to="#"
              class="inline-flex items-center gap-2 rounded-md bg-zaccGreen px-4 py-2 font-semibold text-white shadow-glow hover:brightness-110"
            >
              Read More
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="h-4 w-4"
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
const { observeStats } = useCountUp()

onMounted(() => {
  observeStats()
})
</script>
