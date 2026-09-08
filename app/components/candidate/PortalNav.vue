<template>
  <nav class="portal-nav" aria-label="Candidate portal">
    <!-- Who you are. A portal that does not say which account you are signed in
         as invites the wrong application under the wrong name. -->
    <div class="identity">
      <div class="avatar" aria-hidden="true">{{ initials }}</div>
      <div class="min-w-0">
        <p class="name">{{ fullName || 'Your account' }}</p>
        <p class="email">{{ candidate?.email }}</p>
      </div>
    </div>

    <NuxtLink v-if="candidate && !candidate.emailVerified" to="/candidate" class="unverified">
      <i class="pi pi-exclamation-circle" />
      <span>Email not confirmed</span>
    </NuxtLink>

    <!-- Completion, with the reason it matters rather than a bare number. -->
    <NuxtLink to="/candidate/profile" class="completion" :class="{ done: completion >= 100 }">
      <div class="completion-head">
        <span>Profile</span>
        <span class="pct">{{ completion }}%</span>
      </div>
      <div class="track"><div class="fill" :style="{ width: completion + '%' }" /></div>
      <p class="completion-hint">
        {{ completion >= 100
          ? 'Applications pre-fill from every section.'
          : 'Finish it and applications fill themselves in.' }}
      </p>
    </NuxtLink>

    <ul class="links">
      <li>
        <NuxtLink to="/candidate" class="link" :class="{ active: route.path === '/candidate' }">
          <i class="pi pi-inbox" />
          <span class="flex-1">My applications</span>
          <span v-if="candidate?.applicationCount" class="count">{{ candidate.applicationCount }}</span>
        </NuxtLink>
      </li>

      <li v-if="candidate?.draftCount">
        <NuxtLink to="/candidate" class="link sub">
          <i class="pi pi-pencil" />
          <span class="flex-1">Unfinished</span>
          <span class="count warn">{{ candidate.draftCount }}</span>
        </NuxtLink>
      </li>

      <li>
        <NuxtLink to="/candidate/profile" class="link" :class="{ active: onProfile }">
          <i class="pi pi-user" />
          <span class="flex-1">My profile</span>
          <span class="count">{{ completion }}%</span>
        </NuxtLink>
      </li>

      <!-- The profile's own sections. A candidate coming back to add one thing
           should be able to go straight to it rather than open the page and
           hunt, and the tick says what is still outstanding without opening
           anything at all. -->
      <li v-for="panel in PROFILE_PANELS" :key="panel.key">
        <NuxtLink :to="`/candidate/profile#${panel.key}`" class="link sub"
          :class="{ active: onProfile && activePanel === panel.key }">
          <i :class="['pi', panel.icon]" />
          <span class="flex-1">{{ panel.label }}</span>
          <i v-if="isPanelDone(panel)" class="pi pi-check-circle done-tick" aria-label="Complete" />
        </NuxtLink>
      </li>

      <li class="divider" role="separator" />

      <li>
        <NuxtLink to="/careers" class="link">
          <i class="pi pi-search" />
          <span class="flex-1">Browse vacancies</span>
          <i class="pi pi-arrow-up-right text-[10px] opacity-50" />
        </NuxtLink>
      </li>
    </ul>

    <button type="button" class="signout" @click="logout">
      <i class="pi pi-sign-out" />
      <span>Sign out</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
const { candidate, fullName, logout } = useCandidateAuth()

const completion = computed(() => candidate.value?.profileCompletion ?? 0)

const initials = computed(() => {
  const c = candidate.value
  if (!c) return '·'
  return `${c.firstName?.[0] ?? ''}${c.lastName?.[0] ?? ''}`.toUpperCase() || '·'
})

const onProfile = computed(() => route.path === '/candidate/profile')

/** Which profile section is open, from the URL. Defaults to the first. */
const activePanel = computed(() => route.hash.replace('#', '') || PROFILE_PANELS[0]!.key)

