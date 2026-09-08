/**
 * Name, place and employment pools for the demo seed.
 *
 * Zimbabwean throughout — Shona, Ndebele and the settler-descended and Asian
 * surnames that are also part of the register. Fixture data that reads as
 * American makes a demo feel like someone else's product, and it makes the
 * demographics report meaningless as a preview of the real one.
 *
 * These are invented combinations, not real people.
 */

export const FIRST_NAMES_F = [
  'Tendai', 'Rutendo', 'Chiedza', 'Nyasha', 'Rumbidzai', 'Tariro', 'Farai', 'Anesu',
  'Nokuthula', 'Sibongile', 'Thandiwe', 'Nomsa', 'Bongiwe', 'Sithembile', 'Lindiwe',
  'Chipo', 'Vimbai', 'Shamiso', 'Tsitsi', 'Memory', 'Precious', 'Blessing', 'Charity',
  'Gamuchirai', 'Ropafadzo', 'Kudzai', 'Munyaradzi', 'Tapiwa', 'Rejoice', 'Fadzai',
  'Zvikomborero', 'Nyaradzo', 'Simbarashe', 'Ntombizodwa', 'Sikhanyiso', 'Priviledge',
  'Melody', 'Netsai', 'Yeukai', 'Panashe', 'Mitchell', 'Vongai', 'Kundai', 'Rudo'
] as const

export const FIRST_NAMES_M = [
  'Tinashe', 'Takudzwa', 'Tafadzwa', 'Munashe', 'Tapiwa', 'Farai', 'Kudakwashe',
  'Tonderai', 'Blessing', 'Simbarashe', 'Tatenda', 'Nigel', 'Wellington', 'Trymore',
  'Sipho', 'Mthokozisi', 'Nkosana', 'Bhekimpilo', 'Themba', 'Bongani', 'Sibusiso',
  'Learnmore', 'Godknows', 'Innocent', 'Tichaona', 'Shepherd', 'Munyaradzi',
  'Batsirai', 'Nyasha', 'Panashe', 'Tanaka', 'Anesu', 'Prosper', 'Admire', 'Talent',
  'Brighton', 'Norest', 'Tapfuma', 'Garikai', 'Ngonidzashe', 'Rodwell', 'Clemence'
] as const

export const SURNAMES = [
  'Moyo', 'Ncube', 'Sibanda', 'Dube', 'Nyathi', 'Mpofu', 'Ndlovu', 'Khumalo', 'Mabhena',
  'Chikore', 'Chirwa', 'Mutasa', 'Makoni', 'Mangwana', 'Nyambo', 'Chigumba', 'Mudenda',
  'Gumbo', 'Mhlanga', 'Marufu', 'Zvobgo', 'Musarurwa', 'Chimhini', 'Kanyemba', 'Muzenda',
  'Mataruse', 'Bhebhe', 'Nkomo', 'Masuku', 'Tshuma', 'Zulu', 'Mlambo', 'Ndoro', 'Chuma',
  'Chidyausiku', 'Mafukidze', 'Matimba', 'Rusike', 'Machingura', 'Chiwenga', 'Chinamasa',
  'Kadenge', 'Mangoma', 'Nhamburo', 'Chibaya', 'Mavhunga', 'Gwaunza', 'Mushayavanhu',
  'Van Niekerk', 'Coetzee', 'Naidoo', 'Patel', 'Ismail', 'De Souza', 'Botha'
] as const

