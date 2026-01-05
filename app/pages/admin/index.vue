<template>
  <NuxtLayout name="dashboard">
    <div>
      <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-zaccBlack">Dashboard</h1>
      <p class="mt-2 text-gray-600">{{ welcomeMessage }}</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-4">
      <Card class="border-0 shadow-md hover:shadow-lg transition-shadow">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium text-gray-600 mb-1">Total Reports</div>
              <div class="text-3xl font-extrabold text-zaccBlack">1,234</div>
              <div class="flex items-center gap-1 mt-2 text-sm">
                <i class="pi pi-arrow-up text-green-500 text-xs"></i>
                <span class="text-green-500 font-semibold">12%</span>
                <span class="text-gray-500">vs last month</span>
              </div>
            </div>
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <i class="pi pi-flag text-red-600 text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="border-0 shadow-md hover:shadow-lg transition-shadow">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium text-gray-600 mb-1">News Articles</div>
              <div class="text-3xl font-extrabold text-zaccBlack">89</div>
              <div class="flex items-center gap-1 mt-2 text-sm">
                <i class="pi pi-arrow-up text-green-500 text-xs"></i>
                <span class="text-green-500 font-semibold">5%</span>
                <span class="text-gray-500">vs last month</span>
              </div>
            </div>
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <i class="pi pi-newspaper text-blue-600 text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="border-0 shadow-md hover:shadow-lg transition-shadow">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium text-gray-600 mb-1">Job Applications</div>
              <div class="text-3xl font-extrabold text-zaccBlack">156</div>
              <div class="flex items-center gap-1 mt-2 text-sm">
                <i class="pi pi-arrow-down text-red-500 text-xs"></i>
                <span class="text-red-500 font-semibold">3%</span>
                <span class="text-gray-500">vs last month</span>
              </div>
            </div>
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
              <i class="pi pi-briefcase text-purple-600 text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="border-0 shadow-md hover:shadow-lg transition-shadow">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium text-gray-600 mb-1">Contact Submissions</div>
              <div class="text-3xl font-extrabold text-zaccBlack">342</div>
              <div class="flex items-center gap-1 mt-2 text-sm">
                <i class="pi pi-arrow-up text-green-500 text-xs"></i>
                <span class="text-green-500 font-semibold">8%</span>
                <span class="text-gray-500">vs last month</span>
              </div>
            </div>
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <i class="pi pi-inbox text-green-600 text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Main Content Grid -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Recent Activity -->
      <Card class="lg:col-span-2 border-0 shadow-md">
        <template #header>
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 class="text-xl font-extrabold text-zaccBlack">Recent Activity</h2>
            <Button
              label="View All"
              link
              class="p-0"
            />
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full"
                :class="activity.iconBg"
              >
                <i :class="['pi', activity.icon, activity.iconColor, 'text-lg']"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-zaccBlack">{{ activity.title }}</div>
                <div class="text-sm text-gray-600 mt-1">{{ activity.description }}</div>
                <div class="text-xs text-gray-500 mt-2">{{ activity.time }}</div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Quick Actions -->
      <Card class="border-0 shadow-md">
        <template #header>
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-xl font-extrabold text-zaccBlack">Quick Actions</h2>
          </div>
        </template>
        <template #content>
          <div class="space-y-3">
            <Button
              v-for="action in quickActions"
              :key="action.label"
              :label="action.label"
              :icon="action.icon"
              class="w-full justify-start"
              outlined
              @click="action.command"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- Recent Reports & Submissions -->
    <div class="grid gap-6 mt-6 lg:grid-cols-2">
      <!-- Recent Reports -->
      <Card class="border-0 shadow-md">
        <template #header>
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 class="text-xl font-extrabold text-zaccBlack">Recent Reports</h2>
            <NuxtLink to="/admin/reports" class="text-sm font-semibold text-zaccGreen hover:underline">
              View All
            </NuxtLink>
          </div>
        </template>
        <template #content>
          <DataTable :value="recentReports" :paginator="false" class="text-sm">
            <Column field="reportNumber" header="Report #" />
            <Column field="type" header="Type">
              <template #body="{ data }">
                <Tag :value="data.type" severity="danger" />
              </template>
            </Column>
            <Column field="status" header="Status">
              <template #body="{ data }">
                <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
              </template>
            </Column>
            <Column field="date" header="Date">
              <template #body="{ data }">
                {{ formatDate(data.date) }}
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- Recent Contact Submissions -->
      <Card class="border-0 shadow-md">
        <template #header>
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 class="text-xl font-extrabold text-zaccBlack">Contact Submissions</h2>
            <NuxtLink to="/admin/contact" class="text-sm font-semibold text-zaccGreen hover:underline">
              View All
            </NuxtLink>
          </div>
        </template>
        <template #content>
          <DataTable :value="recentContacts" :paginator="false" class="text-sm">
            <Column field="name" header="Name" />
            <Column field="subject" header="Subject" />
            <Column field="status" header="Status">
              <template #body="{ data }">
                <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
              </template>
            </Column>
            <Column field="date" header="Date">
              <template #body="{ data }">
                {{ formatDate(data.date) }}
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  title: 'Dashboard - ZACC CMS',
  meta: [
    {
      name: 'description',
      content: 'ZACC Content Management System Dashboard'
    }
  ]
})

