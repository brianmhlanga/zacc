# Authentication Setup Guide

This project uses `nuxt-auth-utils` for authentication with bcrypt for password hashing.

## Setup Steps

### 1. Environment Variables

Create a `.env` file in the root directory with the following:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/zacc"

# Session Password (required for nuxt-auth-utils)
# Generate a secure random string with at least 32 characters
# You can generate one with: openssl rand -base64 32
NUXT_SESSION_PASSWORD="your-session-password-here-minimum-32-characters-long"
```

**Important**: The `NUXT_SESSION_PASSWORD` must be at least 32 characters long. If not set, nuxt-auth-utils will generate one automatically in development mode, but you should set it explicitly for production.

### 2. Database Setup

1. Make sure your database is running and accessible
2. Run Prisma migrations:
   ```bash
   npm run prisma:migrate
   ```
   Or push the schema directly:
   ```bash
   npm run prisma:push
   ```

### 3. Seed Admin User

Run the seed script to create the default admin user:

```bash
npm run prisma:seed
```

This will create an admin user with:
- **Email**: `admin@zacc.gov.zw`
- **Password**: `admin123`
- **Role**: `SUPER_ADMIN`

⚠️ **Important**: Change the password immediately after first login!

### 4. Start the Development Server

```bash
npm run dev
```

### 5. Login

Navigate to `/admin/login` and use the credentials:
- Email: `admin@zacc.gov.zw`
- Password: `admin123`

## Authentication Flow

1. **Login**: User submits credentials → `/api/auth/login` → Validates with bcrypt → Creates session
2. **Session**: Stored in encrypted cookie, accessible via `useUserSession()` composable
3. **Protected Routes**: Middleware checks authentication for `/admin/*` routes
4. **Logout**: Calls `/api/auth/logout` → Clears session → Redirects to login

## API Endpoints

- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - Clear user session

## Composable Usage

```vue
<script setup>
const { loggedIn, user, session, fetch, clear } = useUserSession()

// Check if user is logged in
if (loggedIn.value) {
  console.log('User:', user.value)
}

// Manually fetch session
await fetch()

// Logout
await clear()
</script>
```

## User Roles

- `SUPER_ADMIN` - Full access
- `ADMIN` - Administrative access
- `EDITOR` - Content editing access
- `VIEWER` - Read-only access

## Security Notes

- Passwords are hashed using bcrypt (10 rounds)
- Sessions are encrypted and stored in secure cookies
- Session expires after 7 days (configurable in `nuxt.config.ts`)
- Protected routes require authentication via middleware
