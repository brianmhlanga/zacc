<template>
  <aside
    :class="[
      'fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 shadow-lg flex flex-col',
      collapsed ? 'w-20' : 'w-64'
    ]"
  >
    <!-- Logo Section -->
    <div class="flex h-16 items-center justify-between border-b border-gray-200 px-4">
      <div v-if="!collapsed" class="flex items-center gap-3 flex-1">
        <div class="flex h-10 w-10 items-center justify-center flex-shrink-0">
          <img
            src="/logo.png"
            alt="ZACC Logo"
            class="h-10 w-10 object-contain"
          />
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-zaccBlack">ZACC CMS</div>
          <div class="text-xs text-gray-500">Admin Panel</div>
        </div>
      </div>
      <div v-else class="flex h-10 w-10 items-center justify-center mx-auto">
        <img
          src="/logo.png"
          alt="ZACC Logo"
          class="h-10 w-10 object-contain"
        />
      </div>
      <button
        v-if="!collapsed"
        @click="$emit('toggle')"
        class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
        aria-label="Collapse sidebar"
      >
        <i class="pi pi-angle-left text-gray-600"></i>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 px-3 sidebar-scroll">
      <div
        v-for="(group, groupIndex) in visibleGroups"
        :key="group.title ?? `group-${groupIndex}`"
        class="space-y-1"
        :class="{ 'mt-5': groupIndex > 0 }"
      >
        <!-- When collapsed there is no room for a heading, so a rule separates
             the groups instead of letting them run together. -->
        <p
          v-if="group.title && !collapsed"
          class="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400"
        >
          {{ group.title }}
        </p>
        <div
          v-else-if="group.title && collapsed"
          class="mx-3 mb-2 border-t border-gray-200"
          :title="group.title"
        ></div>

        <NuxtLink
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          :title="collapsed ? item.label : undefined"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          :class="[
            isActive(item)
              ? 'bg-zaccBlack/10 text-zaccGreen border-l-4 border-zaccGreen'
              : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          <i :class="['pi', item.icon, 'text-lg']"></i>
          <span v-if="!collapsed">{{ item.label }}</span>
          <span
            v-if="!collapsed && item.badge"
            class="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white"
          >
            {{ item.badge }}
          </span>
        </NuxtLink>
      </div>

    </nav>

    <!-- User Section -->
    <div class="border-t border-gray-200 p-4">
      <div v-if="!collapsed" class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-zaccBlack text-white font-semibold">
          {{ userInitials }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-gray-900 truncate">{{ userName }}</div>
          <div class="text-xs text-gray-500 truncate">{{ userRole }}</div>
        </div>
        <Menu ref="userMenu" :model="userMenuItems" popup />
        <button
          @click="toggleUserMenu"
          class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="User menu"
        >
          <i class="pi pi-ellipsis-v text-gray-600"></i>
        </button>
      </div>
      <div v-else class="flex justify-center">
        <Menu ref="userMenu" :model="userMenuItems" popup />
        <button
          @click="toggleUserMenu"
          class="flex h-10 w-10 items-center justify-center rounded-full bg-zaccBlack text-white font-semibold hover:opacity-90 transition-opacity"
          aria-label="User menu"
        >
          {{ userInitials }}
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
const props = defineProps<{
  collapsed: boolean
}>()

defineEmits<{
  toggle: []
}>()

const route = useRoute()
const userMenu = ref()
const { user, fetch: fetchUser } = useUserSession()
const { loadPermissions, canViewPath, clear: clearPermissions } = useAdminPermissions()

const isReportsAdmin = computed(() => user.value?.role === 'REPORTS_ADMIN')

const badges = ref({
  reports: 0,
  news: 0
})

// Fetch badge counts
const fetchBadges = async () => {
  try {
    const data = await $fetch('/api/dashboard/stats') as any
    if (data.badges) {
      badges.value = data.badges
    }
  } catch (error) {
    console.error('Failed to fetch badge counts:', error)
  }
}

const userName = computed(() => user.value?.name || 'Admin User')
const userRole = computed(() => {
  const role = user.value?.role || 'ADMINISTRATOR'
  return role.replace('_', ' ')
})
const userInitials = computed(() => {
  if (user.value?.name) {
    const names = user.value.name.split(' ')
    return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0][0]
  }
  return 'AU'
})

