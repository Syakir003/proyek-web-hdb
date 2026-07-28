# Invoice Manual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin bisa membuat invoice dari form kosong (data pelanggan + baris item yang diketik sendiri), lengkap dengan DP, kop surat resmi CV Hasil Daya Bersama, nomor invoice otomatis, halaman cetak, dan link WhatsApp.

**Architecture:** Satu tabel `manual_invoices` dengan baris item disimpan sebagai kolom JSON. Semua perhitungan uang tinggal di satu fungsi murni `src/utils/invoice.ts` yang dipakai bersama oleh form admin (untuk tampilan langsung) dan server (untuk hitung ulang saat menyimpan dan membaca) — server tidak pernah mempercayai total kiriman browser. Halaman cetak memakai ulang `src/pages/InvoiceView.tsx` yang sudah ada; endpoint publik invoice manual sengaja mengembalikan bentuk data yang sama dengan `/api/order-invoice/:token`.

**Tech Stack:** React 19 + TypeScript + Tailwind v4 (Vite), Express 4 + mysql2 (dijalankan lewat `tsx`), lucide-react untuk ikon, `motion` untuk animasi. Tidak ada dependency baru.

Spec: `docs/superpowers/specs/2026-07-28-invoice-manual-design.md`

## Global Constraints

- **Tidak boleh menambah dependency baru.** Semua yang dibutuhkan sudah ada di `package.json`.
- **Bahasa UI: Indonesia.** Semua label, pesan error, dan komentar kode memakai bahasa Indonesia, mengikuti kode yang sudah ada.
- **Server selalu menghitung ulang total dari `items`.** Total/subtotal/sisa yang dikirim browser diabaikan sepenuhnya. Ini melanjutkan perbaikan price tampering yang sudah diterapkan di jalur order.
- **Format nomor invoice tidak berubah:** `INV-{YYYY}-{MM}-{NNNN}`, contoh `INV-2026-07-0001`. Dihasilkan hanya di dalam `withInvoiceLock`.
- **Endpoint admin wajib memakai `authenticateToken` + `requireAdmin`.** Hanya `GET /api/manual-invoice/:token` yang publik.
- **Uang disimpan sebagai `DECIMAL(12,2)`** dan selalu dibaca lewat `Number(...)` sebelum dihitung — `mysql2` mengembalikan DECIMAL sebagai string.
- **Jangan ubah perilaku invoice order/penambahan yang sudah berjalan**, kecuali kop surat (memang disengaja berubah).
- Jalankan `npm run lint` (`tsc --noEmit`) sebelum setiap commit. Harus bersih.

---

### Task 1: Perhitungan & validasi invoice (fungsi murni + tes)

Fondasi semua task berikutnya. Tidak menyentuh database, server, atau React — murni fungsi dan tesnya.

**Files:**
- Create: `src/utils/invoice.ts`
- Test: `scripts/test-invoice.ts`

**Interfaces:**
- Consumes: tidak ada (task pertama)
- Produces:
  - `interface InvoiceItem { desc: string; qty: number; unit?: string; price: number }`
  - `interface InvoiceLine extends InvoiceItem { lineTotal: number }`
  - `type InvoiceStatus = "LUNAS" | "DP" | "BELUM BAYAR"`
  - `interface InvoiceTotals { items: InvoiceLine[]; subtotal: number; dp: number; sisa: number; status: InvoiceStatus }`
  - `calcInvoice(items: InvoiceItem[], dpAmount?: number): InvoiceTotals`
  - `validateInvoice(customerName: string, items: InvoiceItem[], dpAmount: number): string | null` — mengembalikan pesan error bahasa Indonesia, atau `null` kalau valid

- [ ] **Step 1: Tulis tes yang gagal**

Buat `scripts/test-invoice.ts`:

