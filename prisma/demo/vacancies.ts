/**
 * Vacancy archetypes and their scoring schemes.
 *
 * Each archetype carries a *real* scheme — criteria, disqualifiers, document
 * slots, keyword sets — because the demo scores are computed by the same engine
 * the application uses. Fabricated numbers would make the console look right and
 * teach QA nothing; a vacancy with no criteria scores every applicant zero.
 *
 * Bucket weights sum to 100 in every archetype, which the builder validates and
 * the console shows in its header.
 */
import type { SkillDomain } from './pools'

export interface CriterionSpec {
  key: string
  label: string
  bucket: 'QUALIFICATIONS_EXPERIENCE' | 'SKILLS' | 'INTEGRITY' | 'FIT'
  type: 'BANDED' | 'QUALIFICATION_LADDER' | 'KEYWORD' | 'BOOLEAN' | 'CHOICE' | 'MANUAL'
  weight: number
  maxPoints: number
  sourceField?: string | null
  config: Record<string, unknown>
  isPanelScored?: boolean
  showToCandidate?: boolean
}

export interface DisqualifierSpec {
  key: string
  label: string
  type:
    | 'MIN_NUMERIC' | 'MAX_NUMERIC' | 'REQUIRED_TRUE' | 'REQUIRED_FALSE'
    | 'REQUIRED_QUALIFICATION' | 'VALUE_IN' | 'VALUE_NOT_IN' | 'MISSING_DOCUMENT'
    | 'AGE_RANGE' | 'CLOSING_DATE'
  sourceField?: string | null
  config: Record<string, unknown>
  action: 'AUTO_REJECT' | 'FLAG_ONLY'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  publicReason?: string
  internalReason?: string
}

export interface Archetype {
  slugStem: string
  titles: readonly string[]
  department: string
  domain: SkillDomain
  /** Fields of study that make an applicant a genuine match. */
  fields: readonly string[]
  keywords: { required: string[]; preferred: string[]; synonyms?: Record<string, string[]> }
  minYearsExperience: number
  requiredQualification: 'DIPLOMA' | 'FIRST_DEGREE' | 'MASTERS'
  bucketWeights: Record<string, number>
  criteria: CriterionSpec[]
  disqualifiers: DisqualifierSpec[]
  responsibilities: string[]
  requirements: string[]
}

/** The experience bands every archetype shares — the "5–10 years" case ZACC asked for. */
const experienceBands = (min: number) => ({
  kind: 'BANDED',
  unit: 'years',
  bands: [
    { label: `Below ${min} years`, min: 0, max: Math.max(min - 1, 0), points: 0 },
    { label: `${min}–${min + 2} years`, min, max: min + 2, points: 40 },
    { label: `${min + 3}–${min + 5} years`, min: min + 3, max: min + 5, points: 70 },
    { label: `${min + 6}–${min + 10} years`, min: min + 6, max: min + 10, points: 90 },
    { label: `Over ${min + 10} years`, min: min + 11, max: null, points: 100 }
  ]
})

const qualificationLadder = {
  kind: 'QUALIFICATION_LADDER',
  ladder: [
    { level: 'DOCTORATE', points: 100 },
    { level: 'MASTERS', points: 95 },
    { level: 'POSTGRAD_DIPLOMA', points: 85 },
    { level: 'FIRST_DEGREE', points: 75 },
    { level: 'HIGHER_DIPLOMA', points: 60 },
    { level: 'DIPLOMA', points: 45 },
    { level: 'CERTIFICATE', points: 25 },
    { level: 'A_LEVEL', points: 10 },
    { level: 'O_LEVEL', points: 0 },
    { level: 'GRADE_7', points: 0 }
  ],
  creditAdditional: true,
  additionalPointsEach: 4,
  cap: 12
}

const noticePeriodBands = {
  kind: 'BANDED',
  unit: 'days',
  bands: [
    { label: 'Immediately available', min: 0, max: 7, points: 100 },
    { label: 'Up to one month', min: 8, max: 31, points: 80 },
    { label: 'One to three months', min: 32, max: 92, points: 45 },
    { label: 'Over three months', min: 93, max: null, points: 10 }
  ]
}

