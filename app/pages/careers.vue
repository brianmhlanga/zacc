<template>
  <NuxtLayout name="main">
    <div>
      <!-- Hero Section -->
    <section class="relative isolate overflow-hidden bg-zaccGreen text-white py-24">
      <div class="absolute inset-0">
        <img src="/businessman.jpg" alt="Careers" class="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div class="absolute inset-0 bg-zaccGreen/90"></div>
      </div>
      <div class="relative mx-auto max-w-7xl px-6">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Careers at ZACC</h1>
          <p class="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
            Join us in the fight against corruption. Build a meaningful career while serving Zimbabwe.
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="relative py-20">
      <div
        class="absolute inset-0 -z-10 opacity-20"
        style="background: radial-gradient(40% 40% at 50% 0%, rgba(212,175,55,0.15), transparent)"
      ></div>
      <div class="mx-auto max-w-7xl px-6">
        <!-- Why Work at ZACC -->
        <div class="mb-16">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold mb-4">Why Work at ZACC?</h2>
            <div class="h-1 w-20 rounded bg-zaccGold mx-auto mb-6"></div>
            <p class="text-zaccBlack/70 max-w-3xl mx-auto">
              Join a team dedicated to integrity, transparency, and justice. Make a real difference in Zimbabwe's future.
            </p>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card class="text-center border-l-4 border-l-zaccGreen">
              <template #content>
                <div class="p-6">
                  <div class="w-16 h-16 rounded-full bg-zaccGreen/10 flex items-center justify-center mx-auto mb-4">
                    <i class="pi pi-heart text-zaccGreen text-3xl"></i>
                  </div>
                  <h3 class="font-extrabold text-lg mb-2">Purpose-Driven</h3>
                  <p class="text-sm text-zaccBlack/70">Work that makes a meaningful impact on society</p>
                </div>
              </template>
            </Card>
            <Card class="text-center border-l-4 border-l-zaccGold">
              <template #content>
                <div class="p-6">
                  <div class="w-16 h-16 rounded-full bg-zaccGold/10 flex items-center justify-center mx-auto mb-4">
                    <i class="pi pi-graduation-cap text-zaccGold text-3xl"></i>
                  </div>
                  <h3 class="font-extrabold text-lg mb-2">Professional Growth</h3>
                  <p class="text-sm text-zaccBlack/70">Continuous learning and development opportunities</p>
                </div>
              </template>
            </Card>
            <Card class="text-center border-l-4 border-l-zaccGreen">
              <template #content>
                <div class="p-6">
                  <div class="w-16 h-16 rounded-full bg-zaccGreen/10 flex items-center justify-center mx-auto mb-4">
                    <i class="pi pi-users text-zaccGreen text-3xl"></i>
                  </div>
                  <h3 class="font-extrabold text-lg mb-2">Team Environment</h3>
                  <p class="text-sm text-zaccBlack/70">Collaborative and supportive workplace culture</p>
                </div>
              </template>
            </Card>
            <Card class="text-center border-l-4 border-l-zaccGold">
              <template #content>
                <div class="p-6">
                  <div class="w-16 h-16 rounded-full bg-zaccGold/10 flex items-center justify-center mx-auto mb-4">
                    <i class="pi pi-shield text-zaccGold text-3xl"></i>
                  </div>
                  <h3 class="font-extrabold text-lg mb-2">Competitive Benefits</h3>
                  <p class="text-sm text-zaccBlack/70">Comprehensive benefits and compensation package</p>
                </div>
              </template>
            </Card>
          </div>
        </div>

        <!-- Search and Filter -->
        <div class="mb-12 rounded-2xl bg-white p-6 shadow-lg border border-zaccGreen/10">
          <div class="grid gap-6 lg:grid-cols-3">
            <div class="lg:col-span-2">
              <label for="jobSearch" class="block text-sm font-semibold text-zaccBlack mb-2">
                Search Jobs
              </label>
              <div class="relative">
                <InputText
                  id="jobSearch"
                  v-model="searchQuery"
                  placeholder="Search by job title, department, or keywords..."
                  class="w-full pl-10"
                />
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-zaccBlack/40"></i>
              </div>
            </div>
            <div>
              <label for="departmentFilter" class="block text-sm font-semibold text-zaccBlack mb-2">
                Filter by Department
              </label>
              <Dropdown
                id="departmentFilter"
                v-model="selectedDepartment"
                :options="departments"
                optionLabel="label"
                optionValue="value"
                placeholder="All Departments"
                class="w-full"
                showClear
              />
            </div>
          </div>
        </div>

        <!-- Job Listings -->
        <div v-if="filteredJobs.length > 0" class="space-y-6 mb-12">
          <Card
            v-for="job in paginatedJobs"
            :key="job.id"
            class="hover:shadow-lg transition-all"
          >
            <template #content>
              <div class="p-6">
                <div class="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div class="flex-1">
                    <div class="flex items-start justify-between gap-4 mb-3">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <h3 class="text-xl font-extrabold text-zaccBlack hover:text-zaccGreen transition-colors">
                            {{ job.title }}
                          </h3>
                          <Badge :value="job.type" :severity="getJobTypeSeverity(job.type)" />
                        </div>
                        <div class="flex flex-wrap items-center gap-4 text-sm text-zaccBlack/60 mb-3">
                          <div class="flex items-center gap-2">
                            <i class="pi pi-building"></i>
                            <span>{{ job.department }}</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <i class="pi pi-map-marker"></i>
                            <span>{{ job.location }}</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <i class="pi pi-calendar"></i>
                            <span>Closes: {{ formatDate(job.closingDate) }}</span>
                          </div>
                        </div>
                        <p class="text-zaccBlack/70 leading-relaxed mb-4">
                          {{ job.summary }}
                        </p>
                        <div class="flex flex-wrap gap-2">
                          <Tag v-for="requirement in job.keyRequirements.slice(0, 3)" :key="requirement" :value="requirement" severity="secondary" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex-shrink-0 flex flex-col gap-2">
                    <Button
                      label="View Details"
                      icon="pi pi-eye"
                      severity="secondary"
                      outlined
                      @click="viewJob(job)"
                    />
                    <Button
                      label="Apply Now"
                      icon="pi pi-send"
                      @click="applyForJob(job)"
                      style="background: #209341; border-color: #209341;"
                    />
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- No Results -->
        <div v-else class="text-center py-20">
          <i class="pi pi-briefcase text-6xl text-zaccBlack/20 mb-4"></i>
          <h3 class="text-xl font-semibold text-zaccBlack mb-2">No Jobs Found</h3>
          <p class="text-zaccBlack/60">Try adjusting your search or filter criteria.</p>
        </div>

        <!-- Pagination -->
        <div v-if="filteredJobs.length > itemsPerPage" class="flex justify-center mt-12">
          <Paginator
            :rows="itemsPerPage"
            :totalRecords="filteredJobs.length"
            :first="(currentPage - 1) * itemsPerPage"
            @page="onPageChange"
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          />
        </div>

        <!-- How to Apply Section -->
        <div class="mt-16 rounded-2xl bg-gradient-to-r from-zaccGreen/10 to-zaccGold/10 p-8 border border-zaccGreen/20">
          <h2 class="text-2xl font-extrabold mb-6 text-center">How to Apply</h2>
          <div class="grid gap-6 sm:grid-cols-3">
            <div class="text-center">
              <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span class="text-2xl font-extrabold text-zaccGreen">1</span>
              </div>
              <h3 class="font-semibold mb-2">Find a Position</h3>
              <p class="text-sm text-zaccBlack/70">Browse available positions and find the role that matches your skills</p>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span class="text-2xl font-extrabold text-zaccGreen">2</span>
              </div>
              <h3 class="font-semibold mb-2">Submit Application</h3>
              <p class="text-sm text-zaccBlack/70">Complete the application form and upload your CV and cover letter</p>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span class="text-2xl font-extrabold text-zaccGreen">3</span>
              </div>
              <h3 class="font-semibold mb-2">Interview Process</h3>
              <p class="text-sm text-zaccBlack/70">Selected candidates will be contacted for interviews and assessments</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Job Detail Dialog -->
    <Dialog
      v-model:visible="showJobDialog"
      :header="selectedJob?.title"
      :modal="true"
      :style="{ width: '90vw', maxWidth: '900px' }"
      :closable="true"
    >
      <div v-if="selectedJob" class="space-y-6">
        <div class="flex flex-wrap items-center gap-4 text-sm text-zaccBlack/60 pb-4 border-b">
          <div class="flex items-center gap-2">
            <i class="pi pi-building"></i>
            <span class="font-semibold">Department:</span>
            <span>{{ selectedJob.department }}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-map-marker"></i>
            <span class="font-semibold">Location:</span>
            <span>{{ selectedJob.location }}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar"></i>
            <span class="font-semibold">Closing Date:</span>
            <span>{{ formatDate(selectedJob.closingDate) }}</span>
          </div>
          <Badge :value="selectedJob.type" :severity="getJobTypeSeverity(selectedJob.type)" />
        </div>

        <div class="prose max-w-none">
          <h4 class="font-extrabold text-lg mb-3">Job Description</h4>
          <p class="text-zaccBlack/80 leading-relaxed mb-6">{{ selectedJob.description }}</p>

          <h4 class="font-extrabold text-lg mb-3">Key Requirements</h4>
          <ul class="space-y-2 mb-6">
            <li v-for="(req, index) in selectedJob.keyRequirements" :key="index" class="flex items-start gap-2 text-zaccBlack/80">
              <i class="pi pi-check-circle text-zaccGreen mt-0.5"></i>
              <span>{{ req }}</span>
            </li>
          </ul>

          <h4 class="font-extrabold text-lg mb-3">Responsibilities</h4>
          <ul class="space-y-2 mb-6">
            <li v-for="(resp, index) in selectedJob.responsibilities" :key="index" class="flex items-start gap-2 text-zaccBlack/80">
              <i class="pi pi-circle-fill text-zaccGold text-xs mt-1.5"></i>
              <span>{{ resp }}</span>
            </li>
          </ul>

          <div v-if="selectedJob.benefits" class="rounded-lg bg-zaccGreen/5 p-4 border border-zaccGreen/20 mb-6">
            <h4 class="font-extrabold text-lg mb-3 text-zaccGreen">Benefits</h4>
            <p class="text-zaccBlack/70">{{ selectedJob.benefits }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-4 border-t">
          <Button
            label="Apply for This Position"
            icon="pi pi-send"
            @click="applyForJob(selectedJob)"
            style="background: #209341; border-color: #209341;"
          />
          <Button
            label="Close"
            severity="secondary"
            outlined
            @click="showJobDialog = false"
          />
        </div>
      </div>
    </Dialog>

    <!-- Application Form Dialog -->
    <Dialog
      v-model:visible="showApplicationDialog"
      header="Job Application"
      :modal="true"
      :style="{ width: '90vw', maxWidth: '800px' }"
      :closable="true"
    >
      <div v-if="applicationJob" class="space-y-6">
        <Message severity="info" :closable="false">
          <template #icon>
            <i class="pi pi-info-circle"></i>
          </template>
          <div>
            <div class="font-semibold mb-1">Applying for: {{ applicationJob.title }}</div>
            <p class="text-sm">Please fill out the form below to submit your application.</p>
          </div>
        </Message>

        <form @submit.prevent="handleApplicationSubmit" class="space-y-6">
          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <label for="applicantName" class="block text-sm font-semibold text-zaccBlack mb-2">
                Full Name <span class="text-red-500">*</span>
              </label>
              <InputText
                id="applicantName"
                v-model="applicationForm.name"
                placeholder="Enter your full name"
                class="w-full"
                :class="{ 'p-invalid': !applicationForm.name && applicationSubmitted }"
                required
              />
              <small v-if="!applicationForm.name && applicationSubmitted" class="p-error">Name is required.</small>
            </div>
            <div>
              <label for="applicantEmail" class="block text-sm font-semibold text-zaccBlack mb-2">
                Email Address <span class="text-red-500">*</span>
              </label>
              <InputText
                id="applicantEmail"
                v-model="applicationForm.email"
                type="email"
                placeholder="your.email@example.com"
                class="w-full"
                :class="{ 'p-invalid': !applicationForm.email && applicationSubmitted }"
                required
              />
              <small v-if="!applicationForm.email && applicationSubmitted" class="p-error">Valid email is required.</small>
            </div>
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <label for="applicantPhone" class="block text-sm font-semibold text-zaccBlack mb-2">
                Phone Number <span class="text-red-500">*</span>
              </label>
              <InputText
                id="applicantPhone"
                v-model="applicationForm.phone"
                type="tel"
                placeholder="+263 XX XXX XXXX"
                class="w-full"
                :class="{ 'p-invalid': !applicationForm.phone && applicationSubmitted }"
                required
              />
              <small v-if="!applicationForm.phone && applicationSubmitted" class="p-error">Phone number is required.</small>
            </div>
            <div>
              <label for="applicantQualification" class="block text-sm font-semibold text-zaccBlack mb-2">
                Highest Qualification
              </label>
              <InputText
                id="applicantQualification"
                v-model="applicationForm.qualification"
                placeholder="e.g., Bachelor's Degree, Master's, etc."
                class="w-full"
              />
            </div>
          </div>

          <div>
            <label for="applicantExperience" class="block text-sm font-semibold text-zaccBlack mb-2">
              Years of Experience
            </label>
            <InputNumber
              id="applicantExperience"
              v-model="applicationForm.experience"
              :min="0"
              :max="50"
              placeholder="Years"
              class="w-full"
            />
          </div>

          <div>
            <label for="coverLetter" class="block text-sm font-semibold text-zaccBlack mb-2">
              Cover Letter <span class="text-red-500">*</span>
            </label>
            <Textarea
              id="coverLetter"
              v-model="applicationForm.coverLetter"
              rows="6"
              placeholder="Tell us why you're interested in this position and what you can bring to ZACC..."
              class="w-full"
              :class="{ 'p-invalid': !applicationForm.coverLetter && applicationSubmitted }"
              required
            />
            <small v-if="!applicationForm.coverLetter && applicationSubmitted" class="p-error">Cover letter is required.</small>
          </div>

          <div>
            <label class="block text-sm font-semibold text-zaccBlack mb-2">
              Upload CV/Resume <span class="text-red-500">*</span>
            </label>
            <FileUpload
              mode="basic"
              :multiple="false"
              accept=".pdf,.doc,.docx"
              :maxFileSize="5000000"
              :auto="false"
              chooseLabel="Upload CV"
              @select="onCVSelect"
              class="w-full"
            />
            <small class="text-zaccBlack/60">PDF, DOC, or DOCX format. Maximum 5MB.</small>
          </div>

          <div class="flex items-center justify-between pt-4 border-t">
            <div class="text-sm text-zaccBlack/70">
              <span class="text-red-500">*</span> Required fields
            </div>
            <div class="flex gap-2">
              <Button
                label="Cancel"
                severity="secondary"
                outlined
                @click="showApplicationDialog = false"
              />
              <Button
                type="submit"
                label="Submit Application"
                icon="pi pi-send"
                :loading="isSubmitting"
                style="background: #209341; border-color: #209341;"
              />
            </div>
          </div>
        </form>
      </div>
    </Dialog>
    </div>
  </NuxtLayout>
</template>

<script setup>
useHead({
  title: 'Careers - Zimbabwe Anti-Corruption Commission (ZACC)',
  meta: [
    {
      name: 'description',
      content: 'Join ZACC in the fight against corruption. Explore career opportunities and make a meaningful impact on Zimbabwe\'s future.'
    }
  ]
})

const departments = [
  { label: 'All Departments', value: null },
  { label: 'Investigations', value: 'investigations' },
  { label: 'Legal', value: 'legal' },
  { label: 'Compliance', value: 'compliance' },
  { label: 'Administration', value: 'administration' },
  { label: 'IT & Technology', value: 'it' },
  { label: 'Finance', value: 'finance' },
  { label: 'Human Resources', value: 'hr' },
  { label: 'Communications', value: 'communications' }
]

const jobs = [
  {
    id: 1,
    title: 'Senior Corruption Investigator',
    department: 'investigations',
    location: 'Harare',
    type: 'Full-time',
    closingDate: '2025-12-15',
    summary: 'Lead complex corruption investigations and work with multidisciplinary teams to build strong cases.',
    description: 'We are seeking an experienced Senior Corruption Investigator to lead high-profile corruption investigations. The successful candidate will be responsible for planning and executing investigations, coordinating with legal teams, and ensuring thorough documentation of evidence.',
    keyRequirements: [
      'Bachelor\'s degree in Law, Criminology, or related field',
      'Minimum 5 years of investigation experience',
      'Strong analytical and problem-solving skills',
      'Excellent written and verbal communication',
      'Knowledge of anti-corruption legislation'
    ],
    responsibilities: [
      'Plan and execute complex corruption investigations',
      'Collect and analyze evidence from multiple sources',
      'Coordinate with legal and compliance teams',
      'Prepare comprehensive investigation reports',
      'Testify in court proceedings when required',
      'Mentor junior investigators'
    ],
    benefits: 'Competitive salary, health insurance, professional development opportunities, and a supportive work environment.'
  },
  {
    id: 2,
    title: 'Legal Officer',
    department: 'legal',
    location: 'Harare',
    type: 'Full-time',
    closingDate: '2025-12-10',
    summary: 'Provide legal support and advice on anti-corruption matters, case preparation, and compliance.',
    description: 'The Legal Officer will provide comprehensive legal support to ZACC operations, including case preparation, legal research, drafting legal documents, and providing advice on compliance matters.',
    keyRequirements: [
      'LLB degree from a recognized university',
      'Admitted legal practitioner in Zimbabwe',
      'Minimum 3 years of legal practice experience',
      'Experience in criminal law or anti-corruption law preferred',
      'Strong research and writing skills'
    ],
    responsibilities: [
      'Provide legal advice on anti-corruption matters',
      'Prepare legal documents and briefs',
      'Conduct legal research and analysis',
      'Assist in case preparation and prosecution support',
      'Review contracts and agreements',
      'Ensure compliance with legal requirements'
    ],
    benefits: 'Competitive salary package, professional development, and opportunities for career advancement.'
  },
  {
    id: 3,
    title: 'Compliance Analyst',
    department: 'compliance',
    location: 'Harare',
    type: 'Full-time',
    closingDate: '2025-12-20',
    summary: 'Monitor compliance with anti-corruption policies and regulations across public and private sectors.',
    description: 'The Compliance Analyst will be responsible for monitoring, assessing, and reporting on compliance with anti-corruption policies and regulations. This role involves working with various stakeholders to ensure adherence to integrity standards.',
    keyRequirements: [
      'Bachelor\'s degree in Business, Law, or related field',
      'Minimum 2 years of compliance experience',
      'Strong analytical and attention to detail',
      'Knowledge of compliance frameworks',
      'Excellent report writing skills'
    ],
    responsibilities: [
      'Monitor compliance with anti-corruption policies',
      'Conduct compliance assessments and audits',
      'Prepare compliance reports and recommendations',
      'Provide compliance training and guidance',
      'Track and report on compliance metrics',
      'Assist in policy development'
    ],
    benefits: 'Competitive benefits package and opportunities for professional growth.'
  },
  {
    id: 4,
    title: 'IT Security Specialist',
    department: 'it',
    location: 'Harare',
    type: 'Full-time',
    closingDate: '2025-12-18',
    summary: 'Ensure the security and integrity of ZACC\'s IT systems and data.',
    description: 'We are looking for an IT Security Specialist to protect ZACC\'s digital infrastructure, implement security measures, and ensure data protection in line with best practices.',
    keyRequirements: [
      'Bachelor\'s degree in IT, Computer Science, or related field',
      'Certifications in cybersecurity (preferred)',
      'Minimum 3 years of IT security experience',
      'Knowledge of network security and data protection',
      'Strong problem-solving abilities'
    ],
    responsibilities: [
      'Implement and maintain IT security measures',
      'Monitor systems for security threats',
      'Conduct security audits and assessments',
      'Develop and enforce security policies',
      'Respond to security incidents',
      'Provide security training to staff'
    ],
    benefits: 'Competitive salary, health benefits, and continuous learning opportunities.'
  },
  {
    id: 5,
    title: 'Communications Officer',
    department: 'communications',
    location: 'Harare',
    type: 'Full-time',
    closingDate: '2025-12-12',
    summary: 'Manage ZACC\'s public communications, media relations, and awareness campaigns.',
    description: 'The Communications Officer will be responsible for developing and implementing communication strategies, managing media relations, and creating content for various platforms to raise awareness about anti-corruption efforts.',
    keyRequirements: [
      'Bachelor\'s degree in Communications, Journalism, or related field',
      'Minimum 3 years of communications experience',
      'Strong writing and editing skills',
      'Experience with social media and digital platforms',
      'Media relations experience'
    ],
    responsibilities: [
      'Develop communication strategies and campaigns',
      'Manage media relations and press releases',
      'Create content for website and social media',
      'Organize public awareness events',
      'Monitor media coverage and public perception',
      'Coordinate with internal teams on messaging'
    ],
    benefits: 'Dynamic work environment, competitive package, and opportunities for creative expression.'
  },
  {
    id: 6,
    title: 'Finance Officer',
    department: 'finance',
    location: 'Harare',
    type: 'Full-time',
    closingDate: '2025-12-14',
    summary: 'Manage financial operations, budgeting, and financial reporting for ZACC.',
    description: 'The Finance Officer will handle financial management, budgeting, accounting, and reporting functions to ensure transparent and accountable financial operations.',
    keyRequirements: [
      'Bachelor\'s degree in Accounting, Finance, or related field',
      'Professional accounting qualification (preferred)',
      'Minimum 3 years of finance experience',
      'Knowledge of public sector finance',
      'Proficiency in accounting software'
    ],
    responsibilities: [
      'Manage financial operations and accounting',
      'Prepare budgets and financial reports',
      'Monitor expenditure and ensure compliance',
      'Process payments and manage accounts',
      'Coordinate audits and financial reviews',
      'Provide financial analysis and recommendations'
    ],
    benefits: 'Competitive salary, professional development, and comprehensive benefits.'
  },
  {
    id: 7,
    title: 'Junior Investigator',
    department: 'investigations',
    location: 'Bulawayo',
    type: 'Full-time',
    closingDate: '2025-12-22',
    summary: 'Entry-level position for aspiring investigators to learn and contribute to corruption investigations.',
    description: 'An excellent opportunity for recent graduates to start a career in anti-corruption investigations. The Junior Investigator will work under supervision to learn investigation techniques and contribute to case work.',
    keyRequirements: [
      'Bachelor\'s degree in Law, Criminology, or related field',
      'Strong interest in anti-corruption work',
      'Good analytical and communication skills',
      'Willingness to learn and develop',
      'Ability to work in a team environment'
    ],
    responsibilities: [
      'Assist in corruption investigations',
      'Collect and organize evidence',
      'Conduct interviews and research',
      'Prepare investigation reports',
      'Support senior investigators',
      'Maintain case files and documentation'
    ],
    benefits: 'Training and mentorship program, competitive entry-level salary, and career development opportunities.'
  },
  {
    id: 8,
    title: 'Human Resources Officer',
    department: 'hr',
    location: 'Harare',
    type: 'Full-time',
    closingDate: '2025-12-16',
    summary: 'Manage HR functions including recruitment, employee relations, and organizational development.',
    description: 'The HR Officer will support all aspects of human resources management, including recruitment, employee relations, performance management, and policy implementation.',
    keyRequirements: [
      'Bachelor\'s degree in Human Resources, Business, or related field',
      'Minimum 3 years of HR experience',
      'Knowledge of labor laws and regulations',
      'Strong interpersonal and communication skills',
      'Experience in recruitment and employee relations'
    ],
    responsibilities: [
      'Manage recruitment and selection processes',
      'Handle employee relations and grievances',
      'Implement HR policies and procedures',
      'Coordinate performance management',
      'Organize training and development programs',
      'Maintain employee records and databases'
    ],
    benefits: 'Competitive package, professional development, and opportunities to shape organizational culture.'
  }
]

const searchQuery = ref('')
const selectedDepartment = ref(null)
const currentPage = ref(1)
const itemsPerPage = 6
const showJobDialog = ref(false)
const selectedJob = ref(null)
const showApplicationDialog = ref(false)
const applicationJob = ref(null)
const applicationSubmitted = ref(false)
const isSubmitting = ref(false)

const applicationForm = reactive({
  name: '',
  email: '',
  phone: '',
  qualification: '',
  experience: null,
  coverLetter: '',
  cv: null
})

const filteredJobs = computed(() => {
  let filtered = jobs

  // Filter by department
  if (selectedDepartment.value) {
    filtered = filtered.filter(job => job.department === selectedDepartment.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(job =>
      job.title.toLowerCase().includes(query) ||
      job.summary.toLowerCase().includes(query) ||
      job.department.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query) ||
      job.keyRequirements.some(req => req.toLowerCase().includes(query))
    )
  }

  return filtered
})

const paginatedJobs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredJobs.value.slice(start, end)
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const getJobTypeSeverity = (type) => {
  return type === 'Full-time' ? 'success' : 'info'
}

const viewJob = (job) => {
  selectedJob.value = job
  showJobDialog.value = true
}

const applyForJob = (job) => {
  applicationJob.value = job
  showApplicationDialog.value = true
  showJobDialog.value = false
  // Reset form
  Object.assign(applicationForm, {
    name: '',
    email: '',
    phone: '',
    qualification: '',
    experience: null,
    coverLetter: '',
    cv: null
  })
  applicationSubmitted.value = false
}

const onCVSelect = (event) => {
  const file = event.files[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }
    applicationForm.cv = file
  }
}