```ts
// scripts/test-invoice.ts
// Pengecekan perhitungan invoice. Jalankan: npx tsx scripts/test-invoice.ts
// Bagian uang dan validasi masukan tidak boleh salah diam-diam — ini jaringnya.
import assert from "node:assert/strict";
import { calcInvoice, validateInvoice } from "../src/utils/invoice";

// --- calcInvoice: total per baris = qty x harga ---
{
  const t = calcInvoice([{ desc: "Service AC 1 PK", qty: 2, price: 150000 }]);
  assert.equal(t.items[0].lineTotal, 300000, "total baris = qty x harga");
  assert.equal(t.subtotal, 300000, "subtotal satu baris");
}

// --- qty desimal (mis. 1,5 kg freon) ---
{
  const t = calcInvoice([{ desc: "Freon R32", qty: 1.5, price: 200000 }]);
  assert.equal(t.items[0].lineTotal, 300000, "qty desimal terhitung benar");
}

// --- subtotal menjumlahkan semua baris ---
{
  const t = calcInvoice([
    { desc: "Service AC 1 PK", qty: 2, price: 150000 },
    { desc: "Freon R32", qty: 1, price: 250000 },
  ]);
  assert.equal(t.subtotal, 550000, "subtotal = jumlah semua baris");
}

// --- DP: sisa = subtotal - dp ---
{
  const t = calcInvoice([{ desc: "Pasang AC", qty: 1, price: 1000000 }], 400000);
  assert.equal(t.dp, 400000);
  assert.equal(t.sisa, 600000, "sisa = subtotal - dp");
  assert.equal(t.status, "DP", "dp sebagian -> status DP");
}

// --- DP melebihi subtotal: sisa 0, bukan negatif ---
{
  const t = calcInvoice([{ desc: "Pasang AC", qty: 1, price: 1000000 }], 1500000);
  assert.equal(t.sisa, 0, "sisa tidak boleh negatif");
  assert.equal(t.status, "LUNAS", "dp >= subtotal -> LUNAS");
}

// --- DP tepat sama dengan subtotal -> LUNAS ---
{
  const t = calcInvoice([{ desc: "Pasang AC", qty: 1, price: 1000000 }], 1000000);
  assert.equal(t.sisa, 0);
  assert.equal(t.status, "LUNAS");
}

// --- tanpa DP -> BELUM BAYAR ---
{
  const t = calcInvoice([{ desc: "Pasang AC", qty: 1, price: 1000000 }]);
  assert.equal(t.dp, 0);
  assert.equal(t.sisa, 1000000);
  assert.equal(t.status, "BELUM BAYAR");
}

// --- DP negatif diperlakukan sebagai 0 ---
{
  const t = calcInvoice([{ desc: "Pasang AC", qty: 1, price: 1000000 }], -500);
  assert.equal(t.dp, 0, "dp negatif dinormalkan jadi 0");
  assert.equal(t.sisa, 1000000);
}

// --- unit default 'pcs' ---
{
  const t = calcInvoice([{ desc: "Bracket", qty: 1, price: 50000 }]);
  assert.equal(t.items[0].unit, "pcs", "unit kosong default ke pcs");
}

// --- validateInvoice: kasus valid ---
{
  const err = validateInvoice("Budi", [{ desc: "Service", qty: 1, price: 100000 }], 0);
  assert.equal(err, null, "invoice valid tidak menghasilkan error");
}

// --- validateInvoice: nama pelanggan kosong ---
{
  const err = validateInvoice("   ", [{ desc: "Service", qty: 1, price: 100000 }], 0);
  assert.equal(err, "Nama pelanggan wajib diisi");
}

// --- validateInvoice: tidak ada baris item ---
{
  assert.equal(validateInvoice("Budi", [], 0), "Minimal satu baris item");
  assert.equal(validateInvoice("Budi", null as any, 0), "Minimal satu baris item");
}

// --- validateInvoice: deskripsi kosong, qty 0/negatif, harga negatif ---
{
  assert.equal(
    validateInvoice("Budi", [{ desc: "  ", qty: 1, price: 1000 }], 0),
    "Baris 1: deskripsi wajib diisi",
  );
  assert.equal(
    validateInvoice("Budi", [{ desc: "Service", qty: 0, price: 1000 }], 0),
    "Baris 1: qty harus lebih dari 0",
  );
  assert.equal(
    validateInvoice("Budi", [{ desc: "Service", qty: -1, price: 1000 }], 0),
    "Baris 1: qty harus lebih dari 0",
  );
  assert.equal(
    validateInvoice("Budi", [{ desc: "Service", qty: 1, price: -5 }], 0),
    "Baris 1: harga tidak boleh negatif",
  );
}

// --- validateInvoice: nomor baris yang salah disebut dengan benar ---
{
  const err = validateInvoice(
    "Budi",
    [
      { desc: "Service", qty: 1, price: 1000 },
      { desc: "", qty: 1, price: 1000 },
    ],
    0,
  );
  assert.equal(err, "Baris 2: deskripsi wajib diisi", "menyebut baris yang bermasalah");
}

// --- validateInvoice: qty/harga bukan angka ditolak ---
{
  assert.equal(
    validateInvoice("Budi", [{ desc: "Service", qty: NaN, price: 1000 }], 0),
    "Baris 1: qty harus lebih dari 0",
  );
  assert.equal(
    validateInvoice("Budi", [{ desc: "Service", qty: 1, price: NaN }], 0),
    "Baris 1: harga tidak boleh negatif",
  );
}

// --- validateInvoice: DP negatif ditolak ---
{
  assert.equal(
    validateInvoice("Budi", [{ desc: "Service", qty: 1, price: 1000 }], -1),
    "DP tidak boleh negatif",
  );
}

console.log("OK — semua pengecekan invoice lulus");
```

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `npx tsx scripts/test-invoice.ts`
Expected: FAIL — modul `../src/utils/invoice` belum ada (`Cannot find module`).

Kalau error yang muncul adalah soal resolusi ekstensi (bukan "file tidak ada"), ubah baris import jadi `from "../src/utils/invoice.ts"` dan jalankan lagi.

- [ ] **Step 3: Tulis implementasinya**

Buat `src/utils/invoice.ts`:

```ts
// src/utils/invoice.ts
// Perhitungan invoice manual — dipakai bersama form admin dan server.
// Satu implementasi supaya angka yang tampil di layar dan angka yang tersimpan
// di database tidak mungkin berbeda.

export interface InvoiceItem {
  desc: string;
  qty: number;
  unit?: string;
  price: number;
}

export interface InvoiceLine extends InvoiceItem {
  unit: string;
  lineTotal: number;
}

export type InvoiceStatus = "LUNAS" | "DP" | "BELUM BAYAR";

export interface InvoiceTotals {
  items: InvoiceLine[];
  subtotal: number;
  dp: number;
  sisa: number;
  status: InvoiceStatus;
}

/**
 * Hitung total invoice dari baris item dan DP.
 * Tahan terhadap masukan kotor (string angka, null, NaN) karena dipanggil juga
 * dengan data mentah dari body request dan kolom DECIMAL MySQL yang berupa string.
 */
export function calcInvoice(
  items: InvoiceItem[],
  dpAmount: number = 0,
): InvoiceTotals {
  const lines: InvoiceLine[] = (items ?? []).map((it) => {
    const qty = Number(it?.qty) || 0;
    const price = Number(it?.price) || 0;
    const unit = String(it?.unit ?? "").trim();
    return {
      desc: it?.desc ?? "",
      qty,
      price,
      unit: unit || "pcs",
      lineTotal: qty * price,
    };
  });

  const subtotal = lines.reduce((s, it) => s + it.lineTotal, 0);
  const dp = Math.max(0, Number(dpAmount) || 0);
  const sisa = Math.max(0, subtotal - dp);

  // subtotal 0 tidak dianggap lunas — invoice kosong bukan invoice yang terbayar.
  const status: InvoiceStatus =
    subtotal > 0 && dp >= subtotal ? "LUNAS" : dp > 0 ? "DP" : "BELUM BAYAR";

  return { items: lines, subtotal, dp, sisa, status };
}

/**
 * Validasi masukan invoice. Mengembalikan pesan error siap tampil, atau null
 * kalau semuanya valid. Dipakai server sebelum INSERT dan form untuk
 * menonaktifkan tombol simpan.
 */
export function validateInvoice(
  customerName: string,
  items: InvoiceItem[],
  dpAmount: number,
): string | null {
  if (!customerName?.trim()) return "Nama pelanggan wajib diisi";
  if (!Array.isArray(items) || items.length === 0)
    return "Minimal satu baris item";

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const no = i + 1;
    if (!it?.desc?.trim()) return `Baris ${no}: deskripsi wajib diisi`;
    // Pembandingan dibalik supaya NaN ikut tertolak.
    if (!(Number(it.qty) > 0)) return `Baris ${no}: qty harus lebih dari 0`;
    if (!(Number(it.price) >= 0))
      return `Baris ${no}: harga tidak boleh negatif`;
  }

  if (!(Number(dpAmount) >= 0)) return "DP tidak boleh negatif";
  return null;
}

/** Format rupiah, dipakai form admin dan halaman cetak. */
export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}
```

- [ ] **Step 4: Jalankan tes, pastikan lulus**

