import { z } from 'zod'
import bcrypt from 'bcrypt'
import { prisma } from '../../../utils/prisma'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  companyName: z.string().min(2),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).default([])
})

export default defineEventHandler(async (event) => {
  const data = schema.parse(await readBody(event))

  const existing = await prisma.supplier.findUnique({ where: { email: data.email.toLowerCase() } })
  if (existing) throw createError({ statusCode: 400, statusMessage: 'Supplier with this email already exists' })

  const categories = data.categoryIds.length
    ? await prisma.tenderCategory.findMany({ where: { id: { in: data.categoryIds }, isActive: true } })
    : []

  const passwordHash = await bcrypt.hash(data.password, 10)
  const supplier = await prisma.supplier.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      companyName: data.companyName,
      contactPerson: data.contactPerson ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      approvals: { create: categories.map((c) => ({ categoryId: c.id, status: 'PENDING' })) }
    },
    select: { id: true, email: true, companyName: true, contactPerson: true, phone: true, address: true, createdAt: true }
  })

  return { success: true, supplier }
})
