import { ADMIN_PERMISSION_MODULES, getPermissionStoreSnapshot } from '../../utils/permissions'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const [users, store] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { createdAt: 'desc' }
    }),
    getPermissionStoreSnapshot()
  ])

  return {
    modules: ADMIN_PERMISSION_MODULES,
    users: users.map((u) => ({
      ...u,
      permissions: store[u.id] || {}
    }))
  }
})
