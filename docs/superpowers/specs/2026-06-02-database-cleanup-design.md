# Rapikan Database hdb_airconds — Design

Tanggal: 2026-06-02

## Tujuan
Optimasi & merapikan database tanpa mengubah perilaku frontend dan tanpa error.
Gambar tetap tersimpan sebagai blob di DB; perubahan hanya di cara penyajian, skema, dan index.

## 1. Optimasi loading gambar
Listing tidak lagi meng-inline base64 (boros), tapi mengembalikan URL ke endpoint gambar yang sudah ada.

- `/api/products` (server.ts:515) & `/api/admin/products` (557): field `image` →
  `IF(image IS NOT NULL, CONCAT('/api/products/', id, '/image'), NULL) AS image`.
- Tim: tambah endpoint `GET /api/team/:id/image` (meniru `/api/products/:id/image`),
  lalu `/api/team` (540) & `/api/admin/team` (740) kembalikan URL `/api/team/:id/image`.
- Foto order (1440) dibiarkan — admin-only, volume kecil.
- Frontend TIDAK berubah: `<img src={x.image}>` menerima URL biasa; cache 30 hari sudah ada di endpoint.

## 2. Hapus kolom `orders.status` ganda
Sumber kebenaran = `order_status`. Kolom `status` hanya ditulis, tak pernah dibaca.

- Hapus `status = ?` di UPDATE server.ts:895 dan 1345 (beserta paramnya).
- Migrasi: `ALTER TABLE orders DROP COLUMN IF EXISTS status;` (idempotent, MariaDB 10.x).
- **Urutan**: deploy kode dulu → baru jalankan migrasi.

## 3. Index
`optimize-query-indexes.sql` (sudah selesai) — composite index sesuai query nyata, hapus index redundan.

## 4. schema.sql bersih
File struktur-only (CREATE TABLE + index inline + view), tanpa kolom `status` ganda.
File dump 16MB TIDAK disentuh (tetap backup data).

## Verifikasi
- `npx tsc --noEmit` (atau build) → tanpa error TypeScript.
- Tinjau manual: tidak ada `TO_BASE64` tersisa di query produk/tim; tidak ada `status = ?` di UPDATE orders.

## Artefak
- `optimize-query-indexes.sql` (ada)
- `migration_cleanup.sql` (drop kolom + panggil index)
- `schema.sql` (skema bersih)
- perubahan `server.ts`
