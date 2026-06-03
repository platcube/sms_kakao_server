-- AlterTable
ALTER TABLE `Client` ADD COLUMN `deliveryCallbackApiKeyEnc` TEXT NULL,
    ADD COLUMN `deliveryCallbackEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `deliveryCallbackUrl` VARCHAR(1024) NULL;

-- AlterTable
ALTER TABLE `Message` ADD COLUMN `deliveryPollAttempt` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `deliveryPollStatus` ENUM('WAITING', 'COMPLETE') NULL,
    ADD COLUMN `lastPolledAt` DATETIME(3) NULL,
    ADD COLUMN `nextPollAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `DeliveryResult` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `idempotencyKey` VARCHAR(120) NULL,
    `totalCount` INTEGER NOT NULL DEFAULT 0,
    `successCount` INTEGER NOT NULL DEFAULT 0,
    `failedCount` INTEGER NOT NULL DEFAULT 0,
    `providerResultCode` VARCHAR(80) NULL,
    `providerResultMessage` VARCHAR(255) NULL,
    `rawJson` JSON NULL,
    `confirmedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `messageId` INTEGER NOT NULL,

    UNIQUE INDEX `DeliveryResult_messageId_key`(`messageId`),
    INDEX `DeliveryResult_idempotencyKey_idx`(`idempotencyKey`),
    INDEX `DeliveryResult_confirmedAt_idx`(`confirmedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientDeliveryCallbackAttempt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `attemptNo` INTEGER NOT NULL DEFAULT 1,
    `callbackUrl` VARCHAR(1024) NOT NULL,
    `requestPayloadJson` JSON NULL,
    `responseStatus` INTEGER NULL,
    `responseBody` TEXT NULL,
    `success` BOOLEAN NOT NULL DEFAULT false,
    `nextRetryAt` DATETIME(3) NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `respondedAt` DATETIME(3) NULL,
    `clientId` INTEGER NOT NULL,
    `messageId` INTEGER NOT NULL,
    `deliveryResultId` INTEGER NULL,

    INDEX `ClientDeliveryCallbackAttempt_clientId_requestedAt_idx`(`clientId`, `requestedAt`),
    INDEX `ClientDeliveryCallbackAttempt_messageId_attemptNo_idx`(`messageId`, `attemptNo`),
    INDEX `ClientDeliveryCallbackAttempt_success_nextRetryAt_idx`(`success`, `nextRetryAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Message_messageType_status_deliveryPollStatus_nextPollAt_idx` ON `Message`(`messageType`, `status`, `deliveryPollStatus`, `nextPollAt`);

-- AddForeignKey
ALTER TABLE `DeliveryResult` ADD CONSTRAINT `DeliveryResult_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientDeliveryCallbackAttempt` ADD CONSTRAINT `ClientDeliveryCallbackAttempt_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientDeliveryCallbackAttempt` ADD CONSTRAINT `ClientDeliveryCallbackAttempt_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientDeliveryCallbackAttempt` ADD CONSTRAINT `ClientDeliveryCallbackAttempt_deliveryResultId_fkey` FOREIGN KEY (`deliveryResultId`) REFERENCES `DeliveryResult`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
