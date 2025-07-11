-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adminEmail` VARCHAR(255) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `targetType` ENUM('user', 'command', 'invoice', 'payment', 'file', 'auth', 'system') NOT NULL,
    `targetId` VARCHAR(191) NULL,
    `details` TEXT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` TEXT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `audit_logs_adminEmail_idx` ON `audit_logs`(`adminEmail`);

-- CreateIndex
CREATE INDEX `audit_logs_action_idx` ON `audit_logs`(`action`);

-- CreateIndex
CREATE INDEX `audit_logs_targetType_idx` ON `audit_logs`(`targetType`);

-- CreateIndex
CREATE INDEX `audit_logs_severity_idx` ON `audit_logs`(`severity`);

-- CreateIndex
CREATE INDEX `audit_logs_timestamp_idx` ON `audit_logs`(`timestamp`);

-- CreateIndex
CREATE INDEX `audit_logs_createdAt_idx` ON `audit_logs`(`createdAt`);