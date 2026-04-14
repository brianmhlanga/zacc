import { createHash, randomBytes } from 'crypto'
import { prisma } from './prisma'

const SESSION_TTL_HOURS = 24 * 14

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export function createSupplierToken() {
  return randomBytes(32).toString('hex')
}

export async function createSupplierSession(supplierId: string) {
  const token = createSupplierToken()
  const tokenHash = sha256(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000)

  await prisma.supplierSession.create({
    data: { supplierId, tokenHash, expiresAt }
  })

  return token
}

export async function getSupplierFromRequest(event: any) {
  const auth = getHeader(event, 'authorization') || ''
  if (!auth.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  if (!token) return null

  const tokenHash = sha256(token)
  const session = await prisma.supplierSession.findUnique({
    where: { tokenHash },
    include: { supplier: true }
  })

  if (!session) return null
  if (session.expiresAt < new Date()) return null
  if (!session.supplier.isActive) return null

  return session.supplier
}

export async function revokeSupplierSession(token: string) {
  const tokenHash = sha256(token)
  await prisma.supplierSession.deleteMany({ where: { tokenHash } })
}
