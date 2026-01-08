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
              <div class="text-3xl font-extrabold text-zaccBlack">{{ formatNumber(stats.reports.total) }}</div>
              <div v-if="stats.reports.change !== null" class="flex items-center gap-1 mt-2 text-sm">
                <i :class="['pi', stats.reports.isPositive ? 'pi-arrow-up' : 'pi-arrow-down', stats.reports.isPositive ? 'text-green-500' : 'text-red-500', 'text-xs']"></i>
                <span :class="[stats.reports.isPositive ? 'text-green-500' : 'text-red-500', 'font-semibold']">
                  {{ Math.abs(stats.reports.change) }}%
                </span>
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
              <div class="text-3xl font-extrabold text-zaccBlack">{{ formatNumber(stats.news.total) }}</div>
              <div v-if="stats.news.change !== null" class="flex items-center gap-1 mt-2 text-sm">
                <i :class="['pi', stats.news.isPositive ? 'pi-arrow-up' : 'pi-arrow-down', stats.news.isPositive ? 'text-green-500' : 'text-red-500', 'text-xs']"></i>
                <span :class="[stats.news.isPositive ? 'text-green-500' : 'text-red-500', 'font-semibold']">
                  {{ Math.abs(stats.news.change) }}%
                </span>
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
              <div class="text-3xl font-extrabold text-zaccBlack">{{ formatNumber(stats.jobApplications.total) }}</div>
              <div v-if="stats.jobApplications.change !== null" class="flex items-center gap-1 mt-2 text-sm">
                <i :class="['pi', stats.jobApplications.isPositive ? 'pi-arrow-up' : 'pi-arrow-down', stats.jobApplications.isPositive ? 'text-green-500' : 'text-red-500', 'text-xs']"></i>
                <span :class="[stats.jobApplications.isPositive ? 'text-green-500' : 'text-red-500', 'font-semibold']">
                  {{ Math.abs(stats.jobApplications.change) }}%
                </span>
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
              <div class="text-3xl font-extrabold text-zaccBlack">{{ formatNumber(stats.contacts.total) }}</div>
              <div v-if="stats.contacts.change !== null" class="flex items-center gap-1 mt-2 text-sm">
                <i :class="['pi', stats.contacts.isPositive ? 'pi-arrow-up' : 'pi-arrow-down', stats.contacts.isPositive ? 'text-green-500' : 'text-red-500', 'text-xs']"></i>
                <span :class="[stats.contacts.isPositive ? 'text-green-500' : 'text-red-500', 'font-semibold']">
                  {{ Math.abs(stats.contacts.change) }}%
                </span>
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
          <DataTable :value="recentReports" :paginator="false" :loading="loading" class="text-sm">
            <template #empty>
              <div class="text-center py-8 text-gray-500">No reports found</div>
            </template>
            <Column field="reportNumber" header="Report #">
              <template #body="{ data }">
                <span class="font-mono text-xs">{{ data.reportNumber.substring(0, 8) }}...</span>
              </template>
            </Column>
            <Column field="type" header="Type">
              <template #body="{ data }">
                <Tag :value="formatCorruptionType(data.type)" severity="danger" />
              </template>
            </Column>
            <Column field="status" header="Status">
              <template #body="{ data }">
                <Tag :value="formatStatus(data.status)" :severity="getStatusSeverity(data.status)" />
              </template>
            </Column>
            <Column field="date" header="Date">
              <template #body="{ data }">
                {{ formatDate(new Date(data.date)) }}
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
          <DataTable :value="recentContacts" :paginator="false" :loading="loading" class="text-sm">
            <template #empty>
              <div class="text-center py-8 text-gray-500">No contact submissions found</div>
            </template>
            <Column field="name" header="Name" />
            <Column field="subject" header="Subject">
              <template #body="{ data }">
                <div class="max-w-xs truncate">{{ data.subject }}</div>
              </template>
            </Column>
            <Column field="status" header="Status">
              <template #body="{ data }">
                <Tag :value="formatStatus(data.status)" :severity="getStatusSeverity(data.status)" />
              </template>
            </Column>
            <Column field="date" header="Date">
              <template #body="{ data }">
                {{ formatDate(new Date(data.date)) }}
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

