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
      <div class="space-y-1">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          :class="[
            isActive(item.path)
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

      <!-- Divider -->
      <div class="my-4 border-t border-gray-200"></div>

      <!-- Settings Section -->
      <div class="space-y-1">
        <div v-if="!collapsed" class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Settings
        </div>
        <NuxtLink
          to="/admin/settings"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          :class="[
            isActive('/admin/settings')
              ? 'bg-zaccBlack/10 text-zaccGreen border-l-4 border-zaccGreen'
              : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          <i class="pi pi-cog text-lg"></i>
          <span v-if="!collapsed">Settings</span>
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

const menuItems = computed(() => [
  { label: 'Dashboard', path: '/admin', icon: 'pi-home' },
  { label: 'Content', path: '/admin/content', icon: 'pi-file-edit' },
  { label: 'News', path: '/admin/news', icon: 'pi-file', badge: badges.value.news > 0 ? badges.value.news.toString() : undefined },
  { label: 'Downloads', path: '/admin/downloads', icon: 'pi-download' },
  { label: 'Rulings', path: '/admin/rulings', icon: 'pi-book' },
  { label: 'Media Library', path: '/admin/gallery', icon: 'pi-images' },
  { label: 'Jobs', path: '/admin/jobs', icon: 'pi-briefcase' },
  { label: 'Reports', path: '/admin/reports', icon: 'pi-flag', badge: badges.value.reports > 0 ? badges.value.reports.toString() : undefined },
  { label: 'Contact Submissions', path: '/admin/contact', icon: 'pi-inbox' },
  { label: 'Statistics', path: '/admin/statistics', icon: 'pi-chart-bar' },
  { label: 'Commissioners', path: '/admin/commissioners', icon: 'pi-users' },
  { label: 'Executives', path: '/admin/executives', icon: 'pi-briefcase' },
  { label: 'Menu Settings', path: '/admin/menus', icon: 'pi-list' },
  { label: 'Users', path: '/admin/users', icon: 'pi-user-edit' },
])

// Fetch user session and badges on mount
onMounted(async () => {
  await fetchUser()
  await fetchBadges()
  // Refresh badges every 5 minutes
  setInterval(fetchBadges, 5 * 60 * 1000)
})

const userMenuItems = [
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
  {
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: async () => {
      const { clear } = useUserSession()
      await clear()
      navigateTo('/admin/login')
    }
  }
]

const isActive = (path: string) => {
  if (path === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(path)
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
