import 'dotenv/config'
import { PrismaClient } from './generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcrypt'

function parseDatabaseUrl(url: string | undefined) {
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.')
  }
  
  // Parse mysql://user:password@host:port/database or mysql://user@host:port/database
  // Try with password first
  let match = url.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/)
  if (match) {
    const [, user, password, host, port, database] = match
    return {
      host,
      port: parseInt(port, 10),
      user,
      password,
      database
    }
  }
  
  // Try without password
  match = url.match(/^mysql:\/\/([^@]+)@([^:]+):(\d+)\/(.+)$/)
  if (match) {
    const [, user, host, port, database] = match
    return {
      host,
      port: parseInt(port, 10),
      user,
      password: undefined,
      database
    }
  }
  
  throw new Error(`Invalid DATABASE_URL format: ${url}. Expected format: mysql://user:password@host:port/database or mysql://user@host:port/database`)
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Parse connection string and create adapter factory
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set. Please create a .env file with DATABASE_URL="mysql://user:password@host:port/database"')
  }
  
  const poolConfig = parseDatabaseUrl(dbUrl)
  const adapterFactory = new PrismaMariaDb(poolConfig)
  const prisma = new PrismaClient({
    adapter: adapterFactory,
    log: ['query', 'info', 'warn', 'error']
  })

  try {
    // Hash the default admin password (strong password)
    const hashedPassword = await bcrypt.hash('Zacc@Admin2024!Secure', 10)

    // Upsert admin user - always update password when seed runs
    const admin = await prisma.user.upsert({
      where: { email: 'admin@zacc.gov.zw' },
      update: {
        name: 'Administrator',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true
      },
      create: {
        email: 'admin@zacc.gov.zw',
        name: 'Administrator',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true
      }
    })

    console.log('✅ Admin user updated successfully!')
    console.log('📧 Email: admin@zacc.gov.zw')
    console.log('🔑 Password: Zacc@Admin2024!Secure')
    console.log('⚠️  Password has been reset to the seed value!')

    // Seed Services (What We Do)
    console.log('\n🌱 Seeding services...')
    
    const services = [
      {
        title: 'Public Education',
        description: 'Mobilisation of anti-corruption awareness materials, developing anti-corruption education curricula, and raising anti-corruption awareness among the public and institutions. We conduct educational campaigns, workshops, and community outreach initiatives to foster a culture of integrity across all sectors of society.',
        icon: 'education',
        iconColor: 'green',
        order: 1,
        isVisible: true
      },
      {
        title: 'Corruption Prevention',
        description: 'Conducting compliance, systems and processes review assessments in public and private institutions. We monitor compliance, promote internal anti-corruption and anti-fraud policies, and make recommendations to enhance integrity, accountability and prevent improper conduct.',
        icon: 'prevention',
        iconColor: 'gold',
        order: 2,
        isVisible: true
      },
      {
        title: 'Investigations',
        description: 'Conduct investigations on complaints alleging any form of corruption and mandate offences. We create and manage databases for criminals under ZACC investigations, refer cases to the Zimbabwe Republic Police, and provide intelligence on corruption and corruption-related offences in public and private sectors.',
        icon: 'investigations',
        iconColor: 'green',
        order: 3,
        isVisible: true
      },
      {
        title: 'Asset Recovery',
        description: 'Profile and investigate unexplained wealth and proceeds of crime. We draft case files for confiscation and unexplained wealth orders, refer case files to National Prosecuting Authority for recovery of proceeds of crime, execute confiscation orders, and manage seized assets on behalf of the Commission.',
        icon: 'legal',
        iconColor: 'gold',
        order: 4,
        isVisible: true
      },
      {
        title: 'Legal Services',
        description: 'Provide corporate secretarial duties, manage legal contracts and external legal service providers. We provide legal advice to departments, management and Commission, draft policy recommendations for Government approval, and liaise with the National Prosecution Authority for prosecution of cases.',
        icon: 'legal',
        iconColor: 'green',
        order: 5,
        isVisible: true
      }
    ]

    let servicesCreated = 0
    let servicesUpdated = 0
    for (const serviceData of services) {
      const existing = await prisma.service.findFirst({
        where: { title: serviceData.title }
      })

      if (!existing) {
        await prisma.service.create({
          data: serviceData
        })
        servicesCreated++
        console.log(`  ✅ Created service: ${serviceData.title}`)
      } else {
        // Update existing service
        await prisma.service.update({
          where: { id: existing.id },
          data: {
            description: serviceData.description,
            icon: serviceData.icon,
            iconColor: serviceData.iconColor,
            order: serviceData.order,
            isVisible: serviceData.isVisible
          }
        })
        servicesUpdated++
        console.log(`  🔄 Updated service: ${serviceData.title}`)
      }
    }
    
    // Remove "Prosecution" service if it exists
    const prosecutionService = await prisma.service.findFirst({
      where: { title: 'Prosecution' }
    })
    if (prosecutionService) {
      await prisma.service.delete({
        where: { id: prosecutionService.id }
      })
      console.log(`  🗑️  Deleted service: Prosecution`)
    }

    console.log(`\n✅ Services seeding complete! Created ${servicesCreated} new service(s), updated ${servicesUpdated} existing service(s).`)

    // Seed Hero Slides
    console.log('\n🌱 Seeding hero slides...')
    const heroSlides = [
      {
        title: 'Zimbabwe Flag',
        subtitle: 'Integrity First',
        description: 'Promoting integrity and combating corruption across Zimbabwe',
        imageUrl: '/flag.jpg',
        order: 1,
        isActive: true
      },
      {
        title: 'Teamwork',
        subtitle: 'Working Together',
        description: 'Collaborating with citizens and institutions to promote accountability',
        imageUrl: '/businessman.jpg',
        order: 2,
        isActive: true
      },
      {
        title: 'Justice',
        subtitle: 'Upholding the Law',
        description: 'Ensuring justice through enforcement and prosecution',
        imageUrl: '/gavel.jpg',
        order: 3,
        isActive: true
      },
      {
        title: 'Asset Recovery',
        subtitle: 'Recovering Stolen Assets',
        description: 'Pursuing asset recovery to return stolen resources to the state',
        imageUrl: '/gavelmoney.jpg',
        order: 4,
        isActive: true
      }
    ]

    let heroSlidesCreated = 0
    for (const slideData of heroSlides) {
      const existing = await prisma.heroSlide.findFirst({
        where: { imageUrl: slideData.imageUrl }
      })

      if (!existing) {
        await prisma.heroSlide.create({
          data: slideData
        })
        heroSlidesCreated++
        console.log(`  ✅ Created hero slide: ${slideData.title}`)
      } else {
        console.log(`  ⏭️  Hero slide already exists: ${slideData.title}`)
      }
    }
    console.log(`✅ Hero slides seeding complete! Created ${heroSlidesCreated} new slide(s).`)

    // Seed Statistics
    console.log('\n🌱 Seeding statistics...')
    const statistics = [
      // Hero section mini stats
      {
        label: 'Tips Received',
        value: 1200,
        suffix: '+',
        color: 'green',
        section: 'hero',
        order: 1,
        isVisible: true
      },
      {
        label: 'Cases Concluded',
        value: 480,
        suffix: '+',
        color: 'gold',
        section: 'hero',
        order: 2,
        isVisible: true
      },
      {
        label: 'Assets Recovered',
        value: 25,
        prefix: '$',
        suffix: 'm',
        color: 'black',
        section: 'hero',
        order: 3,
        isVisible: true
      },
      // Main statistics section
      {
        label: 'Constituency & Executive Projects Tracked',
        value: 8641,
        section: 'homepage',
        order: 1,
        isVisible: true
      },
      {
        label: 'Prevention Activities',
        value: 2605,
        section: 'homepage',
        order: 2,
        isVisible: true
      },
      {
        label: 'Anti-Corruption & Transparency Units',
        value: 600,
        section: 'homepage',
        order: 3,
        isVisible: true
      },
      {
        label: 'Participants Trained',
        value: 12904,
        section: 'homepage',
        order: 4,
        isVisible: true
      },
      {
        label: 'Students Anti-Corruption Clubs',
        value: 1028,
        section: 'homepage',
        order: 5,
        isVisible: true
      },
      {
        label: 'Collaborations & Partnerships',
        value: 111,
        section: 'homepage',
        order: 6,
        isVisible: true
      },
      // About section mini stats
      {
        label: 'Years Serving Zimbabwe',
        value: 20,
        suffix: '+',
        color: 'green',
        section: 'about',
        order: 1,
        isVisible: true
      },
      {
        label: 'Institutions Engaged',
        value: 300,
        suffix: '+',
        color: 'gold',
        section: 'about',
        order: 2,
        isVisible: true
      },
      {
        label: 'Public Education Forums',
        value: 120,
        suffix: '+',
        color: 'black',
        section: 'about',
        order: 3,
        isVisible: true
      },
      // Statistics page stats (using some from homepage and adding more)
      {
        label: 'Constituency & Executive Projects Tracked',
        value: 8641,
        section: 'statistics',
        order: 1,
        isVisible: true
      },
      {
        label: 'Prevention Activities',
        value: 2605,
        section: 'statistics',
        order: 2,
        isVisible: true
      },
      {
        label: 'Anti-Corruption & Transparency Units',
        value: 600,
        section: 'statistics',
        order: 3,
        isVisible: true
      },
      {
        label: 'Participants Trained',
        value: 12904,
        section: 'statistics',
        order: 4,
        isVisible: true
      },
      {
        label: 'Students Anti-Corruption Clubs',
        value: 1028,
        section: 'statistics',
        order: 5,
        isVisible: true
      },
      {
        label: 'Collaborations & Partnerships',
        value: 111,
        section: 'statistics',
        order: 6,
        isVisible: true
      },
      {
        label: 'Tips Received',
        value: 1200,
        suffix: '+',
        section: 'statistics',
        order: 7,
        isVisible: true
      },
      {
        label: 'Cases Concluded',
        value: 480,
        suffix: '+',
        section: 'statistics',
        order: 8,
        isVisible: true
      },
      {
        label: 'Assets Recovered',
        value: 25,
        prefix: '$',
        suffix: 'm',
        section: 'statistics',
        order: 9,
        isVisible: true
      },
      {
        label: 'Years Serving Zimbabwe',
        value: 20,
        suffix: '+',
        section: 'statistics',
        order: 10,
        isVisible: true
      },
      {
        label: 'Institutions Engaged',
        value: 300,
        suffix: '+',
        section: 'statistics',
        order: 11,
        isVisible: true
      },
      {
        label: 'Public Education Forums',
        value: 120,
        suffix: '+',
        section: 'statistics',
        order: 12,
        isVisible: true
      }
    ]

    let statsCreated = 0
    for (const statData of statistics) {
      const existing = await prisma.statistic.findFirst({
        where: {
          label: statData.label,
          section: statData.section
        }
      })

      if (!existing) {
        await prisma.statistic.create({
          data: statData
        })
        statsCreated++
        console.log(`  ✅ Created statistic: ${statData.label}`)
      } else {
        console.log(`  ⏭️  Statistic already exists: ${statData.label}`)
      }
    }
    console.log(`✅ Statistics seeding complete! Created ${statsCreated} new statistic(s).`)

    // Seed Page Content
    console.log('\n🌱 Seeding page content...')
    const pageContents = [
      // Hero Section Content
      {
        pageKey: 'home',
        sectionKey: 'hero-badge',
        title: null,
        content: 'Integrity First',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'home',
        sectionKey: 'hero-title',
        title: null,
        content: 'Zimbabwe Anti-Corruption Commission',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'home',
        sectionKey: 'hero-description',
        title: null,
        content: 'Preventing and combating corruption through enforcement, public education, research, and partnerships. We work with citizens and institutions to promote accountability and uphold the rule of law.',
        order: 3,
        isVisible: true
      },
      {
        pageKey: 'home',
        sectionKey: 'hero-primary-button',
        title: 'Report Corruption',
        content: '/report',
        order: 4,
        isVisible: true,
        metadata: {
          text: 'Report Corruption',
          link: '/report'
        }
      },
      {
        pageKey: 'home',
        sectionKey: 'hero-secondary-button',
        title: 'Learn More',
        content: '/about',
        order: 5,
        isVisible: true,
        metadata: {
          text: 'Learn More',
          link: '/about'
        }
      },
      // About Section Content
      {
        pageKey: 'home',
        sectionKey: 'about-title',
        title: null,
        content: 'About ZACC',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'home',
        sectionKey: 'about-paragraph-1',
        title: null,
        content: 'The Zimbabwe Anti-Corruption Commission (ZACC) was established in terms of Section 254 of the Constitution (Amendment 20, 2013) and the Anti-Corruption Commission Act [Chapter 9:22]. The ZACC is one of the two Chapter 13 institutions established to Combat Corruption and Crime.',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'home',
        sectionKey: 'about-mission',
        title: 'Our Mission',
        content: 'To combat all forms of corruption in Zimbabwe through prevention, investigation and asset recovery.',
        order: 3,
        isVisible: true
      },
      {
        pageKey: 'home',
        sectionKey: 'about-vision',
        title: 'Our Vision',
        content: 'A citizenry and institutions that uphold integrity and good governance for a corruption free Zimbabwe by 2030',
        order: 4,
        isVisible: true
      },
      // Statistics Section Content
      {
        pageKey: 'home',
        sectionKey: 'statistics-title',
        title: null,
        content: 'ZACC Statistics',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'home',
        sectionKey: 'statistics-description',
        title: null,
        content: 'Key indicators of our anti-corruption work and partnerships.',
        order: 2,
        isVisible: true
      },
      // Contact Section Content
      {
        pageKey: 'home',
        sectionKey: 'contact-title',
        title: null,
        content: 'Contact Us',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'home',
        sectionKey: 'contact-description',
        title: null,
        content: 'Share information or request assistance. You can also report anonymously.',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'home',
        sectionKey: 'contact-head-office',
        title: 'Head Office',
        content: '872 Betterment Close, Mt. Pleasant Business Park, Mt. Pleasant, Harare',
        order: 3,
        isVisible: true,
        metadata: {
          address: '872 Betterment Close, Mt. Pleasant Business Park, Mt. Pleasant, Harare',
          phone: ['+263 242369603', '+263 242369605', '+263 242369608', '+263 242369614'],
          cell: ['+263719529483'],
          email: 'reports@zacc.co.zw',
          whatsapp: '+263719529483',
          website: 'www.zacc.co.zw',
          tollFree: {
            netone: '08010101',
            telone: '08004367'
          },
          social: {
            facebook: 'Zimbabwe Anti-Corruption Commission',
            twitter: '@ZACConline_',
            tiktok: '@zacc.online'
          }
        }
      },
      {
        pageKey: 'contact',
        sectionKey: 'reporting-offices',
        title: 'Reporting Offices',
        content: 'Regional Reporting Offices',
        order: 1,
        isVisible: true,
        metadata: {
          offices: [
            {
              name: 'Harare Region & Reporting Office',
              address: '172 Herbert Chitepo Avenue, Harare',
              phone: ['+263 242 254912', '+263 242 254913', '+263 242 254914', '+263 242 254915']
            },
            {
              name: 'Bulawayo Reporting Office',
              address: 'Third floor Entrance 4, Mhlahlandlela Government Complex, Corner Basch Street and 10th Avenue, Bulawayo',
              phone: ['+263 292263910']
            },
            {
              name: 'Midlands Reporting Office',
              address: 'Government Complex, 10th Street and Robert Mugabe, Gweru',
              phone: ['+263 542224040'],
              cell: ['+263719529482']
            },
            {
              name: 'Masvingo Reporting Office',
              address: 'Chiefs Hall Mucheke, Masvingo',
              cell: ['+263719567228'],
              address2: 'No 5 Baden Crescent, Rhodene, Masvingo',
              phone: ['+263 392260941']
            },
            {
              name: 'Mashonaland West Reporting Office',
              address: 'Chinese Complex, opposite Chinhoyi Provincial Hospital, Chikonohono Township, Chinhoyi',
              phone: ['+263 672125354'],
              address2: 'Orange Grove Hotel, Chinhoyi',
              cell: ['+263712899770']
            },
            {
              name: 'Manicaland Reporting Office',
              address: '133 Upper third street, Mutare',
              phone: ['+263 202061212'],
              cell: ['+263719840714']
            },
            {
              name: 'Mashonaland Central Reporting Office',
              address: 'Ground Floor, Ndoda Hondo Government Complex, Bindura',
              cell: ['+263719241747', '+263719567250']
            },
            {
              name: 'Mashonaland East Reporting Office',
              address: 'No 1 Marondera Crescent, Winston Park, Marondera',
              cell: ['0712841435', '0719277708']
            }
          ]
        }
      },
      // About Page Content
      {
        pageKey: 'about',
        sectionKey: 'hero-title',
        title: null,
        content: 'About Us',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'hero-subtitle',
        title: null,
        content: 'Zimbabwe Anti-Corruption Commission (ZACC)',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'introduction-title',
        title: null,
        content: 'Zimbabwe Anti-Corruption Commission',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'introduction-paragraph-1',
        title: null,
        content: 'The Zimbabwe Anti-Corruption Commission (ZACC) was established in terms of Section 254 of the Constitution (Amendment 20, 2013) and the Anti-Corruption Commission Act [Chapter 9:22]. The ZACC is one of the two Chapter 13 institutions established to Combat Corruption and Crime.',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'introduction-paragraph-2',
        title: null,
        content: 'ZACC operates independently and without fear, favour, or prejudice, guided by the Constitution and the laws of Zimbabwe. The Commission plays a central role in strengthening good governance and fostering public confidence in state institutions.',
        order: 3,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'introduction-image-overlay-title',
        title: null,
        content: 'Independent & Accountable',
        order: 4,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'introduction-image-overlay-subtitle',
        title: null,
        content: 'Serving Zimbabwe with integrity',
        order: 5,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'mandate-title',
        title: null,
        content: 'Our Mandate',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'mandate-description',
        title: null,
        content: 'The mandate of the Zimbabwe Anti-Corruption Commission is to combat corruption and related offences through prevention, investigation, and public education. In carrying out this mandate, the Commission:',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'mandate-items',
        title: null,
        content: 'Mandate Items',
        order: 3,
        isVisible: true,
        metadata: {
          items: [
            { title: 'Investigations', description: 'Investigates cases of corruption and related offences' },
            { title: 'Prevention', description: 'Prevents corruption through systems review and institutional strengthening' },
            { title: 'Prosecution', description: 'Refers cases for prosecution to the National Prosecuting Authority of Zimbabwe (NPA)' },
            { title: 'Transparency', description: 'Promotes transparency, accountability, and ethical conduct' },
            { title: 'Advisory', description: 'Advises public and private institutions on corruption risk mitigation' },
            { title: 'Education', description: 'Educates the public on the dangers and consequences of corruption' }
          ]
        }
      },
      {
        pageKey: 'about',
        sectionKey: 'vision-title',
        title: 'Our Vision',
        content: 'A citizenry and institutions that uphold integrity and good governance for a corruption free Zimbabwe by 2030',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'mission-title',
        title: 'Our Mission',
        content: 'To combat all forms of corruption in Zimbabwe through prevention, investigation and asset recovery.',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'vision-mission-years-stat',
        title: null,
        content: '20+',
        order: 3,
        isVisible: true,
        metadata: {
          label: 'Years of Service'
        }
      },
      {
        pageKey: 'about',
        sectionKey: 'core-values-title',
        title: null,
        content: 'Our Core Values',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'core-values-description',
        title: null,
        content: 'The work of the Commission is guided by the following core values:',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'core-values-items',
        title: null,
        content: 'Core Values',
        order: 3,
        isVisible: true,
        metadata: {
          values: [
            { letter: 'I', title: 'Integrity', description: 'Honest, respectful and humane in the delivery of our mandate.' },
            { letter: 'T', title: 'Transparency', description: 'Upholding openness and fairness in the disclosure of information and operations.' },
            { letter: 'A', title: 'Accountability', description: 'Being responsible and answerable for all our activities and outcomes.' },
            { letter: 'T', title: 'Teamwork', description: 'Collaborative effort within all departments and with stakeholders to achieve a common goal.' },
            { letter: 'I', title: 'Independence', description: 'Executing our mandate without fear, favour or prejudice.' },
            { letter: 'P', title: 'Professionalism', description: 'Competence, diligence, commitment and innovativeness in the discharge of our mandate.' }
          ]
        }
      },
      {
        pageKey: 'about',
        sectionKey: 'functions-title',
        title: null,
        content: 'Our Functions',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'functions-description',
        title: null,
        content: 'In fulfilling its constitutional and statutory obligations, ZACC performs the following functions:',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'functions-items',
        title: null,
        content: 'Functions List',
        order: 3,
        isVisible: true,
        metadata: {
          items: [
            'Investigate and expose cases of corruption in the public and private sectors',
            'Combat corruption, theft, misappropriation, abuse of power and improper conduct in the public and private sectors',
            'Promote honesty, financial discipline, and transparency in the public and private sectors',
            'Receive and consider complaints from the public and to take such action in regard to the complaints as it considers appropriate',
            'Direct the Commissioner-General of the Police to investigate cases of suspected corruption and to report to the Commission on the results of any such investigations',
            'Refer matters to the National Prosecution Authority for prosecution',
            'Require assistance from members of the police service and other investigative agencies of the State',
            'Make recommendations to the Government and other persons on measures to enhance integrity, accountability and prevent improper conduct in the public and private sectors'
          ]
        }
      },
      {
        pageKey: 'about',
        sectionKey: 'strategic-focus-title',
        title: null,
        content: 'Strategic Focus Areas',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'strategic-focus-description',
        title: null,
        content: 'The Commission\'s work is guided by national development priorities and strategic frameworks. Key focus areas include:',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'strategic-focus-items',
        title: null,
        content: 'Strategic Focus Areas',
        order: 3,
        isVisible: true,
        metadata: {
          areas: [
            { title: 'Corruption Prevention', description: 'Systems strengthening and risk mitigation' },
            { title: 'Law Enforcement', description: 'Investigations and prosecution support' },
            { title: 'Public Sector Integrity', description: 'Accountability and transparency' },
            { title: 'Private Sector', description: 'Corruption prevention in business' },
            { title: 'Community Engagement', description: 'Public awareness and education' },
            { title: 'Cooperation', description: 'Domestic, regional, and international partnerships' }
          ]
        }
      },
      {
        pageKey: 'about',
        sectionKey: 'nacs-title',
        title: null,
        content: 'Role in the National Anti-Corruption Strategy (NACS)',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'nacs-description',
        title: null,
        content: 'The Zimbabwe Anti-Corruption Commission plays a leading role in the implementation and coordination of the National Anti-Corruption Strategy (NACS). Through multi-stakeholder collaboration, the Commission works with government ministries, departments and agencies, the private sector, civil society, and development partners to promote a whole-of-society approach to combating corruption.',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'leadership-title',
        title: null,
        content: 'Leadership and Governance',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'leadership-description',
        title: null,
        content: 'ZACC is governed by a Commission appointed in accordance with the Constitution of Zimbabwe. The Commission provides strategic direction and oversight, supported by a professional Secretariat responsible for the day-to-day operations of the institution. The leadership of ZACC is committed to independence, accountability, and the rule of law.',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'commitment-title',
        title: null,
        content: 'Our Commitment to Citizens',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'commitment-paragraph-1',
        title: null,
        content: 'The Zimbabwe Anti-Corruption Commission is committed to serving the people of Zimbabwe with integrity and professionalism. The Commission guarantees confidentiality in the handling of corruption reports, protects whistleblowers in accordance with the law, and ensures that investigations are conducted fairly and transparently.',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'commitment-paragraph-2',
        title: null,
        content: 'ZACC upholds human rights and due process, and remains resolute in its zero-tolerance approach to corruption in all its forms.',
        order: 3,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'national-presence-title',
        title: null,
        content: 'National Presence',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'national-presence-description',
        title: null,
        content: 'ZACC has a nationwide mandate and operates across Zimbabwe to ensure accessibility and responsiveness to corruption-related concerns wherever they arise.',
        order: 2,
        isVisible: true
      },
      // Departments Page Content
      {
        pageKey: 'departments',
        sectionKey: 'hero-title',
        title: null,
        content: 'Departments',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'departments',
        sectionKey: 'hero-subtitle',
        title: null,
        content: 'ZACC Departments and Their Functions',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'departments',
        sectionKey: 'introduction-description',
        title: null,
        content: 'The Commission has, in terms of the Constitution and the Act, a Secretariat which is headed by the Executive Secretary.',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'departments',
        sectionKey: 'departments-list',
        title: null,
        content: 'Departments',
        order: 1,
        isVisible: true,
        metadata: {
          departments: [
            {
              name: 'Office of the Executive Secretary',
              description: 'The core functions of the Office are to:',
              functions: [
                'Provide overall leadership and coordination of ZACC policies, strategies and programmes',
                'Supervise departments within ZACC',
                'Manage relationships with stakeholders',
                'Ensure compliance with statutes, regulations, policies, Treasury Instructions and Commission resolutions',
                'Manage resources for the implementation of the Agency\'s plan',
                'Ensure good corporate governance practices',
                'Oversee all procurement of works, goods and services',
                'Develop and maintain appropriate linkages between the Commission and the Secretariat'
              ]
            },
            {
              name: 'Legal and Asset Recovery Department',
              description: 'The Department has two units namely Legal Services and Prosecution Liaison Unit and Asset Forfeiture & Recovery Unit whose core functions are to:',
              units: [
                {
                  name: 'Legal Services and Prosecution Liaison Unit',
                  functions: [
                    'Provide corporate secretarial duties',
                    'Manage legal contracts',
                    'Manage external legal service providers',
                    'Provide legal advice to departments, management and Commission',
                    'Draft policy recommendations for Government approval'
                  ]
                },
                {
                  name: 'Asset Forfeiture and Recovery Unit',
                  functions: [
                    'Profile and investigate unexplained wealth and proceeds of crime',
                    'Draft case files for confiscation and unexplained wealth orders',
                    'Refer case files to National Prosecuting Authority for recovery of proceeds of crime',
                    'Execute confiscation and unexplained wealth orders',
                    'Draft Mutual Legal Assistance (MLA) requests and refer to NPA',
                    'Manage seized assets on behalf of the Commission'
                  ]
                }
              ]
            },
            {
              name: 'Investigations Department',
              description: 'The core functions of the Department are to:',
              functions: [
                'Conduct investigations on complaints alleging any form of corruption and mandate offences',
                'Refer criminal dockets to Legal and Prosecution Liaison Unit',
                'Create and manage database for criminals under ZACC investigations',
                'Referral of cases to the Zimbabwe Republic Police for investigations',
                'Liaison with stakeholders in the investigation of corruption cases',
                'Provide intelligence on corruption and corruption related offences in public and private sector'
              ]
            },
            {
              name: 'Prevention and Corporate Governance Department',
              description: 'The Prevention and corporate governance department has three Units within it namely: Public Education; Compliance and Systems Review; and Research & Knowledge Management whose core functions are:',
              units: [
                {
                  name: 'Public Education Unit',
                  functions: [
                    'Mobilisation of anti-corruption awareness materials',
                    'Developing anti-corruption education curricula',
                    'Raising anti-corruption awareness among the public and institutions'
                  ]
                },
                {
                  name: 'Compliance and Systems Review Unit',
                  functions: [
                    'Conducting compliance, systems and processes review assessments in public and private institutions',
                    'Monitoring compliance and systems of institutions',
                    'Promoting internal anti-corruption and anti-fraud policies and strategies in public and private institutions',
                    'Make recommendations to public and private institutions and other persons on measures to enhance integrity, accountability and prevent improper conduct in the public and private sectors'
                  ]
                },
                {
                  name: 'Research & Knowledge Management Unit',
                  functions: [
                    'Undertaking anti-corruption research studies',
                    'Creating knowledge, for relevant internal departments and stakeholders',
                    'Disseminating research findings'
                  ]
                }
              ]
            },
            {
              name: 'Finance and Administration Department',
              description: 'The Department has two units namely Finance and Administration whose core functions are:',
              units: [
                {
                  name: 'Finance Unit',
                  functions: [
                    'Mobilize financial resources',
                    'Provide financial reporting',
                    'Ensure budgeting, budgetary controls and management of accounts',
                    'Optimize returns from investments'
                  ]
                },
                {
                  name: 'Administration Unit',
                  functions: [
                    'Manage Commission assets and inventory',
                    'Manage goods and services contracts',
                    'Provide logistics for all ZACC events',
                    'Provide records maintenance archiving and retrieval',
                    'Provide security services for ZACC personnel and assets',
                    'Investigate all forms of security breaches',
                    'Conduct security education, training and awareness programmes',
                    'Carry out security surveys, Inspection and Security checks'
                  ]
                }
              ]
            },
            {
              name: 'Human Resources, Learning and Development Department',
              description: 'The Department has two units namely Human Resources and Learning & Development whose core functions are to:',
              units: [
                {
                  name: 'Human Resources Unit',
                  functions: [
                    'Developing and implement human resources policies and procedures',
                    'Institutionalizing performance management',
                    'Attracting and retaining staff',
                    'Institute Organizational harmony',
                    'Coordinating disciplinary procedures'
                  ]
                },
                {
                  name: 'Learning & Development Unit',
                  functions: [
                    'Design and implement training programmes for ZACC staff',
                    'Co-ordinate and conduct continuous development'
                  ]
                }
              ]
            }
          ]
        }
      },
      // Units Page Content
      {
        pageKey: 'units',
        sectionKey: 'hero-title',
        title: null,
        content: 'Executive Units',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'units',
        sectionKey: 'hero-subtitle',
        title: null,
        content: 'ZACC Executive Units and Their Functions',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'units',
        sectionKey: 'units-list',
        title: null,
        content: 'Executive Units',
        order: 1,
        isVisible: true,
        metadata: {
          units: [
            {
              name: 'Communication and Media Liaison Unit',
              description: 'The core functions of the Unit are to:',
              functions: [
                'Executing internal and external communication strategies',
                'Enhancing corporate image',
                'Coordinating corporate events'
              ]
            },
            {
              name: 'External Relations and International Conventions Unit',
              description: 'The core functions of the Unit are to:',
              functions: [
                'Facilitating the participation of the Commission in all local, regional and international fora on anti-corruption',
                'Coordinating the engagement of local, regional and international stakeholders'
              ]
            },
            {
              name: 'Information Communication Technology (ICT) Unit',
              description: 'The core functions of the Unit are to:',
              functions: [
                'Implementation of the e-Government strategy for the Commission',
                'Maintain ICT infrastructure',
                'Provide end-user support'
              ]
            },
            {
              name: 'Internal Audit Unit',
              description: 'The core functions of the Unit are to:',
              functions: [
                'Provide assurance of the Commission\'s systems control and governance processes',
                'Ensure compliance with policies and procedures'
              ]
            },
            {
              name: 'Procurement and Management Unit',
              description: 'The core functions of the Unit are to:',
              functions: [
                'Plan the procurement activities',
                'Manage the procurement process and contracts',
                'Ensure Compliance with Public Procurement and Disposal of Public Assets'
              ]
            },
            {
              name: 'Monitoring and Evaluation Unit',
              description: 'The core functions of the unit are to:',
              functions: [
                'Design and develop an appropriate monitoring and evaluation plan',
                'Coordinate the strategic planning and review processes of the Commission',
                'Assess, track and evaluate organisational performance',
                'Coordinate the risk management processes of the Commission',
                'Coordinate the monitoring and evaluation of the Commission\'s programs and projects',
                'Coordinate the conduct of market research into factors likely to impact on the Commission\'s achievement of strategic goals'
              ]
            }
          ]
        }
      },
      // Legislation Page Content
      {
        pageKey: 'legislation',
        sectionKey: 'hero-title',
        title: null,
        content: 'Legislation',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'hero-subtitle',
        title: null,
        content: 'Legal Framework and Anti-Corruption Laws',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'introduction-title',
        title: null,
        content: 'Legal Framework',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'introduction-paragraph-1',
        title: null,
        content: 'The Zimbabwe Anti-Corruption Commission operates within a comprehensive legal and policy framework that empowers it to prevent, investigate, and combat corruption in the public and private sectors. This legislative framework is aligned with the Constitution of Zimbabwe and international anti-corruption instruments.',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'introduction-paragraph-2',
        title: null,
        content: 'The legal basis for ZACC\'s operations ensures independence, accountability, and effectiveness in the fight against corruption across all sectors of society.',
        order: 3,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'introduction-image-overlay-title',
        title: null,
        content: 'Constitutional Mandate',
        order: 4,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'introduction-image-overlay-subtitle',
        title: null,
        content: 'Established by law, serving justice',
        order: 5,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'constitutional-title',
        title: null,
        content: 'Constitutional Framework',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'constitutional-description',
        title: null,
        content: 'Constitution of Zimbabwe (Amendment No. 20 of 2013)',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'constitutional-content',
        title: null,
        content: 'The Zimbabwe Anti-Corruption Commission is established as an independent constitutional commission under Sections 254 and 255 of the Constitution of Zimbabwe. As a Chapter 13 institution, the Commission is required to exercise its powers and perform its functions without fear, favour, or prejudice.',
        order: 3,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'constitutional-mandates',
        title: 'The Constitution mandates ZACC to:',
        content: 'Constitutional Mandates',
        order: 4,
        isVisible: true,
        metadata: {
          items: [
            'Investigate and expose cases of corruption in the public and private sectors',
            'Combat corruption, abuse of power, theft, and misappropriation',
            'Promote honesty, financial discipline, and transparency',
            'Receive and act on complaints from the public',
            'Refer matters for prosecution to the National Prosecuting Authority'
          ]
        }
      },
      {
        pageKey: 'legislation',
        sectionKey: 'constitutional-image-overlay-title',
        title: null,
        content: 'Sections 254 & 255',
        order: 5,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'constitutional-image-overlay-subtitle',
        title: null,
        content: 'Constitutional Provisions',
        order: 6,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'enabling-title',
        title: null,
        content: 'Enabling Legislation',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'enabling-description',
        title: null,
        content: 'Anti-Corruption Commission Act [Chapter 9:22]',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'enabling-overview-title',
        title: 'Act Overview',
        content: 'The Anti-Corruption Commission Act [Chapter 9:22] operationalises the constitutional mandate of ZACC and provides for the establishment, functions, powers, governance, and administration of the Commission.',
        order: 3,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'enabling-provisions-title',
        title: 'Key Provisions Include:',
        content: 'Key Provisions',
        order: 4,
        isVisible: true,
        metadata: {
          items: [
            'Legal establishment of ZACC as a body corporate',
            'Appointment, qualifications, tenure, and conditions of service of Commissioners',
            'Statutory functions and powers of the Commission',
            'Investigation, search, seizure, and asset recovery powers',
            'Reporting obligations and accountability mechanisms'
          ]
        }
      },
      {
        pageKey: 'legislation',
        sectionKey: 'criminal-title',
        title: null,
        content: 'Criminal and Procedural Laws',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'criminal-description',
        title: null,
        content: 'ZACC derives investigative and enforcement support from the following statutes:',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'criminal-laws',
        title: null,
        content: 'Criminal Laws',
        order: 3,
        isVisible: true,
        metadata: {
          laws: [
            {
              title: 'Criminal Law Act',
              chapter: '[Chapter 9:23]',
              description: 'Criminal Law (Codification and Reform) Act provides for offences related to corruption, including:',
              items: [
                'Bribery',
                'Criminal abuse of duty as a public officer',
                'Corrupt use of false documents',
                'Concealment of personal interest in transactions'
              ]
            },
            {
              title: 'Criminal Procedure',
              chapter: '[Chapter 9:07]',
              description: 'Criminal Procedure and Evidence Act governs criminal investigations, searches, seizures, arrests, and court procedures applicable to corruption cases.'
            },
            {
              title: 'Prevention of Corruption',
              chapter: '[Chapter 9:16]',
              description: 'Prevention of Corruption Act addresses corrupt practices involving public officers and agents.'
            }
          ]
        }
      },
      {
        pageKey: 'legislation',
        sectionKey: 'financial-title',
        title: null,
        content: 'Financial Crimes and Asset Recovery Legislation',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'financial-laws',
        title: null,
        content: 'Financial Laws',
        order: 2,
        isVisible: true,
        metadata: {
          laws: [
            {
              title: 'Money Laundering and Proceeds of Crime Act',
              chapter: '[Chapter 9:24]',
              description: 'Provides mechanisms for:',
              items: [
                'Tracing, freezing, and confiscation of proceeds of corruption',
                'Combatting money laundering and illicit financial flows'
              ]
            },
            {
              title: 'Public Finance Management Act',
              chapter: '[Chapter 22:19]',
              description: 'Ensures accountability and transparency in the management of public funds.'
            }
          ]
        }
      },
      {
        pageKey: 'legislation',
        sectionKey: 'governance-title',
        title: null,
        content: 'Governance and Public Sector Integrity Laws',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'governance-laws',
        title: null,
        content: 'Governance Laws',
        order: 2,
        isVisible: true,
        metadata: {
          laws: [
            {
              title: 'Public Entities Corporate Governance Act',
              chapter: '[Chapter 10:31]',
              description: 'Promotes ethical leadership, transparency, and accountability in public entities.'
            },
            {
              title: 'Public Procurement and Disposal of Public Assets Act',
              chapter: '[Chapter 22:23]',
              description: 'Regulates public procurement processes to prevent corruption and financial abuse.'
            }
          ]
        }
      },
      {
        pageKey: 'legislation',
        sectionKey: 'international-title',
        title: null,
        content: 'International and Regional Instruments',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'international-description',
        title: null,
        content: 'Zimbabwe is a State Party to key international anti-corruption conventions which guide the work of ZACC:',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'international-conventions',
        title: null,
        content: 'International Conventions',
        order: 3,
        isVisible: true,
        metadata: {
          conventions: [
            {
              abbreviation: 'UN',
              title: 'UNCAC',
              description: 'United Nations Convention Against Corruption'
            },
            {
              abbreviation: 'AU',
              title: 'AU Convention',
              description: 'African Union Convention on Preventing and Combating Corruption'
            },
            {
              abbreviation: 'SADC',
              title: 'SADC Protocol',
              description: 'SADC Protocol Against Corruption'
            }
          ]
        }
      },
      {
        pageKey: 'legislation',
        sectionKey: 'international-closing',
        title: null,
        content: 'These instruments reinforce Zimbabwe\'s commitment to international cooperation, asset recovery, and the promotion of integrity and good governance.',
        order: 4,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'regulations-title',
        title: null,
        content: 'Regulations and Statutory Instruments',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'regulations-paragraph-1',
        title: null,
        content: 'The Minister responsible for anti-corruption, in consultation with ZACC, may issue regulations and statutory instruments to give effect to the Anti-Corruption Commission Act and other related laws.',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'regulations-paragraph-2',
        title: null,
        content: 'These regulations provide detailed operational guidelines, procedures, and standards that support the effective implementation of anti-corruption measures.',
        order: 3,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'access-title',
        title: null,
        content: 'Access to Legislation',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'access-description',
        title: null,
        content: 'Members of the public are encouraged to familiarise themselves with the laws governing anti-corruption in Zimbabwe. Copies of the legislation may be accessed through official Government of Zimbabwe platforms and recognised legal information services.',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'access-documents',
        title: null,
        content: 'Legal Documents',
        order: 3,
        isVisible: true,
        metadata: {
          documents: [
            { title: 'Constitution', subtitle: 'Sections 254-255' },
            { title: 'Anti-Corruption Act', subtitle: 'Chapter 9:22' },
            { title: 'Criminal Law Act', subtitle: 'Chapter 9:23' },
            { title: 'Money Laundering Act', subtitle: 'Chapter 9:24' }
          ]
        }
      },
      {
        pageKey: 'legislation',
        sectionKey: 'access-button-text',
        title: null,
        content: 'View All Legal Documents',
        order: 4,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'legislative-framework-title',
        title: null,
        content: 'Legislative Framework',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'legislative-framework-list',
        title: null,
        content: 'Legislative Framework',
        order: 2,
        isVisible: true,
        metadata: {
          acts: [
            'Constitution of Zimbabwe, Amendment No. 20',
            'Anti-Corruption Commission Act [Chapter 9:22]',
            'Prevention of Corruption Act [Chapter 9:16]',
            'Money Laundering and Proceeds of Crime Act [Chapter 9:24]',
            'Exchange Control Act',
            'Criminal Procedure and Evidence Act [Chapter 9:07]',
            'Criminal Law (Codification and Reform) Act [Chapter 9:23]',
            'Public Entities & Corporate Governance Act (Chapter 10:31)',
            'Public Finance Management Act Chapter (22:19)',
            'Public Procurement And Disposal Of Public Assets Act Chapter (22:23)',
            'S.I. 141/2017 ZACC Regulations',
            'SI 143/2019 Criminal Procedure and Evidence (Designation of Peace Officers) (Amendment) Notice, 2019 (No.3)'
          ]
        }
      },
      {
        pageKey: 'legislation',
        sectionKey: 'inquiries-title',
        title: null,
        content: 'Legal Inquiries',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'inquiries-description',
        title: null,
        content: 'For legal inquiries, compliance guidance, or questions about anti-corruption legislation, please contact our Legal Department.',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'legislation',
        sectionKey: 'inquiries-button-text',
        title: null,
        content: 'Contact Legal Department',
        order: 3,
        isVisible: true
      },
      // Statistics Page Content
      {
        pageKey: 'statistics',
        sectionKey: 'statistics-title',
        title: null,
        content: 'ZACC Statistics',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'statistics',
        sectionKey: 'statistics-description',
        title: null,
        content: 'Key indicators of our anti-corruption work and partnerships.',
        order: 2,
        isVisible: true
      }
    ]

    let pageContentsCreated = 0
    let pageContentsUpdated = 0
    for (const contentData of pageContents) {
      const existing = await prisma.pageContent.findUnique({
        where: {
          pageKey_sectionKey: {
            pageKey: contentData.pageKey,
            sectionKey: contentData.sectionKey
          }
        }
      })

      if (!existing) {
        await prisma.pageContent.create({
          data: contentData
        })
        pageContentsCreated++
        console.log(`  ✅ Created page content: ${contentData.pageKey}/${contentData.sectionKey}`)
      } else {
        // Update existing record
        await prisma.pageContent.update({
          where: {
            pageKey_sectionKey: {
              pageKey: contentData.pageKey,
              sectionKey: contentData.sectionKey
            }
          },
          data: {
            title: contentData.title,
            content: contentData.content,
            imageUrl: (contentData as any).imageUrl || null,
            order: contentData.order,
            isVisible: contentData.isVisible,
            metadata: (contentData as any).metadata || null
          }
        })
        pageContentsUpdated++
        console.log(`  🔄 Updated page content: ${contentData.pageKey}/${contentData.sectionKey}`)
      }
    }
    console.log(`✅ Page content seeding complete! Created ${pageContentsCreated} new content item(s), updated ${pageContentsUpdated} existing item(s).`)

    // ============================================
    // SEED COMMISSIONERS
    // ============================================
    console.log('\n📋 Seeding Commissioners...')
    
    const commissioners = [
      // Current Commission - 2024 to Present
      {
        name: 'Honourable Michael Reza',
        role: 'Chairperson',
        title: 'Chairperson',
        description: 'Michael Reza was appointed Chairperson of the Zimbabwe Anti-Corruption Commission in March 2024. He has experience spanning more than three decades in the public service. The Chairperson is a renowned legal practitioner. He served in the National Prosecuting Authority as Law Officer from 2009 where he rose through the ranks to the position of Acting Deputy Prosecutor General in 2020, until his appointment as the ZACC Chairperson.',
        bio: 'Hon Reza has a track record of successful prosecution of high-profile criminal and corruption cases. He holds a Master of Law Degree (LLM) with the Midlands State University (MSU) and a Bachelor of law Degree (LLB) with the University of South Africa.',
        imageUrl: '/uploads/commissioners/michael-reza.jpg',
        email: null,
        phone: null,
        order: 1,
        isActive: true
      },
      {
        name: 'Betty Wenjere',
        role: 'Commissioner',
        title: 'Commissioner',
        description: 'Commissioner Betty Wenjere chairs the Finance, Administration, and Investments Committee. She is a Registered Public Accountant and Associate of the Chartered Governance and Accountancy Institute.',
        bio: 'Commissioner Wenjere has held senior positions in various government ministries including Ministry of Primary and Secondary Education, Ministry of Lands, Agriculture, Fisheries, Water and Rural Development and the Ministry of Information, Publicity and Broadcasting Services.',
        imageUrl: '/uploads/commissioners/betty-wenjere.jpg',
        email: null,
        phone: null,
        order: 2,
        isActive: true
      },
      {
        name: 'Dr Obson Matunja',
        role: 'Commissioner',
        title: 'Commissioner',
        description: 'Commissioner Dr. Obson Matunja chairs the Audit and Risk Committee and as well as the Risk Committee (ERM).',
        bio: 'Dr. Matunja has wealth of experience in forensic accounting, auditing, and risk management spanning over 30 years. He has served in both the public and private sectors, and held key roles at strategic institutions that include ZIMRA, RBZ, and ZESA Holdings.',
        imageUrl: '/uploads/commissioners/obson-matunja.jpg',
        email: null,
        phone: null,
        order: 3,
        isActive: true
      },
      {
        name: 'Meme Rumbidzai Zvimba',
        role: 'Commissioner',
        title: 'Commissioner',
        description: 'Commissioner Meme Rumbidzai Zvimba is a registered Legal practitioner. She chairs the Legal Services committee.',
        bio: 'Commissioner Zvimba has extensive experience in constitutional, criminal, and corporate law and spent over 15 years in private practice where she represented high-profile clients.',
        imageUrl: '/uploads/commissioners/meme-zvimba.jpg',
        email: null,
        phone: null,
        order: 4,
        isActive: true
      },
      {
        name: 'Shelton Dube',
        role: 'Commissioner',
        title: 'Commissioner',
        description: 'Commissioner Shelton Dube chairs the Investigations Committee.',
        bio: 'He is a retired officer of the Zimbabwe Republic Police where he retired at the rank of Commissioner after 36 years in service. He has worked with the United Nations and International Criminal Police Organization (INTERPOL).',
        imageUrl: '/uploads/commissioners/shelton-dube.jpg',
        email: null,
        phone: null,
        order: 5,
        isActive: true
      },
      {
        name: 'Kindness Paradza',
        role: 'Commissioner',
        title: 'Commissioner',
        description: 'Commissioner Kindness Paradza chairs the Communications and External Relations Committee.',
        bio: 'He is a journalist by profession, a three-term Member of Parliament and a former Deputy Minister of Information, Publicity and Broadcasting Services.',
        imageUrl: '/uploads/commissioners/kindness-paradza.jpg',
        email: null,
        phone: null,
        order: 6,
        isActive: true
      },
      {
        name: 'Zalerah Makari',
        role: 'Commissioner',
        title: 'Commissioner',
        description: 'Commissioner Zalerah H. Makari chairs the Human Resources, Learning and Development Committee.',
        bio: 'She is a former Parliamentarian who has a strong background in telecommunications, finance, and international relations.',
        imageUrl: '/uploads/commissioners/zalerah-makari.jpg',
        email: null,
        phone: null,
        order: 7,
        isActive: true
      },
      {
        name: 'Patrick Tendai Mukorera',
        role: 'Commissioner',
        title: 'Commissioner',
        description: 'Commissioner Patrick Tendai Mukorera chairs the Asset Recovery Committee.',
        bio: 'He is a retired member of the Central Intelligence Organisation where he served for more than 30 years.',
        imageUrl: '/uploads/commissioners/patrick-mukorera.jpg',
        email: null,
        phone: null,
        order: 8,
        isActive: true
      },
      {
        name: 'Chido Madiwa',
        role: 'Commissioner',
        title: 'Commissioner',
        description: 'Commissioner Chido Madiwa chairs the Prevention of Corruption Committee and is a gender expert with over 24 years in public service.',
        bio: 'She is a former Director in the Ministry of Women Affairs, Community, Small and Medium Enterprises Development, and a former Parliamentarian who chaired the Parliamentary Portfolio Committee on Women\'s Affairs, Community, SME\'s Development.',
        imageUrl: '/uploads/commissioners/chido-madiwa.jpg',
        email: null,
        phone: null,
        order: 9,
        isActive: true
      },
      // 4th Commission - 2019 to 2024 (Historical - marked as inactive)
      {
        name: 'Justice Loyce Matanda-Moyo',
        role: 'Chairperson',
        title: 'Chairperson (4th Commission)',
        description: 'Justice Loyce Matanda-Moyo chaired the Zimbabwe Anti-Corruption Commission from April 2019 – October 2023. She became the first female Chairperson of ZACC.',
        bio: 'Justice Matanda-Moyo is a High Court Judge and has also served as Labour Court Judge.',
        imageUrl: '/uploads/commissioners/loyce-matanda-moyo.jpg',
        email: null,
        phone: null,
        order: 10,
        isActive: false
      },
      {
        name: 'Thandiwe Mlobane',
        role: 'Commissioner',
        title: 'Commissioner (4th Commission)',
        description: 'Commissioner of the 4th Commission (2019-2024).',
        bio: null,
        imageUrl: '/uploads/commissioners/thandiwe-mlobane.jpg',
        email: null,
        phone: null,
        order: 11,
        isActive: false
      },
      {
        name: 'Dr. Ndakaripa Hungwe',
        role: 'Commissioner',
        title: 'Commissioner (4th Commission)',
        description: 'Commissioner of the 4th Commission (2019-2024).',
        bio: null,
        imageUrl: '/uploads/commissioners/ndakaripa-hungwe.jpg',
        email: null,
        phone: null,
        order: 12,
        isActive: false
      },
      {
        name: 'Kuziwa Phineas Murapa',
        role: 'Deputy Chairperson',
        title: 'Deputy Chairperson (4th Commission)',
        description: 'Deputy Chairperson of the 4th Commission (2019-2024).',
        bio: null,
        imageUrl: '/uploads/commissioners/kuziwa-murapa.jpg',
        email: null,
        phone: null,
        order: 13,
        isActive: false
      },
      {
        name: 'Michael Dennis Santu',
        role: 'Commissioner',
        title: 'Commissioner (4th Commission)',
        description: 'Commissioner of the 4th Commission (2019-2024).',
        bio: null,
        imageUrl: '/uploads/commissioners/michael-santu.jpg',
        email: null,
        phone: null,
        order: 14,
        isActive: false
      },
      {
        name: 'Gabriel Chaibva',
        role: 'Commissioner',
        title: 'Commissioner (4th Commission)',
        description: 'Commissioner of the 4th Commission (2019-2024).',
        bio: null,
        imageUrl: '/uploads/commissioners/gabriel-chaibva.jpg',
        email: null,
        phone: null,
        order: 15,
        isActive: false
      },
      {
        name: 'Jessie Fungai Majome',
        role: 'Commissioner',
        title: 'Commissioner (4th Commission)',
        description: 'Commissioner of the 4th Commission (2019-2024).',
        bio: null,
        imageUrl: '/uploads/commissioners/jessie-majome.jpg',
        email: null,
        phone: null,
        order: 16,
        isActive: false
      },
      {
        name: 'Frank Muchengwa',
        role: 'Commissioner',
        title: 'Commissioner (4th Commission)',
        description: 'Commissioner of the 4th Commission (2019-2024).',
        bio: null,
        imageUrl: '/uploads/commissioners/frank-muchengwa.jpg',
        email: null,
        phone: null,
        order: 17,
        isActive: false
      },
      {
        name: 'John Makamure',
        role: 'Commissioner',
        title: 'Commissioner (4th Commission)',
        description: 'Commissioner of the 4th Commission (2019-2024).',
        bio: null,
        imageUrl: '/uploads/commissioners/john-makamure.jpg',
        email: null,
        phone: null,
        order: 18,
        isActive: false
      },
      // 3rd Commission - 2016 to 2019 (Historical - marked as inactive)
      {
        name: 'Dr Job Whabira',
        role: 'Chairperson',
        title: 'Chairperson (3rd Commission)',
        description: 'Dr Whabira (now late) was a retired senior civil servant and former Permanent Secretary in the Ministry of Defence, and Commissioner of the Public Service Commission. He chaired the 3rd Commission from 2016 until January 2019.',
        bio: null,
        imageUrl: '/uploads/commissioners/job-whabira.jpg',
        email: null,
        phone: null,
        order: 19,
        isActive: false
      },
      {
        name: 'Dr. Nanette Silukhuni',
        role: 'Deputy Chairperson',
        title: 'Deputy Chairperson (3rd Commission)',
        description: 'Deputy Chairperson of the 3rd Commission (2016-2019).',
        bio: null,
        imageUrl: '/uploads/commissioners/nanette-silukhuni.jpg',
        email: null,
        phone: null,
        order: 20,
        isActive: false
      },
      {
        name: 'Goodson Nguni',
        role: 'Commissioner',
        title: 'Commissioner (3rd Commission)',
        description: 'Commissioner of the 3rd Commission (2016-2019).',
        bio: null,
        imageUrl: '/uploads/commissioners/goodson-nguni.jpg',
        email: null,
        phone: null,
        order: 21,
        isActive: false
      },
      {
        name: 'Christine Fundira',
        role: 'Commissioner',
        title: 'Commissioner (3rd Commission)',
        description: 'Commissioner of the 3rd Commission (2016-2019).',
        bio: null,
        imageUrl: '/uploads/commissioners/christine-fundira.jpg',
        email: null,
        phone: null,
        order: 22,
        isActive: false
      },
      {
        name: 'Denford Chirindo',
        role: 'Commissioner',
        title: 'Commissioner (3rd Commission)',
        description: 'Commissioner of the 3rd Commission (2016-2019).',
        bio: null,
        imageUrl: '/uploads/commissioners/denford-chirindo.jpg',
        email: null,
        phone: null,
        order: 23,
        isActive: false
      },
      {
        name: 'Dr. Cathy Muchechetere',
        role: 'Commissioner',
        title: 'Commissioner (3rd Commission)',
        description: 'Commissioner of the 3rd Commission (2016-2019).',
        bio: null,
        imageUrl: '/uploads/commissioners/cathy-muchechetere.jpg',
        email: null,
        phone: null,
        order: 24,
        isActive: false
      },
      {
        name: 'Farai Mashonganyika- Chinyani',
        role: 'Commissioner',
        title: 'Commissioner (3rd Commission)',
        description: 'Commissioner of the 3rd Commission (2016-2019).',
        bio: null,
        imageUrl: '/uploads/commissioners/farai-mashonganyika.jpg',
        email: null,
        phone: null,
        order: 25,
        isActive: false
      },
      {
        name: 'Boyana Ndou',
        role: 'Commissioner',
        title: 'Commissioner (3rd Commission)',
        description: 'Commissioner of the 3rd Commission (2016-2019).',
        bio: null,
        imageUrl: '/uploads/commissioners/boyana-ndou.jpg',
        email: null,
        phone: null,
        order: 26,
        isActive: false
      },
      // 2nd Commission - 2011 to 2015 (Historical - marked as inactive)
      {
        name: 'Rtd Brigadier Denford Chirindo',
        role: 'Chairperson',
        title: 'Chairperson (2nd Commission)',
        description: 'Rtd Brigadier Denford Chirindo is a Lawyer and a retired soldier. Rtd Brig Chirindo chaired the Commission during the transitional period to the new constitutional framework that resulted in the Commission being renamed from ZACC from the Anti-Corruption Commission.',
        bio: null,
        imageUrl: '/uploads/commissioners/denford-chirindo-2nd.jpg',
        email: null,
        phone: null,
        order: 27,
        isActive: false
      },
      {
        name: 'Teresa Pearl Mugadza',
        role: 'Deputy Chairperson',
        title: 'Deputy Chairperson (2nd Commission)',
        description: 'Deputy Chairperson of the 2nd Commission (2011-2015).',
        bio: null,
        imageUrl: '/uploads/commissioners/teresa-mugadza.jpg',
        email: null,
        phone: null,
        order: 28,
        isActive: false
      },
      {
        name: 'Goodwill Shana',
        role: 'Commissioner',
        title: 'Commissioner (2nd Commission)',
        description: 'Commissioner of the 2nd Commission (2011-2015).',
        bio: null,
        imageUrl: '/uploads/commissioners/goodwill-shana.jpg',
        email: null,
        phone: null,
        order: 29,
        isActive: false
      },
      {
        name: 'Emmanuel Chimwanda',
        role: 'Commissioner',
        title: 'Commissioner (2nd Commission)',
        description: 'Commissioner of the 2nd Commission (2011-2015).',
        bio: null,
        imageUrl: '/uploads/commissioners/emmanuel-chimwanda.jpg',
        email: null,
        phone: null,
        order: 30,
        isActive: false
      },
      {
        name: 'Shepherd Gwasira',
        role: 'Commissioner',
        title: 'Commissioner (2nd Commission)',
        description: 'Commissioner of the 2nd Commission (2011-2015).',
        bio: null,
        imageUrl: '/uploads/commissioners/shepherd-gwasira.jpg',
        email: null,
        phone: null,
        order: 31,
        isActive: false
      },
      {
        name: 'Dr Elita Sakupwanya',
        role: 'Commissioner',
        title: 'Commissioner (2nd Commission)',
        description: 'Commissioner of the 2nd Commission (2011-2015).',
        bio: null,
        imageUrl: '/uploads/commissioners/elita-sakupwanya.jpg',
        email: null,
        phone: null,
        order: 32,
        isActive: false
      },
      {
        name: 'Lakayana Dube',
        role: 'Commissioner',
        title: 'Commissioner (2nd Commission)',
        description: 'Commissioner of the 2nd Commission (2011-2015).',
        bio: null,
        imageUrl: '/uploads/commissioners/lakayana-dube.jpg',
        email: null,
        phone: null,
        order: 33,
        isActive: false
      },
      // 1st Commission - 2005 to 2010 (Historical - marked as inactive)
      {
        name: 'Abdulman Eric Harid',
        role: 'Chairperson',
        title: 'Chairperson (1st Commission)',
        description: 'Mr Harid (Late) was the first Chairperson of Anti-Corruption Commission (ACC). He was appointed following the enactment of the Anti-Corruption Commission Act of 2005. Mr Harid was a distinguished public servant who had previously served as Zimbabwe\'s first black Comptroller and Auditor-General.',
        bio: 'During the tenure, he laid the foundation for the institutionalisation of the ACC.',
        imageUrl: '/uploads/commissioners/abdulman-harid.jpg',
        email: null,
        phone: null,
        order: 34,
        isActive: false
      },
      {
        name: 'Dr. Rutendo Faith Wutawunashe',
        role: 'Deputy Chairperson',
        title: 'Deputy Chairperson (1st Commission)',
        description: 'Deputy Chairperson of the 1st Commission (2005-2010).',
        bio: null,
        imageUrl: '/uploads/commissioners/rutendo-wutawunashe.jpg',
        email: null,
        phone: null,
        order: 35,
        isActive: false
      },
      {
        name: 'Johannes Tomana',
        role: 'Commissioner',
        title: 'Commissioner (1st Commission)',
        description: 'Commissioner of the 1st Commission (2005-2010).',
        bio: null,
        imageUrl: '/uploads/commissioners/johannes-tomana.jpg',
        email: null,
        phone: null,
        order: 36,
        isActive: false
      },
      {
        name: 'Bessie Nhandara',
        role: 'Commissioner',
        title: 'Commissioner (1st Commission)',
        description: 'Commissioner of the 1st Commission (2005-2010).',
        bio: null,
        imageUrl: '/uploads/commissioners/bessie-nhandara.jpg',
        email: null,
        phone: null,
        order: 37,
        isActive: false
      },
      {
        name: 'Alice Nkomo',
        role: 'Commissioner',
        title: 'Commissioner (1st Commission)',
        description: 'Commissioner of the 1st Commission (2005-2010).',
        bio: null,
        imageUrl: '/uploads/commissioners/alice-nkomo.jpg',
        email: null,
        phone: null,
        order: 38,
        isActive: false
      },
      {
        name: 'Kuziwa Nyamwanza',
        role: 'Commissioner',
        title: 'Commissioner (1st Commission)',
        description: 'Commissioner of the 1st Commission (2005-2010).',
        bio: null,
        imageUrl: '/uploads/commissioners/kuziwa-nyamwanza.jpg',
        email: null,
        phone: null,
        order: 39,
        isActive: false
      },
      {
        name: 'Retired Brigadier Elasto Madzingira',
        role: 'Commissioner',
        title: 'Commissioner (1st Commission)',
        description: 'Commissioner of the 1st Commission (2005-2010).',
        bio: null,
        imageUrl: '/uploads/commissioners/elasto-madzingira.jpg',
        email: null,
        phone: null,
        order: 40,
        isActive: false
      }
    ]

    let commissionersCreated = 0
    let commissionersUpdated = 0
    
    for (const commissionerData of commissioners) {
      // Try to find existing commissioner by name and role
      const existing = await prisma.commissioner.findFirst({
        where: {
          name: commissionerData.name,
          role: commissionerData.role
        }
      })

      if (!existing) {
        await prisma.commissioner.create({
          data: commissionerData
        })
        commissionersCreated++
        console.log(`  ✅ Created commissioner: ${commissionerData.name}`)
      } else {
        // Update existing record
        await prisma.commissioner.update({
          where: { id: existing.id },
          data: {
            title: commissionerData.title,
            description: commissionerData.description,
            bio: commissionerData.bio,
            imageUrl: commissionerData.imageUrl,
            email: commissionerData.email,
            phone: commissionerData.phone,
            order: commissionerData.order,
            isActive: commissionerData.isActive
          }
        })
        commissionersUpdated++
        console.log(`  🔄 Updated commissioner: ${commissionerData.name}`)
      }
    }
    
    console.log(`✅ Commissioners seeding complete! Created ${commissionersCreated} new commissioner(s), updated ${commissionersUpdated} existing commissioner(s).`)

    // ============================================
    // SEED TEAM (Executives/Management)
    // ============================================
    console.log('\n📋 Seeding Team (Executives)...')
    
    const teamData = [
      {
        name: 'Advocate Shepherd Manhivi',
        role: 'Executive Secretary',
        title: 'ZACC Executive Secretary',
        description: 'Advocate Shepherd Manhivi holds a Bachelor of Laws Honours; Bachelor of Science, Honours in Public Administration, and a Master of Science in International Relations, all from the University of Zimbabwe. He is a governance expert and has served as a Commissioner of the Zimbabwe Electoral Commission.',
        bio: '<p>Adv. Manhivi has worked for the Parliament of Zimbabwe where he served as Senior Advisor to several Parliamentary Portfolio Committees that include Mines and Energy; Human Rights; Foreign Affairs; Budget and Finance; and Justice, Legal and Parliamentary Affairs. Adv. Manhivi also worked for the National Peace and Reconciliation Commission as Regional Coordinator, overseeing devolution of its structures, and was the focal person for the Presidential Matrix in Matabeleland, ensuring the implementation and monitoring of peacebuilding initiatives.</p>',
        imageUrl: '/uploads/executives/shepherd-manhivi.jpg',
        email: null,
        phone: null,
        order: 1,
        isActive: true
      },
      {
        name: 'Mrs. Clara Nyakotyo',
        role: 'General Manager Prevention of Corruption',
        title: 'General Manager Prevention of Corruption',
        description: 'Mrs. Clara Nyakotyo is an economist with over two decades of experience in the public service. She joined the Zimbabwe Anti-Corruption Commission (ZACC) at its formation in 2006 as part of the management team.',
        bio: '<p>Mrs. Nyakotyo holds a Master of Science degree in Economics, a Master of Business Administration (MBA), and a Masters in International Business (MIB). She is a member of the Zimbabwe Economics Society (ZES) and the Association of Certified Fraud Examiners (ACFE).</p>',
        imageUrl: '/uploads/executives/clara-nyakotyo.jpg',
        email: null,
        phone: null,
        order: 2,
        isActive: true
      },
      {
        name: 'Mr Wellington Mugweni',
        role: 'General Manager Finance and Administration',
        title: 'General Manager Finance and Administration',
        description: 'Mr Wellington Mugweni is a Chartered Accountant with the Zambia Institute of Chartered Accountants and a Public Sector Professional Accountant with ICAZ (PSPA-Z). He holds a Master of Commerce in Applied Accounting and Bachelor of Commerce, Honours in Accounting among others.',
        bio: '<p>Mr Mugweni joined ZACC in 2016 from the Ministry of Information, Communication and Technology (ICT) as an Officer and was promoted to Finance Manager in 2017. He later moved to the National Peace and Reconciliation Commission and the Zimbabwe Gender Commission where he served as a General Manager. He rejoined ZACC again in 2022 as General Manager Finance and Administration.</p>',
        imageUrl: '/uploads/executives/wellington-mugweni.jpg',
        email: null,
        phone: null,
        order: 3,
        isActive: true
      },
      {
        name: 'Mrs Charity Matumbi',
        role: 'General Manager Legal and Asset Recovery',
        title: 'General Manager Legal and Asset Recovery',
        description: 'Mrs Charity Matumbi is a registered legal practitioner with an LLBS degree from the University of Zimbabwe and a Master of Corporate Laws from UNISA. She is also a member of the Law Society of Zimbabwe.',
        bio: '<p>Mrs Matumbi joined ZACC in 2008 as a Law Officer from the National Prosecuting Authority and rose through the ranks to become a General Manager in 2021.</p>',
        imageUrl: '/uploads/executives/charity-matumbi.jpg',
        email: null,
        phone: null,
        order: 4,
        isActive: true
      },
      {
        name: 'Mr Humphrey Magorimbo',
        role: 'General Manager Human Resources, Learning and Development',
        title: 'General Manager Human Resources, Learning and Development',
        description: 'Mr Humphrey Magorimbo holds a Master of Commerce in Strategic Management and a Bachelor\'s Degree in Human Resources Management, complemented by professional certifications in Labour Law, Labour Relations, and Chartered Governance.',
        bio: '<p>He has previously served as the Deputy General Manager at the Health Service Board and Acting Deputy Director in the Ministry of Primary and Secondary Education.</p>',
        imageUrl: '/uploads/executives/humphrey-magorimbo.jpg',
        email: null,
        phone: null,
        order: 5,
        isActive: true
      }
    ]

    let teamCreated = 0
    let teamUpdated = 0

    for (const teamMemberData of teamData) {
      const existing = await prisma.team.findFirst({
        where: {
          name: teamMemberData.name,
          role: teamMemberData.role
        }
      })

      if (!existing) {
        await prisma.team.create({
          data: teamMemberData
        })
        teamCreated++
        console.log(`  ✅ Created team member: ${teamMemberData.name}`)
      } else {
        // Update existing record
        await prisma.team.update({
          where: { id: existing.id },
          data: {
            title: teamMemberData.title,
            description: teamMemberData.description,
            bio: teamMemberData.bio,
            imageUrl: teamMemberData.imageUrl,
            email: teamMemberData.email,
            phone: teamMemberData.phone,
            order: teamMemberData.order,
            isActive: teamMemberData.isActive
          }
        })
        teamUpdated++
        console.log(`  🔄 Updated team member: ${teamMemberData.name}`)
      }
    }
    
    console.log(`✅ Team seeding complete! Created ${teamCreated} new team member(s), updated ${teamUpdated} existing team member(s).`)

    console.log('\n🎉 All homepage content seeding complete!')
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