definePageMeta({
  middleware: 'admin'
})

// Ensure user is authenticated
const { loggedIn, user, fetch } = useUserSession()

// Fetch session on mount
onMounted(async () => {
  await fetch()
  if (!loggedIn.value) {
    await navigateTo('/admin/login')
  }
})

// Display user info if available
const welcomeMessage = computed(() => {
  if (user.value?.name) {
    return `Welcome back, ${user.value.name}!`
  }
  return "Welcome back! Here's what's happening today."
})

const recentActivities = [
  {
    id: 1,
    title: 'New corruption report submitted',
    description: 'Report #RPT-2025-0012 received',
    time: '2 minutes ago',
    icon: 'pi-flag',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600'
  },
  {
    id: 2,
    title: 'News article published',
    description: '"ZACC enhances stakeholder engagement"',
    time: '15 minutes ago',
    icon: 'pi-check-circle',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    id: 3,
    title: 'Job application received',
    description: 'Application for Senior Investigator position',
    time: '1 hour ago',
    icon: 'pi-briefcase',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600'
  },
  {
    id: 4,
    title: 'Contact form submission',
    description: 'New inquiry from john.doe@example.com',
    time: '2 hours ago',
    icon: 'pi-inbox',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    id: 5,
    title: 'Media file uploaded',
    description: '5 images added to gallery',
    time: '3 hours ago',
    icon: 'pi-upload',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600'
  }
]

const quickActions = [
  {
    label: 'Create News Article',
    icon: 'pi pi-file-edit',
    command: () => navigateTo('/admin/news/new')
  },
  {
    label: 'Add Download',
    icon: 'pi pi-download',
    command: () => navigateTo('/admin/downloads/new')
  },
  {
    label: 'Upload Media',
    icon: 'pi pi-upload',
    command: () => navigateTo('/admin/media/upload')
  },
  {
    label: 'Add Court Ruling',
    icon: 'pi pi-gavel',
    command: () => navigateTo('/admin/rulings/new')
  },
  {
    label: 'Create Job Posting',
    icon: 'pi pi-briefcase',
    command: () => navigateTo('/admin/jobs/new')
  }
]

const recentReports = [
  {
    reportNumber: 'RPT-2025-0012',
    type: 'Bribery',
    status: 'NEW',
    date: new Date('2025-01-15T10:30:00')
  },
  {
    reportNumber: 'RPT-2025-0011',
    type: 'Fraud',
    status: 'UNDER_INVESTIGATION',
    date: new Date('2025-01-14T14:20:00')
  },
  {
    reportNumber: 'RPT-2025-0010',
    type: 'Embezzlement',
    status: 'ACKNOWLEDGED',
    date: new Date('2025-01-13T09:15:00')
  }
]

const recentContacts = [
  {
    name: 'John Doe',
    subject: 'General Inquiry',
    status: 'NEW',
    date: new Date('2025-01-15T11:00:00')
  },
  {
    name: 'Jane Smith',
    subject: 'Partnership Request',
    status: 'IN_PROGRESS',
    date: new Date('2025-01-14T16:45:00')
  },
  {
    name: 'Robert Johnson',
    subject: 'Media Inquiry',
    status: 'RESPONDED',
    date: new Date('2025-01-13T10:30:00')
  }
]

const getStatusSeverity = (status: string) => {
  const severityMap: Record<string, string> = {
    NEW: 'info',
    IN_PROGRESS: 'warning',
    RESPONDED: 'success',
    CLOSED: 'secondary',
    UNDER_INVESTIGATION: 'warning',
    ACKNOWLEDGED: 'info'
  }
  return severityMap[status] || 'secondary'
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>
