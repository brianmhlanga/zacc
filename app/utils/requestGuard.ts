/**
 * Guards a sequence of overlapping requests so only the newest result is applied.
 *
 * Two mechanisms, both required. Aborting covers requests still in flight. The
 * sequence counter covers a response that had already come back over the wire
 * before the abort landed — that one resolves normally and would otherwise
 * overwrite a newer result.
 *
 * The failure this prevents is a search box painting stale rows: on a
 * shortlisting table those rows carry scores a reviewer may act on.
 */

export type GuardStatus = 'applied' | 'superseded' | 'aborted' | 'failed'

export interface GuardedRun<T> {
  status: GuardStatus
  value?: T
  error?: unknown
}

export interface RequestGuard {
  run<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<GuardedRun<T>>
  cancel(): void
}

export function createRequestGuard(): RequestGuard {
  let controller: AbortController | null = null
  let seq = 0

  return {
    async run<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<GuardedRun<T>> {
      controller?.abort()
      controller = new AbortController()
      const mySeq = ++seq

      try {
        const value = await fn(controller.signal)
        if (mySeq !== seq) return { status: 'superseded' }
        return { status: 'applied', value }
      } catch (error: any) {
        // An aborted request was superseded on purpose; it is not an error the
        // caller should surface.
        if (error?.name === 'AbortError') return { status: 'aborted' }
        if (mySeq !== seq) return { status: 'superseded' }
        return { status: 'failed', error }
      }
    },

    cancel() {
      controller?.abort()
      // Bump the sequence so an in-flight response cannot apply after teardown.
      seq++
    }
  }
}
