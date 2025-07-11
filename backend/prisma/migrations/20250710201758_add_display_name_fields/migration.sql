-- AlterTable
ALTER TABLE `messages` ADD COLUMN `deletedByAdmin` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `displayFirstName` VARCHAR(100) NULL,
    ADD COLUMN `displayLastName` VARCHAR(100) NULL;
