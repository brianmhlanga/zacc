/**
 * Access control for uploaded files that contain personal data.
 *
 * `server/api/uploads/[...path].get.ts` historically served every file with no
 * authentication and a one-year public cache header. That is fine for a news
 * image and wrong for a CV, a national-ID scan or a certified certificate.
 *
 * Rather than lock down the whole uploads root — which would break news images,
 * commissioner photos and the media library — access is gated by path prefix.
 * Recruitment files are written under `recruitment/` from the outset precisely so
 * they fall inside this fence.
 */
import type { H3Event } from 'h3'
import { getQuery } from 'h3'
import type { User } from '#auth-utils'
import { verifyFileSignature } from './signedFileUrl'
import {
  getPermissionsForUser,
  hasPermissionForUser,
  type PermissionModuleKey
} from './permissions'

/**
 * Path prefixes (relative to the uploads root) that require authorisation.
 *
 * KNOWN GAP: corruption-report attachments and whistleblower voice notes are
 * written to the *flat* uploads root by `server/api/public/reports/index.post.ts`
 * (`/uploads/<file>`), not under a prefix, so they are not covered here. Fencing
 * the flat root would also fence every public image. Closing that gap needs those
 * files moved into `reports/` and their stored `fileUrl`/`audioUrl` values
 * migrated — tracked separately from the recruitment work.
 */
export const PROTECTED_PREFIXES = ['recruitment/', 'applications/', 'reports/'] as const

/** Admin modules whose `view` grant confers access to protected recruitment files. */
const VIEWER_MODULES: PermissionModuleKey[] = ['jobs', 'reports']

export function isProtectedUploadPath(relativePath: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => relativePath.startsWith(prefix))
}

/**
 * Decides whether this request may read a protected file.
 *
 * Callers must translate `false` into a **404, not a 403** — a 403 confirms the
 * file exists, which is itself a disclosure when the path embeds a candidate id.
 */
export async function canAccessProtectedFile(
  event: H3Event,
  relativePath: string,
  user: User | null | undefined
): Promise<boolean> {
  // 1. A valid signed URL. This is what lets admin pages use plain <a href> /
  //    <img src> and lets PDF dossiers embed working links, neither of which can
  //    attach an Authorization header.
  const query = getQuery(event)
  const exp = typeof query.exp === 'string' ? query.exp : null
  const sig = typeof query.sig === 'string' ? query.sig : null
  if (verifyFileSignature(relativePath, exp, sig)) return true

  // 2. An authenticated admin with a relevant view grant.
  if (user) {
    if (user.role === 'SUPER_ADMIN') return true
    const permissions = await getPermissionsForUser(user.id)
    if (VIEWER_MODULES.some((m) => hasPermissionForUser(user, m, 'view', permissions))) {
      return true
    }
  }

  // 3. Candidate ownership is added alongside candidate sessions; until then a
  //    candidate reaches their own documents through a signed URL issued by the
  //    endpoint that listed them.
  return false
}
