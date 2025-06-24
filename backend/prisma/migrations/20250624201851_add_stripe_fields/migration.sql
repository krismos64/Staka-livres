-- CreateTable
CREATE TABLE `commandes` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `titre` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `fichierUrl` VARCHAR(191) NULL,
    `statut` ENUM('EN_ATTENTE', 'EN_COURS', 'TERMINE', 'ANNULEE') NOT NULL DEFAULT 'EN_ATTENTE',
    `noteClient` VARCHAR(191) NULL,
    `noteCorrecteur` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `paymentStatus` VARCHAR(191) NULL,
    `stripeSessionId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `commandes` ADD CONSTRAINT `commandes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