/** Province, with the cities the seed will draw from for each. */
export const PROVINCES: ReadonlyArray<{ name: string; cities: readonly string[]; weight: number }> = [
  { name: 'Harare', cities: ['Harare', 'Chitungwiza', 'Epworth', 'Ruwa'], weight: 34 },
  { name: 'Bulawayo', cities: ['Bulawayo'], weight: 14 },
  { name: 'Manicaland', cities: ['Mutare', 'Rusape', 'Chipinge', 'Nyanga'], weight: 9 },
  { name: 'Mashonaland Central', cities: ['Bindura', 'Mount Darwin', 'Shamva'], weight: 5 },
  { name: 'Mashonaland East', cities: ['Marondera', 'Murehwa', 'Mutoko'], weight: 6 },
  { name: 'Mashonaland West', cities: ['Chinhoyi', 'Kariba', 'Kadoma', 'Chegutu'], weight: 7 },
  { name: 'Masvingo', cities: ['Masvingo', 'Chiredzi', 'Gutu'], weight: 7 },
  { name: 'Matabeleland North', cities: ['Hwange', 'Lupane', 'Victoria Falls'], weight: 4 },
  { name: 'Matabeleland South', cities: ['Gwanda', 'Beitbridge', 'Plumtree'], weight: 4 },
  { name: 'Midlands', cities: ['Gweru', 'Kwekwe', 'Zvishavane', 'Shurugwi'], weight: 10 }
]

export const INSTITUTIONS = [
  'University of Zimbabwe', 'National University of Science and Technology',
  'Midlands State University', 'Great Zimbabwe University', 'Chinhoyi University of Technology',
  'Harare Institute of Technology', 'Bindura University of Science Education',
  'Lupane State University', 'Africa University', 'Catholic University of Zimbabwe',
  'Zimbabwe Open University', 'Women’s University in Africa', 'Solusi University',
  'Speciss College', 'Harare Polytechnic', 'Bulawayo Polytechnic', 'Kwekwe Polytechnic',
  'University of Cape Town', 'University of Pretoria', 'University of London'
] as const

export const EMPLOYERS = [
  'Auditor-General’s Office', 'Zimbabwe Revenue Authority', 'Reserve Bank of Zimbabwe',
  'Public Service Commission', 'Ministry of Finance and Economic Development',
  'Zimbabwe Republic Police', 'National Prosecuting Authority', 'Deloitte Zimbabwe',
  'PricewaterhouseCoopers', 'Grant Thornton Zimbabwe', 'BDO Zimbabwe', 'KPMG Zimbabwe',
  'CBZ Holdings', 'Old Mutual Zimbabwe', 'Econet Wireless Zimbabwe', 'Delta Corporation',
  'Zimbabwe Electricity Supply Authority', 'City of Harare', 'City of Bulawayo',
  'Bulawayo City Council', 'Zimbabwe Anti-Corruption Commission', 'Transparency International Zimbabwe',
  'Zimbabwe National Water Authority', 'National Social Security Authority',
  'Zimbabwe Consolidated Diamond Company', 'Air Zimbabwe', 'NetOne Cellular',
  'Ministry of Justice, Legal and Parliamentary Affairs', 'Judicial Service Commission',
  'Zimbabwe Media Commission', 'Chartered Accountants Academy', 'Standard Chartered Zimbabwe'
] as const

export const FIELDS_OF_STUDY = [
  'Accounting', 'Forensic Accounting', 'Auditing', 'Law', 'Criminology', 'Police Studies',
  'Economics', 'Public Administration', 'Business Administration', 'Finance',
  'Information Systems', 'Computer Science', 'Cyber Security', 'Data Science',
  'Human Resource Management', 'Records and Archives Management', 'Journalism and Media Studies',
  'Development Studies', 'Political Science', 'Statistics', 'Procurement and Supply Chain'
] as const

export const PROFESSIONAL_BODIES = [
  'Institute of Chartered Accountants of Zimbabwe',
  'Association of Certified Fraud Examiners',
  'Institute of Internal Auditors Zimbabwe',
  'Law Society of Zimbabwe',
  'Chartered Institute of Procurement and Supply',
  'Institute of People Management Zimbabwe',
  'Computer Society of Zimbabwe',
  'Institute of Chartered Secretaries and Administrators'
] as const

export const HOW_HEARD = [
  'ZACC website', 'Newspaper advertisement', 'Referred by a colleague', 'LinkedIn',
  'Facebook', 'Radio', 'Public Service Commission circular', 'University careers office'
] as const

