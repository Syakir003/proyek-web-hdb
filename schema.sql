-- ================================================
-- SKEMA BERSIH — database hdb_airconds
-- ================================================
-- Struktur-only (TANPA data). Mencerminkan skema final setelah optimasi:
--   • Index composite sesuai query nyata, index redundan dibuang.
--   • Kolom `orders.status` ganda dihapus (pakai `order_status`).
--   • View dan foreign key disertakan.
--
-- Untuk membuat DB baru dari nol:
--   CREATE DATABASE hdb_airconds DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   mysql hdb_airconds < schema.sql
--
-- Data tetap di file dump terpisah (hdb_airconds dump). File ini TIDAK berisi data.
-- ================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── users ───────────────────────────────────────
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `role` enum('admin','teknisi','user') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── user_addresses (beberapa alamat per user) ────
DROP TABLE IF EXISTS `user_addresses`;
CREATE TABLE `user_addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `label` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ua_user_id` (`user_id`),
  CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── products ────────────────────────────────────
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacity` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(12,2) NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `image` mediumblob,
  `description` text COLLATE utf8mb4_unicode_ci,
  `features` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `image_alt` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_mime` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'image/webp',
  `slug` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── services ────────────────────────────────────
DROP TABLE IF EXISTS `services`;
CREATE TABLE `services` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── service_tiers ───────────────────────────────
DROP TABLE IF EXISTS `service_tiers`;
CREATE TABLE `service_tiers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `service_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `sort_order` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `service_tiers_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── material_catalog ────────────────────────────
DROP TABLE IF EXISTS `material_catalog`;
CREATE TABLE `material_catalog` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pcs',
  `price` decimal(12,2) NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── team ────────────────────────────────────────
DROP TABLE IF EXISTS `team`;
CREATE TABLE `team` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` enum('founder','admin','kepala_teknisi','teknisi','lainnya') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'lainnya',
  `role_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` mediumblob,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `image_mime` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'image/webp',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── carts ───────────────────────────────────────
DROP TABLE IF EXISTS `carts`;
CREATE TABLE `carts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `idx_carts_user_id` (`user_id`),
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `carts_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── orders (TANPA kolom `status` ganda) ─────────
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `customer_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `midtrans_transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `midtrans_snap_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('pending','settlement','expire','cancel','deny','refund') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `order_status` enum('pending','processing','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `total_price` decimal(12,2) NOT NULL,
  `teknisi_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `invoice_number` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_sent_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_orders_user_created` (`user_id`,`created_at`),
  KEY `idx_orders_teknisi_id` (`teknisi_id`),
  KEY `idx_orders_order_status` (`order_status`),
  KEY `idx_orders_payment_status` (`payment_status`),
  KEY `idx_orders_created_at` (`created_at`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`teknisi_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── order_items ─────────────────────────────────
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_type` enum('product','service') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'product',
  `item_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `price` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`order_id`),
  KEY `idx_order_items_item` (`item_type`,`item_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── order_photos ────────────────────────────────
DROP TABLE IF EXISTS `order_photos`;
CREATE TABLE `order_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo_type` enum('before','after') COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` mediumblob NOT NULL,
  `mime_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'image/jpeg',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── order_additions ─────────────────────────────
DROP TABLE IF EXISTS `order_additions`;
CREATE TABLE `order_additions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `initiated_by` enum('teknisi','customer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `initiated_by_id` int NOT NULL,
  `status` enum('pending_admin','admin_approved','admin_rejected','pending_customer','customer_approved','customer_rejected','paid','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_admin',
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `payment_method` enum('cash','online') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('pending','paid') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_token` (`customer_token`),
  KEY `idx_oa_order_status` (`order_id`,`status`),
  KEY `idx_oa_initiated_by_id` (`initiated_by_id`),
  CONSTRAINT `order_additions_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── order_addition_items ────────────────────────
DROP TABLE IF EXISTS `order_addition_items`;
CREATE TABLE `order_addition_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_addition_id` int NOT NULL,
  `item_type` enum('material','service') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ref_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pcs',
  `quantity` decimal(10,2) NOT NULL DEFAULT '1.00',
  `unit_price` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_oai_addition_id` (`order_addition_id`),
  CONSTRAINT `order_addition_items_ibfk_1` FOREIGN KEY (`order_addition_id`) REFERENCES `order_additions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================
-- VIEWS
-- ================================================
DROP VIEW IF EXISTS `v_dashboard_stats`;
CREATE VIEW `v_dashboard_stats` AS
SELECT count(0) AS `totalOrders`,
       coalesce(sum((case when (`orders`.`payment_status` = 'settlement') then `orders`.`total_price` else 0 end)),0) AS `totalRevenue`,
       count((case when (`orders`.`order_status` = 'pending') then 1 end)) AS `pendingOrders`,
       (select count(0) from `products`) AS `totalProducts`
FROM `orders`;

DROP VIEW IF EXISTS `v_orders_admin`;
CREATE VIEW `v_orders_admin` AS
SELECT `o`.`id` AS `id`, `o`.`customer_name` AS `customer_name`, `o`.`phone` AS `phone`,
       `o`.`address` AS `address`, `o`.`payment_method` AS `payment_method`,
       `o`.`payment_status` AS `payment_status`, `o`.`order_status` AS `status`,
       `o`.`total_price` AS `total_price`, `o`.`teknisi_id` AS `teknisi_id`,
       `o`.`created_at` AS `created_at`, `o`.`updated_at` AS `updated_at`,
       `u`.`name` AS `teknisi_name`,
       group_concat(`oi`.`item_name` order by `oi`.`id` ASC separator ', ') AS `product_name`,
       coalesce(sum(`oi`.`quantity`),0) AS `total_quantity`
FROM ((`orders` `o` left join `users` `u` on((`u`.`id` = `o`.`teknisi_id`)))
      left join `order_items` `oi` on((`oi`.`order_id` = `o`.`id`)))
GROUP BY `o`.`id`, `o`.`customer_name`, `o`.`phone`, `o`.`address`, `o`.`payment_method`,
         `o`.`payment_status`, `o`.`order_status`, `o`.`total_price`, `o`.`teknisi_id`,
         `o`.`created_at`, `o`.`updated_at`, `u`.`name`;

DROP VIEW IF EXISTS `v_orders_teknisi`;
CREATE VIEW `v_orders_teknisi` AS
SELECT `o`.`id` AS `id`, `o`.`customer_name` AS `customer_name`, `o`.`phone` AS `phone`,
       `o`.`address` AS `address`, `o`.`order_status` AS `status`,
       `o`.`teknisi_id` AS `teknisi_id`, `o`.`created_at` AS `created_at`,
       group_concat(`oi`.`item_name` order by `oi`.`id` ASC separator ', ') AS `product_name`
FROM (`orders` `o` left join `order_items` `oi` on((`oi`.`order_id` = `o`.`id`)))
WHERE (`o`.`order_status` in ('pending','processing'))
GROUP BY `o`.`id`, `o`.`customer_name`, `o`.`phone`, `o`.`address`,
         `o`.`order_status`, `o`.`teknisi_id`, `o`.`created_at`;
