import { z } from 'zod'
import { prisma } from '../../../utils/prisma'
import { getSupplierFromRequest } from '../../../utils/supplierAuth'

const profileSchema = z.object({
  companyName: z.string().min(2).optional(),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable()
})

export default defineEventHandler(async (event) => {
  const supplier = await getSupplierFromRequest(event)
  if (!supplier) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  if (event.method === 'GET') {
    return await prisma.supplier.findUnique({
      where: { id: supplier.id },
      include: {
        approvals: { include: { category: true } },
        documents: true,
        bids: {
          include: {
            tender: {
              select: {
                id: true,
                title: true,
                closingDate: true,
                categoryId: true
              }
            },
            documents: true,
            lineItems: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  }

  const data = profileSchema.parse(await readBody(event))
  return await prisma.supplier.update({
    where: { id: supplier.id },
    data: {
      ...(data.companyName !== undefined ? { companyName: data.companyName } : {}),
      ...(data.contactPerson !== undefined ? { contactPerson: data.contactPerson } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.address !== undefined ? { address: data.address } : {})
    }
  })
})
