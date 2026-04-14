import { getSupplierFromRequest, revokeSupplierSession } from '../../../utils/supplierAuth'

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization') || ''
  if (!auth.startsWith('Bearer ')) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const supplier = await getSupplierFromRequest(event)
  if (!supplier) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  await revokeSupplierSession(auth.slice(7))
  return { success: true }
})
