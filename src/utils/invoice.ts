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
