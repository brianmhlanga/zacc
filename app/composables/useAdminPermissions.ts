type PermissionAction = 'view' | 'create' | 'update' | 'delete'
type PermissionMap = Record<string, PermissionAction[]>

const routeToModule: Array<[string, string]> = [
  ['/admin/content', 'content'],
  ['/admin/citizen-hero', 'citizen_hero'],
  ['/admin/news', 'news'],
  ['/admin/downloads', 'downloads'],
  ['/admin/tenders', 'tenders'],
  ['/admin/bids-', 'tenders'],
  ['/admin/suppliers', 'suppliers'],
  ['/admin/rulings', 'rulings'],
  ['/admin/gallery', 'gallery'],
  // Recruitment. moduleFromPath uses .find with startsWith, so the specific
  // routes must precede '/admin/recruitment', and all of them must stay above
  // the '/admin' catch-all at the end of this list.
  ['/admin/recruitment/applications', 'applications'],
  ['/admin/recruitment/shortlist', 'applications'],
  ['/admin/recruitment/application-', 'applications'],
  ['/admin/recruitment/candidates', 'applications'],
  ['/admin/recruitment/panel', 'panel_review'],
  ['/admin/recruitment/review-', 'panel_review'],
  ['/admin/recruitment/stages', 'recruitment_config'],
  ['/admin/recruitment/templates', 'recruitment_config'],
  ['/admin/recruitment/outbox', 'recruitment_config'],
  ['/admin/recruitment/reports', 'recruitment_reports'],
  ['/admin/recruitment/analytics', 'recruitment_reports'],
  ['/admin/recruitment', 'jobs'],
  ['/admin/jobs', 'jobs'],
  ['/admin/analytics', 'reports'],
  ['/admin/reports', 'reports'],
  ['/admin/contact', 'contact'],
  ['/admin/statistics', 'statistics'],
  ['/admin/commissioners', 'commissioners'],
  ['/admin/executives', 'executives'],
  ['/admin/menus', 'menus'],
  ['/admin/users', 'users'],
  ['/admin/permissions', 'permissions'],
  ['/admin/settings', 'settings'],
  ['/admin', 'dashboard']
]

function moduleFromPath(path: string): string {
  const hit = routeToModule.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(prefix))
  return hit?.[1] || 'dashboard'
}

export function useAdminPermissions() {
  const permissionsState = useState<PermissionMap>('admin-permissions', () => ({}))
  const permissionsLoaded = useState<boolean>('admin-permissions-loaded', () => false)
  const permissionsLoadedForUser = useState<string>('admin-permissions-user-id', () => '')

  const loadPermissions = async () => {
    const { user } = useUserSession()
    const currentUserId = user.value?.id || ''
    if (permissionsLoaded.value && permissionsLoadedForUser.value === currentUserId) {
      return permissionsState.value
    }

    try {
      const res: any = await $fetch('/api/permissions/me')
      permissionsState.value = res?.effective || {}
      permissionsLoadedForUser.value = currentUserId
    } catch {
      permissionsState.value = {}
      permissionsLoadedForUser.value = ''
    } finally {
      permissionsLoaded.value = true
    }
    return permissionsState.value
  }

  const can = (moduleKey: string, action: PermissionAction = 'view') => {
    const actions = permissionsState.value?.[moduleKey] || []
    return actions.includes(action)
  }

  const canViewPath = (path: string) => can(moduleFromPath(path), 'view')

  const clear = () => {
    permissionsState.value = {}
    permissionsLoaded.value = false
    permissionsLoadedForUser.value = ''
  }

  return {
    permissions: permissionsState,
    permissionsLoaded,
    loadPermissions,
    can,
    canViewPath,
    moduleFromPath,
    clear
  }
}
