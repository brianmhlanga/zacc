/**
 * Candidate session state for the careers portal.
 *
 * The session itself lives in an httpOnly cookie the browser cannot read, so
 * this holds only what the server reports back from /me.
 */
export interface CandidateSession {
  id: string
  email: string
  firstName: string
  lastName: string
  emailVerified: boolean
  profileCompletion: number
  /** Per-section completion, for the portal sidebar's ticks. */
  profileSections: Array<{ key: string; complete: boolean }>
  applicationCount: number
  draftCount: number
}

export function useCandidateAuth() {
  const candidate = useState<CandidateSession | null>('candidate', () => null)
  const loaded = useState<boolean>('candidate-loaded', () => false)

  const isSignedIn = computed(() => Boolean(candidate.value))
  const fullName = computed(() =>
    candidate.value ? `${candidate.value.firstName} ${candidate.value.lastName}`.trim() : ''
  )

  /** Loads the session once per navigation; safe to call from many components. */
  const fetchSession = async (force = false) => {
    if (loaded.value && !force) return candidate.value
    try {
      const res = await $fetch<{ candidate: CandidateSession | null }>('/api/public/candidates/me')
      candidate.value = res.candidate
    } catch {
      candidate.value = null
    } finally {
      loaded.value = true
    }
    return candidate.value
  }

  const login = async (email: string, password: string) => {
    await $fetch('/api/public/candidates/login', { method: 'POST', body: { email, password } })
    await fetchSession(true)
    return candidate.value
  }

  const register = async (payload: Record<string, unknown>) =>
    $fetch<{ success: boolean; message: string }>('/api/public/candidates/register', {
      method: 'POST',
      body: payload
    })

  const logout = async () => {
    await $fetch('/api/public/candidates/logout', { method: 'POST' }).catch(() => {})
    candidate.value = null
    loaded.value = true
    await navigateTo('/careers')
  }

  /** Sends the candidate to sign in, remembering where they were headed. */
  const requireSignIn = async (returnTo?: string) => {
    await fetchSession()
    if (candidate.value) return true
    await navigateTo({
      path: '/candidate/login',
      query: returnTo ? { returnTo } : undefined
    })
    return false
  }

  return { candidate, isSignedIn, fullName, fetchSession, login, register, logout, requireSignIn }
}