interface MenuItem {
  label: string
  path: string
  icon: string
  badgeKey?: 'reports' | 'news'
  /** Extra route prefixes that should highlight this item (detail pages). */
  activePrefixes?: string[]
  /** Restrict to specific roles regardless of the permission grid. */
  roles?: Array<'SUPER_ADMIN' | 'ADMIN'>
}

interface MenuGroup {
  /** null renders the items with no heading (the dashboard link). */
  title: string | null
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    title: null,
    items: [{ label: 'Dashboard', path: '/admin', icon: 'pi-home' }]
  },
  {
    title: 'Human Resources',
    items: [
      { label: 'Vacancies', path: '/admin/recruitment', icon: 'pi-briefcase', activePrefixes: ['/admin/recruitment', '/admin/recruitment/vacancy-'] },
      { label: 'Applications', path: '/admin/recruitment/applications', icon: 'pi-users', activePrefixes: ['/admin/recruitment/applications', '/admin/recruitment/application-', '/admin/recruitment/shortlist-'] },
      { label: 'Candidate accounts', path: '/admin/recruitment/candidates', icon: 'pi-id-card' },
      { label: 'My panel reviews', path: '/admin/recruitment/panel', icon: 'pi-check-square', activePrefixes: ['/admin/recruitment/panel', '/admin/recruitment/review-'] },
      { label: 'Interviews', path: '/admin/recruitment/interviews', icon: 'pi-calendar' },
      { label: 'Recruitment reports', path: '/admin/recruitment/reports', icon: 'pi-chart-bar' },
      { label: 'Recruitment settings', path: '/admin/recruitment/stages', icon: 'pi-sliders-h', activePrefixes: ['/admin/recruitment/stages', '/admin/recruitment/templates', '/admin/recruitment/outbox'] },
      // The pre-structured postings still live on the original screen.
      { label: 'Legacy job posts', path: '/admin/jobs', icon: 'pi-folder' }
    ]
  },
  {
    title: 'Content',
    items: [
      { label: 'Content', path: '/admin/content', icon: 'pi-file-edit' },
      { label: 'Citizens Action (Hero)', path: '/admin/citizen-hero', icon: 'pi-megaphone' },
      { label: 'News', path: '/admin/news', icon: 'pi-file', badgeKey: 'news' },
      { label: 'Downloads', path: '/admin/downloads', icon: 'pi-download' },
      { label: 'Media Library', path: '/admin/gallery', icon: 'pi-images' },
      { label: 'Menu Settings', path: '/admin/menus', icon: 'pi-list' }
    ]
  },
  {
    title: 'Procurement',
    items: [
      { label: 'Tenders', path: '/admin/tenders', icon: 'pi-file' },
      { label: 'Suppliers', path: '/admin/suppliers', icon: 'pi-building' }
    ]
  },
  {
    title: 'Corruption Reports',
    items: [
      { label: 'Reports', path: '/admin/reports', icon: 'pi-flag', badgeKey: 'reports' },
      { label: 'Report analytics', path: '/admin/analytics', icon: 'pi-chart-line' },
      { label: 'Contact Submissions', path: '/admin/contact', icon: 'pi-inbox' }
    ]
  },
  {
    title: 'Commission',
    items: [
      { label: 'Commissioners', path: '/admin/commissioners', icon: 'pi-users' },
      { label: 'Executives', path: '/admin/executives', icon: 'pi-id-card' },
      { label: 'Rulings', path: '/admin/rulings', icon: 'pi-book' },
      { label: 'Statistics', path: '/admin/statistics', icon: 'pi-chart-bar' }
    ]
  },
  {
    title: 'Administration',
    items: [
      { label: 'User management', path: '/admin/users', icon: 'pi-user-edit', roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Permissions', path: '/admin/permissions', icon: 'pi-key', roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Site settings', path: '/admin/settings', icon: 'pi-cog', roles: ['SUPER_ADMIN', 'ADMIN'] }
    ]
  }
]

