-- AlterTable
ALTER TABLE `messages` ADD COLUMN `supportRequestId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `messages_supportRequestId_idx` ON `messages`(`supportRequestId`);

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_supportRequestId_fkey` FOREIGN KEY (`supportRequestId`) REFERENCES `support_requests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
