<template>
  <section id="downloads" class="relative py-20">
    <div class="mx-auto max-w-7xl px-6">
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-2xl font-extrabold">Downloads</h2>
          <div class="mt-2 h-1 w-20 rounded bg-zaccGold"></div>
          <p class="mt-2 text-zaccBlack/60">Access forms, publications, and reports.</p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="relative w-full sm:w-64">
            <input
              id="downloadSearch"
              type="search"
              placeholder="Search downloads..."
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
            to="/downloads"
            class="inline-flex items-center justify-center gap-2 rounded-md bg-zaccGreen px-4 py-2 text-sm font-semibold text-white shadow-glow hover:brightness-110"
          >
            View More
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
      <div id="downloadGrid" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLink
          v-for="(download, index) in downloads"
          :key="index"
          to="#"
          class="download-card group grid grid-cols-[auto_1fr] items-start gap-4 rounded-[5px] border border-black/10 bg-white p-4 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] transition hover:-translate-y-0.5 hover:shadow-lg"
          :data-title="download.title"
          :data-body="download.body"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-md bg-zaccGold/20 text-zaccBlack">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path fill="#fff" d="M14 2v6h6" />
              <path d="M8 15h8M8 11h8" stroke="#111" stroke-width="1.5" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <div class="font-semibold group-hover:text-zaccYellow">{{ download.title }}</div>
              <span
                class="ml-3 inline-flex items-center rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-zaccBlack/70"
              >
                PDF
              </span>
            </div>
            <div class="mt-1 text-xs text-zaccBlack/60">{{ download.size }} • Updated {{ download.year }}</div>
          </div>
          <span
            class="col-span-2 mt-4 inline-flex w-full items-center justify-center rounded-md bg-zaccGold px-3 py-2 text-xs font-semibold text-white group-hover:brightness-110"
          >
            Download
          </span>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const downloads = [
  { title: 'Self Declaration Form', body: 'Statutory form', size: '1.2 MB', year: '2025' },
  { title: 'Annual Report 2024', body: 'Publication report', size: '4.8 MB', year: '2025' },
  { title: 'National Anti-Corruption Survey', body: 'Survey publication', size: '3.1 MB', year: '2025' },
  { title: 'Strategic Plan', body: 'Strategic plan document', size: '2.4 MB', year: '2025' },
  { title: 'Quarterly Report Q1 2025', body: 'Quarterly report', size: '2.9 MB', year: '2025' },
  { title: 'Procurement Guidelines', body: 'Guidelines', size: '1.7 MB', year: '2025' },
  { title: 'Whistleblower Policy', body: 'Policy document', size: '1.1 MB', year: '2025' },
  { title: 'Compliance Checklist', body: 'Checklist', size: '0.8 MB', year: '2025' },
  { title: 'DIAL Form', body: 'Declaration of Income, Assets and Liabilities', size: '1.5 MB', year: '2025' },
  { title: 'Annual Budget Review', body: 'Review document', size: '3.9 MB', year: '2025' },
  { title: 'KLIF Progress Report', body: 'Progress report', size: '2.1 MB', year: '2025' },
  { title: 'Anti-Corruption Handbook', body: 'Handbook', size: '5.2 MB', year: '2025' },
  { title: 'Public Procurement Code', body: 'Code document', size: '2.0 MB', year: '2025' },
  { title: 'Transparency Guidelines', body: 'Guidelines document', size: '1.9 MB', year: '2025' },
]

const { setupSearch } = useSearch()

onMounted(() => {
  setupSearch('downloadSearch', '.download-card')
})
</script>
