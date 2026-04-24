-- CreateTable
CREATE TABLE `KakaoProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `profileKey` VARCHAR(120) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `channelName` VARCHAR(120) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `clientId` INTEGER NOT NULL,

    UNIQUE INDEX `KakaoProfile_profileKey_key`(`profileKey`),
    INDEX `KakaoProfile_status_idx`(`status`),
    INDEX `KakaoProfile_clientId_status_idx`(`clientId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KakaoTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `templateCode` VARCHAR(80) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `content` TEXT NOT NULL,
    `button1Json` JSON NULL,
    `button2Json` JSON NULL,
    `category` VARCHAR(80) NULL,
    `status` ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `rejectionReason` VARCHAR(255) NULL,
    `profileId` INTEGER NOT NULL,

    UNIQUE INDEX `KakaoTemplate_templateCode_key`(`templateCode`),
    INDEX `KakaoTemplate_profileId_status_idx`(`profileId`, `status`),
    INDEX `KakaoTemplate_status_updatedAt_idx`(`status`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientKakaoTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `clientId` INTEGER NOT NULL,
    `templateId` INTEGER NOT NULL,

    UNIQUE INDEX `ClientKakaoTemplate_clientId_templateId_key`(`clientId`, `templateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `loginId` VARCHAR(120) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',
    `lastLoginAt` DATETIME(3) NULL,
    `clientId` INTEGER NOT NULL,

    UNIQUE INDEX `ClientUser_loginId_key`(`loginId`),
    INDEX `ClientUser_clientId_status_idx`(`clientId`, `status`),
    INDEX `ClientUser_loginId_status_idx`(`loginId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientRefreshToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tokenHash` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `replacedById` INTEGER NULL,
    `userAgent` VARCHAR(255) NULL,
    `ipAddress` VARCHAR(64) NULL,
    `status` ENUM('ACTIVE', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `clientUserId` INTEGER NOT NULL,

    UNIQUE INDEX `ClientRefreshToken_tokenHash_key`(`tokenHash`),
    INDEX `ClientRefreshToken_clientUserId_status_idx`(`clientUserId`, `status`),
    INDEX `ClientRefreshToken_expiresAt_status_idx`(`expiresAt`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `KakaoProfile` ADD CONSTRAINT `KakaoProfile_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KakaoTemplate` ADD CONSTRAINT `KakaoTemplate_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `KakaoProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientKakaoTemplate` ADD CONSTRAINT `ClientKakaoTemplate_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientKakaoTemplate` ADD CONSTRAINT `ClientKakaoTemplate_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `KakaoTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientUser` ADD CONSTRAINT `ClientUser_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientRefreshToken` ADD CONSTRAINT `ClientRefreshToken_clientUserId_fkey` FOREIGN KEY (`clientUserId`) REFERENCES `ClientUser`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
