import type { User } from '#auth-utils'
import { prisma } from './prisma'

export const ADMIN_PERMISSION_MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'content', label: 'Content' },
  { key: 'news', label: 'News' },
  { key: 'downloads', label: 'Downloads' },
  { key: 'tenders', label: 'Tenders' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'rulings', label: 'Rulings' },
  { key: 'gallery', label: 'Media Library' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'reports', label: 'Reports' },
  { key: 'contact', label: 'Contact Submissions' },
  { key: 'statistics', label: 'Statistics' },
  { key: 'commissioners', label: 'Commissioners' },
  { key: 'executives', label: 'Executives' },
  { key: 'menus', label: 'Menu Settings' },
  { key: 'users', label: 'Users' },
  { key: 'permissions', label: 'Permissions' },
  { key: 'settings', label: 'Settings' }
] as const

export type PermissionModuleKey = typeof ADMIN_PERMISSION_MODULES[number]['key']
export type PermissionAction = 'view' | 'create' | 'update' | 'delete'
export type UserPermissionMap = Partial<Record<PermissionModuleKey, PermissionAction[]>>
type PermissionStore = Record<string, UserPermissionMap>

const PERMISSION_SETTING_KEY = 'admin_user_permissions'

function normalizeStore(value: string | null | undefined): PermissionStore {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object') return parsed as PermissionStore
    return {}
  } catch {
    return {}
  }
}

async function getStore(): Promise<PermissionStore> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: PERMISSION_SETTING_KEY },
    select: { value: true }
  })
  return normalizeStore(setting?.value)
}

export async function getPermissionsForUser(userId: string): Promise<UserPermissionMap> {
  const store = await getStore()
  return store[userId] || {}
}

export async function savePermissionsForUser(userId: string, permissions: UserPermissionMap): Promise<void> {
  const store = await getStore()
  store[userId] = permissions
  await prisma.siteSetting.upsert({
    where: { key: PERMISSION_SETTING_KEY },
    update: {
      value: JSON.stringify(store),
      type: 'json',
      category: 'general',
      description: 'Per-user admin permissions'
    },
    create: {
      key: PERMISSION_SETTING_KEY,
      value: JSON.stringify(store),
      type: 'json',
      category: 'general',
      description: 'Per-user admin permissions'
    }
  })
}

export async function getPermissionStoreSnapshot(): Promise<PermissionStore> {
  return getStore()
}

function hasLegacyRolePermission(role: User['role'], action: PermissionAction): boolean {
  if (role === 'EDITOR') return true
  if (role === 'VIEWER') return action === 'view'
  return false
}

export function hasPermissionForUser(
  user: User,
  moduleKey: PermissionModuleKey,
  action: PermissionAction,
  userPermissions?: UserPermissionMap
): boolean {
  if (user.role === 'SUPER_ADMIN') return true
  if (user.role === 'REPORTS_ADMIN') {
    return moduleKey === 'reports' || (moduleKey === 'dashboard' && action === 'view')
  }

  const hasCustomPermissions = Boolean(
    userPermissions && Object.keys(userPermissions).length > 0
  )

  if (user.role === 'ADMIN') {
    if (!hasCustomPermissions) return true
    const actions = userPermissions?.[moduleKey] || []
    return actions.includes(action)
  }

  if (!hasCustomPermissions) {
    return hasLegacyRolePermission(user.role, action)
  }

  const actions = userPermissions?.[moduleKey] || []
  return actions.includes(action)
}

export function actionFromMethod(method?: string): PermissionAction {
  const m = (method || 'GET').toUpperCase()
  if (m === 'GET') return 'view'
  if (m === 'POST') return 'create'
  if (m === 'DELETE') return 'delete'
  return 'update'
}
