import { prisma } from '~/utils/prisma'

export const usePrisma = () => {
  return prisma
}
