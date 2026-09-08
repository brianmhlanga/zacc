import { prisma } from '../../../../utils/prisma'
import { scoreAndPersist } from '../../../../utils/recruitmentScoring'

/**
 * Re-runs the current scheme over a vacancy's existing applications.
 *
 * Needed because editing a scheme does not touch scores already recorded: a
 * console showing 200 applicants ranked under three different scheme versions is
 * not a ranking. Deliberately explicit rather than automatic on save — a bulk
 * rescore reorders a shortlist people may already be working from, and that is
 * not something to do as a side effect of a save someone might be mid-way
 * through.
 *
 * Auto-rejection is *not* re-applied here. A rule added after someone applied
 * should be reviewed by a person before it removes them, and reversing an
 * auto-rejection is far more expensive than making one.
 */
export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Vacancy id is required' })

    const job = await prisma.job.findUnique({
      where: { id },
      select: { id: true, title: true, scoringVersion: true }
    })
    if (!job) throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })

    // Withdrawn applications are excluded: rescoring one changes nothing anyone
    // will act on, and it would make the reported count misleading.
    const applications = await prisma.jobApplication.findMany({
      where: { jobId: id, isWithdrawn: false, mode: { not: 'LEGACY' } },
      select: { id: true, referenceNumber: true, finalScore: true },
      orderBy: { createdAt: 'asc' }
    })

    let rescored = 0
    let unchanged = 0
    let skipped = 0
    const failures: Array<{ reference: string | null; reason: string }> = []

    // Sequential on purpose. Each call is several queries plus a write, and a
    // vacancy with a thousand applicants would otherwise open a thousand
    // concurrent transactions against a single MariaDB pool.
    for (const a of applications) {
      try {
        // scoreAndPersist always loads the live scheme, which is exactly what a
        // rescore wants: the current rules, not the snapshot taken on submit.
        const result = await scoreAndPersist(a.id)
        if (!result) { skipped++; continue }
        const before = a.finalScore == null ? null : Math.round(Number(a.finalScore) * 100) / 100
        const after = Math.round(result.finalScore * 100) / 100
        if (before === after) unchanged++
        else rescored++
      } catch (e: any) {
        skipped++
        failures.push({ reference: a.referenceNumber, reason: e?.message ?? 'Unknown error' })
      }
    }

    await prisma.recruitmentAuditLog.create({
      data: {
        action: 'vacancy.rescored',
        entityType: 'Job',
        entityId: id,
        jobId: id,
        actorId: (session.user as any).id ?? null,
        actorName: (session.user as any).name ?? (session.user as any).email ?? null,
        actorRole: (session.user as any).role ?? null,
        summary:
          `Rescored ${applications.length} application(s) against scheme v${job.scoringVersion} — ` +
          `${rescored} changed, ${unchanged} unchanged, ${skipped} skipped`,
        detail: { total: applications.length, rescored, unchanged, skipped, failures } as any,
        ipAddress: getRequestIP(event, { xForwardedFor: true }) ?? null
      }
    })

    const parts = [`${rescored} score(s) changed`, `${unchanged} unchanged`]
    if (skipped) parts.push(`${skipped} skipped`)

    return {
      success: true,
      total: applications.length,
      rescored,
      unchanged,
      skipped,
      failures,
      message: applications.length
        ? `${parts.join(', ')}.`
        : 'No applications to rescore.'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[recruitment/vacancies] rescore failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to rescore applications' })
  }
})
