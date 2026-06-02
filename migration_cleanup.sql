-- ================================================
-- MIGRASI CLEANUP — database hdb_airconds
-- ================================================
-- Menerapkan perubahan skema pembersihan ke DB yang SUDAH berjalan.
-- Aman dijalankan berulang (idempotent) di MariaDB 10.x.
--
-- URUTAN PENTING:
--   1. Deploy kode server.ts terbaru DULU (sudah tidak menulis kolom `status`).
--   2. Baru jalankan migrasi ini.
--   3. Lalu jalankan optimize-query-indexes.sql untuk index.
--
-- Cara jalankan:
--   mysql hdb_airconds < migration_cleanup.sql
--   mysql hdb_airconds < optimize-query-indexes.sql
-- ================================================

-- ── Hapus kolom `orders.status` yang redundan ───
-- Sumber kebenaran status pesanan = `order_status`. Kolom `status` hanya
-- di-mirror dan tidak pernah dibaca langsung (frontend baca `order_status`
-- via alias). Setelah kode berhenti menulisnya, kolom ini aman dibuang.
--
-- MariaDB 10.x:
ALTER TABLE `orders` DROP COLUMN IF EXISTS `status`;

-- MySQL 8 (tidak mendukung IF EXISTS pada DROP COLUMN) — pakai baris ini
-- sebagai gantinya dan abaikan error "check that column exists" bila sudah hilang:
--   ALTER TABLE `orders` DROP COLUMN `status`;

-- ── Verifikasi ──────────────────────────────────
-- DESCRIBE `orders`;            -- pastikan kolom `status` sudah tidak ada
-- SHOW INDEX FROM `orders`;     -- cek index setelah optimize-query-indexes.sql
