/*
  Warnings:

  - You are about to drop the column `tokenHash` on the `ClientRefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `loginId` on the `ClientUser` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `ClientUser` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[refreshToken]` on the table `ClientRefreshToken` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[account]` on the table `ClientUser` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `refreshToken` to the `ClientRefreshToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account` to the `ClientUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `ClientUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salt` to the `ClientUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `ClientRefreshToken_tokenHash_key` ON `ClientRefreshToken`;

-- DropIndex
DROP INDEX `ClientUser_loginId_key` ON `ClientUser`;

-- DropIndex
DROP INDEX `ClientUser_loginId_status_idx` ON `ClientUser`;

-- AlterTable
ALTER TABLE `ClientRefreshToken` DROP COLUMN `tokenHash`,
    ADD COLUMN `refreshToken` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `ClientUser` DROP COLUMN `loginId`,
    DROP COLUMN `passwordHash`,
    ADD COLUMN `account` VARCHAR(120) NOT NULL,
    ADD COLUMN `password` VARCHAR(255) NOT NULL,
    ADD COLUMN `salt` VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ClientRefreshToken_refreshToken_key` ON `ClientRefreshToken`(`refreshToken`);

-- CreateIndex
CREATE UNIQUE INDEX `ClientUser_account_key` ON `ClientUser`(`account`);

-- CreateIndex
CREATE INDEX `ClientUser_account_status_idx` ON `ClientUser`(`account`, `status`);
