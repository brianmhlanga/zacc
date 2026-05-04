-- Custom report status label (enum value CUSTOM + optional customStatus text)

ALTER TABLE `corruption_reports` ADD COLUMN `customStatus` VARCHAR(200) NULL;

ALTER TABLE `report_updates` ADD COLUMN `customStatus` VARCHAR(200) NULL;

ALTER TABLE `corruption_reports` MODIFY COLUMN `status` ENUM(
  'NEW',
  'ACKNOWLEDGED',
  'UNDER_INVESTIGATION',
  'REFERRED_TO_PROSECUTION',
  'CLOSED',
  'ARCHIVED',
  'CUSTOM'
) NOT NULL DEFAULT 'NEW';

ALTER TABLE `report_updates` MODIFY COLUMN `status` ENUM(
  'NEW',
  'ACKNOWLEDGED',
  'UNDER_INVESTIGATION',
  'REFERRED_TO_PROSECUTION',
  'CLOSED',
  'ARCHIVED',
  'CUSTOM'
) NOT NULL;
