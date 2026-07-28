# Invoice Manual — Design

Tanggal: 2026-07-28
Status: disetujui, siap diimplementasikan

## Masalah

Sistem invoice yang ada sekarang hanya bisa membuat invoice dari data yang sudah
masuk sistem: order web (`/api/orders/:id/send-invoice`) dan penambahan order
(`/api/order-additions/:id/send-invoice`). Transaksi di luar alur itu — pelanggan
walk-in, proyek, tagihan ke instansi — tidak punya jalur invoice sama sekali.

Admin butuh bisa membuat invoice dari form kosong: isi data pelanggan dan baris
item sendiri, sistem menghitung total, memberi nomor invoice, menyimpannya, dan
menyediakan link yang bisa dikirim ke pelanggan lewat WhatsApp.

## Ruang lingkup

Termasuk:

- Kop surat resmi CV Hasil Daya Bersama pada semua invoice
- Menu admin baru untuk membuat, melihat, dan menghapus invoice manual
- Perhitungan otomatis: total per baris, subtotal, DP, sisa tagihan
- Penomoran invoice yang tidak tabrakan dengan invoice order
- Halaman cetak publik + link WhatsApp

Tidak termasuk (sengaja dilewati):

- PPN / pajak dan diskon — tambahkan kalau memang dipakai
- Edit invoice setelah dibuat — hapus lalu buat ulang
- Template item tersimpan / autocomplete dari katalog material
- Pembayaran online untuk invoice manual (Midtrans)

## Kop surat

