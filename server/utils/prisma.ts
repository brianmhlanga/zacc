import { PrismaClient } from '../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

let prismaInstance: PrismaClient | null = null
let adapterFactory: PrismaMariaDb | null = null

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
  // eslint-disable-next-line no-var
  var __prismaAdapterFactory: PrismaMariaDb | undefined
}

function parseDatabaseUrl(url: string | undefined) {
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.')
  }
  
  // Parse mysql://user:password@host:port/database or mysql://user@host:port/database
  // Try with password first
  let match = url.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/)
  if (match) {
    const [, user, password, host, port, database] = match
    return {
      host,
      port: parseInt(port, 10),
      user,
      password,
      database
    }
  }
  
  // Try without password
  match = url.match(/^mysql:\/\/([^@]+)@([^:]+):(\d+)\/(.+)$/)
  if (match) {
    const [, user, host, port, database] = match
    return {
      host,
      port: parseInt(port, 10),
      user,
      password: undefined,
      database
    }
  }
  
  throw new Error(`Invalid DATABASE_URL format: ${url}. Expected format: mysql://user:password@host:port/database or mysql://user@host:port/database`)
}

function getAdapterFactory(): PrismaMariaDb {
  if (process.env.NODE_ENV !== 'production' && global.__prismaAdapterFactory) {
    return global.__prismaAdapterFactory
  }

  if (!adapterFactory) {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set. Please create a .env file with DATABASE_URL="mysql://user:password@host:port/database"')
    }
    // Parse the connection string into a PoolConfig object
    const poolConfig = parseDatabaseUrl(dbUrl)
    adapterFactory = new PrismaMariaDb(poolConfig)
  }

  if (process.env.NODE_ENV !== 'production') {
    global.__prismaAdapterFactory = adapterFactory
  }

  return adapterFactory
}

async function getPrismaClient(): Promise<PrismaClient> {
  if (prismaInstance) {
    return prismaInstance
  }

  if (process.env.NODE_ENV !== 'production' && global.__prisma) {
    prismaInstance = global.__prisma
    return prismaInstance
  }

  // Pass the factory, not the connected adapter
  const factory = getAdapterFactory()
  prismaInstance = new PrismaClient({ adapter: factory })
  
  if (process.env.NODE_ENV !== 'production') {
    global.__prisma = prismaInstance
  }
  
  return prismaInstance
}

// Create a proxy that handles nested property access (like prisma.user.findUnique)
function createModelProxy(clientPromise: Promise<PrismaClient>, prop: string) {
  return new Proxy({}, {
    get(_target, subProp) {
      return async (...args: any[]) => {
        const client = await clientPromise
        const model = (client as any)[prop]
        if (model && typeof model[subProp] === 'function') {
          return model[subProp].apply(model, args)
        }
        return model?.[subProp]
      }
    }
  })
}

// Export prisma with lazy initialization
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    // For nested model access (like prisma.user.findUnique)
    // Return a proxy that will resolve the client and call the method
    return createModelProxy(getPrismaClient(), prop as string)
  }
}) as PrismaClient
