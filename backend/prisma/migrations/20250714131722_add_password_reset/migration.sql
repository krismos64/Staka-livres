-- AlterTable
ALTER TABLE `messages` ADD COLUMN `isFromVisitor` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `metadata` JSON NULL,
    ADD COLUMN `status` VARCHAR(50) NULL,
    MODIFY `type` ENUM('USER_MESSAGE', 'SYSTEM_MESSAGE', 'NOTIFICATION', 'SUPPORT_MESSAGE', 'ADMIN_MESSAGE', 'CONSULTATION_REQUEST') NOT NULL DEFAULT 'USER_MESSAGE';

-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'PAYMENT', 'ORDER', 'MESSAGE', 'SYSTEM', 'CONSULTATION') NOT NULL DEFAULT 'INFO';

-- CreateTable
CREATE TABLE `password_resets` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_resets_tokenHash_key`(`tokenHash`),
    INDEX `password_resets_userId_idx`(`userId`),
    INDEX `password_resets_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `password_resets` ADD CONSTRAINT `password_resets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
