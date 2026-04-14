import { z } from 'zod'
import { ADMIN_PERMISSION_MODULES, savePermissionsForUser, type PermissionAction } from '../../utils/permissions'

const actionSchema = z.enum(['view', 'create', 'update', 'delete'])
const allowedKeys = new Set(ADMIN_PERMISSION_MODULES.map((m) => m.key))

const schema = z.object({
  permissions: z.record(z.string(), z.array(actionSchema)).default({})
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const userId = getRouterParam(event, 'id')
  if (!userId) throw createError({ statusCode: 400, statusMessage: 'User ID required' })

  const data = schema.parse(await readBody(event))
  const cleaned = Object.fromEntries(
    Object.entries(data.permissions)
      .filter(([key]) => allowedKeys.has(key))
      .map(([key, actions]) => [
        key,
        Array.from(new Set(actions as PermissionAction[]))
      ])
  )

  await savePermissionsForUser(userId, cleaned as any)
  return { success: true }
})
