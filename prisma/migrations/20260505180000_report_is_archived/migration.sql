-- Admin-only: hide reports from default list without changing workflow status
ALTER TABLE `corruption_reports` ADD COLUMN `isArchived` BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX `corruption_reports_isArchived_idx` ON `corruption_reports`(`isArchived`);