const isPanelDone = (panel: ProfilePanel) =>
  panelComplete(panel, candidate.value?.profileSections)
</script>

<style scoped>
.portal-nav {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ── Identity ─────────────────────────────────────────────── */

.identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  background: #fff;
  border: 1px solid #e6ebe7;
  border-radius: 0.75rem;
}
.avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  background: #209341;
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.02em;
}
.name {
  margin: 0;
  font-weight: 700;
  font-size: 0.9rem;
  color: #121212;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.email {
  margin: 0;
  font-size: 0.75rem;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unverified {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.625rem;
  background: #fef6e7;
  border: 1px solid #f3d9a4;
  color: #8c5406;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
}

/* ── Completion ───────────────────────────────────────────── */

.completion {
  display: block;
  padding: 0.75rem 0.875rem;
  background: #fff;
  border: 1px solid #e6ebe7;
  border-radius: 0.75rem;
  text-decoration: none;
  transition: border-color 0.15s;
}
.completion:hover { border-color: #209341; }
.completion-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.78rem;
  font-weight: 600;
  color: #121212;
}
.pct { font-variant-numeric: tabular-nums; color: #6b7280; }
.completion.done .pct { color: #209341; }
.track {
  height: 5px;
  margin-top: 0.5rem;
  border-radius: 999px;
  background: #eef2ef;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: #209341;
  border-radius: 999px;
  transition: width 0.3s ease;
}
.completion-hint {
  margin: 0.5rem 0 0;
  font-size: 0.72rem;
  line-height: 1.4;
  color: #6b7280;
}

/* ── Links ────────────────────────────────────────────────── */

.links {
  list-style: none;
  margin: 0.25rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.link {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.625rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.link:hover { background: #f1f5f2; color: #121212; }
.link.active {
  background: #e8f2eb;
  color: #17612f;
  font-weight: 600;
}
.link i.pi { font-size: 0.9rem; }
.count {
  min-width: 1.4rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: #eef2ef;
  color: #4b5563;
  font-size: 0.7rem;
  font-weight: 700;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.link.active .count { background: #209341; color: #fff; }
.count.warn { background: #fef0d8; color: #8c5406; }

/* Second level: indented, lighter, smaller — subordinate to the page it
   belongs to rather than competing with it. */
.link.sub {
  margin-left: 0.75rem;
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  border-left: 2px solid #eef2ef;
  border-radius: 0 0.5rem 0.5rem 0;
}
.link.sub i.pi { font-size: 0.78rem; }
.link.sub:hover { border-left-color: #cbd8cf; }
.link.sub.active {
  background: #f1f7f3;
  border-left-color: #209341;
  color: #17612f;
  font-weight: 600;
}
.done-tick { color: #209341; font-size: 0.8rem; }

.divider {
  height: 1px;
  margin: 0.5rem 0.75rem;
  background: #e6ebe7;
  list-style: none;
}

.signout {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: 0.25rem;
  padding: 0.625rem 0.75rem;
  border: none;
  border-radius: 0.625rem;
  background: transparent;
  color: #9ca3af;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}
.signout:hover { background: #fdf2f2; color: #b42318; }
.signout:focus-visible { outline: 2px solid #209341; outline-offset: 2px; }

.link:focus-visible,
.completion:focus-visible,
.unverified:focus-visible { outline: 2px solid #209341; outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .fill { transition: none; }
}

/* On a phone the sidebar becomes a scrolling strip above the content: three
   items do not justify a drawer, and a drawer hides where you are. */
@media (max-width: 1023px) {
  .portal-nav { gap: 0.5rem; }
  .links { flex-direction: row; overflow-x: auto; padding-bottom: 0.25rem; }
  .link { white-space: nowrap; }
  .completion, .identity { padding: 0.625rem 0.75rem; }
  .completion-hint { display: none; }
  .signout { margin-top: 0; }
}
</style>