Header `src/pages/InvoiceView.tsx` yang sekarang ("HDB AIRCONDS — Jasa &
Penjualan AC Mojokerto") diganti kop resmi berikut:

```
[logo]  CV HASIL DAYA BERSAMA                                     (bold, serif)
        Service, Maintenance, Supplier & Sparepart AC,
        Kulkas, dan Mesin Cuci                                    (italic bold)
        Jl. Gajah Mada No. 19, Seduri, Kec. Mojosari, Kab. Mojokerto, Jawa Timur
        Telp: 0815-1572-9739 | Email: hasildayabersama@gmail.com
        Website: www.hdbairconds.id
════════════════════════════════════════════════════════════════════════════════
```

Logo memakai file yang sudah ada: `/images/HDB-LOGO.png`.

Karena `InvoiceView.tsx` dipakai bersama, perubahan kop ini **juga berlaku untuk
invoice order dan invoice penambahan yang sudah berjalan**. Ini disengaja: satu
tampilan invoice untuk semua jalur, bukan dua versi yang harus dirawat terpisah.

## Model data

Satu tabel baru. Baris item disimpan sebagai kolom JSON karena item tidak pernah
di-query satuan — hanya ditampilkan utuh bersama invoice-nya. Tabel kedua hanya
akan menambah join tanpa manfaat.

```sql
CREATE TABLE IF NOT EXISTS manual_invoices (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number   VARCHAR(30) NOT NULL UNIQUE,
  token            VARCHAR(64) NOT NULL UNIQUE,
  customer_name    VARCHAR(150) NOT NULL,
  customer_phone   VARCHAR(30) DEFAULT NULL,
  customer_address TEXT,
  invoice_date     DATE NOT NULL,
  items            JSON NOT NULL,
  dp_amount        DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes            TEXT,
  created_by       INT DEFAULT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mi_token (token),
  INDEX idx_mi_created (created_at)
)
```

Dibuat lewat `pool.query("CREATE TABLE IF NOT EXISTS ...")` di blok inisialisasi
`server.ts`, mengikuti pola tabel `order_additions` yang sudah ada.

Bentuk satu elemen `items`:

```json
{ "desc": "Service AC 1 PK", "qty": 2, "unit": "unit", "price": 150000 }
```

`unit` opsional, default `"pcs"`. Subtotal per baris tidak disimpan — selalu
dihitung dari `qty × price` supaya tidak ada dua sumber kebenaran.

## Perhitungan

Fungsi murni di `src/utils/invoice.ts`, dipakai oleh form admin (untuk tampilan
langsung) dan oleh server (untuk validasi). Satu implementasi, dua pemakai.

```
lineTotal  = qty × price          (per baris)
subtotal   = Σ lineTotal
dp         = diisi admin, 0 kalau kosong
sisa       = subtotal − dp        (minimum 0)
status     = dp >= subtotal ? "LUNAS"
           : dp > 0           ? "DP"
           :                    "BELUM BAYAR"
```

Server **menghitung ulang seluruh total dari `items`** dan mengabaikan total
apa pun yang dikirim browser. Ini mengikuti perbaikan price tampering yang sudah
diterapkan pada jalur order.

Validasi di server sebelum menyimpan:

- `items` tidak boleh kosong
- setiap baris: `desc` tidak kosong, `qty > 0`, `price >= 0`
- `dp_amount >= 0`
- `customer_name` tidak kosong

Gagal validasi → `400` dengan pesan yang menyebut baris bermasalah.

## Penomoran invoice

Memakai helper yang sudah ada di `server.ts`: `withInvoiceLock` (named lock MySQL
`hdb_invoice_seq` pada satu koneksi) dan `nextInvoiceNumber`.

`nextInvoiceNumber` diubah supaya menghitung tiga sumber, bukan dua:

```sql
COUNT(orders WHERE invoice_number IS NOT NULL AND bulan = ym)
+ COUNT(order_additions WHERE invoice_number IS NOT NULL AND bulan = ym)
+ COUNT(manual_invoices WHERE bulan(created_at) = ym)
+ 1
```

Format nomor tidak berubah: `INV-2026-07-0001`. Dengan ketiga sumber ikut
dihitung di bawah lock yang sama, nomor invoice manual tidak akan pernah
bertabrakan dengan invoice order.

Nomor mengikuti bulan `created_at` (kapan invoice dibuat), bukan `invoice_date`
yang bisa diisi bebas admin. Jadi invoice yang dibuat hari ini dengan tanggal
mundur ke bulan lalu tetap bernomor bulan ini. Ini disengaja: nomor urut harus
mengikuti urutan penerbitan, bukan tanggal yang diketik.

## API

Semua endpoint admin memakai `authenticateToken` + `requireAdmin`, kecuali
endpoint publik untuk halaman cetak.

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| `GET` | `/api/manual-invoices` | admin | Daftar invoice, terbaru dulu. Mengembalikan total & status hasil hitung ulang. |
| `POST` | `/api/manual-invoices` | admin | Buat invoice. Alokasi nomor + token di bawah `withInvoiceLock`. Balikan: invoice lengkap + `invoiceUrl` + `waLink`. |
| `DELETE` | `/api/manual-invoices/:id` | admin | Hapus invoice. |
| `GET` | `/api/manual-invoice/:token` | publik | Data untuk halaman cetak. |

`waLink` dibentuk sama seperti jalur invoice yang sudah ada:

```
https://wa.me/62{phone tanpa 0 di depan}?text={pesan ter-encode}
```

Kalau `customer_phone` kosong, `waLink` bernilai `null` dan tombol WhatsApp di
UI tidak ditampilkan.

Endpoint publik mengembalikan bentuk data yang sama dengan
`/api/order-invoice/:token` (`orig_items`, `add_items`, `grand_total`, dst.)
supaya `InvoiceView.tsx` bisa dipakai ulang tanpa cabang logika baru:

- `orig_items` ← baris item invoice manual
- `add_items` ← array kosong (bagian "Penambahan Material & Jasa" disembunyikan
  kalau kosong)
- ditambah: `dp_amount`, `sisa`, `status`, `notes`

## UI

### Menu admin baru

`src/pages/admin/AdminInvoices.tsx`, didaftarkan di `AdminLayout.tsx`
(`menuItems` + `renderContent`) dan `AdminSidebar.tsx` dengan id
`manual-invoices`, label "Invoice Manual".

Halaman berisi daftar invoice (nomor, kepada, total, status, tanggal) dengan
aksi Cetak, WhatsApp, dan Hapus, serta tombol "Buat Invoice Baru" yang membuka
modal form.

### Form

Kolom: nama pelanggan, telepon, alamat, tanggal invoice (`<input type="date">`,
default hari ini), baris item yang bisa ditambah/hapus, DP, catatan.

Per baris: deskripsi, qty, satuan, harga satuan, dan total baris yang terhitung
otomatis dan tidak bisa diedit. Di bawah tabel: subtotal, DP, sisa tagihan, dan
label status — semuanya ikut berubah begitu angka diketik.

Tombol simpan nonaktif selama form tidak valid (tidak ada baris item, atau ada
baris tanpa deskripsi / qty ≤ 0).

### Halaman cetak

Memakai `src/pages/InvoiceView.tsx` yang sudah ada dengan `fetchUrl` menunjuk
`/api/manual-invoice/:token`. Perubahan pada komponen:

1. Kop surat baru (berlaku untuk semua jenis invoice)
2. Baris DP dan Sisa Tagihan pada tabel total, tampil hanya kalau `dp_amount > 0`
3. Label status memakai `data.status`, menggantikan teks "LUNAS" yang sekarang
   di-hardcode — invoice order tetap mengirim `status: "LUNAS"` supaya
   tampilannya tidak berubah
4. Blok catatan tampil kalau `notes` terisi
5. Bagian "Penambahan Material & Jasa" disembunyikan kalau `add_items` kosong

### Route publik

`/invoice-manual/<token>` didaftarkan di tiga tempat:

- `src/App.tsx`: `TOKEN_PAGES`, `getPageFromPath`, state token, dan `case` render
- `server.ts`: `SPA_PREFIXES` supaya refresh halaman tidak 404

## Pengujian

Satu berkas pengecekan: `scripts/test-invoice.mjs`, dijalankan dengan
`node scripts/test-invoice.mjs`. Isinya `assert` terhadap fungsi murni di
`src/utils/invoice.ts`:

- total baris = qty × harga, termasuk qty desimal
- subtotal = jumlah semua baris
- sisa = subtotal − DP
- DP melebihi subtotal → sisa 0, bukan negatif
- status benar pada tiga kondisi: DP = 0, 0 < DP < subtotal, DP ≥ subtotal
- validasi menolak: items kosong, deskripsi kosong, qty 0 atau negatif,
  harga negatif

Tidak memakai framework test. Perhitungan uang dan validasi masukan adalah
bagian yang tidak boleh salah diam-diam; sisanya (render form, query) cukup
diverifikasi manual lewat UI.

## Berkas yang tersentuh

| Berkas | Perubahan |
|---|---|
| `src/utils/invoice.ts` | baru — hitung total & validasi |
| `scripts/test-invoice.mjs` | baru — pengecekan perhitungan |
| `src/pages/admin/AdminInvoices.tsx` | baru — daftar + form |
| `server.ts` | tabel `manual_invoices`, 4 endpoint, `nextInvoiceNumber` +1 sumber, `SPA_PREFIXES` |
| `src/pages/InvoiceView.tsx` | kop baru, baris DP/sisa, status dinamis, catatan |
| `src/pages/admin/AdminLayout.tsx` | daftarkan menu & render |
| `src/pages/admin/AdminSidebar.tsx` | item menu |
| `src/App.tsx` | route publik `/invoice-manual/<token>` |