Run: `npx tsx scripts/test-invoice.ts`
Expected: PASS — tercetak `OK — semua pengecekan invoice lulus`, exit code 0.

- [ ] **Step 5: Cek TypeScript**

Run: `npm run lint`
Expected: tidak ada error.

- [ ] **Step 6: Commit**

```bash
git add src/utils/invoice.ts scripts/test-invoice.ts
git commit -m "feat(invoice): fungsi hitung & validasi invoice manual + tes"
```

---

### Task 2: Tabel, penomoran, dan API invoice manual

**Files:**
- Modify: `server.ts` — tambah tabel (setelah blok `order_addition_items`, sekitar baris 417), ubah `nextInvoiceNumber` (sekitar baris 1563), tambah `SPA_PREFIXES` (baris 2601), tambah blok endpoint baru sebelum blok `// START` (sekitar baris 3819)

**Interfaces:**
- Consumes: `calcInvoice`, `validateInvoice` dari Task 1; helper yang sudah ada di `server.ts`: `withInvoiceLock(fn)`, `nextInvoiceNumber(conn, ym)`, `authenticateToken`, `requireAdmin`, `pool`, `crypto`, `PUBLIC_BASE_URL`
- Produces:
  - Tabel `manual_invoices`
  - `GET /api/manual-invoices` → `{ success, data: [{ ...baris, items, subtotal, sisa, status }] }`
  - `POST /api/manual-invoices` → `{ success, invoice_number, token, invoiceUrl, waLink }`
  - `DELETE /api/manual-invoices/:id` → `{ success }`
  - `GET /api/manual-invoice/:token` → `{ success, data }` dengan bentuk yang sama seperti `/api/order-invoice/:token`, ditambah `dp_amount`, `sisa`, `status`, `notes`

- [ ] **Step 1: Tambahkan impor fungsi perhitungan**

Di `server.ts`, setelah baris `import { fileURLToPath } from "url";` (baris 16), tambahkan:

```ts
import { calcInvoice, validateInvoice } from "./src/utils/invoice";
```

- [ ] **Step 2: Tambahkan tabel `manual_invoices`**

