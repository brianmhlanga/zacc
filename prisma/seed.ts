import 'dotenv/config'
import { PrismaClient } from './generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcrypt'

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

async function main() {
  console.log('🌱 Starting database seed...')

  // Parse connection string and create adapter factory
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set. Please create a .env file with DATABASE_URL="mysql://user:password@host:port/database"')
  }
  
  const poolConfig = parseDatabaseUrl(dbUrl)
  const adapterFactory = new PrismaMariaDb(poolConfig)
  const prisma = new PrismaClient({
    adapter: adapterFactory,
    log: ['query', 'info', 'warn', 'error']
  })

  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@zacc.gov.zw' }
    })

    if (existingAdmin) {
      console.log('✅ Admin user already exists, skipping seed...')
      return
    }

    // Hash the default admin password
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@zacc.gov.zw',
        name: 'Administrator',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true
      }
    })

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email: admin@zacc.gov.zw')
    console.log('🔑 Password: admin123')
    console.log('⚠️  Please change the password after first login!')
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