/** Shared integrity block. Every ZACC post carries these three. */
const integrityCriteria = (): CriterionSpec[] => [
  {
    key: 'consents_to_vetting',
    label: 'Consents to vetting and asset declaration',
    bucket: 'INTEGRITY',
    type: 'BOOLEAN',
    weight: 2,
    maxPoints: 100,
    sourceField: 'declarations.vetting.answer',
    // Inverted on purpose: refusing vetting is the adverse answer here.
    config: { kind: 'BOOLEAN', truePoints: 100, falsePoints: 0 }
  },
  {
    key: 'no_corruption_investigation',
    label: 'No current or prior corruption investigation',
    bucket: 'INTEGRITY',
    type: 'BOOLEAN',
    weight: 2,
    maxPoints: 100,
    sourceField: 'declarations.corruption.answer',
    config: { kind: 'BOOLEAN', truePoints: 0, falsePoints: 100 }
  },
  {
    key: 'panel_integrity_assessment',
    label: 'Panel assessment of integrity and suitability',
    bucket: 'INTEGRITY',
    type: 'MANUAL',
    weight: 1,
    maxPoints: 100,
    isPanelScored: true,
    showToCandidate: false,
    config: {
      kind: 'MANUAL',
      rubric: [
        { label: 'Serious concerns', points: 10, guidance: 'Unexplained gaps, evasive answers, or unresolved declarations.' },
        { label: 'Some reservations', points: 40, guidance: 'Minor concerns that would need follow-up before appointment.' },
        { label: 'Satisfactory', points: 70, guidance: 'Nothing adverse; consistent account throughout.' },
        { label: 'Exemplary', points: 100, guidance: 'Demonstrable record of integrity under pressure.' }
      ]
    }
  }
]

const fitCriteria = (): CriterionSpec[] => [
  {
    key: 'notice_period',
    label: 'Availability / notice period',
    bucket: 'FIT',
    type: 'BANDED',
    weight: 2,
    maxPoints: 100,
    sourceField: 'position.noticePeriodDays',
    config: noticePeriodBands
  },
  {
    key: 'willing_to_relocate',
    label: 'Willing to relocate to the duty station',
    bucket: 'FIT',
    type: 'BOOLEAN',
    weight: 1,
    maxPoints: 100,
    sourceField: 'position.willingToRelocate',
    config: { kind: 'BOOLEAN', truePoints: 100, falsePoints: 35 }
  }
]

/** The two disqualifiers every ZACC post carries. */
const baseDisqualifiers = (minYears: number, level: string): DisqualifierSpec[] => [
  {
    key: 'vetting_refused',
    label: 'Declined background vetting',
    type: 'REQUIRED_TRUE',
    sourceField: 'declarations.vetting.answer',
    config: { detail: 'Vetting is a condition of employment at the Commission.' },
    action: 'AUTO_REJECT',
    severity: 'CRITICAL',
    publicReason: 'Consent to background vetting is a condition of employment at the Commission.',
    internalReason: 'Candidate declined the vetting and asset-declaration undertaking.'
  },
  {
    key: 'criminal_record',
    label: 'Criminal record or pending prosecution declared',
    type: 'REQUIRED_FALSE',
    sourceField: 'declarations.criminal.answer',
    config: { detail: 'A criminal record was declared on the application.' },
    action: 'AUTO_REJECT',
    severity: 'CRITICAL',
    publicReason: 'Your application did not meet the mandatory requirements for this post.',
    internalReason: 'Adverse criminal declaration. Review the explanation before upholding.'
  },
  {
    key: 'minimum_experience',
    label: `Fewer than ${minYears} years of relevant experience`,
    type: 'MIN_NUMERIC',
    sourceField: 'employment.totalYears',
    config: { value: minYears, failWhenMissing: true },
    action: 'AUTO_REJECT',
    severity: 'HIGH',
    publicReason: `The post requires a minimum of ${minYears} years of relevant experience.`,
    internalReason: 'Below the advertised minimum experience.'
  },
  {
    key: 'minimum_qualification',
    label: 'Below the minimum qualification',
    type: 'REQUIRED_QUALIFICATION',
    config: { level },
    action: 'AUTO_REJECT',
    severity: 'HIGH',
    publicReason: 'Your highest qualification is below the minimum advertised for this post.',
    internalReason: 'Highest qualification below the advertised minimum.'
  },
  {
    key: 'corruption_investigation',
    label: 'Declared a corruption investigation',
    type: 'REQUIRED_FALSE',
    sourceField: 'declarations.corruption.answer',
    // Flagged, not auto-rejected: an investigation that concluded in the
    // candidate's favour is not a disqualification, and a machine cannot tell
    // the difference from a yes/no field.
    config: { detail: 'A corruption investigation was declared.' },
    action: 'FLAG_ONLY',
    severity: 'HIGH',
    internalReason: 'Read the declaration explanation before proceeding.'
  }
]

