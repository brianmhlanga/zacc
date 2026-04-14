import { z } from 'zod'
import bcrypt from 'bcrypt'
import { prisma } from '../../../utils/prisma'
import { createSupplierSession } from '../../../utils/supplierAuth'

const schema = z.object({ email: z.string().email(), password: z.string().min(1) })

export default defineEventHandler(async (event) => {
  const { email, password } = schema.parse(await readBody(event))
  const supplier = await prisma.supplier.findUnique({ where: { email: email.toLowerCase() } })
  if (!supplier) throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  if (!supplier.isActive) throw createError({ statusCode: 403, statusMessage: 'Supplier account is deactivated' })
  const ok = await bcrypt.compare(password, supplier.passwordHash)
  if (!ok) throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })

  const token = await createSupplierSession(supplier.id)
  return { success: true, token, supplier: { id: supplier.id, email: supplier.email, companyName: supplier.companyName, contactPerson: supplier.contactPerson } }
})
