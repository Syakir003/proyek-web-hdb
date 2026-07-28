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

// --- angka bertipe string (mis. kolom DECIMAL yang dibalikkan mysql2) ---
{
  const t = calcInvoice(
    [{ desc: "X", qty: 2, price: "150000.00" as any }],
    "200000.00" as any,
  );
  assert.equal(t.subtotal, 300000, "subtotal dari price string");
  assert.equal(t.dp, 200000, "dp dari string");
  assert.equal(t.sisa, 100000, "sisa dari kombinasi string");
}

console.log("OK — semua pengecekan invoice lulus");
