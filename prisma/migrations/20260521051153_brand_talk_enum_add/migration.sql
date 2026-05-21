-- AlterTable
ALTER TABLE `Message` MODIFY `messageType` ENUM('SMS', 'LMS', 'MMS', 'ALIMTALK', 'BRANDTALK') NOT NULL;
