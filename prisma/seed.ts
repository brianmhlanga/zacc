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
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@zacc.gov.zw' }
    })

    // Create admin user if it doesn't exist
    if (!existingAdmin) {
      // Hash the default admin password
      const hashedPassword = await bcrypt.hash('admin123', 10)

      // Create admin user
      const admin = await prisma.user.create({
        data: {
          email: 'admin@zacc.gov.zw',
          name: 'Administrator',
          passwordHash: hashedPassword,
          role: 'SUPER_ADMIN',
          isActive: true
        }
      })

      console.log('✅ Admin user created successfully!')
      console.log('📧 Email: admin@zacc.gov.zw')
      console.log('🔑 Password: admin123')
      console.log('⚠️  Please change the password after first login!')
    } else {
      console.log('✅ Admin user already exists, skipping admin creation...')
    }

    // Seed Services (What We Do)
    console.log('\n🌱 Seeding services...')
    
    const services = [
      {
        title: 'Public Education',
        description: 'Nationwide awareness, civic trainings, and youth programs that foster a culture of integrity. We conduct educational campaigns, workshops, and community outreach initiatives to raise awareness about corruption and promote ethical behavior across all sectors of society.',
        icon: 'education',
        iconColor: 'green',
        order: 1,
        isVisible: true
      },
      {
        title: 'Corruption Prevention',
        description: 'Risk assessments, integrity audits, and control frameworks for public institutions. We work proactively with government agencies and private organizations to identify vulnerabilities, strengthen internal controls, and implement preventive measures that reduce opportunities for corruption.',
        icon: 'prevention',
        iconColor: 'gold',
        order: 2,
        isVisible: true
      },
      {
        title: 'Investigations',
        description: 'Evidence-led investigations, asset tracing, and collaboration with law enforcement. Our specialized investigation teams conduct thorough inquiries into corruption allegations, gather evidence, trace illicit assets, and work closely with law enforcement agencies to build strong cases.',
        icon: 'investigations',
        iconColor: 'green',
        order: 3,
        isVisible: true
      },
      {
        title: 'Legal',
        description: 'Advisory on anti-corruption laws, compliance guidance, and legal support to agencies. We provide expert legal counsel on anti-corruption legislation, assist with compliance matters, and offer guidance to public and private institutions on maintaining legal and ethical standards.',
        icon: 'legal',
        iconColor: 'gold',
        order: 4,
        isVisible: true
      },
      {
        title: 'Prosecution',
        description: 'Case preparation, court liaison, and recovery proceedings in coordination with ODPP. We prepare comprehensive cases for prosecution, coordinate with the Office of the Director of Public Prosecutions, and pursue asset recovery proceedings to ensure justice is served and stolen assets are returned to the state.',
        icon: 'prosecution',
        iconColor: 'green',
        order: 5,
        isVisible: true
      }
    ]

    let servicesCreated = 0
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
        console.log(`  ⏭️  Service already exists: ${serviceData.title}`)
      }
    }

    console.log(`\n✅ Services seeding complete! Created ${servicesCreated} new service(s).`)

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
        content: 'ZACC investigates and combats corruption, promotes integrity, and advises on anti-corruption policy and legislation. We work with citizens and institutions to strengthen accountability across Zimbabwe.',
        order: 2,
        isVisible: true
      },
      {
        pageKey: 'home',
        sectionKey: 'about-paragraph-2',
        title: null,
        content: 'Through investigations, asset recovery, and prosecution support, we disrupt networks that enable graft and misuse of public resources. Our teams collaborate with justice sector partners to ensure due process, robust evidence handling, and timely resolution of cases.',
        order: 3,
        isVisible: true
      },
      {
        pageKey: 'home',
        sectionKey: 'about-paragraph-3',
        title: null,
        content: 'Beyond enforcement, we prioritize prevention and public education. ZACC conducts risk assessments, integrity audits, and civic awareness campaigns to help ministries, agencies, and communities establish stronger controls, transparent workflows, and a culture of ethics.',
        order: 4,
        isVisible: true
      },
      {
        pageKey: 'home',
        sectionKey: 'about-mission',
        title: 'Our Mission',
        content: 'To rid Zimbabwe of corruption through lawful enforcement and robust prevention.',
        order: 5,
        isVisible: true
      },
      {
        pageKey: 'home',
        sectionKey: 'about-vision',
        title: 'Our Vision',
        content: 'A Zimbabwe free from all forms of corruption.',
        order: 6,
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
        content: 'ZACC Headquarters • Harare, Zimbabwe',
        order: 3,
        isVisible: true,
        metadata: {
          phone: ['(024) 2369605', '0719 529 483'],
          email: 'info@zacc.org.zw'
        }
      },
      {
        pageKey: 'home',
        sectionKey: 'contact-report-centre',
        title: 'Report Centre',
        content: 'Submit tips by phone, email, or in person.',
        order: 4,
        isVisible: true,
        metadata: {
          phone: ['(024) 2369605', '0719 529 483'],
          email: 'report@zacc.org.zw'
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
        content: 'The Zimbabwe Anti-Corruption Commission (ZACC) is an independent constitutional commission established in terms of the Constitution of Zimbabwe and the Anti-Corruption Commission Act [Chapter 9:22]. The Commission is mandated to prevent, investigate, and combat corruption in both the public and private sectors, thereby promoting integrity, transparency, and accountability in the management of public and private affairs.',
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
        content: 'A corruption-free Zimbabwe founded on integrity, transparency, and accountability.',
        order: 1,
        isVisible: true
      },
      {
        pageKey: 'about',
        sectionKey: 'mission-title',
        title: 'Our Mission',
        content: 'To effectively prevent and combat corruption through investigation, prevention, public education, and strategic partnerships in order to promote good governance and sustainable development.',
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
            { letter: 'I', title: 'Integrity', description: 'Upholding the highest ethical standards in all our operations' },
            { letter: 'I', title: 'Independence', description: 'Operating without undue influence or interference' },
            { letter: 'P', title: 'Professionalism', description: 'Delivering services competently and impartially' },
            { letter: 'T', title: 'Transparency', description: 'Conducting our work openly and accountably' },
            { letter: 'A', title: 'Accountability', description: 'Being answerable to the public and the law' },
            { letter: 'F', title: 'Fairness', description: 'Ensuring justice, objectivity, and respect for human rights' },
            { letter: 'C', title: 'Confidentiality', description: 'Protecting information and whistleblowers' }
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
            'Receives and assesses reports and complaints of corruption',
            'Conducts investigations into alleged acts of corruption and abuse of power',
            'Carries out systems reviews to identify corruption risks in institutions',
            'Monitors trends and patterns of corruption',
            'Recommends corrective measures and institutional reforms',
            'Refers cases for prosecution to the appropriate authorities',
            'Undertakes public education and awareness programmes',
            'Collaborates with local, regional, and international partners in the fight against corruption'
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
        console.log(`  ⏭️  Page content already exists: ${contentData.pageKey}/${contentData.sectionKey}`)
      }
    }
    console.log(`✅ Page content seeding complete! Created ${pageContentsCreated} new content item(s).`)

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
