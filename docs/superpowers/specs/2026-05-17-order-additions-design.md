# Design: Sistem Penambahan Material & Jasa (Order Additions)

**Tanggal:** 2026-05-17
**Status:** Disetujui — siap implementasi

---

## Latar Belakang

Saat teknisi tiba di lokasi pemasangan, kondisi lapangan sering kali berbeda dari perkiraan awal pelanggan. Contoh: pelanggan memesan pemasangan AC dengan asumsi 1 meter pipa, namun medan lokasi membutuhkan 5 meter. Sistem saat ini tidak menangani penambahan material/jasa setelah order dibayar, karena transaksi bersifat immutable setelah pembayaran.

Solusi: **tabel dedikasi `order_additions`** yang terhubung ke order asal — tidak mengubah transaksi lama, tapi mencatat penambahan sebagai entitas tersendiri dengan alur approval dan pembayaran sendiri.

---

## Alur Kerja

### Flow per Role (Final)

```
PELANGGAN                    ADMIN                        TEKNISI
─────────────────────────────────────────────────────────────────────
1. Buat order & bayar              -                           -
2.      -                     Assign teknisi                   -
3.      -                          -                      Terima notif ditugaskan

4.      -                          -                      Survei lokasi
                                                               ↓
                                                    Perlu tambahan?
                                                    TIDAK → langsung kerjakan
                                                    YA    ↓

5a.     -                          -                      Input penambahan:
                                                          • Material (dari katalog)
                                                          • Jasa baru
                                                          • Tambah qty jasa
                                                          → Submit

── ATAU (inisiasi customer) ──────────────────────────────────────────
5b. Request penambahan             -                           -
    jasa/qty dari web

═══════════════════════ VALIDASI ADMIN ══════════════════════════════
6.      -                     Terima notif penambahan          -
                              → lihat detail items + total
                              → APPROVE / TOLAK
                              [tolak] → notif teknisi/customer

═══════════════════════ APPROVAL CUSTOMER ═══════════════════════════
7.  Terima notif (web + WA)        -                           -
    → buka link token (tanpa login)
    → lihat detail + total harga
    → APPROVE / TOLAK
    [approve] → pilih Cash / Online
    [tolak]   → notif teknisi

    [teknisi pilih tindakan:]
      • Revisi & submit ulang → kembali ke step 5
      • Eskalasi ke admin
      • Batalkan job

═══════════════════════ PAYMENT ═════════════════════════════════════
8.  Bayar (Cash / Online)          -                      Terima notif paid
    → paid / confirmed                                    → lanjut / mulai kerja

═══════════════════════ INVOICE & HISTORY ═══════════════════════════
9.      -                     Review transaksi final           -
                              → Kirim invoice ke customer
                              → Tercatat di history

10. Terima invoice                 -                      Update status → selesai
    (web + WA)
```

---

## Database

### Tabel Baru

#### `material_catalog`
Katalog material/sparepart yang dikelola admin.

```sql
CREATE TABLE IF NOT EXISTS material_catalog (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  unit        VARCHAR(50)  NOT NULL DEFAULT 'pcs',
  price       DECIMAL(12,2) NOT NULL,
  category    VARCHAR(100),
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `order_additions`
Satu record = satu pengajuan penambahan untuk satu order.

```sql
CREATE TABLE IF NOT EXISTS order_additions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  order_id         VARCHAR(50) NOT NULL,
  initiated_by     ENUM('teknisi','customer') NOT NULL,
  initiated_by_id  INT NOT NULL,
  status           ENUM(
                     'pending_admin',
                     'admin_approved',
                     'admin_rejected',
                     'pending_customer',
                     'customer_approved',
                     'customer_rejected',
                     'paid',
                     'cancelled'
                   ) NOT NULL DEFAULT 'pending_admin',
  admin_notes      TEXT,
  payment_method   ENUM('cash','online') DEFAULT NULL,
  payment_status   ENUM('pending','paid') DEFAULT NULL,
  customer_token   VARCHAR(64) UNIQUE,
  invoice_sent_at  TIMESTAMP DEFAULT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (initiated_by_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id),
  INDEX idx_token (customer_token)
);
```

**Status lifecycle:**
```
pending_admin
  ├─► admin_approved → pending_customer
  │     ├─► customer_approved → paid ✓
  │     └─► customer_rejected
  │             ├─► [revisi] → pending_admin (loop)
  │             ├─► [eskalasi] → pending_admin
  │             └─► cancelled ✗
  └─► admin_rejected → cancelled ✗
