-- AlterTable
ALTER TABLE `job_application_documents` ADD COLUMN `candidateDocumentId` VARCHAR(191) NULL,
    ADD COLUMN `slotKey` VARCHAR(191) NULL,
    ADD COLUMN `verification` ENUM('RECEIVED', 'VERIFIED', 'AWAITING_REFEREE', 'ACTION_NEEDED', 'REJECTED') NOT NULL DEFAULT 'RECEIVED',
    ADD COLUMN `verifiedAt` DATETIME(3) NULL,
    ADD COLUMN `verifiedBy` VARCHAR(191) NULL,
    ADD COLUMN `verifierNote` TEXT NULL;

-- AlterTable
ALTER TABLE `job_applications` ADD COLUMN `altPhone` VARCHAR(191) NULL,
    ADD COLUMN `answers` JSON NULL,
    ADD COLUMN `autoRejectReasons` JSON NULL,
    ADD COLUMN `autoScore` DOUBLE NULL,
    ADD COLUMN `candidateId` VARCHAR(191) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `dateOfBirth` DATETIME(3) NULL,
    ADD COLUMN `driversLicenceClass` VARCHAR(191) NULL,
    ADD COLUMN `expectedSalary` DOUBLE NULL,
    ADD COLUMN `finalScore` DOUBLE NULL,
    ADD COLUMN `firstName` VARCHAR(191) NULL,
    ADD COLUMN `gender` VARCHAR(191) NULL,
    ADD COLUMN `hasDisability` BOOLEAN NULL,
    ADD COLUMN `highestQualification` ENUM('DOCTORATE', 'MASTERS', 'POSTGRAD_DIPLOMA', 'FIRST_DEGREE', 'HIGHER_DIPLOMA', 'DIPLOMA', 'CERTIFICATE', 'A_LEVEL', 'O_LEVEL', 'GRADE_7') NULL,
    ADD COLUMN `howHeard` VARCHAR(191) NULL,
    ADD COLUMN `integrityFlagCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isAutoRejected` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isCurrentlyEmployed` BOOLEAN NULL,
    ADD COLUMN `isShortlisted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isWithdrawn` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `keywordMatchPct` DOUBLE NULL,
    ADD COLUMN `lastCandidateViewAt` DATETIME(3) NULL,
    ADD COLUMN `lastName` VARCHAR(191) NULL,
    ADD COLUMN `mode` ENUM('LEGACY', 'STRUCTURED') NOT NULL DEFAULT 'LEGACY',
    ADD COLUMN `nationalId` VARCHAR(191) NULL,
    ADD COLUMN `nationalIdType` VARCHAR(191) NULL,
    ADD COLUMN `nationality` VARCHAR(191) NULL,
    ADD COLUMN `noticePeriodDays` INTEGER NULL,
    ADD COLUMN `panelReviewCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `panelScoreMean` DOUBLE NULL,
    ADD COLUMN `panelScoreMedian` DOUBLE NULL,
    ADD COLUMN `panelScoreSpread` DOUBLE NULL,
    ADD COLUMN `panelScoreStdev` DOUBLE NULL,
    ADD COLUMN `province` VARCHAR(191) NULL,
    ADD COLUMN `referenceNumber` VARCHAR(191) NULL,
    ADD COLUMN `schemeSnapshot` JSON NULL,
    ADD COLUMN `scoreComputedAt` DATETIME(3) NULL,
    ADD COLUMN `scoreOverride` DOUBLE NULL,
    ADD COLUMN `scoreOverrideNote` TEXT NULL,
    ADD COLUMN `scoringVersion` INTEGER NULL,
    ADD COLUMN `stageId` VARCHAR(191) NULL,
    ADD COLUMN `submittedAt` DATETIME(3) NULL,
    ADD COLUMN `totalYearsExperience` DOUBLE NULL,
    ADD COLUMN `willingToRelocate` BOOLEAN NULL,
    ADD COLUMN `withdrawnAt` DATETIME(3) NULL,
    ADD COLUMN `withdrawnReason` TEXT NULL,
    MODIFY `coverLetter` TEXT NULL,
    MODIFY `cvUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `jobs` ADD COLUMN `applicationMode` ENUM('LEGACY', 'STRUCTURED') NOT NULL DEFAULT 'STRUCTURED',
    ADD COLUMN `autoRejectDelayMinutes` INTEGER NULL,
    ADD COLUMN `autoRejectEnabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `bucketWeights` JSON NULL,
    ADD COLUMN `dutyStation` VARCHAR(191) NULL,
    ADD COLUMN `grade` VARCHAR(191) NULL,
    ADD COLUMN `jobDescriptionText` TEXT NULL,
    ADD COLUMN `keywords` JSON NULL,
    ADD COLUMN `maxNoticePeriodDays` INTEGER NULL,
    ADD COLUMN `minYearsExperience` INTEGER NULL,
    ADD COLUMN `numberOfPosts` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `openingDate` DATETIME(3) NULL,
    ADD COLUMN `panelAggregation` ENUM('MEAN', 'MEDIAN', 'TRIMMED_MEAN', 'CHAIR_OVERRIDE') NOT NULL DEFAULT 'MEAN',
    ADD COLUMN `panelBlindDemographics` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `panelBlindIdentity` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `panelSpreadThreshold` DOUBLE NOT NULL DEFAULT 20,
    ADD COLUMN `province` VARCHAR(191) NULL,
    ADD COLUMN `referencePrefix` VARCHAR(191) NULL,
    ADD COLUMN `scoringTemplateId` VARCHAR(191) NULL,
    ADD COLUMN `scoringVersion` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `candidates` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `emailVerifiedAt` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `failedLoginCount` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `candidates_email_key`(`email`),
    INDEX `candidates_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidate_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `candidateId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `lastUsedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revokedAt` DATETIME(3) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `candidate_sessions_tokenHash_key`(`tokenHash`),
    INDEX `candidate_sessions_candidateId_idx`(`candidateId`),
    INDEX `candidate_sessions_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidate_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `candidateId` VARCHAR(191) NOT NULL,
    `purpose` ENUM('EMAIL_VERIFY', 'PASSWORD_RESET', 'EMAIL_CHANGE') NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `payload` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `candidate_tokens_tokenHash_key`(`tokenHash`),
    INDEX `candidate_tokens_candidateId_purpose_idx`(`candidateId`, `purpose`),
    INDEX `candidate_tokens_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidate_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `candidateId` VARCHAR(191) NOT NULL,
    `middleName` VARCHAR(191) NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `placeOfBirth` VARCHAR(191) NULL,
    `nationalIdType` VARCHAR(191) NULL DEFAULT 'National ID',
    `nationalId` VARCHAR(191) NULL,
    `nationality` VARCHAR(191) NULL DEFAULT 'Zimbabwean',
    `gender` VARCHAR(191) NULL,
    `hasDisability` BOOLEAN NULL,
    `disabilityDetail` TEXT NULL,
    `currentAddress` TEXT NULL,
    `permanentAddress` TEXT NULL,
    `province` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `altPhone` VARCHAR(191) NULL,
    `qualifications` JSON NULL,
    `memberships` JSON NULL,
    `employment` JSON NULL,
    `skills` JSON NULL,
    `languages` JSON NULL,
    `driversLicenceClass` VARCHAR(191) NULL,
    `driversLicenceExpiry` DATETIME(3) NULL,
    `completionPct` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `candidate_profiles_candidateId_key`(`candidateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidate_documents` (
    `id` VARCHAR(191) NOT NULL,
    `candidateId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `candidate_documents_candidateId_idx`(`candidateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_drafts` (
    `id` VARCHAR(191) NOT NULL,
    `candidateId` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `answers` JSON NOT NULL,
    `currentStep` INTEGER NOT NULL DEFAULT 1,
    `version` INTEGER NOT NULL DEFAULT 1,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `application_drafts_jobId_idx`(`jobId`),
    UNIQUE INDEX `application_drafts_candidateId_jobId_key`(`candidateId`, `jobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vacancy_criteria` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `bucket` ENUM('QUALIFICATIONS_EXPERIENCE', 'SKILLS', 'INTEGRITY', 'FIT') NOT NULL DEFAULT 'QUALIFICATIONS_EXPERIENCE',
    `type` ENUM('BANDED', 'QUALIFICATION_LADDER', 'KEYWORD', 'BOOLEAN', 'CHOICE', 'MANUAL') NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1,
    `maxPoints` DOUBLE NOT NULL DEFAULT 100,
    `config` JSON NOT NULL,
    `sourceField` VARCHAR(191) NULL,
    `isAutoScored` BOOLEAN NOT NULL DEFAULT true,
    `isPanelScored` BOOLEAN NOT NULL DEFAULT false,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `showToCandidate` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vacancy_criteria_jobId_idx`(`jobId`),
    UNIQUE INDEX `vacancy_criteria_jobId_key_key`(`jobId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vacancy_disqualifiers` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `type` ENUM('MIN_NUMERIC', 'MAX_NUMERIC', 'REQUIRED_TRUE', 'REQUIRED_FALSE', 'REQUIRED_QUALIFICATION', 'VALUE_IN', 'VALUE_NOT_IN', 'MISSING_DOCUMENT', 'AGE_RANGE', 'CLOSING_DATE') NOT NULL,
    `sourceField` VARCHAR(191) NULL,
    `config` JSON NOT NULL,
    `action` ENUM('AUTO_REJECT', 'FLAG_ONLY') NOT NULL DEFAULT 'AUTO_REJECT',
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'HIGH',
    `publicReason` TEXT NULL,
    `internalReason` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vacancy_disqualifiers_jobId_idx`(`jobId`),
    UNIQUE INDEX `vacancy_disqualifiers_jobId_key_key`(`jobId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vacancy_document_slots` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isMandatory` BOOLEAN NOT NULL DEFAULT false,
    `allowMultiple` BOOLEAN NOT NULL DEFAULT false,
    `maxFiles` INTEGER NOT NULL DEFAULT 1,
    `allowedExtensions` JSON NOT NULL,
    `maxSizeBytes` INTEGER NOT NULL DEFAULT 5242880,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vacancy_document_slots_jobId_idx`(`jobId`),
    UNIQUE INDEX `vacancy_document_slots_jobId_key_key`(`jobId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vacancy_panel_members` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('CHAIR', 'MEMBER', 'OBSERVER', 'HR_COORDINATOR') NOT NULL DEFAULT 'MEMBER',
    `canSeeIdentity` BOOLEAN NOT NULL DEFAULT true,
    `canSeeDemographics` BOOLEAN NOT NULL DEFAULT false,
    `canSeeOtherScores` BOOLEAN NOT NULL DEFAULT false,
    `assignedBy` VARCHAR(191) NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vacancy_panel_members_jobId_idx`(`jobId`),
    INDEX `vacancy_panel_members_userId_idx`(`userId`),
    UNIQUE INDEX `vacancy_panel_members_jobId_userId_key`(`jobId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scoring_templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `definition` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `scoring_templates_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recruitment_stages` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `internalLabel` VARCHAR(191) NOT NULL,
    `publicLabel` VARCHAR(191) NOT NULL,
    `internalDescription` TEXT NULL,
    `publicDescription` TEXT NULL,
    `category` ENUM('INTAKE', 'SCREENING', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'CLOSED') NOT NULL DEFAULT 'SCREENING',
    `legacyStatus` ENUM('PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWED', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'REVIEWING',
    `colorHex` VARCHAR(191) NOT NULL DEFAULT '#209341',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isTerminal` BOOLEAN NOT NULL DEFAULT false,
    `isRejection` BOOLEAN NOT NULL DEFAULT false,
    `isAutoRejectTarget` BOOLEAN NOT NULL DEFAULT false,
    `showOnCandidateTimeline` BOOLEAN NOT NULL DEFAULT true,
    `notifyCandidate` BOOLEAN NOT NULL DEFAULT false,
    `notificationTemplateId` VARCHAR(191) NULL,
    `notificationDelayMinutes` INTEGER NOT NULL DEFAULT 0,
    `notificationDelayJitterMinutes` INTEGER NOT NULL DEFAULT 0,
    `respectSendWindow` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `recruitment_stages_key_key`(`key`),
    INDEX `recruitment_stages_sortOrder_idx`(`sortOrder`),
    INDEX `recruitment_stages_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_stage_events` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `stageId` VARCHAR(191) NULL,
    `fromStageKey` VARCHAR(191) NULL,
    `toStageKey` VARCHAR(191) NULL,
    `toInternalLabel` VARCHAR(191) NULL,
    `toPublicLabel` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `isAutomated` BOOLEAN NOT NULL DEFAULT false,
    `changedBy` VARCHAR(191) NULL,
    `changedByName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `application_stage_events_applicationId_idx`(`applicationId`),
    INDEX `application_stage_events_stageId_idx`(`stageId`),
    INDEX `application_stage_events_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_qualifications` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `level` ENUM('DOCTORATE', 'MASTERS', 'POSTGRAD_DIPLOMA', 'FIRST_DEGREE', 'HIGHER_DIPLOMA', 'DIPLOMA', 'CERTIFICATE', 'A_LEVEL', 'O_LEVEL', 'GRADE_7') NOT NULL,
    `fieldOfStudy` VARCHAR(191) NULL,
    `institution` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `yearObtained` INTEGER NULL,
    `classGrade` VARCHAR(191) NULL,
    `result` VARCHAR(191) NULL,

    INDEX `application_qualifications_applicationId_idx`(`applicationId`),
    INDEX `application_qualifications_level_idx`(`level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_employments` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `employer` VARCHAR(191) NOT NULL,
    `jobTitle` VARCHAR(191) NOT NULL,
    `fromMonth` VARCHAR(191) NULL,
    `toMonth` VARCHAR(191) NULL,
    `isCurrent` BOOLEAN NOT NULL DEFAULT false,
    `salary` DOUBLE NULL,
    `responsibilities` TEXT NULL,
    `reasonForLeaving` VARCHAR(191) NULL,
    `noticePeriod` VARCHAR(191) NULL,
    `supervisorName` VARCHAR(191) NULL,
    `supervisorRole` VARCHAR(191) NULL,
    `supervisorPhone` VARCHAR(191) NULL,

    INDEX `application_employments_applicationId_idx`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_declarations` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `question` TEXT NOT NULL,
    `answer` BOOLEAN NOT NULL,
    `explanation` TEXT NULL,
    `documentId` VARCHAR(191) NULL,
    `isAdverse` BOOLEAN NOT NULL DEFAULT false,

    INDEX `application_declarations_applicationId_idx`(`applicationId`),
    UNIQUE INDEX `application_declarations_applicationId_key_key`(`applicationId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_skills` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `proficiency` ENUM('NONE', 'BASIC', 'GOOD', 'FLUENT', 'NATIVE') NULL,
    `detail` JSON NULL,

    INDEX `application_skills_applicationId_idx`(`applicationId`),
    INDEX `application_skills_kind_idx`(`kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_keyword_hits` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `matched` BOOLEAN NOT NULL DEFAULT false,
    `occurrences` INTEGER NOT NULL DEFAULT 0,
    `matchedVia` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL,

    INDEX `application_keyword_hits_applicationId_idx`(`applicationId`),
    INDEX `application_keyword_hits_keyword_matched_idx`(`keyword`, `matched`),
    UNIQUE INDEX `application_keyword_hits_applicationId_keyword_key`(`applicationId`, `keyword`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_criterion_scores` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `criterionId` VARCHAR(191) NOT NULL,
    `criterionKey` VARCHAR(191) NOT NULL,
    `bucket` ENUM('QUALIFICATIONS_EXPERIENCE', 'SKILLS', 'INTEGRITY', 'FIT') NOT NULL,
    `rawPoints` DOUBLE NOT NULL DEFAULT 0,
    `maxPoints` DOUBLE NOT NULL DEFAULT 0,
    `normalizedPct` DOUBLE NOT NULL DEFAULT 0,
    `weightedPoints` DOUBLE NOT NULL DEFAULT 0,
    `pending` BOOLEAN NOT NULL DEFAULT false,
    `detail` JSON NULL,
    `explanation` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `application_criterion_scores_applicationId_idx`(`applicationId`),
    INDEX `application_criterion_scores_criterionId_idx`(`criterionId`),
    UNIQUE INDEX `application_criterion_scores_applicationId_criterionId_key`(`applicationId`, `criterionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_panel_scores` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `criterionId` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NOT NULL,
    `points` DOUBLE NOT NULL,
    `maxPoints` DOUBLE NOT NULL,
    `comment` TEXT NULL,
    `isSubmitted` BOOLEAN NOT NULL DEFAULT false,
    `submittedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `application_panel_scores_applicationId_idx`(`applicationId`),
    INDEX `application_panel_scores_reviewerId_idx`(`reviewerId`),
    UNIQUE INDEX `application_panel_scores_applicationId_criterionId_reviewerI_key`(`applicationId`, `criterionId`, `reviewerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NOT NULL,
    `role` ENUM('CHAIR', 'MEMBER', 'OBSERVER', 'HR_COORDINATOR') NOT NULL DEFAULT 'MEMBER',
    `recommendation` VARCHAR(191) NULL,
    `comments` TEXT NULL,
    `isSubmitted` BOOLEAN NOT NULL DEFAULT false,
    `submittedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `application_reviews_applicationId_idx`(`applicationId`),
    INDEX `application_reviews_reviewerId_idx`(`reviewerId`),
    UNIQUE INDEX `application_reviews_applicationId_reviewerId_key`(`applicationId`, `reviewerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_flags` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `disqualifierId` VARCHAR(191) NULL,
    `code` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('OPEN', 'ACKNOWLEDGED', 'CLEARED', 'UPHELD') NOT NULL DEFAULT 'OPEN',
    `causedReject` BOOLEAN NOT NULL DEFAULT false,
    `detail` TEXT NULL,
    `publicReason` TEXT NULL,
    `resolvedBy` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `resolutionNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `application_flags_applicationId_idx`(`applicationId`),
    INDEX `application_flags_code_idx`(`code`),
    INDEX `application_flags_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interview_events` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `mode` ENUM('IN_PERSON', 'VIRTUAL', 'TELEPHONE') NOT NULL DEFAULT 'IN_PERSON',
    `venue` TEXT NULL,
    `meetingUrl` TEXT NULL,
    `scheduledAt` DATETIME(3) NOT NULL,
    `durationMinutes` INTEGER NOT NULL DEFAULT 45,
    `panelSummary` JSON NULL,
    `bringItems` JSON NULL,
    `notes` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `interview_events_jobId_idx`(`jobId`),
    INDEX `interview_events_scheduledAt_idx`(`scheduledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interview_invitations` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `response` ENUM('PENDING', 'CONFIRMED', 'DECLINED', 'RESCHEDULE_REQUESTED') NOT NULL DEFAULT 'PENDING',
    `respondedAt` DATETIME(3) NULL,
    `responseNote` TEXT NULL,
    `confirmByDate` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `interview_invitations_applicationId_idx`(`applicationId`),
    UNIQUE INDEX `interview_invitations_eventId_applicationId_key`(`eventId`, `applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_messages` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `candidateId` VARCHAR(191) NULL,
    `direction` ENUM('TO_CANDIDATE', 'FROM_CANDIDATE') NOT NULL DEFAULT 'TO_CANDIDATE',
    `fromLabel` VARCHAR(191) NOT NULL DEFAULT 'Human Capital & Administration',
    `subject` VARCHAR(191) NULL,
    `body` TEXT NOT NULL,
    `isInternal` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `application_messages_applicationId_idx`(`applicationId`),
    INDEX `application_messages_candidateId_idx`(`candidateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_templates` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `bodyHtml` TEXT NOT NULL,
    `bodyText` TEXT NULL,
    `variables` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `notification_templates_key_key`(`key`),
    INDEX `notification_templates_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_outbox` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NULL,
    `templateKey` VARCHAR(191) NULL,
    `toEmail` VARCHAR(191) NOT NULL,
    `toName` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `bodyHtml` TEXT NOT NULL,
    `bodyText` TEXT NOT NULL,
    `status` ENUM('SCHEDULED', 'CLAIMED', 'SENT', 'FAILED', 'CANCELLED', 'SKIPPED') NOT NULL DEFAULT 'SCHEDULED',
    `scheduledFor` DATETIME(3) NOT NULL,
    `claimToken` VARCHAR(191) NULL,
    `claimedAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 5,
    `lastError` TEXT NULL,
    `contextType` VARCHAR(191) NULL,
    `contextId` VARCHAR(191) NULL,
    `variables` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `email_outbox_status_scheduledFor_idx`(`status`, `scheduledFor`),
    INDEX `email_outbox_claimToken_idx`(`claimToken`),
    INDEX `email_outbox_contextType_contextId_idx`(`contextType`, `contextId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recruitment_audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `jobId` VARCHAR(191) NULL,
    `actorId` VARCHAR(191) NULL,
    `actorName` VARCHAR(191) NULL,
    `actorRole` VARCHAR(191) NULL,
    `summary` TEXT NULL,
    `detail` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `recruitment_audit_logs_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `recruitment_audit_logs_jobId_idx`(`jobId`),
    INDEX `recruitment_audit_logs_actorId_idx`(`actorId`),
    INDEX `recruitment_audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `job_application_documents_applicationId_slotKey_idx` ON `job_application_documents`(`applicationId`, `slotKey`);

-- CreateIndex
CREATE INDEX `job_application_documents_verification_idx` ON `job_application_documents`(`verification`);

-- CreateIndex
CREATE UNIQUE INDEX `job_applications_referenceNumber_key` ON `job_applications`(`referenceNumber`);

-- CreateIndex
CREATE INDEX `job_applications_candidateId_idx` ON `job_applications`(`candidateId`);

-- CreateIndex
CREATE INDEX `job_applications_stageId_idx` ON `job_applications`(`stageId`);

-- CreateIndex
CREATE INDEX `job_applications_referenceNumber_idx` ON `job_applications`(`referenceNumber`);

-- CreateIndex
CREATE INDEX `job_applications_jobId_isWithdrawn_isAutoRejected_idx` ON `job_applications`(`jobId`, `isWithdrawn`, `isAutoRejected`);

-- CreateIndex
CREATE INDEX `job_applications_jobId_finalScore_idx` ON `job_applications`(`jobId`, `finalScore`);

-- CreateIndex
CREATE INDEX `job_applications_gender_idx` ON `job_applications`(`gender`);

-- CreateIndex
CREATE INDEX `job_applications_province_idx` ON `job_applications`(`province`);

-- CreateIndex
CREATE INDEX `job_applications_highestQualification_idx` ON `job_applications`(`highestQualification`);

-- CreateIndex
CREATE INDEX `job_applications_submittedAt_idx` ON `job_applications`(`submittedAt`);

-- CreateIndex
CREATE INDEX `jobs_applicationMode_idx` ON `jobs`(`applicationMode`);

-- CreateIndex
CREATE INDEX `jobs_scoringTemplateId_idx` ON `jobs`(`scoringTemplateId`);

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_scoringTemplateId_fkey` FOREIGN KEY (`scoringTemplateId`) REFERENCES `scoring_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_candidateId_fkey` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `recruitment_stages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_application_documents` ADD CONSTRAINT `job_application_documents_candidateDocumentId_fkey` FOREIGN KEY (`candidateDocumentId`) REFERENCES `candidate_documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `candidate_sessions` ADD CONSTRAINT `candidate_sessions_candidateId_fkey` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `candidate_tokens` ADD CONSTRAINT `candidate_tokens_candidateId_fkey` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `candidate_profiles` ADD CONSTRAINT `candidate_profiles_candidateId_fkey` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `candidate_documents` ADD CONSTRAINT `candidate_documents_candidateId_fkey` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_drafts` ADD CONSTRAINT `application_drafts_candidateId_fkey` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_drafts` ADD CONSTRAINT `application_drafts_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vacancy_criteria` ADD CONSTRAINT `vacancy_criteria_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vacancy_disqualifiers` ADD CONSTRAINT `vacancy_disqualifiers_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vacancy_document_slots` ADD CONSTRAINT `vacancy_document_slots_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vacancy_panel_members` ADD CONSTRAINT `vacancy_panel_members_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vacancy_panel_members` ADD CONSTRAINT `vacancy_panel_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scoring_templates` ADD CONSTRAINT `scoring_templates_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scoring_templates` ADD CONSTRAINT `scoring_templates_updatedBy_fkey` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recruitment_stages` ADD CONSTRAINT `recruitment_stages_notificationTemplateId_fkey` FOREIGN KEY (`notificationTemplateId`) REFERENCES `notification_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_stage_events` ADD CONSTRAINT `application_stage_events_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_stage_events` ADD CONSTRAINT `application_stage_events_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `recruitment_stages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_qualifications` ADD CONSTRAINT `application_qualifications_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_employments` ADD CONSTRAINT `application_employments_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_declarations` ADD CONSTRAINT `application_declarations_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_skills` ADD CONSTRAINT `application_skills_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_keyword_hits` ADD CONSTRAINT `application_keyword_hits_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_criterion_scores` ADD CONSTRAINT `application_criterion_scores_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_criterion_scores` ADD CONSTRAINT `application_criterion_scores_criterionId_fkey` FOREIGN KEY (`criterionId`) REFERENCES `vacancy_criteria`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_panel_scores` ADD CONSTRAINT `application_panel_scores_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_panel_scores` ADD CONSTRAINT `application_panel_scores_criterionId_fkey` FOREIGN KEY (`criterionId`) REFERENCES `vacancy_criteria`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_panel_scores` ADD CONSTRAINT `application_panel_scores_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_reviews` ADD CONSTRAINT `application_reviews_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_reviews` ADD CONSTRAINT `application_reviews_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_flags` ADD CONSTRAINT `application_flags_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_flags` ADD CONSTRAINT `application_flags_disqualifierId_fkey` FOREIGN KEY (`disqualifierId`) REFERENCES `vacancy_disqualifiers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interview_events` ADD CONSTRAINT `interview_events_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interview_invitations` ADD CONSTRAINT `interview_invitations_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `interview_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interview_invitations` ADD CONSTRAINT `interview_invitations_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_messages` ADD CONSTRAINT `application_messages_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_messages` ADD CONSTRAINT `application_messages_candidateId_fkey` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_outbox` ADD CONSTRAINT `email_outbox_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `notification_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Data step
-- ---------------------------------------------------------------------------
-- `jobs.applicationMode` defaults to STRUCTURED because that is right for every
-- vacancy created from now on. Vacancies that already exist were advertised
-- against the old single-page form and have no criteria, no document slots and
-- no scoring scheme, so flipping them to the wizard would break them mid-flight.
-- Pin them to LEGACY; HR opts each one in by editing it.
--
-- `job_applications.mode` already defaults to LEGACY, so submitted applications
-- need no equivalent step.
UPDATE `jobs` SET `applicationMode` = 'LEGACY' WHERE `createdAt` < NOW();
