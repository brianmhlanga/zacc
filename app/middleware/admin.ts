export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware for login and forgot-password pages
  if (to.path === '/admin/login' || to.path === '/admin/forgot-password') {
    const { loggedIn, fetch, user } = useUserSession()
    await fetch()
    
    // Redirect to dashboard if already logged in
    if (loggedIn.value && to.path === '/admin/login') {
      if (user.value?.role === 'REPORTS_ADMIN') {
        return navigateTo('/admin/reports')
      }
      return navigateTo('/admin')
    }
    return
  }

  // Protect all other /admin routes
  if (to.path.startsWith('/admin')) {
    const { loggedIn, fetch, user } = useUserSession()
    const { loadPermissions, canViewPath } = useAdminPermissions()
    
    // Fetch session if not already loaded
    await fetch()
    
    // Redirect to login if not authenticated
    if (!loggedIn.value) {
      return navigateTo('/admin/login')
    }

    // Reports-only role: only /admin/reports (and nested)
    if (user.value?.role === 'REPORTS_ADMIN' && !to.path.startsWith('/admin/reports')) {
      return navigateTo('/admin/reports')
    }

    if (!['SUPER_ADMIN', 'REPORTS_ADMIN'].includes(user.value?.role || '')) {
      await loadPermissions()
      if (!canViewPath(to.path)) {
        const fallbackPaths = [
          '/admin/reports',
          '/admin/content',
          '/admin/news',
          '/admin/downloads',
          '/admin/tenders',
          '/admin/suppliers',
          '/admin/rulings',
          '/admin/gallery',
          '/admin/jobs',
          '/admin/contact',
          '/admin/statistics',
          '/admin/commissioners',
          '/admin/executives',
          '/admin/menus',
          '/admin/users',
          '/admin/permissions',
          '/admin/settings',
          '/admin'
        ]
        const firstAllowed = fallbackPaths.find((p) => canViewPath(p))
        return navigateTo(firstAllowed || '/admin/login')
      }
    }
  }
})
