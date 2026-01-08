-- CreateTable
CREATE TABLE `menus` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `menus_name_key`(`name`),
    UNIQUE INDEX `menus_location_key`(`location`),
    INDEX `menus_location_idx`(`location`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menu_items` (
    `id` VARCHAR(191) NOT NULL,
    `menuId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NULL,
    `target` VARCHAR(191) NOT NULL DEFAULT '_self',
    `icon` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `parentId` VARCHAR(191) NULL,
    `pageId` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `menu_items_menuId_order_idx`(`menuId`, `order`),
    INDEX `menu_items_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_menuId_fkey` FOREIGN KEY (`menuId`) REFERENCES `menus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `menu_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
