declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string | null
    role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER' | 'REPORTS_ADMIN'
  }

  interface UserSession {
    user?: User
    loggedInAt?: Date | string
  }

  interface SecureSessionData {
    // Add any secure data that should only be accessible on server
  }
}

export {}
