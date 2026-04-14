-- AlterTable
ALTER TABLE `contact_submissions` ADD COLUMN IF NOT EXISTS `category` ENUM('GENERAL', 'COMPLAINT', 'COMPLIMENT', 'INQUIRY', 'OTHER') NOT NULL DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE `gallery_images` ADD COLUMN IF NOT EXISTS `showTitle` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `page_content` ADD COLUMN IF NOT EXISTS `isLocked` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `statistics` ADD COLUMN IF NOT EXISTS `year` INTEGER NOT NULL DEFAULT 2026;

-- AlterTable
ALTER TABLE `team` ADD COLUMN IF NOT EXISTS `gender` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER', 'REPORTS_ADMIN') NOT NULL DEFAULT 'EDITOR';

-- CreateTable
CREATE TABLE `tenders` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NULL,
    `details` TEXT NOT NULL,
    `closingDate` DATETIME(3) NOT NULL,
    `type` ENUM('NORMAL', 'RFQ') NOT NULL DEFAULT 'NORMAL',
    `categoryId` VARCHAR(191) NOT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `tenders_isPublished_closingDate_idx`(`isPublished`, `closingDate`),
    INDEX `tenders_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tender_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tender_categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tender_documents` (
    `id` VARCHAR(191) NOT NULL,
    `tenderId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tender_documents_tenderId_idx`(`tenderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tender_line_items` (
    `id` VARCHAR(191) NOT NULL,
    `tenderId` VARCHAR(191) NOT NULL,
    `itemNo` INTEGER NOT NULL,
    `description` TEXT NOT NULL,
    `quantity` DOUBLE NULL,
    `unit` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tender_line_items_tenderId_idx`(`tenderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `contactPerson` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `suppliers_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `supplier_sessions_tokenHash_key`(`tokenHash`),
    INDEX `supplier_sessions_supplierId_idx`(`supplierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier_category_approvals` (
    `id` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `supplier_category_approvals_supplierId_idx`(`supplierId`),
    INDEX `supplier_category_approvals_categoryId_idx`(`categoryId`),
    UNIQUE INDEX `supplier_category_approvals_supplierId_categoryId_key`(`supplierId`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier_documents` (
    `id` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `supplier_documents_supplierId_idx`(`supplierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tender_bids` (
    `id` VARCHAR(191) NOT NULL,
    `tenderId` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `totalAmount` DOUBLE NULL,
    `status` ENUM('SUBMITTED', 'WITHDRAWN') NOT NULL DEFAULT 'SUBMITTED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tender_bids_tenderId_idx`(`tenderId`),
    INDEX `tender_bids_supplierId_idx`(`supplierId`),
    UNIQUE INDEX `tender_bids_tenderId_supplierId_key`(`tenderId`, `supplierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tender_bid_documents` (
    `id` VARCHAR(191) NOT NULL,
    `bidId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tender_bid_documents_bidId_idx`(`bidId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tender_bid_line_items` (
    `id` VARCHAR(191) NOT NULL,
    `bidId` VARCHAR(191) NOT NULL,
    `tenderItemId` VARCHAR(191) NOT NULL,
    `unitPrice` DOUBLE NOT NULL,
    `quantity` DOUBLE NULL,
    `totalPrice` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tender_bid_line_items_bidId_idx`(`bidId`),
    INDEX `tender_bid_line_items_tenderItemId_idx`(`tenderItemId`),
    UNIQUE INDEX `tender_bid_line_items_bidId_tenderItemId_key`(`bidId`, `tenderItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `contact_submissions_category_idx` ON `contact_submissions`(`category`);

-- CreateIndex
CREATE INDEX `statistics_section_year_idx` ON `statistics`(`section`, `year`);

-- AddForeignKey
ALTER TABLE `tenders` ADD CONSTRAINT `tenders_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `tender_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenders` ADD CONSTRAINT `tenders_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenders` ADD CONSTRAINT `tenders_updatedBy_fkey` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tender_documents` ADD CONSTRAINT `tender_documents_tenderId_fkey` FOREIGN KEY (`tenderId`) REFERENCES `tenders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tender_line_items` ADD CONSTRAINT `tender_line_items_tenderId_fkey` FOREIGN KEY (`tenderId`) REFERENCES `tenders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_sessions` ADD CONSTRAINT `supplier_sessions_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_category_approvals` ADD CONSTRAINT `supplier_category_approvals_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_category_approvals` ADD CONSTRAINT `supplier_category_approvals_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `tender_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_documents` ADD CONSTRAINT `supplier_documents_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tender_bids` ADD CONSTRAINT `tender_bids_tenderId_fkey` FOREIGN KEY (`tenderId`) REFERENCES `tenders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tender_bids` ADD CONSTRAINT `tender_bids_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tender_bid_documents` ADD CONSTRAINT `tender_bid_documents_bidId_fkey` FOREIGN KEY (`bidId`) REFERENCES `tender_bids`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tender_bid_line_items` ADD CONSTRAINT `tender_bid_line_items_bidId_fkey` FOREIGN KEY (`bidId`) REFERENCES `tender_bids`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tender_bid_line_items` ADD CONSTRAINT `tender_bid_line_items_tenderItemId_fkey` FOREIGN KEY (`tenderItemId`) REFERENCES `tender_line_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
