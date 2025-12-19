<template>
  <section id="news" class="relative py-20">
    <div class="mx-auto max-w-7xl px-6">
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-2xl font-extrabold">Latest News & Updates</h2>
          <div class="mt-2 h-1 w-20 rounded bg-zaccGold"></div>
          <p class="mt-2 text-zaccBlack/60">Announcements, case updates, events, and educational insights.</p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="relative w-full sm:w-64">
            <input
              id="newsSearch"
              type="search"
              placeholder="Search news..."
              class="w-full rounded-md border border-black/10 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-zaccBlack/40 outline-none focus:border-zaccGold"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zaccBlack/40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z"
              />
            </svg>
          </div>
          <NuxtLink
            to="/news"
            class="inline-flex items-center justify-center gap-2 rounded-md bg-zaccGreen px-4 py-2 text-sm font-semibold text-white shadow-glow hover:brightness-110"
          >
            View All
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
      <div id="newsGrid" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <article
          class="news-card group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_5px_10px_0_rgba(41,61,102,0.2)]"
          data-title="ZACC enhances stakeholder engagement"
          data-body="Strategic collaboration to strengthen integrity systems across public institutions."
        >
          <div class="h-1 bg-zaccGold"></div>
          <div class="aspect-[16/9] overflow-hidden">
            <img src="/businessman.jpg" alt="Stakeholder engagement" class="h-full w-full object-cover" />
          </div>
          <div class="p-5">
            <div class="text-xs text-zaccBlack/50">06 Nov 2025</div>
            <h3 class="mt-1 text-base font-semibold group-hover:text-zaccYellow">
              ZACC enhances stakeholder engagement
            </h3>
            <p class="mt-2 text-sm text-zaccBlack/60">
              Strategic collaboration to strengthen integrity systems across public institutions.
            </p>
          </div>
        </article>
        <article
          class="news-card group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_5px_10px_0_rgba(41,61,102,0.2)]"
          data-title="Compliance monitoring initiative"
          data-body="Assess integrity plans and risk controls."
        >
          <div class="h-1 bg-zaccGold"></div>
          <div class="aspect-[16/9] overflow-hidden">
            <img src="/gavel.jpg" alt="Compliance initiative" class="h-full w-full object-cover" />
          </div>
          <div class="p-5">
            <div class="text-xs text-zaccBlack/50">28 Oct 2025</div>
            <h3 class="mt-1 text-base font-semibold group-hover:text-zaccYellow">Compliance monitoring initiative</h3>
            <p class="mt-2 text-sm text-zaccBlack/60">New program to assess integrity plans and risk controls.</p>
          </div>
        </article>
        <article
          class="news-card group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_5px_10px_0_rgba(41,61,102,0.2)]"
          data-title="Asset recovery success"
          data-body="Court outcomes reinforce deterrence against graft."
        >
          <div class="h-1 bg-zaccGold"></div>
          <div class="aspect-[16/9] overflow-hidden">
            <img src="/gavelmoney.jpg" alt="Asset recovery success" class="h-full w-full object-cover" />
          </div>
          <div class="p-5">
            <div class="text-xs text-zaccBlack/50">15 Oct 2025</div>
            <h3 class="mt-1 text-base font-semibold group-hover:text-zaccYellow">Asset recovery success</h3>
            <p class="mt-2 text-sm text-zaccBlack/60">Recent court outcomes reinforce deterrence against graft.</p>
          </div>
        </article>
        <article
          class="news-card group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_5px_10px_0_rgba(41,61,102,0.2)]"
          data-title="Guidelines for expedited trials"
          data-body="Fast-tracked corruption trial guidelines adopted."
        >
          <div class="h-1 bg-zaccGold"></div>
          <div class="aspect-[16/9] overflow-hidden">
            <img src="/flag.jpg" alt="Expedited trials" class="h-full w-full object-cover" />
          </div>
          <div class="p-5">
            <div class="text-xs text-zaccBlack/50">09 Oct 2025</div>
            <h3 class="mt-1 text-base font-semibold group-hover:text-zaccYellow">Guidelines for expedited trials</h3>
            <p class="mt-2 text-sm text-zaccBlack/60">Justice sector adopts streamlined procedures for corruption cases.</p>
          </div>
        </article>
        <article
          class="news-card group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_5px_10px_0_rgba(41,61,102,0.2)]"
          data-title="Partnerships expanded"
          data-body="New collaborations with regional integrity bodies."
        >
          <div class="h-1 bg-zaccGold"></div>
          <div class="aspect-[16/9] overflow-hidden">
            <img src="/el1.jpg" alt="Partnerships expanded" class="h-full w-full object-cover" />
          </div>
          <div class="p-5">
            <div class="text-xs text-zaccBlack/50">01 Oct 2025</div>
            <h3 class="mt-1 text-base font-semibold group-hover:text-zaccYellow">Partnerships expanded</h3>
            <p class="mt-2 text-sm text-zaccBlack/60">New collaborations with regional integrity bodies.</p>
          </div>
        </article>
        <article
          class="news-card group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_5px_10px_0_rgba(41,61,102,0.2)]"
          data-title="Capacity building initiatives"
          data-body="Training programs for investigators and compliance officers."
        >
          <div class="h-1 bg-zaccGold"></div>
          <div class="aspect-[16/9] overflow-hidden">
            <img src="/gavel2.jpg" alt="Capacity building" class="h-full w-full object-cover" />
          </div>
          <div class="p-5">
            <div class="text-xs text-zaccBlack/50">20 Sep 2025</div>
            <h3 class="mt-1 text-base font-semibold group-hover:text-zaccYellow">Capacity building initiatives</h3>
            <p class="mt-2 text-sm text-zaccBlack/60">Training programs for investigators and compliance officers.</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { setupSearch } = useSearch()

onMounted(() => {
  setupSearch('newsSearch', '.news-card')
})
</script>
