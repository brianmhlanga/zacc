import { revokeCandidateSession } from '../../../utils/candidateAuth'

export default defineEventHandler(async (event) => {
  await revokeCandidateSession(event)
  return { success: true }
})
