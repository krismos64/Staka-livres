/*
  Warnings:

  - You are about to drop the column `commandeId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `supportRequestId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `threadId` on the `messages` table. All the data in the column will be lost.
  - Added the required column `conversationId`. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_commandeId_fkey`;

-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_parentId_fkey`;

-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_supportRequestId_fkey`;

-- DropIndex
DROP INDEX `messages_commandeId_idx` ON `messages`;

-- DropIndex
DROP INDEX `messages_createdAt_idx` ON `messages`;

-- DropIndex
DROP INDEX `messages_parentId_idx` ON `messages`;

-- DropIndex
DROP INDEX `messages_statut_idx` ON `messages`;

-- DropIndex
DROP INDEX `messages_supportRequestId_idx` ON `messages`;

-- DropIndex
DROP INDEX `messages_threadId_idx` ON `messages`;

-- DropIndex
DROP INDEX `messages_type_idx` ON `messages`;

-- Step 1: Add the new columns as optional
ALTER TABLE `messages` 
    DROP COLUMN `commandeId`,
    DROP COLUMN `supportRequestId`,
    DROP COLUMN `threadId`,
    ADD COLUMN `conversationId` VARCHAR(191) NULL,
    ADD COLUMN `visitorEmail` VARCHAR(255) NULL,
    ADD COLUMN `visitorName` VARCHAR(100) NULL,
    MODIFY `senderId` VARCHAR(191) NULL;

-- Step 2: Populate the new conversationId for existing messages
-- We create a temporary table to store conversation IDs based on sender/receiver pairs
CREATE TEMPORARY TABLE temp_conversations AS
SELECT
    LEAST(senderId, receiverId) as user1,
    GREATEST(senderId, receiverId) as user2,
    UUID() as conv_id
FROM messages
WHERE senderId IS NOT NULL AND receiverId IS NOT NULL
GROUP BY user1, user2;

-- Now update the messages table using the temporary table
UPDATE messages m
JOIN temp_conversations tc ON 
    (m.senderId = tc.user1 AND m.receiverId = tc.user2) OR
    (m.senderId = tc.user2 AND m.receiverId = tc.user1)
SET m.conversationId = tc.conv_id;

-- For any messages that might not have a pair (e.g. only senderId), assign a unique ID
UPDATE messages SET conversationId = UUID() WHERE conversationId IS NULL;

-- Drop the temporary table
DROP TEMPORARY TABLE temp_conversations;

-- Step 3: Make the conversationId column required
ALTER TABLE `messages` MODIFY `conversationId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `messages_conversationId_idx` ON `messages`(`conversationId`);

-- CreateIndex
CREATE INDEX `messages_visitorEmail_idx` ON `messages`(`visitorEmail`);

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `messages`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
