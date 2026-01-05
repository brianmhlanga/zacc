import { PrismaClient } from '../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

let adapterPromise: Promise<any> | null = null

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
  // eslint-disable-next-line no-var
  var __prismaAdapter: any
}

async function getPrismaClient(): Promise<PrismaClient> {
  if (process.env.NODE_ENV !== 'production' && global.__prisma) {
    return global.__prisma
  }

  if (!global.__prismaAdapter) {
    if (!adapterPromise) {
      const adapterFactory = new PrismaMariaDb(process.env.DATABASE_URL!)
      adapterPromise = adapterFactory.connect()
    }
    global.__prismaAdapter = await adapterPromise
  }
  
  const client = new PrismaClient({ adapter: global.__prismaAdapter })
  
  if (process.env.NODE_ENV !== 'production') {
    global.__prisma = client
  }
  
  return client
}

// Initialize adapter (non-blocking)
if (!adapterPromise) {
  adapterPromise = (async () => {
    const adapterFactory = new PrismaMariaDb(process.env.DATABASE_URL!)
    return adapterFactory.connect()
  })()
  adapterPromise.then(adapter => {
    global.__prismaAdapter = adapter
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