/**
 * Skills the keyword matcher will actually see. Split so an applicant can be
 * given a plausible mix: strong on their own discipline, thin elsewhere, which
 * is what produces a spread of keyword-match percentages rather than a wall of
 * identical scores.
 */
export const SKILL_POOLS = {
  investigation: [
    'forensic investigation', 'evidence handling', 'witness interviewing', 'case management',
    'asset tracing', 'surveillance', 'statement taking', 'crime scene management',
    'intelligence analysis', 'docket preparation'
  ],
  audit: [
    'forensic audit', 'internal audit', 'risk assessment', 'internal controls',
    'financial statement analysis', 'IFRS', 'sampling', 'audit planning',
    'fraud detection', 'reconciliation', 'ACL', 'CaseWare'
  ],
  legal: [
    'criminal procedure', 'prosecution', 'legal drafting', 'legal research',
    'civil litigation', 'administrative law', 'constitutional law', 'court advocacy',
    'contract drafting', 'mutual legal assistance'
  ],
  finance: [
    'management accounting', 'budgeting', 'payroll', 'accounts payable', 'Pastel',
    'SAP', 'Sage', 'financial reporting', 'cash flow forecasting', 'treasury'
  ],
  it: [
    'digital forensics', 'EnCase', 'network security', 'incident response', 'SQL',
    'Python', 'Linux administration', 'penetration testing', 'log analysis',
    'data recovery', 'Power BI', 'Microsoft 365 administration'
  ],
  admin: [
    'records management', 'minute taking', 'diary management', 'procurement',
    'stakeholder liaison', 'report writing', 'stores control', 'fleet management'
  ],
  hr: [
    'recruitment and selection', 'industrial relations', 'performance management',
    'job evaluation', 'payroll administration', 'training and development',
    'labour law', 'employee wellness'
  ],
  comms: [
    'media relations', 'press releases', 'social media management', 'public speaking',
    'content production', 'crisis communication', 'stakeholder engagement', 'photography'
  ],
  generic: [
    'Microsoft Excel', 'Microsoft Word', 'PowerPoint', 'report writing', 'teamwork',
    'time management', 'communication skills', 'driving', 'minute taking', 'filing'
  ]
} as const

export type SkillDomain = keyof typeof SKILL_POOLS

export const JOB_TITLES_BY_DOMAIN: Record<SkillDomain, readonly string[]> = {
  investigation: ['Investigations Officer', 'Detective Constable', 'Case Officer', 'Intelligence Analyst'],
  audit: ['Internal Auditor', 'Audit Senior', 'Forensic Accountant', 'Assurance Associate'],
  legal: ['Legal Officer', 'Public Prosecutor', 'Legal Counsel', 'Legal Assistant'],
  finance: ['Accountant', 'Assistant Accountant', 'Finance Officer', 'Management Accountant'],
  it: ['Systems Administrator', 'IT Support Officer', 'Security Analyst', 'Database Administrator'],
  admin: ['Administrative Assistant', 'Registry Clerk', 'Office Administrator', 'Procurement Officer'],
  hr: ['Human Resources Officer', 'HR Assistant', 'Training Officer', 'Payroll Administrator'],
  comms: ['Communications Officer', 'Public Relations Officer', 'Media Liaison', 'Content Producer'],
  generic: ['Officer', 'Assistant', 'Clerk', 'Coordinator']
}

export const REASONS_FOR_LEAVING = [
  'Career progression', 'Contract ended', 'Organisational restructuring', 'Relocation',
  'Better remuneration', 'Studies', 'Post abolished', 'Currently employed'
] as const

/** Kept small on purpose: a demo register with 60 disability disclosures is not realistic. */
export const DISABILITY_DETAIL = [
  'Partial hearing loss in the left ear; uses a hearing aid.',
  'Mobility impairment; requires ground-floor or lift access.',
  'Low vision; uses screen-magnification software.'
] as const