function scheme(opts: {
  domain: SkillDomain
  minYears: number
  keywordWeight?: number
}): CriterionSpec[] {
  return [
    {
      key: 'years_experience',
      label: 'Years of relevant experience',
      bucket: 'QUALIFICATIONS_EXPERIENCE',
      type: 'BANDED',
      weight: 3,
      maxPoints: 100,
      sourceField: 'employment.totalYears',
      config: experienceBands(opts.minYears)
    },
    {
      key: 'highest_qualification',
      label: 'Highest qualification attained',
      bucket: 'QUALIFICATIONS_EXPERIENCE',
      type: 'QUALIFICATION_LADDER',
      weight: 2,
      maxPoints: 100,
      config: qualificationLadder
    },
    {
      key: 'currently_employed',
      label: 'Currently in relevant employment',
      bucket: 'QUALIFICATIONS_EXPERIENCE',
      type: 'BOOLEAN',
      weight: 1,
      maxPoints: 100,
      sourceField: 'employment.isCurrentlyEmployed',
      config: { kind: 'BOOLEAN', truePoints: 100, falsePoints: 60 }
    },
    {
      key: 'technical_keywords',
      label: 'Technical skills match',
      bucket: 'SKILLS',
      type: 'KEYWORD',
      weight: opts.keywordWeight ?? 3,
      maxPoints: 100,
      config: { kind: 'KEYWORD', required: [], preferred: [], requiredWeight: 0.7 }
    },
    {
      key: 'panel_technical_assessment',
      label: 'Panel assessment of technical competence',
      bucket: 'SKILLS',
      type: 'MANUAL',
      weight: 2,
      maxPoints: 100,
      isPanelScored: true,
      showToCandidate: false,
      config: {
        kind: 'MANUAL',
        rubric: [
          { label: 'Does not meet', points: 20, guidance: 'Cannot demonstrate the core competencies for the grade.' },
          { label: 'Partially meets', points: 50, guidance: 'Some competencies present; would need substantial support.' },
          { label: 'Meets', points: 75, guidance: 'Competent across the core requirements.' },
          { label: 'Exceeds', points: 100, guidance: 'Would strengthen the unit from day one.' }
        ]
      }
    },
    ...integrityCriteria(),
    ...fitCriteria()
  ]
}