const handleApplicationSubmit = async () => {
  applicationSubmitted.value = true

  if (!applicationForm.name || !applicationForm.email || !applicationForm.phone || !applicationForm.coverLetter || !applicationForm.cv) {
    return
  }

  isSubmitting.value = true

  try {
    // Here you would typically send the application to your backend
    console.log('Application submitted:', {
      job: applicationJob.value?.title,
      ...applicationForm
    })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    alert(`Thank you for your application to ${applicationJob.value?.title}. We will review your application and contact you if you are shortlisted.`)

    // Reset and close
    showApplicationDialog.value = false
    Object.assign(applicationForm, {
      name: '',
      email: '',
      phone: '',
      qualification: '',
      experience: null,
      coverLetter: '',
      cv: null
    })
    applicationSubmitted.value = false
  } catch (error) {
    console.error('Error submitting application:', error)
    alert('There was an error submitting your application. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

const onPageChange = (event) => {
  currentPage.value = (event.first / itemsPerPage) + 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Reset to page 1 when filters change
watch([searchQuery, selectedDepartment], () => {
  currentPage.value = 1
})
</script>

<style scoped>
:deep(.p-card) {
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 5px 10px 0 rgba(41, 61, 102, 0.2);
  transition: all 0.3s ease;
}

:deep(.p-card:hover) {
  transform: translateY(-2px);
  border-color: rgba(32, 147, 65, 0.3);
}

:deep(.p-dialog-header) {
  background: linear-gradient(to right, rgba(32, 147, 65, 0.1), rgba(212, 175, 55, 0.1));
  border-bottom: 1px solid rgba(32, 147, 65, 0.2);
}
</style>
