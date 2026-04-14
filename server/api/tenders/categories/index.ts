import { z } from 'zod'
import { prisma } from '../../../utils/prisma'

const schema = z.object({ name: z.string().min(2), description: z.string().optional().nullable(), isActive: z.boolean().default(true) })

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  if (event.method === 'GET') {
    let categories = await prisma.tenderCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    // Bootstrap default categories so tender creation dropdown is never empty.
    if (categories.length === 0) {
      const defaultNames = [
        'General Goods',
        'Office Supplies',
        'Stationery',
        'Printing Services',
        'Furniture',
        'Computer Hardware',
        'Computer Software',
        'Network Equipment',
        'ICT Services',
        'Telecommunications',
        'Internet Services',
        'Data Center Services',
        'Cloud Services',
        'Cybersecurity Services',
        'Electrical Works',
        'Civil Works',
        'Building Construction',
        'Building Maintenance',
        'Plumbing Services',
        'HVAC Services',
        'Road Works',
        'Water Infrastructure',
        'Sanitation Services',
        'Energy Services',
        'Solar Equipment',
        'Generators',
        'Vehicles',
        'Vehicle Maintenance',
        'Spare Parts',
        'Fuel Supply',
        'Transport Services',
        'Logistics Services',
        'Courier Services',
        'Security Services',
        'Cleaning Services',
        'Waste Management',
        'Catering Services',
        'Event Management',
        'Accommodation Services',
        'Travel Services',
        'Consultancy Services',
        'Legal Services',
        'Audit Services',
        'Accounting Services',
        'Human Resource Services',
        'Training Services',
        'Research Services',
        'Media Services',
        'Advertising Services',
        'Public Relations Services',
        'Health Services',
        'Medical Supplies',
        'Laboratory Supplies',
        'Protective Equipment',
        'Agricultural Supplies',
        'Food Supplies',
        'Library Materials',
        'Insurance Services',
        'Banking Services',
        'General Services'
      ]
      await prisma.tenderCategory.createMany({
        data: defaultNames.map((name) => ({ name, isActive: true })),
        skipDuplicates: true
      })
      categories = await prisma.tenderCategory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      })
    }

    return categories
  }

  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const data = schema.parse(await readBody(event))
  return await prisma.tenderCategory.create({ data })
})
