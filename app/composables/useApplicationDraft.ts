/**
 * Debounced autosave for the application wizard.
 *
 * Saves to the server (so a draft survives a device change) and mirrors to
 * localStorage as a fallback for the case that matters most to a candidate on a
 * shared connection: the request failed and they do not yet know it.
 */
export function useApplicationDraft(slug: string, answers: Ref<any>, currentStep: Ref<number>) {
  const savedAt = ref<Date | null>(null)
  const saving = ref(false)
  const dirty = ref(false)
  const error = ref<string | null>(null)
  const version = ref<number | undefined>(undefined)

  const storageKey = `zacc.application.${slug}`
  let timer: ReturnType<typeof setTimeout> | null = null

  /** Never faster than this, so autosave cannot trip the rate limiter. */
  const MIN_INTERVAL_MS = 3000
  let lastSave = 0

  const mirrorLocally = () => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        answers: answers.value, currentStep: currentStep.value, at: Date.now()
      }))
    } catch {
      // Private mode, quota, or storage disabled — the server copy is primary.
    }
  }

  const readLocal = () => {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const clearLocal = () => {
    if (!import.meta.client) return
    try { localStorage.removeItem(storageKey) } catch { /* ignore */ }
  }

  const save = async (immediate = false) => {
    if (!immediate && Date.now() - lastSave < MIN_INTERVAL_MS) return
    saving.value = true
    error.value = null
    mirrorLocally()
    try {
      const res = await $fetch<any>(`/api/public/vacancies/${slug}/draft`, {
        method: 'PUT',
        body: { answers: answers.value, currentStep: currentStep.value, version: version.value }
      })
      version.value = res.version
      savedAt.value = new Date(res.savedAt)
      dirty.value = false
      lastSave = Date.now()
    } catch (e: any) {
      // Surfaced in the UI rather than swallowed: a candidate who thinks their
      // work is saved and loses it has a much worse day than one who is warned.
      error.value = e.data?.statusMessage || 'Could not save your progress'
    } finally {
      saving.value = false
    }
  }

  const scheduleSave = () => {
    dirty.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => save(), 2500)
  }

  const flush = async () => {
    if (timer) clearTimeout(timer)
    if (dirty.value) await save(true)
  }

  if (import.meta.client) {
    // A tab closed mid-application still gets one last attempt.
    const onLeave = () => {
      if (!dirty.value) return
      mirrorLocally()
      navigator.sendBeacon?.(
        `/api/public/vacancies/${slug}/draft`,
        new Blob(
          [JSON.stringify({ answers: answers.value, currentStep: currentStep.value })],
          { type: 'application/json' }
        )
      )
    }
    window.addEventListener('beforeunload', onLeave)
    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', onLeave)
      if (timer) clearTimeout(timer)
    })
  }

  return { savedAt, saving, dirty, error, version, scheduleSave, save, flush, readLocal, clearLocal }
}
