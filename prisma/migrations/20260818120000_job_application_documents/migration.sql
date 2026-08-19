-- Supporting documents (certificates, qualifications, IDs) attached to a job application.

CREATE TABLE `job_application_documents` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `job_application_documents_applicationId_idx`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `job_application_documents`
    ADD CONSTRAINT `job_application_documents_applicationId_fkey`
    FOREIGN KEY (`applicationId`) REFERENCES `job_applications`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
