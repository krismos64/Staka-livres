-- CreateTable
CREATE TABLE `tarifs` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `prix` INTEGER NOT NULL,
    `prixFormate` VARCHAR(50) NOT NULL,
    `typeService` VARCHAR(100) NOT NULL,
    `dureeEstimee` VARCHAR(100) NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tarifs_actif_idx`(`actif`),
    INDEX `tarifs_ordre_idx`(`ordre`),
    INDEX `tarifs_typeService_idx`(`typeService`),
    INDEX `tarifs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
