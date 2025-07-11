-- AlterTable
ALTER TABLE `tarifs` ADD COLUMN `stripePriceId` VARCHAR(255) NULL,
    ADD COLUMN `stripeProductId` VARCHAR(255) NULL;

-- CreateIndex
CREATE INDEX `tarifs_stripeProductId_idx` ON `tarifs`(`stripeProductId`);

-- CreateIndex
CREATE INDEX `tarifs_stripePriceId_idx` ON `tarifs`(`stripePriceId`);