// State
const loading = ref(false)
const stats = ref({
  reports: { total: 0, change: null, isPositive: true },
  news: { total: 0, change: null, isPositive: true },
  jobApplications: { total: 0, change: null, isPositive: true },
  contacts: { total: 0, change: null, isPositive: true }
})
const recentReports = ref([])
const recentContacts = ref([])
const recentActivities = ref([])

// Fetch session on mount
onMounted(async () => {
  await fetch()
  if (!loggedIn.value) {
    await navigateTo('/admin/login')
  } else {
    await loadDashboardData()
  }
})

// Display user info if available
const welcomeMessage = computed(() => {
  if (user.value?.name) {
    return `Welcome back, ${user.value.name}!`
  }
  return "Welcome back! Here's what's happening today."
})

// Load dashboard data
const loadDashboardData = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/dashboard/stats')
    stats.value = data.stats
    recentReports.value = data.recentReports
    recentContacts.value = data.recentContacts
    
    // Generate recent activities from the data
    const activities: any[] = []
    
    // Add recent reports as activities
    if (data.recentReports.length > 0) {
      const report = data.recentReports[0]
      activities.push({
        id: `report-${report.id}`,
        title: 'New corruption report submitted',
        description: `Report #${report.reportNumber.substring(0, 8)}... received`,
        time: formatTimeAgo(new Date(report.date)),
        icon: 'pi-flag',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600'
      })
    }
    
    // Add recent news as activities
    if (data.recentNews && data.recentNews.length > 0) {
      const news = data.recentNews[0]
      activities.push({
        id: `news-${news.id}`,
        title: news.isPublished ? 'News article published' : 'News article created',
        description: `"${news.title}"`,
        time: formatTimeAgo(new Date(news.date)),
        icon: 'pi-check-circle',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600'
      })
    }
    
    // Add recent contacts as activities
    if (data.recentContacts.length > 0) {
      const contact = data.recentContacts[0]
      activities.push({
        id: `contact-${contact.id}`,
        title: 'Contact form submission',
        description: `New inquiry: ${contact.subject}`,
        time: formatTimeAgo(new Date(contact.date)),
        icon: 'pi-inbox',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600'
      })
    }
    
    recentActivities.value = activities.slice(0, 5)
  } catch (error: any) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
}

const quickActions = [
  {
    label: 'Create News Article',
    icon: 'pi pi-file-edit',
    command: () => navigateTo('/admin/news')
  },
  {
    label: 'Add Download',
    icon: 'pi pi-download',
    command: () => navigateTo('/admin/downloads')
  },
  {
    label: 'Upload Media',
    icon: 'pi pi-upload',
    command: () => navigateTo('/admin/gallery')
  },
  {
    label: 'Add Court Ruling',
    icon: 'pi pi-gavel',
    command: () => navigateTo('/admin/rulings')
  },
  {
    label: 'Create Job Posting',
    icon: 'pi pi-briefcase',
    command: () => navigateTo('/admin/jobs')
  }
]

const getStatusSeverity = (status: string) => {
  const severityMap: Record<string, string> = {
    NEW: 'info',
    IN_PROGRESS: 'warning',
    RESPONDED: 'success',
    CLOSED: 'secondary',
    UNDER_INVESTIGATION: 'warning',
    ACKNOWLEDGED: 'info',
    REFERRED_TO_PROSECUTION: 'success',
    ARCHIVED: 'secondary'
  }
  return severityMap[status] || 'secondary'
}

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatCorruptionType = (type: string) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num)
}

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  }
}
</script>
