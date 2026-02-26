-- CreateTable
CREATE TABLE `HealthLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Client` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `clientCode` VARCHAR(50) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `apiKeyHash` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `Client_clientCode_key`(`clientCode`),
    INDEX `Client_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `idempotencyKey` VARCHAR(120) NULL,
    `messageType` ENUM('SMS', 'LMS', 'MMS', 'ALIMTALK') NOT NULL,
    `sendType` ENUM('NOW', 'SCHEDULED') NOT NULL,
    `status` ENUM('PENDING', 'SCHEDULED', 'DISPATCHING', 'ACCEPTED', 'DELIVERED', 'FAILED', 'VALIDATION_FAILED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `recipientPhone` VARCHAR(30) NOT NULL,
    `senderKey` VARCHAR(80) NOT NULL,
    `subject` VARCHAR(120) NULL,
    `content` TEXT NOT NULL,
    `templateCode` VARCHAR(80) NULL,
    `templateVariablesJson` JSON NULL,
    `buttonsJson` JSON NULL,
    `mediaUrl` VARCHAR(1024) NULL,
    `scheduledAt` DATETIME(3) NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finalizedAt` DATETIME(3) NULL,
    `statusReasonCode` VARCHAR(80) NULL,
    `statusReasonMessage` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `clientId` INTEGER NOT NULL,

    UNIQUE INDEX `Message_idempotencyKey_key`(`idempotencyKey`),
    INDEX `Message_clientId_requestedAt_idx`(`clientId`, `requestedAt`),
    INDEX `Message_status_scheduledAt_idx`(`status`, `scheduledAt`),
    INDEX `Message_messageType_requestedAt_idx`(`messageType`, `requestedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderDispatch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `providerRequestId` VARCHAR(120) NULL,
    `requestPayloadJson` JSON NULL,
    `responsePayloadJson` JSON NULL,
    `responseCount` INTEGER NULL,
    `responseCode` INTEGER NULL,
    `responseMessage` VARCHAR(255) NULL,
    `responseMac` VARCHAR(255) NULL,
    `isRetryable` BOOLEAN NOT NULL DEFAULT false,
    `attemptNo` INTEGER NOT NULL DEFAULT 1,
    `maxRetry` INTEGER NOT NULL DEFAULT 0,
    `nextRetryAt` DATETIME(3) NULL,
    `dispatchedAt` DATETIME(3) NULL,
    `respondedAt` DATETIME(3) NULL,
    `messageId` INTEGER NOT NULL,

    INDEX `ProviderDispatch_messageId_createdAt_idx`(`messageId`, `createdAt`),
    INDEX `ProviderDispatch_responseCode_createdAt_idx`(`responseCode`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MessageEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `eventType` ENUM('REQUESTED', 'VALIDATION_FAILED', 'SCHEDULED', 'DISPATCH_ATTEMPTED', 'ACCEPTED', 'DELIVERED', 'FAILED', 'RETRIED', 'CANCELED') NOT NULL,
    `detailJson` JSON NULL,
    `messageId` INTEGER NOT NULL,

    INDEX `MessageEvent_messageId_eventAt_idx`(`messageId`, `eventAt`),
    INDEX `MessageEvent_eventType_eventAt_idx`(`eventType`, `eventAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryResultSnapshot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `periodType` ENUM('DAY', 'MONTH') NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NULL,
    `totalCount` INTEGER NULL,
    `successCount` INTEGER NULL,
    `failedCount` INTEGER NULL,
    `responseCode` INTEGER NULL,
    `responseMsg` VARCHAR(255) NULL,
    `rawJson` JSON NULL,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DeliveryResultSnapshot_periodType_periodStart_idx`(`periodType`, `periodStart`),
    INDEX `DeliveryResultSnapshot_syncedAt_idx`(`syncedAt`),
    UNIQUE INDEX `DeliveryResultSnapshot_periodType_periodStart_key`(`periodType`, `periodStart`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BillingEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `billable` BOOLEAN NOT NULL DEFAULT true,
    `unitPrice` DECIMAL(12, 4) NOT NULL,
    `costPrice` DECIMAL(12, 4) NOT NULL,
    `marginAmount` DECIMAL(12, 4) NOT NULL,
    `billingMonth` VARCHAR(7) NOT NULL,
    `billingStatus` ENUM('PENDING', 'CONFIRMED', 'ADJUSTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clientId` INTEGER NOT NULL,
    `messageId` INTEGER NOT NULL,

    INDEX `BillingEvent_clientId_billingMonth_idx`(`clientId`, `billingMonth`),
    INDEX `BillingEvent_messageId_idx`(`messageId`),
    INDEX `BillingEvent_billingStatus_billingMonth_idx`(`billingStatus`, `billingMonth`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApiRequestLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `path` VARCHAR(255) NOT NULL,
    `method` ENUM('GET', 'POST', 'PUT', 'PATCH', 'DELETE') NOT NULL,
    `clientIp` VARCHAR(64) NOT NULL,
    `httpStatus` INTEGER NOT NULL,
    `traceId` VARCHAR(120) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clientId` INTEGER NULL,

    INDEX `ApiRequestLog_clientId_createdAt_idx`(`clientId`, `createdAt`),
    INDEX `ApiRequestLog_path_createdAt_idx`(`path`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderDispatch` ADD CONSTRAINT `ProviderDispatch_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageEvent` ADD CONSTRAINT `MessageEvent_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillingEvent` ADD CONSTRAINT `BillingEvent_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillingEvent` ADD CONSTRAINT `BillingEvent_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApiRequestLog` ADD CONSTRAINT `ApiRequestLog_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
