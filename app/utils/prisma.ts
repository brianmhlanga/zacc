import { PrismaClient } from '../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  adapter: any
}

let adapterPromise: Promise<any> | null = null

async function getPrismaClient() {
  if (!globalForPrisma.adapter) {
    if (!adapterPromise) {
      const adapterFactory = new PrismaMariaDb(process.env.DATABASE_URL!)
      adapterPromise = adapterFactory.connect()
    }
    globalForPrisma.adapter = await adapterPromise
  }
  return new PrismaClient({ adapter: globalForPrisma.adapter })
}

// Initialize adapter (non-blocking)
if (!adapterPromise) {
  adapterPromise = (async () => {
    const adapterFactory = new PrismaMariaDb(process.env.DATABASE_URL!)
    return adapterFactory.connect()
  })()
  adapterPromise.then(adapter => {
    globalForPrisma.adapter = adapter
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient({ adapter })
    }
  })
}

// Export prisma with lazy initialization
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return async (...args: any[]) => {
      const client = await getPrismaClient()
      const method = (client as any)[prop]
      if (typeof method === 'function') {
        return method.apply(client, args)
      }
      return method
    }
  }
}) as PrismaClient
