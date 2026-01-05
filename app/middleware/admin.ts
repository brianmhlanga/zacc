export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware for login and forgot-password pages
  if (to.path === '/admin/login' || to.path === '/admin/forgot-password') {
    const { loggedIn, fetch } = useUserSession()
    await fetch()
    
    // Redirect to dashboard if already logged in
    if (loggedIn.value && to.path === '/admin/login') {
      return navigateTo('/admin')
    }
    return
  }

  // Protect all other /admin routes
  if (to.path.startsWith('/admin')) {
    const { loggedIn, fetch } = useUserSession()
    
    // Fetch session if not already loaded
    await fetch()
    
    // Redirect to login if not authenticated
    if (!loggedIn.value) {
      return navigateTo('/admin/login')
    }
  }
})
