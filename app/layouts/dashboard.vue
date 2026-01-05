<template>
  <div class="min-h-screen bg-gray-50">
    <AdminDashboardSidebar :collapsed="sidebarCollapsed" @toggle="handleToggleSidebar" />
    <div :class="['transition-all duration-300', sidebarCollapsed ? 'ml-20' : 'ml-64']">
      <AdminDashboardHeader @toggle-sidebar="handleToggleSidebar" />
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const sidebarCollapsed = ref(false)

const handleToggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<style scoped>
/* Smooth transitions for sidebar */
</style>
