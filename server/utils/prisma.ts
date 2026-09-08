import { PrismaClient } from '../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { parseDatabaseUrl } from './databaseUrl'

let prismaInstance: PrismaClient | null = null
let adapterFactory: PrismaMariaDb | null = null

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
  // eslint-disable-next-line no-var
  var __prismaAdapterFactory: PrismaMariaDb | undefined
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
    // Guard `await prisma` and internal symbol probes (util.inspect, etc.) so they
    // do not resolve to a model proxy.
    if (prop === 'then' || typeof prop === 'symbol') return undefined

    // Client-level methods ($transaction, $queryRaw, $executeRaw, $connect, ...) must be
    // real functions bound to the resolved client. The model proxy below cannot serve
    // them: its target is a plain object, so `prisma.$transaction(...)` would throw
    // "is not a function" before ever reaching Prisma.
    //
    // NOTE: only the *interactive* form works — `prisma.$transaction(async (tx) => ...)`.
    // The array form cannot, because createModelProxy returns plain Promises rather than
    // the PrismaPromise instances Prisma needs in order to batch. Use `tx` in the callback.
    if (typeof prop === 'string' && prop.charCodeAt(0) === 36 /* '$' */) {
      return async (...args: any[]) => {
        const client = await getPrismaClient()
        const value = (client as any)[prop]
        if (typeof value !== 'function') return value
        return value.apply(client, args)
      }
    }

    // For nested model access (like prisma.user.findUnique)
    // Return a proxy that will resolve the client and call the method
    return createModelProxy(getPrismaClient(), prop as string)
  }
}) as PrismaClient
