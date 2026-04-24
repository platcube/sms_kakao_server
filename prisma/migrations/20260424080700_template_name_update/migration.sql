/*
  Warnings:

  - You are about to drop the column `templateId` on the `ClientKakaoTemplate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[clientId,kakaoTemplateId]` on the table `ClientKakaoTemplate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `kakaoTemplateId` to the `ClientKakaoTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `ClientKakaoTemplate` DROP FOREIGN KEY `ClientKakaoTemplate_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `ClientKakaoTemplate` DROP FOREIGN KEY `ClientKakaoTemplate_templateId_fkey`;

-- DropIndex
DROP INDEX `ClientKakaoTemplate_clientId_templateId_key` ON `ClientKakaoTemplate`;

-- DropIndex
DROP INDEX `ClientKakaoTemplate_templateId_fkey` ON `ClientKakaoTemplate`;

-- AlterTable
ALTER TABLE `ClientKakaoTemplate` DROP COLUMN `templateId`,
    ADD COLUMN `kakaoTemplateId` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ClientKakaoTemplate_clientId_kakaoTemplateId_key` ON `ClientKakaoTemplate`(`clientId`, `kakaoTemplateId`);

-- AddForeignKey
ALTER TABLE `ClientKakaoTemplate` ADD CONSTRAINT `ClientKakaoTemplate_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientKakaoTemplate` ADD CONSTRAINT `ClientKakaoTemplate_kakaoTemplateId_fkey` FOREIGN KEY (`kakaoTemplateId`) REFERENCES `KakaoTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
