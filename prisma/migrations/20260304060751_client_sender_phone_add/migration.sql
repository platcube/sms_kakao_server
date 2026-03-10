/*
  Warnings:

  - Added the required column `senderPhone` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Client` ADD COLUMN `senderPhone` VARCHAR(80) NOT NULL;
