<template>
  <NuxtLayout name="main">
    <div>
      <!-- Hero Section for About Page -->
    <section class="relative isolate overflow-hidden bg-zaccGreen text-white py-24">
      <div class="absolute inset-0">
        <img src="/flag.jpg" alt="Zimbabwe flag" class="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div class="absolute inset-0 bg-zaccGreen/90"></div>
      </div>
      <div class="relative mx-auto max-w-7xl px-6">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">About Us</h1>
          <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
            Zimbabwe Anti-Corruption Commission (ZACC)
          </p>
        </div>
      </div>
    </section>

    <!-- Main About Content -->
    <section class="relative py-20">
      <div
        class="absolute inset-0 -z-10 opacity-20"
        style="background: radial-gradient(40% 40% at 50% 0%, rgba(212,175,55,0.15), transparent)"
      ></div>
      <div class="mx-auto max-w-7xl px-6">
        <!-- Introduction with Image -->
        <div class="grid gap-12 lg:grid-cols-2 items-center mb-20">
          <div>
            <h2 class="text-3xl font-extrabold mb-4">Zimbabwe Anti-Corruption Commission</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mb-6"></div>
            <p class="text-zaccBlack/70 leading-relaxed mb-4">
              The Zimbabwe Anti-Corruption Commission (ZACC) is an independent constitutional commission established in terms of the Constitution of Zimbabwe and the Anti-Corruption Commission Act [Chapter 9:22]. The Commission is mandated to prevent, investigate, and combat corruption in both the public and private sectors, thereby promoting integrity, transparency, and accountability in the management of public and private affairs.
            </p>
            <p class="text-zaccBlack/70 leading-relaxed">
              ZACC operates independently and without fear, favour, or prejudice, guided by the Constitution and the laws of Zimbabwe. The Commission plays a central role in strengthening good governance and fostering public confidence in state institutions.
            </p>
          </div>
          <div class="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-lg">
            <img src="/gavel2.jpg" alt="ZACC operations" class="h-full w-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-zaccGreen/80 to-transparent"></div>
            <div class="absolute bottom-6 left-6 right-6 text-white">
              <div class="text-2xl font-extrabold">Independent & Accountable</div>
              <div class="text-sm text-white/90 mt-1">Serving Zimbabwe with integrity</div>
            </div>
          </div>
        </div>

        <!-- Our Mandate -->
        <div class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">Our Mandate</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
            <p class="text-zaccBlack/70 max-w-3xl mx-auto">
              The mandate of the Zimbabwe Anti-Corruption Commission is to combat corruption and related offences through prevention, investigation, and public education. In carrying out this mandate, the Commission:
            </p>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border border-zaccGreen/10">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-zaccGreen/10 flex items-center justify-center">
                  <svg class="h-6 w-6 text-zaccGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div class="font-semibold mb-1">Investigations</div>
                  <p class="text-sm text-zaccBlack/70">Investigates cases of corruption and related offences</p>
                </div>
              </div>
            </div>
            <div class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border border-zaccGreen/10">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-zaccGreen/10 flex items-center justify-center">
                  <svg class="h-6 w-6 text-zaccGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div class="font-semibold mb-1">Prevention</div>
                  <p class="text-sm text-zaccBlack/70">Prevents corruption through systems review and institutional strengthening</p>
                </div>
              </div>
            </div>
            <div class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border border-zaccGreen/10">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-zaccGreen/10 flex items-center justify-center">
                  <svg class="h-6 w-6 text-zaccGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div class="font-semibold mb-1">Prosecution</div>
                  <p class="text-sm text-zaccBlack/70">Refers cases for prosecution to the National Prosecuting Authority of Zimbabwe (NPA)</p>
                </div>
              </div>
            </div>
            <div class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border border-zaccGreen/10">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-zaccGreen/10 flex items-center justify-center">
                  <svg class="h-6 w-6 text-zaccGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div class="font-semibold mb-1">Transparency</div>
                  <p class="text-sm text-zaccBlack/70">Promotes transparency, accountability, and ethical conduct</p>
                </div>
              </div>
            </div>
            <div class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border border-zaccGreen/10">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-zaccGreen/10 flex items-center justify-center">
                  <svg class="h-6 w-6 text-zaccGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div class="font-semibold mb-1">Advisory</div>
                  <p class="text-sm text-zaccBlack/70">Advises public and private institutions on corruption risk mitigation</p>
                </div>
              </div>
            </div>
            <div class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border border-zaccGreen/10">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-zaccGreen/10 flex items-center justify-center">
                  <svg class="h-6 w-6 text-zaccGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div class="font-semibold mb-1">Education</div>
                  <p class="text-sm text-zaccBlack/70">Educates the public on the dangers and consequences of corruption</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vision and Mission with Image -->
        <div class="grid gap-12 lg:grid-cols-2 items-center mb-20">
          <div class="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-lg">
            <img src="/businessman.jpg" alt="ZACC mission" class="h-full w-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-br from-zaccGreen/80 to-zaccBlack/60"></div>
            <div class="absolute inset-0 flex items-center justify-center p-8">
              <div class="text-center text-white">
                <div class="text-4xl font-extrabold mb-2">20+</div>
                <div class="text-lg">Years of Service</div>
              </div>
            </div>
          </div>
          <div class="space-y-6">
            <div class="rounded-xl bg-gradient-to-br from-zaccGreen/10 to-zaccGold/10 p-8 border border-zaccGreen/20">
              <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zaccGold/20 text-zaccBlack">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-6 w-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3l2.5 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 6.1 18l.9-5.4L3 8.7l5.4-.8L12 3z" />
                </svg>
              </div>
              <div class="font-semibold text-xl mb-3">Our Vision</div>
              <p class="text-zaccBlack/70 leading-relaxed">
                A corruption-free Zimbabwe founded on integrity, transparency, and accountability.
              </p>
            </div>
            <div class="rounded-xl bg-gradient-to-br from-zaccGreen/10 to-zaccGold/10 p-8 border border-zaccGreen/20">
              <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zaccGreen/20 text-zaccGreen">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-6 w-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15z" />
                </svg>
              </div>
              <div class="font-semibold text-xl mb-3">Our Mission</div>
              <p class="text-zaccBlack/70 leading-relaxed">
                To effectively prevent and combat corruption through investigation, prevention, public education, and strategic partnerships in order to promote good governance and sustainable development.
              </p>
            </div>
          </div>
        </div>

        <!-- Core Values -->
        <div class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">Our Core Values</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
            <p class="text-zaccBlack/70 max-w-3xl mx-auto">
              The work of the Commission is guided by the following core values:
            </p>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] text-center border border-zaccGreen/10 hover:border-zaccGreen/30 transition">
              <div class="text-3xl font-extrabold text-zaccGreen mb-2">I</div>
              <div class="font-semibold text-zaccBlack mb-2">Integrity</div>
              <p class="text-sm text-zaccBlack/70">Upholding the highest ethical standards in all our operations</p>
            </div>
            <div class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] text-center border border-zaccGreen/10 hover:border-zaccGreen/30 transition">
              <div class="text-3xl font-extrabold text-zaccGreen mb-2">I</div>
              <div class="font-semibold text-zaccBlack mb-2">Independence</div>
              <p class="text-sm text-zaccBlack/70">Operating without undue influence or interference</p>
            </div>
            <div class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] text-center border border-zaccGreen/10 hover:border-zaccGreen/30 transition">
              <div class="text-3xl font-extrabold text-zaccGreen mb-2">P</div>
              <div class="font-semibold text-zaccBlack mb-2">Professionalism</div>
              <p class="text-sm text-zaccBlack/70">Delivering services competently and impartially</p>
            </div>
            <div class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] text-center border border-zaccGreen/10 hover:border-zaccGreen/30 transition">
              <div class="text-3xl font-extrabold text-zaccGreen mb-2">T</div>
              <div class="font-semibold text-zaccBlack mb-2">Transparency</div>
              <p class="text-sm text-zaccBlack/70">Conducting our work openly and accountably</p>
            </div>
            <div class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] text-center border border-zaccGreen/10 hover:border-zaccGreen/30 transition">
              <div class="text-3xl font-extrabold text-zaccGreen mb-2">A</div>
              <div class="font-semibold text-zaccBlack mb-2">Accountability</div>
              <p class="text-sm text-zaccBlack/70">Being answerable to the public and the law</p>
            </div>
            <div class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] text-center border border-zaccGreen/10 hover:border-zaccGreen/30 transition">
              <div class="text-3xl font-extrabold text-zaccGreen mb-2">F</div>
              <div class="font-semibold text-zaccBlack mb-2">Fairness</div>
              <p class="text-sm text-zaccBlack/70">Ensuring justice, objectivity, and respect for human rights</p>
            </div>
            <div class="rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] text-center border border-zaccGreen/10 hover:border-zaccGreen/30 transition">
              <div class="text-3xl font-extrabold text-zaccGreen mb-2">C</div>
              <div class="font-semibold text-zaccBlack mb-2">Confidentiality</div>
              <p class="text-sm text-zaccBlack/70">Protecting information and whistleblowers</p>
            </div>
          </div>
        </div>

        <!-- Our Functions with Image -->
        <div class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">Our Functions</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
            <p class="text-zaccBlack/70 max-w-3xl mx-auto">
              In fulfilling its constitutional and statutory obligations, ZACC performs the following functions:
            </p>
          </div>
          <div class="grid gap-8 lg:grid-cols-2 items-center">
            <div class="space-y-4">
              <div class="flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm border border-zaccGreen/10">
                <svg class="h-6 w-6 text-zaccGreen mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-zaccBlack/80">Receives and assesses reports and complaints of corruption</span>
              </div>
              <div class="flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm border border-zaccGreen/10">
                <svg class="h-6 w-6 text-zaccGreen mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-zaccBlack/80">Conducts investigations into alleged acts of corruption and abuse of power</span>
              </div>
              <div class="flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm border border-zaccGreen/10">
                <svg class="h-6 w-6 text-zaccGreen mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-zaccBlack/80">Carries out systems reviews to identify corruption risks in institutions</span>
              </div>
              <div class="flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm border border-zaccGreen/10">
                <svg class="h-6 w-6 text-zaccGreen mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-zaccBlack/80">Monitors trends and patterns of corruption</span>
              </div>
            </div>
            <div class="relative h-[400px] rounded-2xl overflow-hidden shadow-lg">
              <img src="/gavel.jpg" alt="ZACC functions" class="h-full w-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-zaccBlack/70 to-transparent"></div>
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2 mt-8">
            <div class="flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm border border-zaccGreen/10">
              <svg class="h-6 w-6 text-zaccGreen mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-zaccBlack/80">Recommends corrective measures and institutional reforms</span>
            </div>
            <div class="flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm border border-zaccGreen/10">
              <svg class="h-6 w-6 text-zaccGreen mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-zaccBlack/80">Refers cases for prosecution to the appropriate authorities</span>
            </div>
            <div class="flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm border border-zaccGreen/10">
              <svg class="h-6 w-6 text-zaccGreen mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-zaccBlack/80">Undertakes public education and awareness programmes</span>
            </div>
            <div class="flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm border border-zaccGreen/10">
              <svg class="h-6 w-6 text-zaccGreen mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-zaccBlack/80">Collaborates with local, regional, and international partners in the fight against corruption</span>
            </div>
          </div>
        </div>

        <!-- Strategic Focus Areas -->
        <div class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">Strategic Focus Areas</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
            <p class="text-zaccBlack/70 max-w-3xl mx-auto">
              The Commission's work is guided by national development priorities and strategic frameworks. Key focus areas include:
            </p>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border border-zaccGreen/10 hover:border-zaccGreen/30 transition">
              <div class="absolute top-0 right-0 w-20 h-20 bg-zaccGreen/5 rounded-bl-full"></div>
              <div class="relative">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-2 h-2 rounded-full bg-zaccGreen"></div>
                  <span class="font-semibold text-zaccBlack">Corruption Prevention</span>
                </div>
                <p class="text-sm text-zaccBlack/70">Systems strengthening and risk mitigation</p>
              </div>
            </div>
            <div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border border-zaccGreen/10 hover:border-zaccGreen/30 transition">
              <div class="absolute top-0 right-0 w-20 h-20 bg-zaccGreen/5 rounded-bl-full"></div>
              <div class="relative">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-2 h-2 rounded-full bg-zaccGreen"></div>
                  <span class="font-semibold text-zaccBlack">Law Enforcement</span>
                </div>
                <p class="text-sm text-zaccBlack/70">Investigations and prosecution support</p>
              </div>
            </div>
            <div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border border-zaccGreen/10 hover:border-zaccGreen/30 transition">
              <div class="absolute top-0 right-0 w-20 h-20 bg-zaccGreen/5 rounded-bl-full"></div>
              <div class="relative">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-2 h-2 rounded-full bg-zaccGreen"></div>
                  <span class="font-semibold text-zaccBlack">Public Sector Integrity</span>
                </div>
                <p class="text-sm text-zaccBlack/70">Accountability and transparency</p>
              </div>
            </div>
            <div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border border-zaccGreen/10 hover:border-zaccGreen/30 transition">
              <div class="absolute top-0 right-0 w-20 h-20 bg-zaccGreen/5 rounded-bl-full"></div>
              <div class="relative">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-2 h-2 rounded-full bg-zaccGreen"></div>
                  <span class="font-semibold text-zaccBlack">Private Sector</span>
                </div>
                <p class="text-sm text-zaccBlack/70">Corruption prevention in business</p>
              </div>
            </div>
            <div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border border-zaccGreen/10 hover:border-zaccGreen/30 transition">
              <div class="absolute top-0 right-0 w-20 h-20 bg-zaccGreen/5 rounded-bl-full"></div>
              <div class="relative">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-2 h-2 rounded-full bg-zaccGreen"></div>
                  <span class="font-semibold text-zaccBlack">Community Engagement</span>
                </div>
                <p class="text-sm text-zaccBlack/70">Public awareness and education</p>
              </div>
            </div>
            <div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-[0_5px_10px_0_rgba(41,61,102,0.2)] border border-zaccGreen/10 hover:border-zaccGreen/30 transition">
              <div class="absolute top-0 right-0 w-20 h-20 bg-zaccGreen/5 rounded-bl-full"></div>
              <div class="relative">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-2 h-2 rounded-full bg-zaccGreen"></div>
                  <span class="font-semibold text-zaccBlack">Cooperation</span>
                </div>
                <p class="text-sm text-zaccBlack/70">Domestic, regional, and international partnerships</p>
              </div>
            </div>
          </div>
        </div>

        <!-- NACS Section with Image -->
        <div class="mb-20 grid gap-12 lg:grid-cols-2 items-center">
          <div class="relative h-[400px] rounded-2xl overflow-hidden shadow-lg">
            <img src="/el1.jpg" alt="NACS collaboration" class="h-full w-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-br from-zaccGreen/70 to-zaccBlack/50"></div>
          </div>
          <div class="rounded-2xl bg-gradient-to-br from-zaccGreen/10 to-zaccGold/10 p-8 border border-zaccGreen/20">
            <h2 class="text-2xl font-extrabold mb-4">Role in the National Anti-Corruption Strategy (NACS)</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mb-6"></div>
            <p class="text-zaccBlack/70 leading-relaxed">
              The Zimbabwe Anti-Corruption Commission plays a leading role in the implementation and coordination of the National Anti-Corruption Strategy (NACS). Through multi-stakeholder collaboration, the Commission works with government ministries, departments and agencies, the private sector, civil society, and development partners to promote a whole-of-society approach to combating corruption.
            </p>
          </div>
        </div>

        <!-- Leadership and Governance -->
        <div class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">Leadership and Governance</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
          </div>
          <div class="grid gap-8 lg:grid-cols-2 items-center">
            <div class="relative h-[400px] rounded-2xl overflow-hidden shadow-lg">
              <img src="/el2.jpg" alt="ZACC leadership" class="h-full w-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-zaccBlack/60 to-transparent"></div>
            </div>
            <div>
              <p class="text-zaccBlack/70 leading-relaxed text-lg">
                ZACC is governed by a Commission appointed in accordance with the Constitution of Zimbabwe. The Commission provides strategic direction and oversight, supported by a professional Secretariat responsible for the day-to-day operations of the institution. The leadership of ZACC is committed to independence, accountability, and the rule of law.
              </p>
            </div>
          </div>
        </div>

        <!-- Commitment to Citizens -->
        <div class="mb-20 rounded-2xl bg-gradient-to-r from-zaccGreen to-zaccGreen/90 p-12 text-white relative overflow-hidden">
          <div class="absolute inset-0 opacity-10">
            <img src="/flag.jpg" alt="Background" class="h-full w-full object-cover" />
          </div>
          <div class="relative z-10 max-w-4xl mx-auto text-center">
            <h2 class="text-3xl font-extrabold mb-6">Our Commitment to Citizens</h2>
            <div class="h-1 w-20 rounded bg-white/70 mx-auto mb-8"></div>
            <p class="text-white/90 leading-relaxed text-lg mb-6">
              The Zimbabwe Anti-Corruption Commission is committed to serving the people of Zimbabwe with integrity and professionalism. The Commission guarantees confidentiality in the handling of corruption reports, protects whistleblowers in accordance with the law, and ensures that investigations are conducted fairly and transparently.
            </p>
            <p class="text-white/90 leading-relaxed text-lg">
              ZACC upholds human rights and due process, and remains resolute in its zero-tolerance approach to corruption in all its forms.
            </p>
          </div>
        </div>

        <!-- National Presence -->
        <div class="mb-12 text-center">
          <h2 class="text-3xl font-extrabold mb-4">National Presence</h2>
          <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
          <p class="text-zaccBlack/70 leading-relaxed text-lg max-w-3xl mx-auto">
            ZACC has a nationwide mandate and operates across Zimbabwe to ensure accessibility and responsiveness to corruption-related concerns wherever they arise.
          </p>
        </div>

        <!-- Back to Home -->
        <div class="text-center pt-8">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 rounded-md bg-zaccGreen px-6 py-3 font-semibold text-white shadow-glow hover:brightness-110"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Home
          </NuxtLink>
        </div>
      </div>
    </section>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  title: 'About Us - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Learn about ZACC - Zimbabwe Anti-Corruption Commission. Our mandate, vision, mission, core values, functions, and commitment to combating corruption through prevention, investigation, and public education.'
    }
  ]
})
</script>
