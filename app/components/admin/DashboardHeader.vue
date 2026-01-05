<template>
  <header class="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 shadow-sm">
    <div class="flex h-full items-center justify-between px-6">
      <!-- Left Section -->
      <div class="flex items-center gap-4">
        <button
          @click="$emit('toggle-sidebar')"
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <i class="pi pi-bars text-gray-600 text-lg"></i>
        </button>

        <!-- Search -->
        <div class="relative hidden md:block">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <i class="pi pi-search"></i>
          </span>
          <InputText
            v-model="searchQuery"
            placeholder="Search..."
            class="pl-10 w-64"
          />
        </div>
      </div>

      <!-- Right Section -->
      <div class="flex items-center gap-3">
        <!-- Notifications -->
        <Menu ref="notificationsMenu" :model="notificationMenuItems" popup />
        <button
          @click="toggleNotifications"
          class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <i class="pi pi-bell text-gray-600 text-lg"></i>
          <span
            v-if="notificationCount > 0"
            class="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white"
          >
            {{ notificationCount > 9 ? '9+' : notificationCount }}
          </span>
        </button>

        <!-- Messages -->
        <Menu ref="messagesMenu" :model="messageMenuItems" popup />
        <button
          @click="toggleMessages"
          class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Messages"
        >
          <i class="pi pi-envelope text-gray-600 text-lg"></i>
          <span
            v-if="messageCount > 0"
            class="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white"
          >
            {{ messageCount > 9 ? '9+' : messageCount }}
          </span>
        </button>

        <!-- Quick Actions -->
        <SplitButton
          label="New"
          icon="pi pi-plus"
          :model="quickActions"
          @click="handleQuickAction"
          style="background: #209341; border-color: #209341;"
        />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  'toggle-sidebar': []
}>()

const searchQuery = ref('')
const notificationsMenu = ref()
const messagesMenu = ref()

const notificationCount = ref(5)
const messageCount = ref(3)

const notificationMenuItems = [
  {
    label: 'New corruption report',
    icon: 'pi pi-flag',
    command: () => navigateTo('/admin/reports')
  },
  {
    label: 'Job application received',
    icon: 'pi pi-briefcase',
    command: () => navigateTo('/admin/jobs')
  },
  {
    label: 'Contact form submission',
    icon: 'pi pi-inbox',
    command: () => navigateTo('/admin/contact')
  },
  { separator: true },
  {
    label: 'View All Notifications',
    icon: 'pi pi-bell',
    command: () => navigateTo('/admin/notifications')
  }
]

const messageMenuItems = [
  {
    label: 'John Doe - Regarding case #1234',
    icon: 'pi pi-user',
    command: () => navigateTo('/admin/messages')
  },
  {
    label: 'Jane Smith - Follow up needed',
    icon: 'pi pi-user',
    command: () => navigateTo('/admin/messages')
  },
  { separator: true },
  {
    label: 'View All Messages',
    icon: 'pi pi-inbox',
    command: () => navigateTo('/admin/messages')
  }
]

const quickActions = [
  {
    label: 'New Article',
    icon: 'pi pi-file-edit',
    command: () => {
      navigateTo('/admin/news/new')
    }
  },
  {
    label: 'New Download',
    icon: 'pi pi-download',
    command: () => {
      navigateTo('/admin/downloads/new')
    }
  },
  {
    label: 'Upload Media',
    icon: 'pi pi-upload',
    command: () => {
      navigateTo('/admin/media/upload')
    }
  }
]

const toggleNotifications = (event: Event) => {
  notificationsMenu.value.toggle(event)
}

const toggleMessages = (event: Event) => {
  messagesMenu.value.toggle(event)
}

const handleQuickAction = () => {
  navigateTo('/admin/news/new')
}
</script>