export const ARCHETYPES: readonly Archetype[] = [
  {
    slugStem: 'investigations-officer',
    titles: ['Investigations Officer', 'Senior Investigations Officer', 'Principal Investigations Officer'],
    department: 'investigations',
    domain: 'investigation',
    fields: ['Criminology', 'Police Studies', 'Law', 'Forensic Accounting'],
    keywords: {
      required: ['forensic investigation', 'evidence handling', 'witness interviewing', 'case management'],
      preferred: ['asset tracing', 'intelligence analysis', 'surveillance', 'docket preparation', 'statement taking'],
      synonyms: {
        'forensic investigation': ['forensic investigations', 'fraud investigation', 'criminal investigation'],
        'witness interviewing': ['interviewing witnesses', 'suspect interviewing', 'investigative interviewing'],
        'evidence handling': ['chain of custody', 'exhibit management']
      }
    },
    minYearsExperience: 4,
    requiredQualification: 'FIRST_DEGREE',
    bucketWeights: { QUALIFICATIONS_EXPERIENCE: 35, SKILLS: 30, INTEGRITY: 25, FIT: 10 },
    criteria: scheme({ domain: 'investigation', minYears: 4 }),
    disqualifiers: baseDisqualifiers(4, 'FIRST_DEGREE'),
    responsibilities: [
      'Conduct investigations into allegations of corruption, fraud and abuse of office.',
      'Gather, preserve and document evidence in line with the Criminal Procedure and Evidence Act.',
      'Interview complainants, witnesses and suspects and record statements.',
      'Prepare investigation dockets for referral to the National Prosecuting Authority.',
      'Trace and recover proceeds of corruption in coordination with the Asset Recovery Unit.'
    ],
    requirements: [
      'A first degree in Criminology, Law, Police Studies, Forensic Accounting or equivalent.',
      'At least four years of investigative experience in a law-enforcement or regulatory setting.',
      'Working knowledge of the Anti-Corruption Commission Act and the Criminal Procedure and Evidence Act.',
      'Clean criminal record and willingness to undergo full vetting and asset declaration.',
      'A valid class 4 driver’s licence.'
    ]
  },
  {
    slugStem: 'forensic-auditor',
    titles: ['Forensic Auditor', 'Senior Forensic Auditor', 'Forensic Audit Manager'],
    department: 'compliance',
    domain: 'audit',
    fields: ['Forensic Accounting', 'Accounting', 'Auditing', 'Finance'],
    keywords: {
      required: ['forensic audit', 'internal controls', 'fraud detection', 'financial statement analysis'],
      preferred: ['IFRS', 'risk assessment', 'reconciliation', 'audit planning', 'CaseWare', 'ACL'],
      synonyms: {
        'forensic audit': ['forensic auditing', 'investigative audit'],
        'fraud detection': ['fraud examination', 'fraud risk'],
        'internal controls': ['control environment', 'control testing']
      }
    },
    minYearsExperience: 5,
    requiredQualification: 'FIRST_DEGREE',
    bucketWeights: { QUALIFICATIONS_EXPERIENCE: 40, SKILLS: 30, INTEGRITY: 20, FIT: 10 },
    criteria: scheme({ domain: 'audit', minYears: 5 }),
    disqualifiers: baseDisqualifiers(5, 'FIRST_DEGREE'),
    responsibilities: [
      'Plan and execute forensic audits of public entities referred to the Commission.',
      'Quantify losses arising from corrupt practice and prepare expert reports.',
      'Test internal control environments and report control failures.',
      'Give expert testimony in court where required.'
    ],
    requirements: [
      'A first degree in Accounting, Auditing or Forensic Accounting.',
      'CA(Z), ACCA, CIA or CFE would be a distinct advantage.',
      'At least five years of audit experience, of which two in forensic or investigative audit.',
      'Willingness to undergo full vetting and asset declaration.'
    ]
  },
  {
    slugStem: 'legal-officer',
    titles: ['Legal Officer', 'Senior Legal Officer', 'Principal Legal Officer'],
    department: 'legal',
    domain: 'legal',
    fields: ['Law'],
    keywords: {
      required: ['criminal procedure', 'legal drafting', 'legal research', 'prosecution'],
      preferred: ['court advocacy', 'administrative law', 'constitutional law', 'mutual legal assistance', 'contract drafting'],
      synonyms: {
        prosecution: ['prosecuting', 'public prosecution', 'criminal prosecution'],
        'legal drafting': ['drafting pleadings', 'drafting opinions']
      }
    },
    minYearsExperience: 3,
    requiredQualification: 'FIRST_DEGREE',
    bucketWeights: { QUALIFICATIONS_EXPERIENCE: 35, SKILLS: 35, INTEGRITY: 20, FIT: 10 },
    criteria: scheme({ domain: 'legal', minYears: 3, keywordWeight: 4 }),
    disqualifiers: baseDisqualifiers(3, 'FIRST_DEGREE'),
    responsibilities: [
      'Advise investigation teams on the legal sufficiency of evidence.',
      'Draft opinions, warrants, applications and correspondence.',
      'Represent the Commission before the courts and administrative tribunals.',
      'Support mutual legal assistance requests with foreign jurisdictions.'
    ],
    requirements: [
      'An LLB degree and registration as a legal practitioner in Zimbabwe.',
      'At least three years of post-admission experience.',
      'Demonstrable criminal-law experience.',
      'Willingness to undergo full vetting and asset declaration.'
    ]
  },
  {
    slugStem: 'ict-officer',
    titles: ['ICT Officer', 'Digital Forensics Analyst', 'Systems Administrator', 'Cyber Security Analyst'],
    department: 'it',
    domain: 'it',
    fields: ['Computer Science', 'Information Systems', 'Cyber Security', 'Data Science'],
    keywords: {
      required: ['digital forensics', 'network security', 'incident response'],
      preferred: ['EnCase', 'Linux administration', 'SQL', 'Python', 'log analysis', 'penetration testing', 'data recovery'],
      synonyms: {
        'digital forensics': ['computer forensics', 'cyber forensics', 'mobile forensics'],
        'incident response': ['security incident', 'breach response']
      }
    },
    minYearsExperience: 3,
    requiredQualification: 'FIRST_DEGREE',
    bucketWeights: { QUALIFICATIONS_EXPERIENCE: 30, SKILLS: 40, INTEGRITY: 20, FIT: 10 },
    criteria: scheme({ domain: 'it', minYears: 3, keywordWeight: 4 }),
    disqualifiers: baseDisqualifiers(3, 'FIRST_DEGREE'),
    responsibilities: [
      'Acquire and analyse digital evidence in line with forensic best practice.',
      'Maintain the Commission’s network, endpoints and case-management systems.',
      'Respond to security incidents and maintain the incident register.',
      'Support investigators with data extraction and analysis.'
    ],
    requirements: [
      'A first degree in Computer Science, Information Systems or Cyber Security.',
      'At least three years in a similar role.',
      'Recognised digital-forensics or security certification is an advantage.',
      'Willingness to undergo full vetting and asset declaration.'
    ]
  },
  {
    slugStem: 'finance-officer',
    titles: ['Finance Officer', 'Accountant', 'Management Accountant', 'Assistant Accountant'],
    department: 'finance',
    domain: 'finance',
    fields: ['Accounting', 'Finance', 'Economics'],
    keywords: {
      required: ['financial reporting', 'budgeting', 'reconciliation'],
      preferred: ['Pastel', 'SAP', 'management accounting', 'payroll', 'cash flow forecasting', 'treasury'],
      synonyms: {
        'financial reporting': ['financial statements', 'monthly reporting'],
        reconciliation: ['bank reconciliation', 'reconciliations']
      }
    },
    minYearsExperience: 3,
    requiredQualification: 'DIPLOMA',
    bucketWeights: { QUALIFICATIONS_EXPERIENCE: 40, SKILLS: 25, INTEGRITY: 25, FIT: 10 },
    criteria: scheme({ domain: 'finance', minYears: 3, keywordWeight: 2 }),
    disqualifiers: baseDisqualifiers(3, 'DIPLOMA'),
    responsibilities: [
      'Prepare monthly management accounts and the annual financial statements.',
      'Maintain the general ledger and perform monthly reconciliations.',
      'Administer the payroll and statutory returns.',
      'Support the Auditor-General’s annual audit of the Commission.'
    ],
    requirements: [
      'A diploma or degree in Accounting or Finance.',
      'At least three years in a finance function.',
      'Working knowledge of the Public Finance Management Act.',
      'Willingness to undergo full vetting and asset declaration.'
    ]
  },
  {
    slugStem: 'human-resources-officer',
    titles: ['Human Resources Officer', 'HR Assistant', 'Training and Development Officer'],
    department: 'hr',
    domain: 'hr',
    fields: ['Human Resource Management', 'Public Administration', 'Business Administration'],
    keywords: {
      required: ['recruitment and selection', 'industrial relations', 'performance management'],
      preferred: ['job evaluation', 'labour law', 'payroll administration', 'training and development', 'employee wellness'],
      synonyms: {
        'recruitment and selection': ['recruitment', 'talent acquisition', 'selection'],
        'industrial relations': ['employee relations', 'labour relations']
      }
    },
    minYearsExperience: 3,
    requiredQualification: 'DIPLOMA',
    bucketWeights: { QUALIFICATIONS_EXPERIENCE: 35, SKILLS: 30, INTEGRITY: 20, FIT: 15 },
    criteria: scheme({ domain: 'hr', minYears: 3, keywordWeight: 3 }),
    disqualifiers: baseDisqualifiers(3, 'DIPLOMA'),
    responsibilities: [
      'Run recruitment and selection processes end to end.',
      'Administer conditions of service and the performance management cycle.',
      'Advise management on the Labour Act and Commission policy.',
      'Coordinate staff training and development.'
    ],
    requirements: [
      'A diploma or degree in Human Resource Management or Public Administration.',
      'At least three years in a human resources function.',
      'IPMZ membership is an advantage.',
      'Willingness to undergo full vetting and asset declaration.'
    ]
  },
  {
    slugStem: 'communications-officer',
    titles: ['Communications Officer', 'Public Relations Officer', 'Media Liaison Officer'],
    department: 'communications',
    domain: 'comms',
    fields: ['Journalism and Media Studies', 'Development Studies', 'Political Science'],
    keywords: {
      required: ['media relations', 'press releases', 'stakeholder engagement'],
      preferred: ['social media management', 'crisis communication', 'content production', 'public speaking', 'photography'],
      synonyms: {
        'media relations': ['press relations', 'media liaison'],
        'press releases': ['media statements', 'press statements']
      }
    },
    minYearsExperience: 2,
    requiredQualification: 'DIPLOMA',
    bucketWeights: { QUALIFICATIONS_EXPERIENCE: 30, SKILLS: 35, INTEGRITY: 20, FIT: 15 },
    criteria: scheme({ domain: 'comms', minYears: 2, keywordWeight: 4 }),
    disqualifiers: baseDisqualifiers(2, 'DIPLOMA'),
    responsibilities: [
      'Draft press statements, speeches and public awareness material.',
      'Manage the Commission’s media relationships and social media presence.',
      'Support public education campaigns in all ten provinces.',
      'Handle media enquiries within the approved communications protocol.'
    ],
    requirements: [
      'A diploma or degree in Journalism, Media Studies or Communications.',
      'At least two years in a communications or media role.',
      'Excellent written and spoken English; Shona and/or Ndebele an advantage.',
      'Willingness to undergo full vetting and asset declaration.'
    ]
  },
  {
    slugStem: 'administrative-assistant',
    titles: ['Administrative Assistant', 'Registry Clerk', 'Office Administrator', 'Procurement Officer'],
    department: 'administration',
    domain: 'admin',
    fields: ['Public Administration', 'Business Administration', 'Records and Archives Management', 'Procurement and Supply Chain'],
    keywords: {
      required: ['records management', 'report writing'],
      preferred: ['minute taking', 'procurement', 'diary management', 'stakeholder liaison', 'stores control'],
      synonyms: {
        'records management': ['registry', 'filing systems', 'archives'],
        'minute taking': ['minutes', 'secretariat support']
      }
    },
    minYearsExperience: 2,
    requiredQualification: 'DIPLOMA',
    bucketWeights: { QUALIFICATIONS_EXPERIENCE: 30, SKILLS: 25, INTEGRITY: 25, FIT: 20 },
    criteria: scheme({ domain: 'admin', minYears: 2, keywordWeight: 2 }),
    disqualifiers: baseDisqualifiers(2, 'DIPLOMA'),
    responsibilities: [
      'Maintain the registry and the Commission’s records retention schedule.',
      'Provide secretariat support to management meetings.',
      'Raise requisitions and manage stores in line with procurement regulations.',
      'Handle front-office enquiries and correspondence.'
    ],
    requirements: [
      'A diploma in Public Administration, Records Management or equivalent.',
      'At least two years in an administrative role.',
      'Strong Microsoft Office skills.',
      'Willingness to undergo full vetting and asset declaration.'
    ]
  }
]

