-- Homepage hero: Citizen Actions panel + items (links / QR / buttons)

CREATE TABLE `citizen_hero_panels` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT 'Citizen Actions',
    `subtitle` TEXT NULL,
    `footerText` TEXT NULL,
    `footerCtaLabel` VARCHAR(191) NULL,
    `footerCtaUrl` TEXT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `citizen_hero_panels_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `citizen_hero_actions` (
    `id` VARCHAR(191) NOT NULL,
    `panelId` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `iconName` VARCHAR(191) NOT NULL DEFAULT 'users',
    `iconTone` VARCHAR(191) NOT NULL DEFAULT 'neutral',
    `actionStyle` ENUM('BUTTON', 'LINK', 'QR', 'BUTTON_QR') NOT NULL,
    `ctaLabel` VARCHAR(191) NULL,
    `ctaUrl` TEXT NULL,
    `qrImageUrl` TEXT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `citizen_hero_actions_panelId_sortOrder_idx`(`panelId`, `sortOrder`),
    PRIMARY KEY (`id`),
    CONSTRAINT `citizen_hero_actions_panelId_fkey` FOREIGN KEY (`panelId`) REFERENCES `citizen_hero_panels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