const visibleGroups = computed(() => {
  const mapBadge = (key?: 'reports' | 'news') => {
    if (key === 'reports' && badges.value.reports > 0) return badges.value.reports.toString()
    if (key === 'news' && badges.value.news > 0) return badges.value.news.toString()
    return undefined
  }

  if (isReportsAdmin.value) {
    return [
      {
        title: 'Corruption Reports',
        items: [
          { label: 'Reports', path: '/admin/reports', icon: 'pi-flag', badge: mapBadge('reports') },
          { label: 'Report analytics', path: '/admin/analytics', icon: 'pi-chart-line', badge: undefined }
        ]
      }
    ]
  }

  const role = user.value?.role

  return menuGroups
    .map((group) => ({
      title: group.title,
      items: group.items
        .filter((item) => {
          // A role restriction is a hard gate, applied before the permission grid.
          if (item.roles && !(role && item.roles.includes(role as any))) return false
          if (role === 'SUPER_ADMIN') return true
          return canViewPath(item.path)
        })
        .map((item) => ({
          label: item.label,
          path: item.path,
          icon: item.icon,
          badge: mapBadge(item.badgeKey)
        }))
    }))
    // Drop headings whose items were all filtered away, so a user with narrow
    // grants does not see an empty "Administration" label.
    .filter((group) => group.items.length > 0)
})

// Fetch user session and badges on mount
onMounted(async () => {
  await fetchUser()
  await loadPermissions()
  await fetchBadges()
  // Refresh badges every 5 minutes
  setInterval(fetchBadges, 5 * 60 * 1000)
})

const userMenuItems = computed(() => {
  const logout = {
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: async () => {
      const { clear } = useUserSession()
      await clear()
      clearPermissions()
      navigateTo('/admin/login')
    }
  }
  if (isReportsAdmin.value) {
    return [logout]
  }
  return [
    {
      label: 'Profile',
      icon: 'pi pi-user',
      command: () => {
        navigateTo('/admin/profile')
      }
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => {
        navigateTo('/admin/settings')
      }
    },
    { separator: true },
    logout
  ]
})

/**
 * A prefix ending in '-' matches by bare startsWith, for the flat dynamic routes
 * this admin uses (`/admin/recruitment/application-<id>`). Everything else must
 * match the whole path or a full segment, so '/admin/news' never claims
 * '/admin/newsletter'.
 */
const matchesPrefix = (current: string, prefix: string) =>
  prefix.endsWith('-')
    ? current.startsWith(prefix)
    : current === prefix || current.startsWith(`${prefix}/`)

const prefixesFor = (item: { path: string; activePrefixes?: string[] }) =>
  item.activePrefixes?.length ? item.activePrefixes : [item.path]

/** Every prefix currently on screen, so the most specific match can win. */
const visiblePrefixes = computed(() =>
  visibleGroups.value.flatMap((g) => g.items.flatMap((i) => prefixesFor(i)))
)

const isActive = (item: { path: string; activePrefixes?: string[] }) => {
  const current = route.path

  // Dashboard would otherwise match every /admin/* route.
  if (item.path === '/admin') return current === '/admin'
  if (item.path === '/admin/analytics') {
    return current === '/admin/analytics' || current.startsWith('/admin/analytics/')
  }
  if (item.path === '/admin/reports') {
    return current === '/admin/reports' || current === '/admin/reports/'
  }

  const own = prefixesFor(item).filter((p) => matchesPrefix(current, p))
  if (!own.length) return false

  // Nested routes mean several items can match at once — '/admin/recruitment'
  // and '/admin/recruitment/panel' both match the panel page. Only the longest
  // (most specific) match should highlight.
  const longest = visiblePrefixes.value
    .filter((p) => matchesPrefix(current, p))
    .reduce((best, p) => (p.length > best.length ? p : best), '')

  return own.includes(longest)
}

const toggleUserMenu = (event: Event) => {
  userMenu.value.toggle(event)
}
</script>

<style scoped>
.sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.sidebar-scroll::-webkit-scrollbar {
  width: 6px;
}

.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
  transition: background-color 0.2s ease;
}

.sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>
