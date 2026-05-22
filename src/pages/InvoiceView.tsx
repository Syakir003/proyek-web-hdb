// src/pages/InvoiceView.tsx
import React, { useState, useEffect } from "react";
import { Loader2, Printer } from "lucide-react";

interface Props {
  token: string;
  fetchUrl?: string;
}

export default function InvoiceView({ token, fetchUrl }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);
  // Guard null/undefined agar tidak tampil "1 Januari 1970"
  const fmtDate = (s: string | null | undefined) =>
    s
      ? new Date(s).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "—";

  useEffect(() => {
    fetch(fetchUrl ?? `/api/order-additions/token/${token}/invoice-data`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  if (!data)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">Invoice tidak ditemukan.</p>
      </div>
    );

  return (
    <>
      {/* Print CSS injected via style tag */}
      <style>{`
        @media print {
          /* Sembunyikan semua elemen UI selain invoice */
          .no-print { display: none !important; }
          nav, footer, header,
          [class*="fixed"],
          [class*="z-50"] { display: none !important; }
          /* Paksa background putih & hilangkan padding halaman */
          body { margin: 0; background: white; }
          #root > div > main { padding: 0 !important; }
          .invoice-page {
            width: 210mm; min-height: 297mm;
            margin: 0 auto; padding: 15mm 20mm;
            box-shadow: none !important;
          }
        }
        @page { size: A4 portrait; margin: 0; }
      `}</style>

      {/* Print Button */}
      <div className="no-print bg-slate-100 py-4 px-6 flex justify-between items-center">
        <span className="text-slate-500 text-sm">
          Invoice {data.invoice_number}
        </span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-sky-600 text-sm"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* Invoice Page */}
      <div
        className="invoice-page bg-white mx-auto my-6 p-10 shadow-lg"
        style={{ width: "210mm", minHeight: "297mm" }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-sky-500">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <img
                src="/images/HDB-LOGO.png"
                alt="HDB Airconds"
                className="h-12 w-auto object-contain"
              />
              <span className="text-2xl font-black text-sky-600">
                HDB AIRCONDS
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              Jasa & Penjualan AC Mojokerto
            </p>
            <p className="text-slate-500 text-xs mt-2">
              Jl. Gajah Mada No.19, Rw. III, Seduri
            </p>
            <p className="text-slate-500 text-xs">
              Kec. Mojosari, Kab. Mojokerto, Jawa Timur 61382
            </p>
            <p className="text-slate-500 text-xs">
              0815-1572-9739 &nbsp;· hasildayabersama@gmail.com
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-slate-800 mb-2">INVOICE</p>
            <table className="text-sm text-right ml-auto">
              <tbody>
                {[
                  ["No. Invoice", data.invoice_number],
                  ["Tanggal", fmtDate(data.invoice_date)],
                  ["No. Order", data.order_id],
                  ["Tgl Order", fmtDate(data.order_date)],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td className="text-slate-500 pr-3 py-0.5">{k}</td>
                    <td className="font-semibold text-slate-800">: {v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Billing + Teknisi */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Tagihan Kepada
            </p>
            <p className="font-bold text-slate-800">{data.customer_name}</p>
            <p className="text-slate-500 text-sm">{data.customer_phone}</p>
            <p className="text-slate-500 text-sm">{data.customer_address}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Dikerjakan Oleh
            </p>
            <p className="font-bold text-slate-800">
              {data.teknisi_name || "—"}
            </p>
            <p className="text-slate-500 text-sm">
              Tanggal: {fmtDate(data.invoice_date)}
            </p>
          </div>
        </div>

        {/* Original Items */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Rincian Pesanan Awal
          </p>
          <table className="w-full text-sm">
            <thead className="bg-sky-50">
              <tr>
                {["No", "Deskripsi", "Qty", "Harga Sat", "Total"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 font-semibold text-slate-700"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.orig_items || []).map((it: any, i: number) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">
                    {it.item_name}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{it.quantity}</td>
                  <td className="px-3 py-2">{fmt(Number(it.price))}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">
                    {fmt(Number(it.price) * Number(it.quantity))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Addition Items */}
        <div className="mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Penambahan Material & Jasa
          </p>
          <table className="w-full text-sm">
            <thead className="bg-amber-50">
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
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.add_items || []).map((it: any, i: number) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">
                    {it.name}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{it.quantity}</td>
                  <td className="px-3 py-2 text-slate-400">{it.unit}</td>
                  <td className="px-3 py-2">{fmt(it.unit_price)}</td>
                  <td className="px-3 py-2 font-semibold text-sky-600">
                    {fmt(it.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <table className="text-sm w-64">
            <tbody>
              <tr>
                <td className="py-1 text-slate-500">Subtotal Pesanan Awal</td>
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
              <tr className="border-t-2 border-slate-800">
                <td className="pt-2 font-bold text-slate-800 text-base">
                  TOTAL
                </td>
                <td className="pt-2 text-right font-black text-sky-600 text-lg">
                  {fmt(data.grand_total)}
                </td>
              </tr>
              <tr>
                <td className="pt-1 text-slate-500 text-xs">Metode Bayar</td>
                <td className="pt-1 text-right text-xs font-medium capitalize">
                  {data.payment_method === "cash"
                    ? "Tunai"
                    : "Transfer / Online"}
                </td>
              </tr>
              <tr>
                <td className="text-slate-500 text-xs">Status</td>
                <td className="text-right text-xs font-bold text-emerald-600">
                  LUNAS
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes */}
        <div className="bg-sky-50 rounded-xl p-4 mb-10 text-xs text-slate-500">
          <p>
            • Garansi layanan berlaku <strong>30 hari</strong> sejak tanggal
            pengerjaan.
          </p>
          <p>
            • Hubungi kami jika ada pertanyaan: <strong>0815-1572-9739</strong>{" "}
            atau <strong>hasildayabersama@gmail.com</strong>
          </p>
        </div>

        {/* Signatures */}
        <div className="mt-auto">
          <p className="text-sm text-slate-500 mb-6">
            Mojosari, {fmtDate(data.invoice_date)}
          </p>
          <div className="grid grid-cols-2 gap-8">
            {[
              { label: "Penerima / Pelanggan", name: data.customer_name },
              {
                label: "Hormat Kami",
                name: "HDB Airconds",
              },
            ].map((col, i) => (
              <div key={i} className="text-center">
                <p className="text-xs text-slate-500 whitespace-pre-line mb-16">
                  {col.label}
                </p>
                <div className="border-b border-slate-400 mb-1" />
                <p className="text-xs text-slate-600 font-medium">{col.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          Dokumen ini dibuat otomatis oleh sistem HDB Airconds &nbsp;·&nbsp;
          Dicetak:{" "}
          {new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>
    </>
  );
}
