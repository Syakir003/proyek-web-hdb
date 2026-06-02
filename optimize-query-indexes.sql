-- ================================================
-- OPTIMASI DATABASE hdb_airconds — INDEX & CLEANUP
-- ================================================
-- Index untuk kolom yang sering dipakai di JOIN, WHERE, dan ORDER BY,
-- berdasarkan query nyata di server.ts. Tujuan: mempercepat listing
-- pesanan, laporan dashboard, riwayat user, dan lookup teknisi/customer.
--
-- Aman dijalankan berulang (IF NOT EXISTS / IF EXISTS — MariaDB 10.x).
-- MySQL 8 TIDAK mendukung IF [NOT] EXISTS pada CREATE/DROP INDEX:
--   jalankan tiap baris manual dan abaikan error "Duplicate key name"
--   atau "check that ... exists".
--
-- Cek index terpasang lebih dulu, mis:  SHOW INDEX FROM orders;
-- ================================================

-- ── ORDERS ──────────────────────────────────────
-- Riwayat pesanan user yang login: WHERE user_id = ? ORDER BY created_at DESC
-- (server.ts /api/my-orders). Composite ini melayani filter + sort sekaligus.
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at);
-- Daftar tugas teknisi & laporan beban kerja: JOIN/WHERE teknisi_id.
CREATE INDEX IF NOT EXISTS idx_orders_teknisi_id ON orders(teknisi_id);
-- Statistik admin: GROUP BY / WHERE order_status ('pending','completed', dst).
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
-- Dashboard pendapatan: WHERE payment_status='settlement' + SUM(total_price).
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
-- Semua listing admin: ORDER BY created_at DESC; grafik: WHERE created_at >= ?.
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ── ORDER ITEMS ─────────────────────────────────
-- JOIN order_items ON oi.order_id (GROUP_CONCAT nama produk di tiap listing).
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
-- Laporan produk terlaris: LEFT JOIN ON oi.item_id AND oi.item_type='product'.
CREATE INDEX IF NOT EXISTS idx_order_items_item ON order_items(item_type, item_id);

-- ── ORDER ADDITIONS ─────────────────────────────
-- Cek addition pending sebuah order: WHERE order_id = ? AND status = ? LIMIT 1
-- (subquery pending_addition_token di /api/my-orders). Composite menutupi
-- juga lookup hanya-order_id, jadi index order_id tunggal jadi redundan.
CREATE INDEX IF NOT EXISTS idx_oa_order_status ON order_additions(order_id, status);
-- JOIN users ON oa.initiated_by_id (nama pemrakarsa di list admin).
CREATE INDEX IF NOT EXISTS idx_oa_initiated_by_id ON order_additions(initiated_by_id);

-- ── ORDER ADDITION ITEMS ────────────────────────
-- Lookup item per addition (batch IN (...) di list admin & detail).
-- FK order_addition_id biasanya sudah ter-index otomatis; baris jaga-jaga.
CREATE INDEX IF NOT EXISTS idx_oai_addition_id ON order_addition_items(order_addition_id);

-- ── PRODUCTS ────────────────────────────────────
-- Lookup via slug sudah ditangani index `idx_slug` yang ADA di skema.
-- Jangan buat index baru bernama lain (mis. idx_products_slug) — itu duplikat.

-- ================================================
-- INDEX REDUNDAN — HAPUS (menghemat ruang & beban tulis)
-- ================================================
-- order_additions.customer_token sudah punya UNIQUE KEY `customer_token`,
-- yang otomatis berfungsi sebagai index. `idx_oa_token` di atasnya duplikat.
DROP INDEX IF EXISTS idx_oa_token ON order_additions;

-- `idx_oa_order_id` (order_id tunggal) jadi redundan setelah composite
-- idx_oa_order_status (order_id, status) ada — leftmost prefix sudah menutupi.
DROP INDEX IF EXISTS idx_oa_order_id ON order_additions;

-- Catatan MySQL 8: index FK tidak boleh di-drop kalau jadi satu-satunya
-- penopang constraint. idx_oa_order_status menggantikan perannya, jadi aman.

-- ================================================
-- VERIFIKASI (jalankan manual setelah migrasi)
-- ================================================
-- SHOW INDEX FROM orders;
-- SHOW INDEX FROM order_additions;
-- EXPLAIN SELECT ... ;   -- pastikan "key" memakai index di atas, bukan NULL.
