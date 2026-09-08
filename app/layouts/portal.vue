<template>
  <div class="bg-white text-zaccBlack antialiased overflow-x-hidden">
    <TopAnnouncement />
    <Header />

    <!-- The public site chrome is kept on purpose. This is a careers portal on
         zacc.co.zw, not a back office: a candidate arrives from /careers and
         must be able to get back to the rest of the site. What changes is the
         middle — a persistent nav instead of a page that forgets where it sits. -->
    <div class="bg-[#f7f9f8] border-t border-gray-100 min-h-[70vh]">
      <div class="mx-auto max-w-7xl px-4 py-8 lg:py-10">
        <div class="grid gap-6 lg:grid-cols-[260px_1fr] items-start">
          <aside class="lg:sticky lg:top-6">
            <CandidatePortalNav />
          </aside>

          <main class="min-w-0">
            <slot />
          </main>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>
