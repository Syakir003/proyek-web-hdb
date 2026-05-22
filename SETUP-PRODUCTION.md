# Setup Production — HDB Airconds

Panduan ringkas untuk switch dari **sandbox** (development) ke **production** (real money).

> Asumsi: kamu sudah deploy aplikasi ke VPS (lihat panduan Hostinger di chat sebelumnya).
> Kalau belum, ini bisa dijalankan di lokal dulu untuk testing dengan akun production Midtrans.

---

## Tahap 1 — Aktivasi Akun Production Midtrans

Tanpa akun production aktif, kamu **tidak bisa** dapat production key.

1. Login [https://dashboard.midtrans.com](https://dashboard.midtrans.com)
2. Toggle environment di pojok kiri atas: **Sandbox → Production**
3. Kalau muncul tombol **Activate Production**, klik
4. Upload dokumen yang diminta:
   - KTP owner
   - NPWP pribadi / badan usaha
   - NIB / SIUP (kalau ada)
   - Rekening bank untuk settlement
   - Foto lokasi usaha (Jl. Gajah Mada No.19, Mojosari)
5. Tunggu approval Midtrans **1–3 hari kerja**
6. Setelah aktif, **Settings → Access Keys** → copy:
   - **Server Key**: `Mid-server-XXXXXXXXXX`
   - **Client Key**: `Mid-client-XXXXXXXXXX`

> Note: production key TANPA prefix `SB-`. Kalau masih ada `SB-Mid-...` berarti environment kamu masih sandbox.

---

## Tahap 2 — Daftarkan Webhook URL di Midtrans

Tanpa step ini, status pembayaran **tidak akan auto-update** dari pending → settlement walau pelanggan sudah bayar.

**Settings → Configuration**, isi:

| Field | URL |
|---|---|
| Payment Notification URL | `https://www.hdbaircons.com/api/midtrans/webhook` |
| Finish Redirect URL | `https://www.hdbaircons.com/pesanan-saya?status=success` |
| Unfinish Redirect URL | `https://www.hdbaircons.com/pesanan-saya?status=pending` |
| Error Redirect URL | `https://www.hdbaircons.com/pesanan-saya?status=error` |

Klik **Update**. Lalu klik tombol **Test** di sebelah Payment Notification URL untuk verifikasi.

---

## Tahap 3 — Switch Mode di Aplikasi

Ada 3 cara, pilih salah satu:

### Cara A — Pakai script otomatis (RECOMMENDED, paling aman)

```bash
npm run midtrans:production
```

Script akan:
1. Tanya konfirmasi (mencegah accidental switch)
2. Minta paste production server key & client key
3. Validasi prefix key benar (`Mid-server-...` / `Mid-client-...`)
4. Backup `.env` lama ke `.env.backup`
5. Update 5 baris terkait Midtrans di `.env`
6. Print langkah selanjutnya

### Cara B — Manual edit `.env`

Buka `.env`, ganti:

```diff
- MIDTRANS_SERVER_KEY=SB-Mid-server-XXXXXXXXXX
- MIDTRANS_CLIENT_KEY=SB-Mid-client-XXXXXXXXXX
- MIDTRANS_IS_PRODUCTION=false
- VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-XXXXXXXXXX
- VITE_MIDTRANS_IS_PRODUCTION=false

+ MIDTRANS_SERVER_KEY=Mid-server-XXXXXXXXXX        # paste production server key
+ MIDTRANS_CLIENT_KEY=Mid-client-XXXXXXXXXX        # paste production client key
+ MIDTRANS_IS_PRODUCTION=true
+ VITE_MIDTRANS_CLIENT_KEY=Mid-client-XXXXXXXXXX   # sama dgn MIDTRANS_CLIENT_KEY
+ VITE_MIDTRANS_IS_PRODUCTION=true
```

### Cara C — Cek status saat ini

```bash
npm run midtrans:status
```

Output contoh:
```
Mode flag : SANDBOX
Key type  : sandbox
Match     : ✅ OK
```

Kalau muncul `❌ MISMATCH` berarti `IS_PRODUCTION` flag tidak sesuai dengan tipe key — server akan menolak start (sudah ada validasi otomatis).

---

## Tahap 4 — Rebuild Frontend & Restart Server

**WAJIB rebuild** karena `VITE_*` variable ter-embed saat build, bukan runtime:

```bash
npm run build
```

Lalu restart server:

```bash
# Kalau pakai PM2 di production
pm2 restart hdbaircons

# Kalau masih lokal/dev
# Ctrl+C lalu npm run dev
```

Saat server boot, harus muncul log:
```
✅ Midtrans configured: 🔴 PRODUCTION (real money!)
```

Kalau muncul `🟡 SANDBOX (test mode)` berarti config belum apply.

---

## Tahap 5 — Test Transaksi Real

Pakai nominal kecil dulu (Rp 1.000 atau Rp 10.000).

1. Buka `https://www.hdbaircons.com` di incognito (bukan akun admin)
2. Daftar / login sebagai pelanggan
3. Tambah produk termurah ke cart, checkout
4. Pilih metode **QRIS** (paling cepat)
5. Bayar pakai HP (scan QRIS dengan GoPay/OVO/DANA/etc)
6. Tunggu 5–10 detik

**Verifikasi:**

```bash
# Cek log webhook diterima
pm2 logs hdbaircons --lines 50 | grep webhook

# Cek status di database
mysql -u USER -p hdbaircons -e "SELECT id, payment_status, order_status, midtrans_transaction_id FROM orders ORDER BY created_at DESC LIMIT 1;"
```

Status harus jadi `settlement` (bukan `pending`).

Cek juga di Midtrans dashboard **Transactions** → transaksi terbaru harus berlabel hijau **Settlement**.

---

## Checklist Go-Live

Centang semua sebelum buka untuk publik:

- [ ] Akun Midtrans production sudah diaktivasi & di-approve
- [ ] Production server key & client key sudah didapat
- [ ] `npm run midtrans:status` menunjukkan ✅ OK
- [ ] `npm run build` sudah dijalankan setelah ubah env
- [ ] Server di-restart (log boot menunjukkan 🔴 PRODUCTION)
- [ ] Webhook URL sudah didaftarkan di Midtrans Dashboard
- [ ] Tombol "Test" webhook di Midtrans Dashboard sukses (cek pm2 logs)
- [ ] Test transaksi real Rp 1.000 sukses end-to-end
- [ ] Email notifikasi pembayaran masuk
- [ ] Status order di database otomatis jadi `settlement`
- [ ] SSL aktif (gembok hijau di browser)

---

## Rollback ke Sandbox (kalau ada masalah)

```bash
# Cara cepat: pulihkan .env dari backup
cp .env.backup .env

# Atau switch ulang via script
npm run midtrans:sandbox

# Rebuild & restart
npm run build
pm2 restart hdbaircons
```

---

## Troubleshooting Cepat

| Gejala | Fix |
|---|---|
| Server boot error: `FATAL: MIDTRANS_IS_PRODUCTION=true tapi key masih SANDBOX!` | Validasi otomatis bekerja. Update `MIDTRANS_SERVER_KEY` & `MIDTRANS_CLIENT_KEY` ke production key |
| Popup Snap menampilkan branding "Sandbox" walau pakai prod key | Frontend belum di-rebuild. Run `npm run build` lalu hard refresh browser (Ctrl+Shift+R) |
| Webhook tidak diterima | Pastikan URL HTTPS, publik, return 200. Test dengan tombol Test di Midtrans Dashboard |
| Status pembayaran stuck di pending | Cek apakah webhook URL didaftarkan di dashboard Midtrans (Settings → Configuration) |
| Error "Invalid client key" di browser | `VITE_MIDTRANS_CLIENT_KEY` salah atau belum di-build ulang setelah ganti |

---

## File Terkait

- `.env.example` — template lengkap dengan komentar
- `.env` — config aktif (TIDAK di-commit ke git)
- `scripts/switch-midtrans.cjs` — helper switch mode
- `server.ts` (line 28-75) — validasi config Midtrans saat boot
- `src/utils/midtrans.ts` — instance Midtrans client (frontend)
- `src/pages/Checkout.tsx` (line 68-125) — load Snap.js dinamis