Di `server.ts`, tepat setelah blok `CREATE TABLE IF NOT EXISTS order_addition_items (...)` berakhir (baris 417, setelah `` `); ``), sisipkan:

```ts
  await pool.query(`
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
  `);
```

- [ ] **Step 3: Masukkan invoice manual ke penomoran**

Di `server.ts`, fungsi `nextInvoiceNumber` (sekitar baris 1563). Ganti seluruh isi fungsi menjadi:

```ts
  async function nextInvoiceNumber(conn: any, ym: string): Promise<string> {
    const [c1]: any = await conn.query(
      `SELECT COUNT(*) as cnt FROM orders WHERE invoice_number IS NOT NULL AND DATE_FORMAT(invoice_sent_at,'%Y-%m')=?`,
      [ym],
    );
    const [c2]: any = await conn.query(
      `SELECT COUNT(*) as cnt FROM order_additions WHERE invoice_number IS NOT NULL AND DATE_FORMAT(invoice_sent_at,'%Y-%m')=?`,
      [ym],
    );
    // Invoice manual ikut dihitung supaya nomornya tidak pernah bertabrakan
    // dengan invoice order. Patokannya created_at (kapan diterbitkan), bukan
    // invoice_date yang boleh diisi mundur oleh admin.
    const [c3]: any = await conn.query(
      `SELECT COUNT(*) as cnt FROM manual_invoices WHERE DATE_FORMAT(created_at,'%Y-%m')=?`,
      [ym],
    );
    const seq = Number(c1[0].cnt) + Number(c2[0].cnt) + Number(c3[0].cnt) + 1;
    return `INV-${ym}-${String(seq).padStart(4, "0")}`;
  }
```

- [ ] **Step 4: Daftarkan route publik ke SPA_PREFIXES**

Di `server.ts` baris 2601, ganti:

```ts
    const SPA_PREFIXES = ["/tambahan/", "/invoice/", "/order-invoice/"];
```

menjadi:

```ts
    const SPA_PREFIXES = ["/tambahan/", "/invoice/", "/order-invoice/", "/invoice-manual/"];
```

- [ ] **Step 5: Tambahkan keempat endpoint**

Di `server.ts`, sisipkan blok berikut tepat sebelum komentar `// =========================` yang diikuti `// START` (sekitar baris 3820, setelah endpoint `GET /api/order-invoice/:token` selesai):

```ts
  // =========================
  // INVOICE MANUAL
  // =========================
  // mysql2 biasanya sudah mem-parse kolom JSON, tapi tergantung versi/driver
  // bisa juga balik sebagai string. Tangani keduanya.
  const parseItems = (v: any) => {
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
      try {
        return JSON.parse(v);
      } catch {
        return [];
      }
    }
    return [];
  };

  // Nomor WA Indonesia: buang non-digit, buang prefix 62/0 yang sudah ada,
  // lalu pasang 62. 081234567890 dan +62 812-3456-7890 sama-sama jadi
  // 6281234567890.
  const waNumber = (phone: string) =>
    "62" +
    String(phone).replace(/\D/g, "").replace(/^62/, "").replace(/^0/, "");

  // GET /api/manual-invoices — admin: daftar invoice manual
  app.get(
    "/api/manual-invoices",
    authenticateToken,
    requireAdmin,
    async (_req, res) => {
      try {
        const [rows]: any = await pool.query(
          "SELECT * FROM manual_invoices ORDER BY created_at DESC",
        );
        res.json({
          success: true,
          data: rows.map((r: any) => {
            const items = parseItems(r.items);
            const t = calcInvoice(items, Number(r.dp_amount));
            return {
              id: r.id,
              invoice_number: r.invoice_number,
              token: r.token,
              customer_name: r.customer_name,
              customer_phone: r.customer_phone,
              customer_address: r.customer_address,
              invoice_date: r.invoice_date,
              notes: r.notes,
              created_at: r.created_at,
              items: t.items,
              subtotal: t.subtotal,
              dp_amount: t.dp,
              sisa: t.sisa,
              status: t.status,
            };
          }),
        });
      } catch (e) {
        res
          .status(500)
          .json({ success: false, message: "Gagal mengambil daftar invoice" });
      }
    },
  );

  // POST /api/manual-invoices — admin: buat invoice manual baru
  app.post(
    "/api/manual-invoices",
    authenticateToken,
    requireAdmin,
    async (req: any, res) => {
      try {
        const {
          customer_name,
          customer_phone,
          customer_address,
          invoice_date,
          items,
          dp_amount,
          notes,
        } = req.body;

        const dp = Number(dp_amount) || 0;
        const err = validateInvoice(customer_name, items, dp);
        if (err) return res.status(400).json({ success: false, message: err });

        // Hanya field yang dikenal yang disimpan, dan angkanya dinormalkan di sini.
        // Total tidak ikut disimpan — selalu dihitung ulang saat dibaca, jadi
        // angka kiriman browser tidak pernah dipercaya.
        const cleanItems = items.map((it: any) => ({
          desc: String(it.desc).trim(),
          qty: Number(it.qty),
          unit: String(it.unit || "pcs").trim(),
          price: Number(it.price),
        }));

        const token = crypto.randomBytes(32).toString("hex");
        const invoiceDate =
          invoice_date || new Date().toISOString().slice(0, 10);

        // Alokasi nomor + INSERT di bawah lock global yang sama dengan invoice
        // order, supaya dua permintaan bersamaan tidak dapat nomor kembar.
        const invoiceNumber = await withInvoiceLock(async (conn) => {
          const now = new Date();
          const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          const num = await nextInvoiceNumber(conn, ym);
          await conn.query(
            `INSERT INTO manual_invoices
               (invoice_number, token, customer_name, customer_phone,
                customer_address, invoice_date, items, dp_amount, notes, created_by)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [
              num,
              token,
              String(customer_name).trim(),
              customer_phone ? String(customer_phone).trim() : null,
              customer_address ? String(customer_address).trim() : null,
              invoiceDate,
              JSON.stringify(cleanItems),
              dp,
              notes ? String(notes).trim() : null,
              req.user?.id ?? null,
            ],
          );
          return num;
        });

        const invoiceUrl = `${PUBLIC_BASE_URL}/invoice-manual/${token}`;
        const waLink = customer_phone
          ? `https://wa.me/${waNumber(customer_phone)}?text=${encodeURIComponent(
              `Halo ${customer_name}, invoice Anda (${invoiceNumber}) sudah tersedia.\n\nLihat invoice di:\n${invoiceUrl}`,
            )}`
          : null;

        res.json({
          success: true,
          invoice_number: invoiceNumber,
          token,
          invoiceUrl,
          waLink,
        });
      } catch (e) {
        res
          .status(500)
          .json({ success: false, message: "Gagal membuat invoice" });
      }
    },
  );

  // DELETE /api/manual-invoices/:id — admin: hapus invoice manual
  app.delete(
    "/api/manual-invoices/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const [r]: any = await pool.query(
          "DELETE FROM manual_invoices WHERE id=?",
          [req.params.id],
        );
        if (!r.affectedRows)
          return res
            .status(404)
            .json({ success: false, message: "Invoice tidak ditemukan" });
        res.json({ success: true });
      } catch (e) {
        res
          .status(500)
          .json({ success: false, message: "Gagal menghapus invoice" });
      }
    },
  );

  // GET /api/manual-invoice/:token — publik: data untuk halaman cetak.
  // Bentuk balasannya sengaja sama dengan /api/order-invoice/:token supaya
  // InvoiceView.tsx bisa dipakai ulang tanpa cabang logika baru.
  app.get("/api/manual-invoice/:token", async (req, res) => {
    try {
      const [rows]: any = await pool.query(
        "SELECT * FROM manual_invoices WHERE token=?",
        [req.params.token],
      );
      if (!rows.length)
        return res
          .status(404)
          .json({ success: false, message: "Invoice tidak ditemukan" });

      const inv = rows[0];
      const t = calcInvoice(parseItems(inv.items), Number(inv.dp_amount));

      res.json({
        success: true,
        data: {
          invoice_number: inv.invoice_number,
          invoice_date: inv.invoice_date,
          order_id: null,
          order_date: null,
          customer_name: inv.customer_name,
          customer_phone: inv.customer_phone,
          customer_address: inv.customer_address,
          teknisi_name: null,
          payment_method: null,
          orig_items: t.items.map((it) => ({
            item_name: it.desc,
            quantity: it.qty,
            unit: it.unit,
            price: it.price,
          })),
          add_items: [],
          orig_total: t.subtotal,
          add_total: 0,
          grand_total: t.subtotal,
          dp_amount: t.dp,
          sisa: t.sisa,
          status: t.status,
          notes: inv.notes,
        },
      });
    } catch (e) {
      res
        .status(500)
        .json({ success: false, message: "Gagal mengambil data invoice" });
    }
  });
```

- [ ] **Step 6: Cek TypeScript & jalankan server**

Run: `npm run lint`
Expected: tidak ada error.

Run: `npm run server`
Expected: server hidup tanpa error, tabel `manual_invoices` dibuat otomatis saat start.

- [ ] **Step 7: Uji endpoint manual**

Ambil token admin dulu (login lewat UI, salin `authToken` dari `localStorage`), lalu di terminal Git Bash:

```bash
TOKEN='<tempel authToken di sini>'

# Buat invoice
curl -s -X POST http://localhost:3000/api/manual-invoices \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"customer_name":"Budi Santoso","customer_phone":"081234567890","customer_address":"Jl. Contoh No. 1","invoice_date":"2026-07-28","items":[{"desc":"Service AC 1 PK","qty":2,"unit":"unit","price":150000},{"desc":"Freon R32","qty":1,"unit":"kg","price":250000}],"dp_amount":200000,"notes":"Garansi 30 hari"}'
```

Expected: `success: true`, ada `invoice_number` berformat `INV-2026-07-xxxx`, `token`, `invoiceUrl`, dan `waLink` yang diawali `https://wa.me/6281234567890`.

```bash
# Daftar invoice
curl -s http://localhost:3000/api/manual-invoices -H "Authorization: Bearer $TOKEN"
```

Expected: baris tadi muncul dengan `subtotal: 550000`, `sisa: 350000`, `status: "DP"`.

```bash
# Halaman cetak (publik, tanpa token) — pakai token invoice dari balasan POST
curl -s http://localhost:3000/api/manual-invoice/<token_invoice>
```

Expected: `grand_total: 550000`, `orig_items` berisi 2 baris, `add_items: []`.

```bash
# Validasi ditolak: item kosong
curl -s -X POST http://localhost:3000/api/manual-invoices \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"customer_name":"Budi","items":[],"dp_amount":0}'
```

Expected: HTTP 400, `message: "Minimal satu baris item"`.

```bash
# Akses tanpa token ditolak
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/manual-invoices
```

Expected: `401`.

