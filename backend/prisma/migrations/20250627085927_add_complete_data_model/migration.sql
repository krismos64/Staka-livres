/*
  Warnings:

  - You are about to alter the column `paymentStatus` on the `commandes` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `prenom` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `nom` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.

*/
-- AlterTable
ALTER TABLE `commandes` ADD COLUMN `amount` INTEGER NULL,
    ADD COLUMN `dateEcheance` DATETIME(3) NULL,
    ADD COLUMN `dateFinition` DATETIME(3) NULL,
    ADD COLUMN `priorite` ENUM('FAIBLE', 'NORMALE', 'HAUTE', 'URGENTE') NOT NULL DEFAULT 'NORMALE',
    MODIFY `titre` VARCHAR(255) NOT NULL,
    MODIFY `description` TEXT NULL,
    MODIFY `fichierUrl` VARCHAR(500) NULL,
    MODIFY `statut` ENUM('EN_ATTENTE', 'EN_COURS', 'TERMINE', 'ANNULEE', 'SUSPENDUE') NOT NULL DEFAULT 'EN_ATTENTE',
    MODIFY `noteClient` TEXT NULL,
    MODIFY `noteCorrecteur` TEXT NULL,
    MODIFY `paymentStatus` VARCHAR(50) NULL,
    MODIFY `stripeSessionId` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `adresse` TEXT NULL,
    ADD COLUMN `avatar` VARCHAR(500) NULL,
    ADD COLUMN `telephone` VARCHAR(20) NULL,
    MODIFY `prenom` VARCHAR(100) NOT NULL,
    MODIFY `nom` VARCHAR(100) NOT NULL,
    MODIFY `email` VARCHAR(255) NOT NULL,
    MODIFY `password` VARCHAR(255) NOT NULL,
    MODIFY `role` ENUM('USER', 'ADMIN', 'CORRECTOR') NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE `files` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `storedName` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `size` INTEGER NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `type` ENUM('DOCUMENT', 'IMAGE', 'AUDIO', 'VIDEO', 'ARCHIVE', 'OTHER') NOT NULL DEFAULT 'DOCUMENT',
    `uploadedById` VARCHAR(191) NOT NULL,
    `commandeId` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `files_uploadedById_idx`(`uploadedById`),
    INDEX `files_commandeId_idx`(`commandeId`),
    INDEX `files_type_idx`(`type`),
    INDEX `files_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `receiverId` VARCHAR(191) NULL,
    `commandeId` VARCHAR(191) NULL,
    `subject` VARCHAR(255) NULL,
    `content` TEXT NOT NULL,
    `type` ENUM('USER_MESSAGE', 'SYSTEM_MESSAGE', 'NOTIFICATION', 'SUPPORT_MESSAGE', 'ADMIN_MESSAGE') NOT NULL DEFAULT 'USER_MESSAGE',
    `statut` ENUM('BROUILLON', 'ENVOYE', 'DELIVRE', 'LU', 'ARCHIVE') NOT NULL DEFAULT 'ENVOYE',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `parentId` VARCHAR(191) NULL,
    `threadId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `messages_senderId_idx`(`senderId`),
    INDEX `messages_receiverId_idx`(`receiverId`),
    INDEX `messages_commandeId_idx`(`commandeId`),
    INDEX `messages_type_idx`(`type`),
    INDEX `messages_statut_idx`(`statut`),
    INDEX `messages_parentId_idx`(`parentId`),
    INDEX `messages_threadId_idx`(`threadId`),
    INDEX `messages_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NOT NULL,

    INDEX `message_attachments_messageId_idx`(`messageId`),
    INDEX `message_attachments_fileId_idx`(`fileId`),
    UNIQUE INDEX `message_attachments_messageId_fileId_key`(`messageId`, `fileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_requests` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `category` ENUM('GENERAL', 'TECHNIQUE', 'FACTURATION', 'COMMANDE', 'COMPTE', 'AUTRE') NOT NULL DEFAULT 'GENERAL',
    `priority` ENUM('FAIBLE', 'NORMALE', 'HAUTE', 'URGENTE', 'CRITIQUE') NOT NULL DEFAULT 'NORMALE',
    `status` ENUM('OUVERT', 'EN_COURS', 'EN_ATTENTE', 'RESOLU', 'FERME', 'ANNULE') NOT NULL DEFAULT 'OUVERT',
    `assignedToId` VARCHAR(191) NULL,
    `source` VARCHAR(100) NULL,
    `tags` TEXT NULL,
    `firstResponseAt` DATETIME(3) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `support_requests_userId_idx`(`userId`),
    INDEX `support_requests_assignedToId_idx`(`assignedToId`),
    INDEX `support_requests_status_idx`(`status`),
    INDEX `support_requests_priority_idx`(`priority`),
    INDEX `support_requests_category_idx`(`category`),
    INDEX `support_requests_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_methods` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `stripePaymentMethodId` VARCHAR(255) NOT NULL,
    `brand` VARCHAR(50) NOT NULL,
    `last4` VARCHAR(4) NOT NULL,
    `expMonth` INTEGER NOT NULL,
    `expYear` INTEGER NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `fingerprint` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_methods_stripePaymentMethodId_key`(`stripePaymentMethodId`),
    INDEX `payment_methods_userId_idx`(`userId`),
    INDEX `payment_methods_stripePaymentMethodId_idx`(`stripePaymentMethodId`),
    INDEX `payment_methods_isDefault_idx`(`isDefault`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` VARCHAR(191) NOT NULL,
    `commandeId` VARCHAR(191) NOT NULL,
    `number` VARCHAR(50) NOT NULL,
    `amount` INTEGER NOT NULL,
    `taxAmount` INTEGER NOT NULL DEFAULT 0,
    `pdfUrl` VARCHAR(500) NOT NULL,
    `status` ENUM('GENERATED', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'GENERATED',
    `issuedAt` DATETIME(3) NULL,
    `dueAt` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invoices_number_key`(`number`),
    INDEX `invoices_commandeId_idx`(`commandeId`),
    INDEX `invoices_status_idx`(`status`),
    INDEX `invoices_number_idx`(`number`),
    INDEX `invoices_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'PAYMENT', 'ORDER', 'MESSAGE', 'SYSTEM') NOT NULL DEFAULT 'INFO',
    `priority` ENUM('FAIBLE', 'NORMALE', 'HAUTE', 'URGENTE') NOT NULL DEFAULT 'NORMALE',
    `data` TEXT NULL,
    `actionUrl` VARCHAR(500) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notifications_userId_idx`(`userId`),
    INDEX `notifications_type_idx`(`type`),
    INDEX `notifications_isRead_idx`(`isRead`),
    INDEX `notifications_isDeleted_idx`(`isDeleted`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pages` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `excerpt` TEXT NULL,
    `type` ENUM('PAGE', 'FAQ', 'BLOG', 'LEGAL', 'HELP', 'LANDING') NOT NULL DEFAULT 'PAGE',
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED') NOT NULL DEFAULT 'DRAFT',
    `metaTitle` VARCHAR(255) NULL,
    `metaDescription` TEXT NULL,
    `metaKeywords` TEXT NULL,
    `category` VARCHAR(100) NULL,
    `tags` TEXT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `requireAuth` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pages_slug_key`(`slug`),
    INDEX `pages_slug_idx`(`slug`),
    INDEX `pages_type_idx`(`type`),
    INDEX `pages_status_idx`(`status`),
    INDEX `pages_category_idx`(`category`),
    INDEX `pages_isPublic_idx`(`isPublic`),
    INDEX `pages_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `commandes_statut_idx` ON `commandes`(`statut`);

-- CreateIndex
CREATE INDEX `commandes_priorite_idx` ON `commandes`(`priorite`);

-- CreateIndex
CREATE INDEX `commandes_createdAt_idx` ON `commandes`(`createdAt`);

-- CreateIndex
CREATE INDEX `users_email_idx` ON `users`(`email`);

-- CreateIndex
CREATE INDEX `users_role_idx` ON `users`(`role`);

-- CreateIndex
CREATE INDEX `users_isActive_idx` ON `users`(`isActive`);

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_attachments` ADD CONSTRAINT `message_attachments_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_attachments` ADD CONSTRAINT `message_attachments_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_requests` ADD CONSTRAINT `support_requests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_requests` ADD CONSTRAINT `support_requests_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_methods` ADD CONSTRAINT `payment_methods_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `commandes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `commandes` RENAME INDEX `commandes_userId_fkey` TO `commandes_userId_idx`;
