import { prisma } from '../../../utils/prisma'

/**
 * The signed-in reviewer's own queue.
 *
 * Scoped to vacancies this user sits on the panel for — a reviewer should not be
 * able to enumerate applications for a competition they are not part of, even
 * with a valid admin session.
 */
export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const memberships = await prisma.vacancyPanelMember.findMany({
      where: { userId: session.user.id },
      select: {
        jobId: true, role: true,
        canSeeIdentity: true, canSeeDemographics: true, canSeeOtherScores: true,
        job: {
          select: {
            id: true, title: true, department: true, closingDate: true,
            criteria: { where: { isPanelScored: true }, select: { id: true } }
          }
        }
      }
    })

    if (!memberships.length) return { assignments: [], panelCount: 0 }

    const jobIds = memberships.map((m: any) => m.jobId)

    // Only applications that have reached a stage where a panel is expected to
    // score. Reviewing something still in intake screening wastes their time.
    const applications = await prisma.jobApplication.findMany({
      where: {
        jobId: { in: jobIds },
        isWithdrawn: false,
        isAutoRejected: false,
        stage: { category: { in: ['ASSESSMENT', 'INTERVIEW'] } }
      },
      select: {
        id: true, jobId: true, referenceNumber: true,
        firstName: true, lastName: true, name: true,
        gender: true, highestQualification: true, totalYearsExperience: true,
        finalScore: true, submittedAt: true,
        stage: { select: { internalLabel: true, colorHex: true } },
        panelScores: {
          where: { reviewerId: session.user.id },
          select: { criterionId: true, isSubmitted: true }
        }
      },
      orderBy: { submittedAt: 'asc' }
    })

    const byJob = new Map(memberships.map((m: any) => [m.jobId, m]))

    const assignments = applications.map((a: any) => {
      const m: any = byJob.get(a.jobId)
      const expected = m.job.criteria.length
      const submitted = a.panelScores.filter((s: any) => s.isSubmitted).length

      // Strip anything this reviewer is not cleared to see, before it leaves
      // the server. See server/utils/applicationProjection.ts.
      const row: any = {
        id: a.id,
        jobId: a.jobId,
        vacancy: m.job.title,
        department: m.job.department,
        stage: a.stage,
        myRole: m.role,
        expectedCriteria: expected,
        submittedCriteria: submitted,
        isComplete: expected > 0 && submitted >= expected,
        submittedAt: a.submittedAt
      }

      if (m.canSeeIdentity) {
        row.displayName = [a.firstName, a.lastName].filter(Boolean).join(' ') || a.name
        row.referenceNumber = a.referenceNumber
      } else {
        row.displayName = `Candidate ${String(a.id).slice(-6).toUpperCase()}`
      }
      if (m.canSeeDemographics) row.gender = a.gender
      if (m.canSeeOtherScores) row.finalScore = a.finalScore

      row.highestQualification = a.highestQualification
      row.totalYearsExperience = a.totalYearsExperience
      return row
    })

    return {
      assignments,
      panelCount: memberships.length,
      vacancies: memberships.map((m: any) => ({ id: m.job.id, title: m.job.title, role: m.role }))
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[recruitment/panel] load failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load your panel queue' })
  }
})