export const DOCUMENT_SLOTS = [
  {
    key: 'cv', label: 'Curriculum vitae', isMandatory: true,
    description: 'A detailed CV including three contactable referees.',
    allowedExtensions: ['pdf', 'doc', 'docx'], maxSizeBytes: 5_242_880, sortOrder: 1
  },
  {
    key: 'national_id', label: 'National identity document', isMandatory: true,
    description: 'A clear copy of your national ID or passport.',
    allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], maxSizeBytes: 3_145_728, sortOrder: 2
  },
  {
    key: 'certificates', label: 'Certified academic certificates', isMandatory: true,
    description: 'Certified copies of every qualification listed on your application.',
    allowedExtensions: ['pdf'], allowMultiple: true, maxFiles: 6, maxSizeBytes: 10_485_760, sortOrder: 3
  },
  {
    key: 'professional_membership', label: 'Professional membership certificate', isMandatory: false,
    description: 'Where you have claimed membership of a professional body.',
    allowedExtensions: ['pdf', 'jpg', 'png'], maxSizeBytes: 3_145_728, sortOrder: 4
  },
  {
    key: 'police_clearance', label: 'Police clearance certificate', isMandatory: false,
    description: 'Issued within the last twelve months. Required before appointment.',
    allowedExtensions: ['pdf'], maxSizeBytes: 3_145_728, sortOrder: 5
  }
] as const

export const GRADES = ['D1', 'D2', 'D3', 'C1', 'C2', 'C3', 'B1', 'B2'] as const
