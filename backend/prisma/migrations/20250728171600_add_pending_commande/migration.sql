-- CreateTable
CREATE TABLE `pending_commandes` (
    `id` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(100) NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `telephone` VARCHAR(20) NULL,
    `adresse` TEXT NULL,
    `serviceId` VARCHAR(255) NOT NULL,
    `consentementRgpd` BOOLEAN NOT NULL DEFAULT false,
    `stripeSessionId` VARCHAR(255) NULL,
    `activationToken` VARCHAR(255) NULL,
    `tokenExpiresAt` DATETIME(3) NULL,
    `isProcessed` BOOLEAN NOT NULL DEFAULT false,
    `userId` VARCHAR(191) NULL,
    `commandeId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pending_commandes_stripeSessionId_key`(`stripeSessionId`),
    UNIQUE INDEX `pending_commandes_activationToken_key`(`activationToken`),
    INDEX `pending_commandes_email_idx`(`email`),
    INDEX `pending_commandes_stripeSessionId_idx`(`stripeSessionId`),
    INDEX `pending_commandes_activationToken_idx`(`activationToken`),
    INDEX `pending_commandes_isProcessed_idx`(`isProcessed`),
    INDEX `pending_commandes_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;