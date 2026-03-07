-- CreateTable
CREATE TABLE `Domain` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `domainName` VARCHAR(255) NOT NULL,
    `registrar` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `status` TEXT NULL,
    `rdapUrl` VARCHAR(500) NULL,
    `lastCheckedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Domain_domainName_key`(`domainName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Nameserver` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `domainId` INTEGER NOT NULL,
    `nameserver` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LookupHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `domainId` INTEGER NULL,
    `domainName` VARCHAR(255) NOT NULL,
    `queryType` VARCHAR(50) NOT NULL,
    `responseStatus` INTEGER NULL,
    `success` BOOLEAN NOT NULL,
    `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rawResponse` LONGTEXT NULL,
    `errorMessage` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Nameserver` ADD CONSTRAINT `Nameserver_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `Domain`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LookupHistory` ADD CONSTRAINT `LookupHistory_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `Domain`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
