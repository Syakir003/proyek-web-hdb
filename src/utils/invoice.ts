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
 *
 * Batas panjang mengikuti lebar kolom di tabel manual_invoices — kalau tidak
 * dicek di sini, MySQL yang menolak dan admin cuma dapat "Gagal membuat
 * invoice" tanpa tahu bagian mana yang salah.
 */
export function validateInvoice(
  customerName: string,
  items: InvoiceItem[],
  dpAmount: number,
  phone?: string,
  invoiceDate?: string,
): string | null {
  // Nilainya datang mentah dari body request, jadi belum tentu string.
  // Dipaksa jadi teks di sini supaya masukan aneh berakhir sebagai pesan
  // validasi (400), bukan TypeError yang jatuh jadi 500.
  const txt = (v: any) =>
    typeof v === "string" || typeof v === "number" ? String(v).trim() : "";

  const name = txt(customerName);
  if (!name) return "Nama pelanggan wajib diisi";
  if (name.length > 150) return "Nama pelanggan maksimal 150 karakter";
  if (txt(phone).length > 30) return "Nomor telepon maksimal 30 karakter";
  // Tanggal kosong berarti "hari ini", diisi server. Kalau diisi harus rapi DAN
  // benar-benar ada: Date menggulung 2026-02-30 jadi 2 Maret, jadi formatnya
  // dibandingkan balik setelah di-parse. MySQL kolom DATE menolak tanggal
  // seperti itu dan errornya jatuh jadi 500 yang tidak menjelaskan apa-apa.
  const date = txt(invoiceDate);
  if (invoiceDate) {
    const d = new Date(`${date}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      isNaN(d.getTime()) ||
      d.toISOString().slice(0, 10) !== date
    )
      return "Tanggal invoice tidak valid";
  }

  if (!Array.isArray(items) || items.length === 0)
    return "Minimal satu baris item";

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const no = i + 1;
    const desc = txt(it?.desc);
    if (!desc) return `Baris ${no}: deskripsi wajib diisi`;
    if (desc.length > 255) return `Baris ${no}: deskripsi maksimal 255 karakter`;
    // Pembandingan dibalik supaya NaN ikut tertolak.
    if (!(Number(it.qty) > 0)) return `Baris ${no}: qty harus lebih dari 0`;
    if (!(Number(it.price) >= 0))
      return `Baris ${no}: harga tidak boleh negatif`;
  }

  if (!(Number(dpAmount) >= 0)) return "DP tidak boleh negatif";
  // DECIMAL(12,2): maksimal 9.999.999.999,99
  if (Number(dpAmount) > 9999999999) return "DP terlalu besar";
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