- [ ] **Step 8: Commit**

```bash
git add server.ts
git commit -m "feat(invoice): API invoice manual + tabel manual_invoices"
```

---

### Task 3: Kop surat, DP, dan status pada halaman cetak

Mengubah `InvoiceView.tsx` yang dipakai bersama tiga jenis invoice. Karena itu setiap field baru harus punya nilai jatuh-balik supaya invoice order dan penambahan tampil persis seperti sebelumnya (kecuali kop, yang memang disengaja berubah).

**Files:**
- Modify: `src/pages/InvoiceView.tsx`

**Interfaces:**
- Consumes: data dari `GET /api/manual-invoice/:token` (Task 2), `GET /api/order-invoice/:token`, dan `GET /api/order-additions/token/:token/invoice-data`
- Produces: tidak ada API baru — komponen ini dipakai Task 5 lewat prop `fetchUrl`

- [ ] **Step 1: Ganti blok header dengan kop surat**

Di `src/pages/InvoiceView.tsx`, ganti seluruh blok `{/* Header */}` (baris 92–136, dari `<div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-sky-500">` sampai `</div>` penutupnya) dengan:

```jsx
        {/* Kop Surat */}
        <div className="flex items-start gap-4">
          <img
            src="/images/HDB-LOGO.png"
            alt="CV Hasil Daya Bersama"
            className="h-[72px] w-[72px] object-contain shrink-0"
          />
          <div
            className="text-slate-900 leading-snug"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            <p className="text-xl font-bold tracking-wide">
              CV HASIL DAYA BERSAMA
            </p>
            <p className="italic font-semibold text-[13px]">
              Service, Maintenance, Supplier &amp; Sparepart AC, Kulkas, dan
              Mesin Cuci
            </p>
            <p className="text-[13px]">
              Jl. Gajah Mada No. 19, Seduri, Kec. Mojosari, Kab. Mojokerto, Jawa
              Timur
            </p>
            <p className="text-[13px]">
              Telp: 0815-1572-9739 | Email:{" "}
              <span className="text-blue-700 underline">
                hasildayabersama@gmail.com
              </span>
            </p>
            <p className="text-[13px]">
              Website:{" "}
              <span className="text-blue-700 underline">
                www.hdbairconds.id
              </span>
            </p>
          </div>
        </div>

        {/* Garis ganda pemisah kop */}
        <div className="mt-3 border-b-[3px] border-slate-900" />
        <div className="mt-[3px] border-b border-slate-900 mb-8" />

        {/* Judul + Meta */}
        <div className="flex justify-between items-start mb-8">
          <p className="text-3xl font-black text-slate-800">INVOICE</p>
          <table className="text-sm text-right">
            <tbody>
              {[
                ["No. Invoice", data.invoice_number],
                ["Tanggal", fmtDate(data.invoice_date)],
                // Invoice manual tidak punya order — barisnya disembunyikan
                // daripada tampil kosong.
                ...(data.order_id
                  ? ([
                      ["No. Order", data.order_id],
                      ["Tgl Order", fmtDate(data.order_date)],
                    ] as [string, any][])
                  : []),
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className="text-slate-500 pr-3 py-0.5">{k}</td>
                  <td className="font-semibold text-slate-800">: {v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
```

- [ ] **Step 2: Sembunyikan kartu teknisi kalau tidak ada**

Ganti blok `{/* Billing + Teknisi */}` (baris 138–159) dengan:

```jsx
        {/* Billing + Teknisi */}
        <div
          className={`grid gap-6 mb-8 ${data.teknisi_name ? "grid-cols-2" : "grid-cols-1"}`}
        >
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Tagihan Kepada
            </p>
            <p className="font-bold text-slate-800">{data.customer_name}</p>
            <p className="text-slate-500 text-sm">{data.customer_phone}</p>
            <p className="text-slate-500 text-sm">{data.customer_address}</p>
          </div>
          {/* Invoice manual tidak terikat teknisi — kartunya dilewati */}
          {data.teknisi_name && (
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Dikerjakan Oleh
              </p>
              <p className="font-bold text-slate-800">{data.teknisi_name}</p>
              <p className="text-slate-500 text-sm">
                Tanggal: {fmtDate(data.invoice_date)}
              </p>
            </div>
          )}
        </div>
```

- [ ] **Step 3: Sesuaikan judul tabel item & tampilkan satuan**

Pada blok `{/* Original Items */}` (baris 161–195), ganti judulnya:

```jsx
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            {data.order_id ? "Rincian Pesanan Awal" : "Rincian Item"}
          </p>
```

lalu ganti header kolomnya supaya menyertakan satuan:

```jsx
              <tr>
                {["No", "Deskripsi", "Qty", "Satuan", "Harga Sat", "Total"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2 font-semibold text-slate-700"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
```

dan tambahkan sel satuan di baris data, tepat setelah sel Qty:

```jsx
                  <td className="px-3 py-2 text-slate-400">{it.unit || "—"}</td>
```

- [ ] **Step 4: Sembunyikan bagian penambahan kalau kosong**

Bungkus seluruh blok `{/* Addition Items */}` (baris 197–234) dengan pengecekan. Ganti pembukanya:

```jsx
        {/* Addition Items — hanya ada pada invoice order */}
        {(data.add_items || []).length > 0 && (
        <div className="mb-8">
```

dan penutupnya (`</div>` terakhir blok itu) jadi:

```jsx
        </div>
        )}
```

- [ ] **Step 5: Tambahkan baris DP, sisa, dan status dinamis**

Ganti seluruh blok `{/* Totals */}` (baris 236–276) dengan:

```jsx
        {/* Totals */}
        <div className="flex justify-end mb-8">
          <table className="text-sm w-72">
            <tbody>
              {/* Rincian per-bagian hanya relevan kalau ada penambahan order */}
              {(data.add_items || []).length > 0 && (
                <>
                  <tr>
                    <td className="py-1 text-slate-500">
                      Subtotal Pesanan Awal
                    </td>
                    <td className="py-1 text-right font-medium">
                      {fmt(data.orig_total)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-500">Subtotal Penambahan</td>
                    <td className="py-1 text-right font-medium">
                      {fmt(data.add_total)}
                    </td>
                  </tr>
                </>
              )}
              <tr className="border-t-2 border-slate-800">
                <td className="pt-2 font-bold text-slate-800 text-base">
                  TOTAL
                </td>
                <td className="pt-2 text-right font-black text-sky-600 text-lg">
                  {fmt(data.grand_total)}
                </td>
              </tr>

              {/* DP & sisa hanya tampil kalau memang ada uang muka */}
              {Number(data.dp_amount) > 0 && (
                <>
                  <tr>
                    <td className="pt-2 text-slate-500">Uang Muka (DP)</td>
                    <td className="pt-2 text-right font-medium text-emerald-600">
                      − {fmt(Number(data.dp_amount))}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <td className="pt-2 font-bold text-slate-800">
                      Sisa Tagihan
                    </td>
                    <td className="pt-2 text-right font-black text-rose-600 text-base">
                      {fmt(Number(data.sisa))}
                    </td>
                  </tr>
                </>
              )}

              {data.payment_method && (
                <tr>
                  <td className="pt-2 text-slate-500 text-xs">Metode Bayar</td>
                  <td className="pt-2 text-right text-xs font-medium capitalize">
                    {data.payment_method === "cash"
                      ? "Tunai"
                      : "Transfer / Online"}
                  </td>
                </tr>
              )}
              <tr>
                <td className="text-slate-500 text-xs">Status</td>
                {/* Invoice order/penambahan tidak mengirim status — selalu lunas */}
                <td
                  className={`text-right text-xs font-bold ${
                    (data.status || "LUNAS") === "LUNAS"
                      ? "text-emerald-600"
                      : (data.status || "LUNAS") === "DP"
                        ? "text-amber-600"
                        : "text-rose-600"
                  }`}
                >
                  {data.status || "LUNAS"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
```

- [ ] **Step 6: Tampilkan catatan invoice**

Ganti blok `{/* Notes */}` (baris 278–288) dengan:

```jsx
        {/* Notes */}
        <div className="bg-sky-50 rounded-xl p-4 mb-10 text-xs text-slate-500">
          {data.notes && (
            <p className="mb-1 text-slate-700 whitespace-pre-line">
              • {data.notes}
            </p>
          )}
          <p>
            • Garansi layanan berlaku <strong>30 hari</strong> sejak tanggal
            pengerjaan.
          </p>
          <p>
            • Hubungi kami jika ada pertanyaan: <strong>0815-1572-9739</strong>{" "}
            atau <strong>hasildayabersama@gmail.com</strong>
          </p>
        </div>
```

- [ ] **Step 7: Ganti nama perusahaan di blok tanda tangan**

Di blok `{/* Signatures */}`, ganti `name: "HDB Airconds"` menjadi:

```jsx
                name: "CV Hasil Daya Bersama",
```

- [ ] **Step 8: Cek TypeScript & verifikasi tampilan invoice lama**

Run: `npm run lint`
Expected: tidak ada error.

Run: `npm run dev`, lalu buka invoice order yang sudah ada di `/order-invoice/<token>` (ambil salah satu token dari kolom `orders.invoice_token` di database).
Expected:
- Kop baru CV Hasil Daya Bersama tampil dengan logo dan garis ganda
- Baris No. Order / Tgl Order tetap tampil
- Kartu "Dikerjakan Oleh" tetap tampil
- Status tetap `LUNAS` berwarna hijau
- Tidak ada baris DP/Sisa (karena `dp_amount` tidak dikirim endpoint itu)
- `Ctrl+P` menampilkan preview A4 satu halaman tanpa navbar

- [ ] **Step 9: Commit**

```bash
git add src/pages/InvoiceView.tsx
git commit -m "feat(invoice): kop surat CV HDB + baris DP/sisa & status dinamis"
```

---

### Task 4: Halaman admin Invoice Manual

**Files:**
- Create: `src/pages/admin/AdminInvoices.tsx`
- Modify: `src/pages/admin/AdminLayout.tsx` (impor, `menuItems`, `renderContent`)
- Modify: `src/pages/admin/AdminSidebar.tsx` (impor ikon, `menuItems`)

**Interfaces:**
- Consumes: `calcInvoice`, `validateInvoice`, `formatRupiah` dari Task 1; endpoint dari Task 2
- Produces: komponen `AdminInvoices({ token }: { token: string })`, dipasang di tab admin dengan id `manual-invoices`

- [ ] **Step 1: Buat komponen halaman**

Buat `src/pages/admin/AdminInvoices.tsx`:

```tsx
// src/pages/admin/AdminInvoices.tsx
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Printer, MessageCircle, X } from "lucide-react";
import {
  calcInvoice,
  validateInvoice,
  formatRupiah,
  type InvoiceItem,
} from "../../utils/invoice";

interface ManualInvoice {
  id: number;
  invoice_number: string;
  token: string;
  customer_name: string;
  customer_phone: string | null;
  invoice_date: string;
  subtotal: number;
  dp_amount: number;
  sisa: number;
  status: "LUNAS" | "DP" | "BELUM BAYAR";
}

const EMPTY_ROW: InvoiceItem = { desc: "", qty: 1, unit: "pcs", price: 0 };

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  customer_name: "",
  customer_phone: "",
  customer_address: "",
  invoice_date: todayISO(),
  items: [{ ...EMPTY_ROW }] as InvoiceItem[],
  dp_amount: 0,
  notes: "",
});

const STATUS_STYLE: Record<string, string> = {
  LUNAS: "bg-emerald-50 text-emerald-600",
  DP: "bg-amber-50 text-amber-600",
  "BELUM BAYAR": "bg-rose-50 text-rose-600",
};

export default function AdminInvoices({ token }: { token: string }) {
  const [invoices, setInvoices] = useState<ManualInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchInvoices = async () => {
    setLoading(true);
    const r = await fetch("/api/manual-invoices", { headers });
    const d = await r.json();
    if (d.success) setInvoices(d.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Total dihitung ulang setiap render dengan fungsi yang sama seperti server,
  // jadi angka di form persis sama dengan yang akan tersimpan.
  const totals = calcInvoice(form.items, form.dp_amount);
  const formError = validateInvoice(
    form.customer_name,
    form.items,
    form.dp_amount,
  );

  const setItem = (i: number, patch: Partial<InvoiceItem>) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    }));

  const addRow = () =>
    setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_ROW }] }));

  const removeRow = (i: number) =>
    setForm((f) => ({
      ...f,
      items: f.items.length > 1 ? f.items.filter((_, idx) => idx !== i) : f.items,
    }));

  const openForm = () => {
    setForm(emptyForm());
    setModalOpen(true);
  };

  const save = async () => {
    if (formError) return alert(formError);
    setSaving(true);
    try {
      const r = await fetch("/api/manual-invoices", {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!d.success) return alert(d.message || "Gagal membuat invoice");
      setModalOpen(false);
      await fetchInvoices();
      if (d.waLink && confirm(`Invoice ${d.invoice_number} dibuat. Kirim lewat WhatsApp sekarang?`))
        window.open(d.waLink, "_blank");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (inv: ManualInvoice) => {
    if (!confirm(`Hapus invoice ${inv.invoice_number}? Tindakan ini tidak bisa dibatalkan.`))
      return;
    await fetch(`/api/manual-invoices/${inv.id}`, { method: "DELETE", headers });
    fetchInvoices();
  };

  const waLinkFor = (inv: ManualInvoice) => {
    if (!inv.customer_phone) return null;
    const nomor = inv.customer_phone
      .replace(/\D/g, "")
      .replace(/^62/, "")
      .replace(/^0/, "");
    const url = `${window.location.origin}/invoice-manual/${inv.token}`;
    return `https://wa.me/62${nomor}?text=${encodeURIComponent(
      `Halo ${inv.customer_name}, invoice Anda (${inv.invoice_number}) sudah tersedia.\n\nLihat invoice di:\n${url}`,
    )}`;
  };

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const inputCls =
    "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Invoice Manual</h2>
        <button
          onClick={openForm}
          className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-sky-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Buat Invoice
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Memuat...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["No. Invoice", "Kepada", "Tanggal", "Total", "Sisa", "Status", "Aksi"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const wa = waLinkFor(inv);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {inv.invoice_number}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {inv.customer_name}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {fmtDate(inv.invoice_date)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {formatRupiah(inv.subtotal)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-rose-600">
                      {inv.sisa > 0 ? formatRupiah(inv.sisa) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${STATUS_STYLE[inv.status]}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <a
                          href={`/invoice-manual/${inv.token}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Buka & cetak"
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </a>
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noreferrer"
                            title="Kirim lewat WhatsApp"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => remove(inv)}
                          title="Hapus"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!invoices.length && (
            <div className="text-center py-12 text-slate-400">
              Belum ada invoice manual
            </div>
          )}
        </div>
      )}

      {/* Modal form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                Buat Invoice Baru
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Data pelanggan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Nama Pelanggan *
                </label>
                <input
                  className={inputCls}
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm({ ...form, customer_name: e.target.value })
                  }
                  placeholder="Nama orang atau perusahaan"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  className={inputCls}
                  value={form.customer_phone}
                  onChange={(e) =>
                    setForm({ ...form, customer_phone: e.target.value })
                  }
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Alamat
                </label>
                <input
                  className={inputCls}
                  value={form.customer_address}
                  onChange={(e) =>
                    setForm({ ...form, customer_address: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Tanggal Invoice
                </label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.invoice_date}
                  onChange={(e) =>
                    setForm({ ...form, invoice_date: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Baris item */}
            <label className="block text-xs font-semibold text-slate-500 mb-2">
              Rincian Item *
            </label>
            <div className="overflow-x-auto mb-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400">
                    <th className="text-left font-medium pb-1">Deskripsi</th>
                    <th className="text-left font-medium pb-1 w-20">Qty</th>
                    <th className="text-left font-medium pb-1 w-24">Satuan</th>
                    <th className="text-left font-medium pb-1 w-36">
                      Harga Satuan
                    </th>
                    <th className="text-right font-medium pb-1 w-32">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((it, i) => (
                    <tr key={i}>
                      <td className="pr-2 pb-2">
                        <input
                          className={inputCls}
                          value={it.desc}
                          onChange={(e) => setItem(i, { desc: e.target.value })}
                          placeholder="Service AC 1 PK"
                        />
                      </td>
                      <td className="pr-2 pb-2">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          className={inputCls}
                          value={it.qty}
                          onChange={(e) =>
                            setItem(i, { qty: Number(e.target.value) })
                          }
                        />
                      </td>
                      <td className="pr-2 pb-2">
                        <input
                          className={inputCls}
                          value={it.unit}
                          onChange={(e) => setItem(i, { unit: e.target.value })}
                        />
                      </td>
                      <td className="pr-2 pb-2">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          className={inputCls}
                          value={it.price}
                          onChange={(e) =>
                            setItem(i, { price: Number(e.target.value) })
                          }
                        />
                      </td>
                      <td className="pb-2 text-right font-semibold text-slate-700 whitespace-nowrap">
                        {formatRupiah(totals.items[i]?.lineTotal ?? 0)}
                      </td>
                      <td className="pb-2 text-right">
                        <button
                          onClick={() => removeRow(i)}
                          disabled={form.items.length === 1}
                          className="p-1 text-slate-300 hover:text-rose-500 disabled:opacity-30 disabled:hover:text-slate-300"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={addRow}
              className="text-sky-600 text-sm font-medium hover:text-sky-700 mb-5"
            >
              + Tambah Baris
            </button>

            {/* DP + total */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Uang Muka / DP
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className={inputCls}
                  value={form.dp_amount}
                  onChange={(e) =>
                    setForm({ ...form, dp_amount: Number(e.target.value) })
                  }
                />
                <label className="block text-xs font-semibold text-slate-500 mt-3 mb-1">
                  Catatan
                </label>
                <textarea
                  rows={2}
                  className={inputCls}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Contoh: pelunasan paling lambat 7 hari"
                />
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-sm self-start">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold">
                    {formatRupiah(totals.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">DP</span>
                  <span className="font-medium text-emerald-600">
                    − {formatRupiah(totals.dp)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-slate-200 mt-1">
                  <span className="font-bold text-slate-800">Sisa Tagihan</span>
                  <span className="font-black text-rose-600">
                    {formatRupiah(totals.sisa)}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500 text-xs">Status</span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${STATUS_STYLE[totals.status]}`}
                  >
                    {totals.status}
                  </span>
                </div>
              </div>
            </div>

            {formError && (
              <p className="text-xs text-rose-500 mb-3">{formError}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={save}
                disabled={!!formError || saving}
                className="bg-sky-500 text-white px-5 py-2 rounded-xl font-medium hover:bg-sky-600 text-sm disabled:opacity-40 disabled:hover:bg-sky-500"
              >
                {saving ? "Menyimpan..." : "Simpan & Buat Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Daftarkan menu di AdminLayout**

Di `src/pages/admin/AdminLayout.tsx`:

Tambahkan impor setelah baris `import AdminAdditions from "./AdminAdditions";`:

```tsx
import AdminInvoices from "./AdminInvoices";
```

Tambahkan item di array `menuItems`, setelah baris `additions`:

```tsx
  { id: "manual-invoices",  label: "Invoice Manual",     emoji: "🧾" },
```

Tambahkan `case` di `renderContent`, setelah `case "additions":`:

```tsx
      case "manual-invoices":
        return <AdminInvoices token={token} />;
```

- [ ] **Step 3: Daftarkan menu di AdminSidebar**

Di `src/pages/admin/AdminSidebar.tsx`, tambahkan `FileText` ke daftar impor `lucide-react` (setelah `Plus,`):

```tsx
  FileText,
```

lalu tambahkan item di array `menuItems` setelah baris `additions`:

```tsx
  { id: "manual-invoices",  label: "Invoice Manual",     icon: <FileText className="w-5 h-5" /> },
```

- [ ] **Step 4: Cek TypeScript**

Run: `npm run lint`
Expected: tidak ada error.

- [ ] **Step 5: Uji lewat UI**

Run: `npm run dev`, login sebagai admin, buka menu **Invoice Manual**.

Expected:
- Menu "Invoice Manual" muncul di sidebar dengan ikon dokumen
- Klik "Buat Invoice" membuka form dengan satu baris item kosong dan tanggal hari ini
- Isi nama "Budi Santoso", satu baris "Service AC 1 PK" qty 2 harga 150000 → kolom Total baris langsung menampilkan Rp 300.000 dan Subtotal ikut berubah
- Tambah baris kedua "Freon R32" qty 1 harga 250000 → Subtotal jadi Rp 550.000
- Isi DP 200000 → Sisa Tagihan jadi Rp 350.000, badge status berubah jadi `DP`
- Kosongkan nama pelanggan → tombol Simpan nonaktif dan muncul pesan "Nama pelanggan wajib diisi"
- Isi ulang dan Simpan → modal tertutup, invoice muncul di daftar dengan nomor `INV-2026-07-xxxx`, muncul konfirmasi kirim WhatsApp
- Tombol hapus meminta konfirmasi dan menghapus barisnya

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/AdminInvoices.tsx src/pages/admin/AdminLayout.tsx src/pages/admin/AdminSidebar.tsx
git commit -m "feat(invoice): halaman admin invoice manual"
```

---

### Task 5: Route publik halaman cetak

Task terakhir yang menyambungkan semuanya — sebelum ini, tombol Cetak di Task 4 masih membuka halaman 404.

**Files:**
- Modify: `src/App.tsx` — `TOKEN_PAGES` (baris 59), `pageFromPath` (baris 62–68), state token (sekitar baris 92), `case` render (sekitar baris 400), `isInvoicePage` (baris 423)

**Interfaces:**
- Consumes: `InvoiceView` (Task 3), endpoint `GET /api/manual-invoice/:token` (Task 2)
- Produces: URL publik `/invoice-manual/<token>`

- [ ] **Step 1: Daftarkan halaman ber-token**

Di `src/App.tsx` baris 59, ganti:

```tsx
const TOKEN_PAGES = ["tambahan", "invoice", "order-invoice"];
```

menjadi:

```tsx
const TOKEN_PAGES = ["tambahan", "invoice", "order-invoice", "invoice-manual"];
```

- [ ] **Step 2: Terjemahkan URL jadi nama halaman**

Di fungsi `pageFromPath` (baris 62–68), tambahkan satu baris setelah baris `order-invoice`:

```tsx
  if (path.startsWith("/invoice-manual/")) return "invoice-manual";
```

- [ ] **Step 3: Baca token dari URL**

Setelah blok `const [orderInvoiceToken] = useState<string | null>(...)` (baris 92–95), tambahkan:

```tsx
  const [manualInvoiceToken] = useState<string | null>(() => {
    const path = window.location.pathname;
    return path.startsWith('/invoice-manual/') ? path.replace('/invoice-manual/', '') : null;
  });
```

- [ ] **Step 4: Render halamannya**

Di `renderPage`, setelah `case "order-invoice":` (baris 400–402), tambahkan:

```tsx
      case "invoice-manual":
        if (!manualInvoiceToken) return <Home setCurrentPage={setCurrentPage} />;
        return <InvoiceView token={manualInvoiceToken} fetchUrl={`/api/manual-invoice/${manualInvoiceToken}`} />;
```

- [ ] **Step 5: Sembunyikan navbar & footer di halaman cetak**

Di baris 423, ganti:

```tsx
  const isInvoicePage = currentPage === "invoice" || currentPage === "order-invoice" || currentPage === "tambahan";
```

menjadi:

```tsx
  const isInvoicePage = currentPage === "invoice" || currentPage === "order-invoice" || currentPage === "invoice-manual" || currentPage === "tambahan";
```

- [ ] **Step 6: Cek TypeScript**

Run: `npm run lint`
Expected: tidak ada error.

- [ ] **Step 7: Uji alur lengkap dari nol**

Run: `npm run dev`

1. Login admin → menu **Invoice Manual** → **Buat Invoice**
2. Isi: nama "Budi Santoso", WA "081234567890", alamat bebas, dua baris item (Service AC 1 PK × 2 @150.000, Freon R32 × 1 @250.000), DP 200.000, catatan "Pelunasan maksimal 7 hari"
3. Simpan, lalu tolak ajakan WhatsApp
4. Klik ikon printer pada baris invoice tadi

Expected pada halaman cetak yang terbuka:
- Kop CV Hasil Daya Bersama lengkap dengan logo dan garis ganda
- Tidak ada baris "No. Order" / "Tgl Order"
- Tidak ada kartu "Dikerjakan Oleh"; kartu "Tagihan Kepada" selebar halaman
- Judul tabel "Rincian Item" dengan dua baris dan kolom Satuan terisi
- Bagian "Penambahan Material & Jasa" tidak muncul
- TOTAL Rp 550.000, Uang Muka (DP) − Rp 200.000, Sisa Tagihan Rp 350.000
- Status `DP` berwarna kuning
- Catatan "Pelunasan maksimal 7 hari" muncul di kotak biru
- `Ctrl+P` → preview A4 rapi tanpa navbar/footer
- Refresh halaman (F5) tetap menampilkan invoice, bukan 404

5. Kembali ke daftar, klik ikon WhatsApp → tab wa.me terbuka dengan pesan berisi link invoice

- [ ] **Step 8: Jalankan ulang seluruh pengecekan**

Run: `npx tsx scripts/test-invoice.ts`
Expected: PASS

Run: `npm run lint`
Expected: tidak ada error

Run: `npm run build`
Expected: build sukses tanpa error

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx
git commit -m "feat(invoice): route publik /invoice-manual/<token>"
```
