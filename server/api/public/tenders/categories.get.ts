import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async () => {
  return await prisma.tenderCategory.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
})
