import 'dotenv/config'
import { defineConfig, env } from '@prisma/config'

// Try to get DATABASE_URL from env() first, fallback to process.env
const databaseUrl = env('DATABASE_URL') || process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Please create a .env file with DATABASE_URL="mysql://user:password@localhost:3306/database_name"'
  )
}

// Validate database URL format for MySQL
if (!databaseUrl.startsWith('mysql://')) {
  throw new Error(
    `DATABASE_URL must start with "mysql://" for MySQL database.\n` +
    `Current value starts with: ${databaseUrl.substring(0, 20)}...\n` +
    `Please update your .env file to use a MySQL connection string like: mysql://user:password@localhost:3306/database_name`
  )
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl
  }
})

