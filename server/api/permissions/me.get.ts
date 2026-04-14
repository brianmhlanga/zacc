import { ADMIN_PERMISSION_MODULES, getPermissionsForUser, hasPermissionForUser, type PermissionAction } from '../../utils/permissions'

const ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete']

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const map = await getPermissionsForUser(session.user.id)
  const effective = Object.fromEntries(
    ADMIN_PERMISSION_MODULES.map((m) => [
      m.key,
      ACTIONS.filter((a) => hasPermissionForUser(session.user!, m.key, a, map))
    ])
  )

  return {
    role: session.user.role,
    permissions: map,
    effective
  }
})
