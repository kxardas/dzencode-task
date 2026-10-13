-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER UNSIGNED NOT NULL,
    `serialNumber` VARCHAR(100) NOT NULL,
    `isNew` BOOLEAN NOT NULL DEFAULT true,
    `photo` VARCHAR(2048) NULL,
    `title` VARCHAR(255) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `specification` TEXT NOT NULL,
    `warrantyStart` DATETIME(3) NOT NULL,
    `warrantyEnd` DATETIME(3) NOT NULL,
    `priceUSD` DECIMAL(12, 2) NOT NULL,
    `priceUAH` DECIMAL(12, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `products_orderId_idx`(`orderId`),
    INDEX `products_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Domain constraints enforced by MySQL in addition to API validation.
ALTER TABLE `products`
    ADD CONSTRAINT `products_priceUSD_nonnegative` CHECK (`priceUSD` >= 0),
    ADD CONSTRAINT `products_priceUAH_nonnegative` CHECK (`priceUAH` >= 0),
    ADD CONSTRAINT `products_warranty_dates_valid` CHECK (`warrantyEnd` >= `warrantyStart`);
