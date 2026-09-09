import { z } from 'zod'
import { prisma } from '../../../../utils/prisma'

/**
 * Turns a vacancy's test mode on or off.
 *
 * Its own route rather than a widening of `scheme.put.ts`, because this switch
 * decides who can see a public advert and carries three guards that have
 * nothing to do with scoring. It rides the existing
 * `['/api/recruitment/vacancies', 'jobs']` mapping in the permission
 * middleware, so a PUT already requires the `jobs` update grant.
 *
 * Every toggle is audited. At an anti-corruption commission, a switch that
 * changes the visibility of a public advert belongs in the same record as the
 * stage moves and the exports.
 */
const bodySchema = z.object({
  isTestMode: z.boolean(),
  /**
   * Required to hide a vacancy that candidates are already part-way through.
   * Forces the caller to have been shown the count and chosen anyway.
   */
  acknowledgeInFlight: z.boolean().optional().default(false)
})

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Vacancy id is required' })

    const { isTestMode, acknowledgeInFlight } = bodySchema.parse(await readBody(event))

    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true, title: true, isTestMode: true, isPublished: true,
        _count: { select: { applications: true, drafts: true } }
      }
    })
    if (!job) throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })

    if (job.isTestMode === isTestMode) {
      return { success: true, isTestMode, message: 'No change — the vacancy is already in that state.' }
    }

    if (isTestMode) {
      // 1. An unpublished vacancy is invisible to everyone, staff included.
      //    Allowing this produces a bug report that reads "test mode is broken".
      if (!job.isPublished) {
        throw createError({
          statusCode: 409,
          statusMessage:
            'Publish the vacancy first. Test mode makes a published vacancy visible only to ' +
            'signed-in staff — on an unpublished one there is nothing for anyone to see.'
        })
      }

      // 2. Hiding a vacancy strands anyone mid-application: the wizard 404s and
      //    they cannot read back or submit answers they have already written.
      //    Candidates who already SUBMITTED are unaffected — their tracking
      //    pages are candidateId-scoped and deliberately ungated.
      const inFlight = job._count.drafts
      if (inFlight > 0 && !acknowledgeInFlight) {
        throw createError({
          statusCode: 409,
          statusMessage:
            `${inFlight} candidate(s) have part-finished applications on this vacancy. ` +
            'Switching to test mode hides it from them — they will not be able to reopen ' +
            'their answers or submit. Confirm to proceed anyway.',
          data: { reason: 'in_flight_drafts', count: inFlight }
        })
      }
    } else {
      // 3. Turning test mode OFF with rehearsal applications attached would
      //    promote them to real — and, worse, permanently lock the scoring
      //    scheme: `canEditScheme` is `applications === 0`. The rehearsal that
      //    exists to catch scheme problems would prevent fixing what it found.
      //    A test vacancy is a throwaway; that is made structural here.
      if (job._count.applications > 0) {
        throw createError({
          statusCode: 409,
          statusMessage:
            `${job._count.applications} application(s) were submitted while this vacancy was ` +
            'in test mode. Taking it live would treat them as real and would permanently lock ' +
            'its scoring criteria. Delete this vacancy and create the real one, or delete ' +
            'those applications first.',
          data: { reason: 'test_applications_exist', count: job._count.applications }
        })
      }
    }

    await prisma.job.update({ where: { id }, data: { isTestMode } })

    await prisma.recruitmentAuditLog.create({
      data: {
        action: isTestMode ? 'vacancy.test_mode_on' : 'vacancy.test_mode_off',
        entityType: 'Job',
        entityId: id,
        jobId: id,
        actorId: (session.user as any).id ?? null,
        actorName: (session.user as any).name ?? (session.user as any).email ?? null,
        actorRole: (session.user as any).role ?? null,
        summary: isTestMode
          ? `Put "${job.title}" into test mode — visible on the careers site to signed-in staff only`
          : `Took "${job.title}" out of test mode — now visible to the public`,
        detail: {
          drafts: job._count.drafts,
          applications: job._count.applications,
          acknowledgedInFlight: isTestMode ? acknowledgeInFlight : undefined
        } as any,
        ipAddress: getRequestIP(event, { xForwardedFor: true }) ?? null
      }
    })

    return {
      success: true,
      isTestMode,
      message: isTestMode
        ? 'Test mode is on. Only signed-in staff can see this vacancy on the careers site.'
        : 'Test mode is off. This vacancy is now visible to the public.'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: error.issues[0]?.message ?? 'Validation error' })
    }
    console.error('[recruitment/vacancies] test-mode toggle failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not change test mode' })
  }
})