```

#### `order_addition_items`
Detail item dalam satu pengajuan.

```sql
CREATE TABLE IF NOT EXISTS order_addition_items (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  order_addition_id   INT NOT NULL,
  item_type           ENUM('material','service') NOT NULL,
  ref_id              VARCHAR(50) NOT NULL,
  name                VARCHAR(200) NOT NULL,
  unit                VARCHAR(50)  NOT NULL DEFAULT 'pcs',
  quantity            DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price          DECIMAL(12,2) NOT NULL,
  subtotal            DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (order_addition_id) REFERENCES order_additions(id) ON DELETE CASCADE
);
```

> `ref_id` mengacu ke `material_catalog.id` (jika `item_type = material`) atau `services.id` (jika `item_type = service`). Nama & harga di-snapshot saat diajukan agar perubahan katalog tidak mempengaruhi history.

---

## Komponen UI

### Admin Panel

| Halaman / Komponen | Fungsi |
|--------------------|--------|
| `AdminMaterialCatalog.tsx` | CRUD katalog: tambah, edit, aktif/nonaktif |
| Panel "Penambahan Order" di AdminOrders | List semua order_additions, filter by status |
| Modal detail review | Lihat items + total, input catatan admin, tombol Approve / Tolak |
| Tombol "Kirim Invoice" | Generate & kirim invoice ke customer setelah paid |

### Teknisi Dashboard

| Komponen | Fungsi |
|----------|--------|
| Tombol "Tambah Material/Jasa" | Muncul di detail order saat status `processing` |
| Form penambahan | Pilih dari katalog + qty, bisa multi-item |
| Badge status addition | Pending / Approved / Ditolak / Paid |
| Tombol revisi | Aktif setelah customer tolak |
| Tombol eskalasi & batalkan | Opsi lain setelah customer tolak |

### Customer

| Halaman / Komponen | Fungsi |
|--------------------|--------|
| `/tambahan/:token` | Halaman publik, tanpa login, via link WA |
| | Tampil daftar items + total |
| | Tombol Setuju / Tolak |
| | Jika setuju → pilih Cash atau Online |
| | Jika Online → redirect Midtrans |
| Notifikasi di "Pesanan Saya" | Card "Ada penambahan menunggu persetujuan" |

---

## API Endpoints

### Material Catalog

```
GET    /api/material-catalog              list aktif (admin & teknisi)
POST   /api/material-catalog              tambah item (admin)
PUT    /api/material-catalog/:id          edit item (admin)
PATCH  /api/material-catalog/:id/toggle   aktif / nonaktif (admin)
```

### Order Additions

```
POST   /api/orders/:orderId/additions           buat pengajuan (teknisi / customer)
GET    /api/order-additions                     list semua (admin)
GET    /api/order-additions/my                  list milik teknisi yg login
GET    /api/order-additions/token/:token        lihat via link publik (no auth)
PATCH  /api/order-additions/:id/admin-review    admin: approve / reject
PATCH  /api/order-additions/:id/customer-response  customer: approve / reject
POST   /api/order-additions/:id/payment         inisiasi bayar online (Midtrans)
PATCH  /api/order-additions/:id/revise          teknisi: revisi item
PATCH  /api/order-additions/:id/escalate        teknisi: eskalasi ke admin
PATCH  /api/order-additions/:id/cancel          teknisi: batalkan
POST   /api/order-additions/:id/send-invoice    admin: generate & kirim invoice
```

### Webhook (extend existing)

```
POST   /api/midtrans/notification   tangani payment addition (extend handler yg ada)
```

---

## Notifikasi

Semua notifikasi WA dikirim via link `wa.me` yang sudah dipakai di sistem — tidak perlu integrasi API WA baru.

| Event | Penerima | Channel |
|-------|----------|---------|
| Teknisi submit addition | Admin | Web (dashboard) |
| Admin approve | Customer | Web + WA (link token) |
| Admin reject | Teknisi | Web (dashboard) |
| Customer approve (cash) | Teknisi | Web (dashboard) |
| Customer approve (online) + paid | Teknisi | Web (dashboard) |
| Customer reject | Teknisi | Web (dashboard) |
| Admin kirim invoice | Customer | Web + WA |

---

## Keputusan Desain

| Keputusan | Alasan |
|-----------|--------|
| Tabel terpisah, bukan edit order asal | Order immutable setelah bayar — tidak boleh diubah |
| Admin validasi sebelum customer lihat | Mencegah teknisi input harga/item yang salah tanpa sepengetahuan admin |
| Token publik untuk approval customer | Customer tidak perlu login — akses mudah dari link WA |
| Snapshot nama & harga di items | Perubahan katalog tidak merusak history transaksi |
| Reuse Midtrans existing | Tidak perlu integrasi payment baru |
| ref_id VARCHAR(50) | Akomodasi services.id (VARCHAR) dan material_catalog.id (INT) sekaligus |
