import { PrismaClient } from './generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcrypt'

async function main() {
  console.log('🌱 Starting database seed...')

  // Create adapter factory and connect
  const adapterFactory = new PrismaMariaDb(process.env.DATABASE_URL!)
  const adapter = await adapterFactory.connect()
  const prisma = new PrismaClient({
    adapter,
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
    await adapter.dispose()
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
