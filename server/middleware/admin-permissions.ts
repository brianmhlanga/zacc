import { actionFromMethod, getPermissionsForUser, hasPermissionForUser, type PermissionModuleKey } from '../utils/permissions'

const API_PREFIX_TO_MODULE: Array<[string, PermissionModuleKey]> = [
  ['/api/content', 'content'],
  ['/api/citizen-hero', 'citizen_hero'],
  ['/api/news', 'news'],
  ['/api/downloads', 'downloads'],
  ['/api/tenders', 'tenders'],
  ['/api/suppliers', 'suppliers'],
  ['/api/rulings', 'rulings'],
  ['/api/gallery', 'gallery'],
  // Recruitment. Order matters: resolveModule returns the FIRST match, so the
  // specific prefixes must precede the '/api/recruitment' catch-all below them.
  ['/api/recruitment/applications', 'applications'],
  // The candidate register is the same personal data as the applications
  // console, seen as people rather than as submissions, so it rides the same grant.
  ['/api/recruitment/candidates', 'applications'],
  ['/api/recruitment/panel', 'panel_review'],
  ['/api/recruitment/config', 'recruitment_config'],
  ['/api/recruitment/reports', 'recruitment_reports'],
  ['/api/recruitment/vacancies', 'jobs'],
  ['/api/recruitment', 'jobs'],
  ['/api/jobs', 'jobs'],
  ['/api/reports', 'reports'],
  ['/api/contact', 'contact'],
  ['/api/statistics', 'statistics'],
  ['/api/commissioners', 'commissioners'],
  ['/api/team', 'executives'],
  ['/api/menus', 'menus'],
  ['/api/users', 'users'],
  ['/api/permissions', 'permissions'],
  ['/api/settings', 'settings'],
  ['/api/dashboard', 'dashboard']
]

function resolveModule(pathname: string): PermissionModuleKey | null {
  const match = API_PREFIX_TO_MODULE.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  return match?.[1] || null
}

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname
  if (!pathname.startsWith('/api/')) return
  if (pathname.startsWith('/api/public/')) return
  if (pathname.startsWith('/api/auth/')) return
  if (pathname.startsWith('/api/uploads/')) return
  if (pathname === '/api/permissions/me') return

  const moduleKey = resolveModule(pathname)
  if (!moduleKey) return

  const session = await getUserSession(event)
  if (!session.user) return
  if (session.user.role === 'SUPER_ADMIN') return

  const action = actionFromMethod(event.method)
  const permissions = await getPermissionsForUser(session.user.id)
  const ok = hasPermissionForUser(session.user, moduleKey, action, permissions)
  if (!ok) {
    throw createError({
      statusCode: 403,
      statusMessage: `Forbidden: missing ${action} permission for ${moduleKey}`
    })
  }
})
