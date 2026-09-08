/**
 * The profile's sections, named once.
 *
 * Both the portal sidebar and the profile page render this list — the sidebar as
 * navigation, the page as its panels. Keeping it in one place is what stops the
 * two drifting into disagreeing about what the profile contains, which is the
 * usual failure of a nav that mirrors a form.
 *
 * `covers` maps a panel to the completion sections it is responsible for, so a
 * tick beside "Personal details" means both identity *and* contact are done —
 * the page groups finer-grained scoring into coarser panels on purpose.
 */
export interface ProfilePanel {
  key: string
  label: string
  icon: string
  /** Section keys from `profileSections()` that this panel is responsible for. */
  covers: string[]
}

export const PROFILE_PANELS: ProfilePanel[] = [
  { key: 'personal', label: 'Personal details', icon: 'pi-id-card', covers: ['identity', 'contact'] },
  { key: 'qualifications', label: 'Qualifications', icon: 'pi-book', covers: ['qualifications'] },
  { key: 'employment', label: 'Employment history', icon: 'pi-briefcase', covers: ['employment'] },
  { key: 'skills', label: 'Skills & languages', icon: 'pi-star', covers: ['skills', 'languages'] }
]

/** Whether every section a panel is responsible for is complete. */
export function panelComplete(
  panel: ProfilePanel,
  sections: Array<{ key: string; complete: boolean }> | null | undefined
): boolean {
  if (!sections?.length) return false
  return panel.covers.every((key) => sections.find((s) => s.key === key)?.complete)
}
