import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3, Download, Calendar, TrendingUp, Users, Package,
  Wallet, FileText, RefreshCw, Award, DollarSign, ShoppingBag,
  ChevronUp, ChevronDown, FileSpreadsheet, Printer, Filter,
  ArrowUpRight, Star, CheckCircle2, Clock, XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ─────────────────────────────  Types  ───────────────────────────── */
interface DailyRevenue {
  month: string;
  monthLabel: string;
  revenue: number;
  orderCount: number;
}
interface TopProduct {
  id: string;
  name: string;
  brand: string;
  capacity: string;
  quantity: number;
  revenue: number;
}
interface TopTeknisi {
  id: number;
  name: string;
  assigned: number;
  completed: number;
}
interface FinancialItem {
  status: string;
  orderCount: number;
  totalAmount: number;
}
interface ReportData {
  monthlyRevenue: DailyRevenue[];
  revenueByPeriod?: {
    weekly: DailyRevenue[];
    monthly: DailyRevenue[];
    yearly: DailyRevenue[];
  };
  topProducts: TopProduct[];
  topTeknisi: TopTeknisi[];
  financialBreakdown: FinancialItem[];
  orderStatusBreakdown: Array<{ status: string; count: number }>;
}

/* ─────────────────────────  Format helpers  ──────────────────────── */
const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);

const shortRupiah = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} Rb`;
  return n.toString();
};

/* ─────────────────────────  Company info  ───────────────────────── */
const COMPANY = {
  name: "CV. HDB Airconds",
  tagline: "Cooling Solutions — Penjualan & Servis AC",
  address: "Jl. Gajah Mada No.19 Seduri Mojosari, Kab. Mojokerto, Jawa Timur 61382",
  phone: "+62 815-1572-9739",
  email: "hasildayabersama@gmail.com",
};

/* ─────────────────────────  Export utilities  ────────────────────── */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function loadLogoArrayBuffer(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch("/images/HDB-LOGO.png");
    return await res.arrayBuffer();
  } catch { return null; }
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const buf = await loadLogoArrayBuffer();
    if (!buf) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(new Blob([buf], { type: "image/png" }));
    });
  } catch { return null; }
}

function exportCSV(reports: ReportData, stats: any) {
  const today = new Date().toLocaleDateString("id-ID", { dateStyle: "long" });
  const lines: string[][] = [];
  const push = (...row: string[]) => lines.push(row);

  push(COMPANY.name);
  push(COMPANY.tagline);
  push(COMPANY.address);
  push(`Telp: ${COMPANY.phone}  |  Email: ${COMPANY.email}`);
  push();
  push("LAPORAN PENJUALAN");
  push("Tanggal Ekspor:", today);
  push();
  push("=== RINGKASAN ===");
  push("Total Pendapatan (IDR)", stats?.totalRevenue?.toString() ?? "0");
  push("Total Pesanan", stats?.totalOrders?.toString() ?? "0");
  push("Pesanan Pending", stats?.pendingOrders?.toString() ?? "0");
  push("Total Produk", stats?.totalProducts?.toString() ?? "0");
  push("Rata-rata Nilai Pesanan (IDR)", stats?.totalOrders > 0
    ? Math.round((stats.totalRevenue ?? 0) / stats.totalOrders).toString() : "0");
  push();
  push("=== PENDAPATAN BULANAN ===");
  push("Bulan", "Pendapatan (IDR)", "Jumlah Pesanan");
  reports.monthlyRevenue.forEach(r => push(r.monthLabel, r.revenue.toString(), r.orderCount.toString()));
  const totalRev = reports.monthlyRevenue.reduce((s, r) => s + r.revenue, 0);
  const totalOrd = reports.monthlyRevenue.reduce((s, r) => s + r.orderCount, 0);
  push("TOTAL", totalRev.toString(), totalOrd.toString());
  push();
  push("=== PRODUK TERLARIS ===");
  push("Rank", "Nama Produk", "Brand", "Kapasitas", "Terjual (Unit)", "Pendapatan (IDR)");
  reports.topProducts.forEach((p, i) =>
    push((i + 1).toString(), p.name, p.brand, p.capacity, p.quantity.toString(), p.revenue.toString()));
  push();
  push("=== PERFORMA TEKNISI ===");
  push("Nama Teknisi", "Ditugaskan", "Selesai", "Pending", "Tingkat Selesai (%)");
  reports.topTeknisi.forEach(t => {
    const rate = t.assigned > 0 ? Math.round((t.completed / t.assigned) * 100) : 0;
    push(t.name, t.assigned.toString(), t.completed.toString(),
      (t.assigned - t.completed).toString(), rate.toString());
  });
  push();
  push("=== STATUS PESANAN ===");
  push("Status", "Jumlah", "Persentase (%)");
  const totalOrdStatus = reports.orderStatusBreakdown.reduce((s, o) => s + o.count, 0);
  reports.orderStatusBreakdown.forEach(s => {
    const pct = totalOrdStatus > 0 ? Math.round((s.count / totalOrdStatus) * 100) : 0;
    push(s.status, s.count.toString(), pct.toString());
  });
  push();
  push("=== STATUS PEMBAYARAN ===");
  push("Status", "Jumlah Pesanan", "Total (IDR)");
  reports.financialBreakdown.forEach(f => push(f.status, f.orderCount.toString(), f.totalAmount.toString()));
  push();
  push(`Dokumen digenerate otomatis oleh sistem ${COMPANY.name} — ${today}`);

  const csv = lines.map(row => row.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }),
    `laporan-hdb-${new Date().toISOString().slice(0, 10)}.csv`);
}

async function exportXLSX(reports: ReportData, stats: any) {
  const wb = new ExcelJS.Workbook();
  wb.creator = COMPANY.name;
  wb.created = new Date();
  const today = new Date().toLocaleDateString("id-ID", { dateStyle: "long" });

  // Load logo
  let logoId: number | null = null;
  try {
    const buf = await loadLogoArrayBuffer();
    if (buf) logoId = wb.addImage({ buffer: buf, extension: "png" });
  } catch { /* logo optional */ }

  // ── Color tokens ──
  const SKY    = "FF0EA5E9";
  const SKYDK  = "FF0284C7";
  const SKYBG  = "FFE0F2FE";
  const WHITE  = "FFFFFFFF";
  const ALTBG  = "FFF0F9FF";
  const DARK   = "FF0F172A";
  const MID    = "FF475569";
  const BORDER = "FFBAE6FD";
  const GRYBRD = "FFE2E8F0";

  const hdrFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: SKY } };
  const coFill:  ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: SKYBG } };
  const altFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: ALTBG } };
  const totFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCFFAFE" } };

  const thinBorder = (color = BORDER): Partial<ExcelJS.Borders> => ({
    top:    { style: "thin", color: { argb: color } },
    left:   { style: "thin", color: { argb: color } },
    bottom: { style: "thin", color: { argb: color } },
    right:  { style: "thin", color: { argb: color } },
  });

  const styleHeader = (cell: ExcelJS.Cell) => {
    cell.fill = hdrFill;
    cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: false };
    cell.border = thinBorder();
  };
  const styleData = (cell: ExcelJS.Cell, alt = false) => {
    if (alt) cell.fill = altFill;
    cell.border = thinBorder(GRYBRD);
    cell.font = { size: 9, color: { argb: DARK } };
    cell.alignment = { vertical: "middle" };
  };
  const styleTotal = (cell: ExcelJS.Cell) => {
    cell.fill = totFill;
    cell.font = { bold: true, size: 9, color: { argb: SKYDK } };
    cell.border = thinBorder();
    cell.alignment = { vertical: "middle" };
  };

  // ── Company header helper ──
  const addHeader = (ws: ExcelJS.Worksheet, totalCols: number) => {
    // 3 rows reserved for logo area
    for (let i = 0; i < 3; i++) {
      const r = ws.addRow([]);
      r.height = 20;
      for (let c = 1; c <= totalCols; c++) r.getCell(c).fill = coFill;
    }
    if (logoId !== null) {
      ws.addImage(logoId, {
        tl: { col: 0, row: 0 },
        ext: { width: 56, height: 56 },
      });
    }

    const mkRow = (text: string, sz: number, bold: boolean, color: string) => {
      const r = ws.addRow([text]);
      r.height = sz === 14 ? 20 : 15;
      const cell = r.getCell(1);
      cell.font = { bold, size: sz, color: { argb: color } };
      cell.fill = coFill;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      if (totalCols > 1) ws.mergeCells(r.number, 1, r.number, totalCols);
    };
    mkRow(COMPANY.name,    14, true,  SKYDK);
    mkRow(COMPANY.tagline,  9, false, MID);
    mkRow(COMPANY.address,  9, false, MID);
    mkRow(`Telp: ${COMPANY.phone}  |  Email: ${COMPANY.email}`, 9, false, MID);
    mkRow(`Tanggal Ekspor: ${today}`, 9, false, MID);

    // Divider row
    const divRow = ws.addRow([]);
    for (let c = 1; c <= totalCols; c++) {
      divRow.getCell(c).fill = hdrFill;
    }
    divRow.height = 4;

    ws.addRow([]); // spacer
  };

  // ── Sheet 1: Ringkasan ──
  {
    const ws = wb.addWorksheet("Ringkasan");
    ws.columns = [{ width: 36 }, { width: 26 }];
    addHeader(ws, 2);

    const t = ws.addRow(["RINGKASAN LAPORAN"]);
    ws.mergeCells(t.number, 1, t.number, 2);
    t.height = 18; t.getCell(1).fill = hdrFill;
    t.getCell(1).font = { bold: true, size: 12, color: { argb: WHITE } };
    t.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    ws.addRow([]);

    const hdr = ws.addRow(["Metrik", "Nilai"]);
    hdr.height = 16; hdr.eachCell(styleHeader);

    const rows: [string, number][] = [
      ["Total Pendapatan (IDR)", stats?.totalRevenue ?? 0],
      ["Total Pesanan", stats?.totalOrders ?? 0],
      ["Pesanan Pending", stats?.pendingOrders ?? 0],
      ["Total Produk", stats?.totalProducts ?? 0],
      ["Rata-rata Nilai Pesanan (IDR)", stats?.totalOrders > 0
        ? Math.round((stats.totalRevenue ?? 0) / stats.totalOrders) : 0],
    ];
    rows.forEach(([label, val], i) => {
      const r = ws.addRow([label, val]);
      r.height = 14;
      styleData(r.getCell(1), i % 2 === 1);
      styleData(r.getCell(2), i % 2 === 1);
      r.getCell(2).numFmt = '#,##0';
      r.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
    });
  }

  // ── Sheet 2: Pendapatan Bulanan ──
  {
    const ws = wb.addWorksheet("Pendapatan Bulanan");
    ws.columns = [{ width: 18 }, { width: 26 }, { width: 20 }];
    addHeader(ws, 3);

    const t = ws.addRow(["PENDAPATAN BULANAN"]);
    ws.mergeCells(t.number, 1, t.number, 3);
    t.height = 18; t.getCell(1).fill = hdrFill;
    t.getCell(1).font = { bold: true, size: 12, color: { argb: WHITE } };
    t.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    ws.addRow([]);

    const hdr = ws.addRow(["Bulan", "Pendapatan (IDR)", "Jumlah Pesanan"]);
    hdr.height = 16; hdr.eachCell(styleHeader);

    reports.monthlyRevenue.forEach((r, i) => {
      const row = ws.addRow([r.monthLabel, r.revenue, r.orderCount]);
      row.height = 14;
      [1, 2, 3].forEach(c => styleData(row.getCell(c), i % 2 === 1));
      row.getCell(2).numFmt = '#,##0';
      row.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
    });

    ws.addRow([]);
    const totalRev = reports.monthlyRevenue.reduce((s, r) => s + r.revenue, 0);
    const totalOrd = reports.monthlyRevenue.reduce((s, r) => s + r.orderCount, 0);
    const tot = ws.addRow(["TOTAL", totalRev, totalOrd]);
    tot.height = 15;
    [1, 2, 3].forEach(c => styleTotal(tot.getCell(c)));
    tot.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    tot.getCell(2).numFmt = '#,##0';
    tot.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
    tot.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
  }

  // ── Sheet 3: Produk Terlaris ──
  {
    const ws = wb.addWorksheet("Produk Terlaris");
    ws.columns = [{ width: 6 }, { width: 38 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 26 }];
    addHeader(ws, 6);

    const t = ws.addRow(["PRODUK TERLARIS"]);
    ws.mergeCells(t.number, 1, t.number, 6);
    t.height = 18; t.getCell(1).fill = hdrFill;
    t.getCell(1).font = { bold: true, size: 12, color: { argb: WHITE } };
    t.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    ws.addRow([]);

    const hdr = ws.addRow(["#", "Nama Produk", "Brand", "Kapasitas", "Terjual (Unit)", "Pendapatan (IDR)"]);
    hdr.height = 16; hdr.eachCell(styleHeader);

    reports.topProducts.forEach((p, i) => {
      const row = ws.addRow([i + 1, p.name, p.brand, p.capacity, p.quantity, p.revenue]);
      row.height = 14;
      [1, 2, 3, 4, 5, 6].forEach(c => styleData(row.getCell(c), i % 2 === 1));
      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(6).numFmt = '#,##0';
      row.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
    });
  }

  // ── Sheet 4: Performa Teknisi ──
  {
    const ws = wb.addWorksheet("Performa Teknisi");
    ws.columns = [{ width: 28 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 22 }];
    addHeader(ws, 5);

    const t = ws.addRow(["PERFORMA TEKNISI"]);
    ws.mergeCells(t.number, 1, t.number, 5);
    t.height = 18; t.getCell(1).fill = hdrFill;
    t.getCell(1).font = { bold: true, size: 12, color: { argb: WHITE } };
    t.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    ws.addRow([]);

    const hdr = ws.addRow(["Nama Teknisi", "Ditugaskan", "Selesai", "Pending", "Tingkat Selesai"]);
    hdr.height = 16; hdr.eachCell(styleHeader);

    reports.topTeknisi.forEach((t, i) => {
      const rate = t.assigned > 0 ? Math.round((t.completed / t.assigned) * 100) : 0;
      const row = ws.addRow([t.name, t.assigned, t.completed, t.assigned - t.completed, rate / 100]);
      row.height = 14;
      [1, 2, 3, 4, 5].forEach(c => styleData(row.getCell(c), i % 2 === 1));
      [2, 3, 4].forEach(c => { row.getCell(c).alignment = { horizontal: "center", vertical: "middle" }; });
      row.getCell(5).numFmt = '0%';
      row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
      const rateArgb = rate >= 80 ? "FF10B981" : rate >= 50 ? "FFF59E0B" : "FFEF4444";
      row.getCell(5).font = { bold: true, size: 9, color: { argb: rateArgb } };
    });
  }

  // ── Sheet 5: Status Pesanan ──
  {
    const ws = wb.addWorksheet("Status Pesanan");
    ws.columns = [{ width: 22 }, { width: 16 }, { width: 18 }];
    addHeader(ws, 3);

    const t = ws.addRow(["STATUS PESANAN"]);
    ws.mergeCells(t.number, 1, t.number, 3);
    t.height = 18; t.getCell(1).fill = hdrFill;
    t.getCell(1).font = { bold: true, size: 12, color: { argb: WHITE } };
    t.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    ws.addRow([]);

    const hdr = ws.addRow(["Status", "Jumlah", "Persentase"]);
    hdr.height = 16; hdr.eachCell(styleHeader);

    const totalOrd = reports.orderStatusBreakdown.reduce((s, o) => s + o.count, 0);
    reports.orderStatusBreakdown.forEach((s, i) => {
      const row = ws.addRow([s.status, s.count, totalOrd > 0 ? s.count / totalOrd : 0]);
      row.height = 14;
      [1, 2, 3].forEach(c => styleData(row.getCell(c), i % 2 === 1));
      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).numFmt = '0.0%';
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
    });
  }

  // ── Sheet 6: Status Pembayaran ──
  {
    const ws = wb.addWorksheet("Status Pembayaran");
    ws.columns = [{ width: 22 }, { width: 18 }, { width: 26 }];
    addHeader(ws, 3);

    const t = ws.addRow(["STATUS PEMBAYARAN"]);
    ws.mergeCells(t.number, 1, t.number, 3);
    t.height = 18; t.getCell(1).fill = hdrFill;
    t.getCell(1).font = { bold: true, size: 12, color: { argb: WHITE } };
    t.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    ws.addRow([]);

    const hdr = ws.addRow(["Status Pembayaran", "Jumlah Pesanan", "Total (IDR)"]);
    hdr.height = 16; hdr.eachCell(styleHeader);

    reports.financialBreakdown.forEach((f, i) => {
      const row = ws.addRow([f.status, f.orderCount, f.totalAmount]);
      row.height = 14;
      [1, 2, 3].forEach(c => styleData(row.getCell(c), i % 2 === 1));
      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).numFmt = '#,##0';
      row.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `laporan-hdb-${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

async function exportPDF(reports: ReportData, stats: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("id-ID", { dateStyle: "long" });
  const W = 210;

  // Load logo
  const logoDataUrl = await loadLogoDataUrl();

  // ── Header banner ──
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, W, 42, "F");
  doc.setFillColor(2, 132, 199);
  doc.rect(0, 36, W, 6, "F");

  // Logo (left side)
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 9, 5, 28, 28);
  }

  // Company text (right of logo)
  const tx = logoDataUrl ? 43 : 14;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(COMPANY.name, tx, 13);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY.tagline, tx, 19);
  doc.text(COMPANY.address, tx, 24);
  doc.text(`Telp: ${COMPANY.phone}  |  ${COMPANY.email}`, tx, 29);

  // Export date
  doc.setFontSize(7.5);
  doc.text(`Diekspor: ${today}`, W - 14, 39.5, { align: "right" });

  let y = 52;

  // ── KPI cards ──
  const kpis = [
    ["Total Pendapatan", formatRupiah(stats?.totalRevenue ?? 0)],
    ["Total Pesanan",    (stats?.totalOrders ?? 0).toString()],
    ["Pesanan Pending",  (stats?.pendingOrders ?? 0).toString()],
    ["Total Produk",     (stats?.totalProducts ?? 0).toString()],
  ];
  const boxW = (W - 28 - 9) / 4;
  kpis.forEach(([label, value], i) => {
    const bx = 14 + i * (boxW + 3);
    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(186, 230, 253);
    doc.roundedRect(bx, y, boxW, 16, 2, 2, "FD");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(label, bx + 4, y + 5);
    doc.setTextColor(14, 165, 233);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text(value, bx + 4, y + 12);
  });
  y += 24;

  // ── Section helper ──
  const section = (title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 14, y);
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.4);
    doc.line(14, y + 1.5, W - 14, y + 1.5);
    y += 7;
  };

  const headStyles = {
    fillColor: [14, 165, 233] as [number, number, number],
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: "bold" as const,
    fontSize: 8,
  };
  const altStyles = { fillColor: [240, 249, 255] as [number, number, number] };
  const totalRowStyles = {
    fillColor: [207, 250, 254] as [number, number, number],
    textColor: [2, 132, 199] as [number, number, number],
    fontStyle: "bold" as const,
  };

  // ── Pendapatan Bulanan ──
  section("PENDAPATAN BULANAN");
  const totalRevPDF = reports.monthlyRevenue.reduce((s, r) => s + r.revenue, 0);
  const totalOrdPDF = reports.monthlyRevenue.reduce((s, r) => s + r.orderCount, 0);
  autoTable(doc, {
    startY: y,
    head: [["Bulan", "Pendapatan", "Jml. Pesanan"]],
    body: [
      ...reports.monthlyRevenue.map(r => [r.monthLabel, formatRupiah(r.revenue), r.orderCount.toString()]),
      ["TOTAL", formatRupiah(totalRevPDF), totalOrdPDF.toString()],
    ],
    theme: "striped",
    headStyles,
    alternateRowStyles: altStyles,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
    willDrawCell: (data) => {
      if (data.section === "body" && data.row.index === reports.monthlyRevenue.length) {
        data.cell.styles.fillColor = totalRowStyles.fillColor;
        data.cell.styles.textColor = totalRowStyles.textColor;
        data.cell.styles.fontStyle = totalRowStyles.fontStyle;
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Produk Terlaris ──
  if (y > 220) { doc.addPage(); y = 20; }
  section("PRODUK TERLARIS");
  autoTable(doc, {
    startY: y,
    head: [["#", "Nama Produk", "Brand", "Kapasitas", "Terjual", "Pendapatan"]],
    body: reports.topProducts.map((p, i) => [
      `#${i + 1}`, p.name, p.brand, p.capacity,
      `${p.quantity} unit`, formatRupiah(p.revenue),
    ]),
    theme: "striped",
    headStyles,
    alternateRowStyles: altStyles,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 8 }, 5: { halign: "right" } },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Status side-by-side ──
  if (y > 220) { doc.addPage(); y = 20; }
  section("STATUS PESANAN & PEMBAYARAN");
  const totalOrdStatus = reports.orderStatusBreakdown.reduce((s, o) => s + o.count, 0);
  autoTable(doc, {
    startY: y,
    head: [["Status Pesanan", "Jml", "%"]],
    body: reports.orderStatusBreakdown.map(s => [
      s.status, s.count.toString(),
      totalOrdStatus > 0 ? `${Math.round((s.count / totalOrdStatus) * 100)}%` : "0%",
    ]),
    theme: "striped", headStyles, alternateRowStyles: altStyles,
    margin: { left: 14, right: (W / 2) + 1 },
    styles: { fontSize: 8 },
    tableWidth: (W - 28) / 2 - 2,
  });
  autoTable(doc, {
    startY: y,
    head: [["Status Bayar", "Pesanan", "Total"]],
    body: reports.financialBreakdown.map(f => [f.status, f.orderCount.toString(), formatRupiah(f.totalAmount)]),
    theme: "striped", headStyles, alternateRowStyles: altStyles,
    margin: { left: (W / 2) + 1, right: 14 },
    styles: { fontSize: 8 },
    tableWidth: (W - 28) / 2 - 2,
  });
  y = Math.max((doc as any).lastAutoTable.finalY, y) + 10;

  // ── Performa Teknisi ──
  if (y > 220) { doc.addPage(); y = 20; }
  section("PERFORMA TEKNISI");
  autoTable(doc, {
    startY: y,
    head: [["Nama Teknisi", "Ditugaskan", "Selesai", "Pending", "Tingkat Selesai"]],
    body: reports.topTeknisi.map(t => {
      const rate = t.assigned > 0 ? Math.round((t.completed / t.assigned) * 100) : 0;
      return [t.name, t.assigned.toString(), t.completed.toString(),
        (t.assigned - t.completed).toString(), `${rate}%`];
    }),
    theme: "striped", headStyles, alternateRowStyles: altStyles,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
  });

  // ── Footer on every page ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 285, W, 12, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255);
    doc.text(`${COMPANY.name}  ·  ${COMPANY.address}`, 14, 291.5);
    doc.text(`Halaman ${i} dari ${pages}`, W - 14, 291.5, { align: "right" });
  }

  doc.save(`laporan-hdb-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/* ────────────────────────  Sub-components  ──────────────────────── */

/** Donut chart using SVG stroke-dasharray */
function DonutChart({ segments, centerLabel, centerSub }: {
  segments: { label: string; value: number; color: string }[];
  centerLabel?: string;
  centerSub?: string;
}) {
  const r = 36, cx = 50, cy = 50;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let cum = 0;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="11" />
      {total > 0 && segments.map((seg, i) => {
        const frac = seg.value / total;
        const rotation = -90 + cum * 360;
        cum += frac;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth="11"
            strokeDasharray={`${frac * C} ${(1 - frac) * C}`}
            transform={`rotate(${rotation} ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
      })}
      {centerLabel && (
        <>
          <text x={cx} y={cy - 1} textAnchor="middle" dominantBaseline="middle"
            className="font-bold" style={{ fontSize: 12, fill: "#0f172a", fontFamily: "sans-serif", fontWeight: 700 }}>
            {centerLabel}
          </text>
          {centerSub && (
            <text x={cx} y={cy + 8} textAnchor="middle"
              style={{ fontSize: 7, fill: "#94a3b8", fontFamily: "sans-serif" }}>
              {centerSub}
            </text>
          )}
        </>
      )}
    </svg>
  );
}

/** Circular progress ring for teknisi */
function CircleProgress({ pct, color = "#0ea5e9", size = 64 }: { pct: number; color?: string; size?: number }) {
  const r = (size / 2) - 6;
  const C = 2 * Math.PI * r;
  const dash = (pct / 100) * C;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${C - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 11, fontWeight: 700, fill: "#0f172a", fontFamily: "sans-serif" }}>
        {pct}%
      </text>
    </svg>
  );
}

/** Custom bar chart */
function RevenueBarChart({ data }: { data: DailyRevenue[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxRev = data.reduce((m, d) => Math.max(m, d.revenue), 0) || 1;
  const yTicks = 4;

  return (
    <div className="relative w-full">
      {/* Y-axis labels */}
      <div className="flex gap-2">
        <div className="flex flex-col-reverse justify-between h-48 text-right pr-1 py-1 shrink-0">
          {Array.from({ length: yTicks + 1 }, (_, i) => (
            <span key={i} className="text-[10px] text-slate-400 leading-none">
              {shortRupiah((maxRev / yTicks) * i)}
            </span>
          ))}
        </div>
        {/* Chart area */}
        <div className="flex-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col-reverse justify-between pointer-events-none py-1">
            {Array.from({ length: yTicks + 1 }, (_, i) => (
              <div key={i} className="border-t border-dashed border-slate-100 w-full" />
            ))}
          </div>
          {/* Bars */}
          <div className="flex items-end gap-1 h-48 relative z-10">
            {data.map((item, i) => {
              const pct = maxRev > 0 ? (item.revenue / maxRev) * 100 : 0;
              const isHov = hovered === i;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-0"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Tooltip */}
                  <AnimatePresence>
                    {isHov && (
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full mb-1 z-20 pointer-events-none"
                        style={{ left: `${(i / data.length) * 100 + (0.5 / data.length) * 100}%`, transform: "translateX(-50%)" }}
                      >
                        <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl whitespace-nowrap border border-slate-700">
                          <p className="font-bold text-sky-300">{formatRupiah(item.revenue)}</p>
                          <p className="text-slate-300 mt-0.5">{item.orderCount} pesanan</p>
                          <p className="text-slate-400 text-[10px]">{item.monthLabel}</p>
                        </div>
                        <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1 border-r border-b border-slate-700" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
                    transition={{ duration: 0.7, delay: i * 0.04, ease: "easeOut" }}
                    className={`w-full rounded-t-md transition-all duration-200 cursor-pointer ${
                      isHov
                        ? "bg-gradient-to-t from-blue-600 to-sky-400 shadow-lg shadow-sky-500/30"
                        : "bg-gradient-to-t from-sky-600 to-sky-400"
                    }`}
                    style={{ minHeight: item.revenue > 0 ? 4 : 0 }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* X-axis labels */}
      <div className="flex gap-1 ml-10 mt-1">
        {data.map((item, i) => (
          <div key={i} className={`flex-1 text-center text-[10px] truncate px-0.5 transition-colors ${hovered === i ? "text-sky-600 font-semibold" : "text-slate-400"}`}>
            {item.monthLabel}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────  Order/Payment status config  ─────────── */
const orderStatusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:    { label: "Menunggu",  color: "#f59e0b", bg: "bg-amber-50",   icon: <Clock className="w-3.5 h-3.5" /> },
  processing: { label: "Diproses", color: "#3b82f6", bg: "bg-blue-50",    icon: <RefreshCw className="w-3.5 h-3.5" /> },
  completed:  { label: "Selesai",  color: "#10b981", bg: "bg-emerald-50", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelled:  { label: "Dibatal",  color: "#ef4444", bg: "bg-red-50",     icon: <XCircle className="w-3.5 h-3.5" /> },
};
const paymentStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  settlement: { label: "Lunas",    color: "#10b981", bg: "bg-emerald-50" },
  pending:    { label: "Pending",  color: "#f59e0b", bg: "bg-amber-50" },
  cancel:     { label: "Batal",    color: "#ef4444", bg: "bg-red-50" },
  deny:       { label: "Ditolak",  color: "#ef4444", bg: "bg-red-50" },
  expire:     { label: "Expired",  color: "#64748b", bg: "bg-slate-50" },
  refund:     { label: "Refund",   color: "#8b5cf6", bg: "bg-violet-50" },
};

/* ─────────────────────────  Main component  ─────────────────────── */
type RevenuePeriod = "weekly" | "monthly" | "yearly";
type DateRange = "3" | "4" | "5" | "6" | "8" | "12";

const periodConfig: Record<RevenuePeriod, { label: string; unit: string; bestLabel: string; ranges: DateRange[] }> = {
  weekly: { label: "Minggu", unit: "Minggu", bestLabel: "Periode Terbaik", ranges: ["4", "8", "12"] },
  monthly: { label: "Bulan", unit: "Bulan", bestLabel: "Bulan Terbaik", ranges: ["3", "6", "12"] },
  yearly: { label: "Tahun", unit: "Tahun", bestLabel: "Tahun Terbaik", ranges: ["3", "5"] },
};

export default function AdminReports({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<ReportData | null>(null);
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("monthly");
  const [dateRange, setDateRange] = useState<DateRange>("12");
  const [exporting, setExporting] = useState<"csv" | "xlsx" | "pdf" | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [statsRes, reportsRes] = await Promise.all([
        fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/reports/detailed", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const statsData = await statsRes.json();
      const reportsData = await reportsRes.json();
      if (statsData.success) setStats(statsData.data);
      if (reportsData.success) setReports(reportsData.data);
    } catch {
      /* silent fail */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* Filtered chart data */
  const activePeriodConfig = periodConfig[revenuePeriod];
  const rangeOptions = activePeriodConfig.ranges;
  const selectedRange = rangeOptions.includes(dateRange) ? dateRange : rangeOptions[rangeOptions.length - 1];
  const periodRevenue =
    reports?.revenueByPeriod?.[revenuePeriod] ??
    (revenuePeriod === "monthly" ? reports?.monthlyRevenue : []) ??
    [];
  const chartData = periodRevenue.slice(-Number(selectedRange));

  /* KPI derived values */
  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalOrders = stats?.totalOrders ?? 0;
  const pendingOrders = stats?.pendingOrders ?? 0;
  const completedOrders = stats?.completedOrders ?? 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  /* Best period */
  const bestPeriod = chartData.reduce((best, cur) => cur.revenue > (best?.revenue ?? 0) ? cur : best, chartData[0]);

  /* Revenue growth (last vs prev period) */
  const half = Math.floor(chartData.length / 2);
  const recentHalf = chartData.slice(half).reduce((s, d) => s + d.revenue, 0);
  const prevHalf = chartData.slice(0, half).reduce((s, d) => s + d.revenue, 0);
  const growthPct = prevHalf > 0 ? Math.round(((recentHalf - prevHalf) / prevHalf) * 100) : 0;

  /* Max product revenue for progress bars */
  const maxProductRevenue = reports?.topProducts.reduce((m, p) => Math.max(m, p.revenue), 0) ?? 1;

  /* Handle exports */
  const handleExport = async (type: "csv" | "xlsx" | "pdf") => {
    if (!reports || !stats) return;
    setExporting(type);
    await new Promise(r => setTimeout(r, 100)); // let UI update
    try {
      if (type === "csv") exportCSV(reports, stats);
      else if (type === "xlsx") await exportXLSX(reports, stats);
      else await exportPDF(reports, stats);
    } finally {
      setExporting(null);
    }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-80" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
        </div>
        <div className="h-72 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 bg-slate-200 rounded-2xl" />
          <div className="h-48 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  /* ── Main render ── */
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Laporan & Analitik</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Data diperbarui otomatis · {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {/* Export buttons */}
          <button
            onClick={() => handleExport("csv")}
            disabled={!!exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all disabled:opacity-50"
            title="Export CSV"
          >
            {exporting === "csv" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            CSV
          </button>
          <button
            onClick={() => handleExport("xlsx")}
            disabled={!!exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-sm font-medium transition-all disabled:opacity-50"
            title="Export Excel"
          >
            {exporting === "xlsx" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            XLSX
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={!!exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition-all shadow-md shadow-sky-500/30 disabled:opacity-50"
            title="Export PDF"
          >
            {exporting === "pdf" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PDF
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Pendapatan", value: formatRupiah(totalRevenue),
            sub: `vs periode lalu`, badge: `${growthPct >= 0 ? "+" : ""}${growthPct}%`,
            up: growthPct >= 0,
            icon: <DollarSign className="w-5 h-5" />,
            theme: "from-emerald-400 to-teal-500",
            text: "text-emerald-600",
          },
          {
            label: "Total Pesanan", value: totalOrders.toString(),
            sub: `${pendingOrders} pesanan menunggu`, badge: `${pendingOrders} pending`,
            up: pendingOrders === 0,
            icon: <ShoppingBag className="w-5 h-5" />,
            theme: "from-sky-400 to-blue-500",
            text: "text-sky-600",
          },
          {
            label: "Rata-rata Nilai Pesanan", value: formatRupiah(avgOrderValue),
            sub: `Dari ${totalOrders} pesanan`, badge: `${totalOrders} order`,
            up: true,
            icon: <Wallet className="w-5 h-5" />,
            theme: "from-violet-400 to-purple-500",
            text: "text-violet-600",
          },
          {
            label: "Tingkat Penyelesaian", value: `${completionRate}%`,
            sub: `${completedOrders} dari ${totalOrders} selesai`, badge: `${completionRate}%`,
            up: completionRate >= 80,
            icon: <Award className="w-5 h-5" />,
            theme: "from-amber-400 to-orange-500",
            text: "text-amber-600",
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.theme} flex items-center justify-center text-white shadow-md`}>
                {kpi.icon}
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${kpi.up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                {kpi.up ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {kpi.badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-1">{kpi.label}</p>
            <p className={`text-xl font-bold ${kpi.text} leading-tight`}>{kpi.value}</p>
            <p className="text-xs text-slate-400 mt-1">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Revenue Chart + Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-500" />
              <h3 className="font-bold text-slate-900">Grafik Pendapatan</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-100 rounded-xl p-0.5 gap-0.5">
                {(Object.keys(periodConfig) as RevenuePeriod[]).map(period => (
                  <button
                    key={period}
                    onClick={() => {
                      setRevenuePeriod(period);
                      setDateRange(periodConfig[period].ranges[periodConfig[period].ranges.length - 1]);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      revenuePeriod === period ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {periodConfig[period].label}
                  </button>
                ))}
              </div>
              <div className="flex bg-slate-100 rounded-xl p-0.5 gap-0.5">
                {rangeOptions.map(r => (
                  <button
                    key={r}
                    onClick={() => setDateRange(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedRange === r ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {r} {activePeriodConfig.unit}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {chartData.length > 0 ? (
            <RevenueBarChart key={`${revenuePeriod}-${selectedRange}`} data={chartData} />
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              Belum ada data pendapatan
            </div>
          )}
        </motion.div>

        {/* Summary panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-5"
        >
          <h3 className="font-bold text-slate-900">Ringkasan Periode</h3>

          <div className="p-4 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border border-sky-100">
            <p className="text-xs text-sky-600 font-semibold uppercase tracking-wide mb-1">Total Pendapatan</p>
            <p className="text-2xl font-bold text-sky-700">{formatRupiah(chartData.reduce((s, d) => s + d.revenue, 0))}</p>
            <p className="text-xs text-sky-500 mt-1">{chartData.reduce((s, d) => s + d.orderCount, 0)} pesanan</p>
          </div>

          {bestPeriod && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <Star className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-700">{activePeriodConfig.bestLabel}</p>
                <p className="font-bold text-slate-800 text-sm">{bestPeriod.monthLabel}</p>
                <p className="text-xs text-slate-500">{formatRupiah(bestPeriod.revenue)}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Rata-rata/{activePeriodConfig.unit}</span>
              <span className="font-semibold text-slate-800">
                {chartData.length > 0 ? formatRupiah(Math.round(chartData.reduce((s, d) => s + d.revenue, 0) / chartData.length)) : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Pesanan/{activePeriodConfig.unit}</span>
              <span className="font-semibold text-slate-800">
                {chartData.length > 0 ? Math.round(chartData.reduce((s, d) => s + d.orderCount, 0) / chartData.length) : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Pertumbuhan</span>
              <span className={`font-bold flex items-center gap-0.5 ${growthPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {growthPct >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {growthPct >= 0 ? "+" : ""}{growthPct}%
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Status Donut Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-slate-900">Status Pesanan</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 shrink-0">
              <DonutChart
                segments={(reports?.orderStatusBreakdown ?? []).map(s => ({
                  label: s.status,
                  value: s.count,
                  color: orderStatusConfig[s.status]?.color ?? "#94a3b8",
                }))}
                centerLabel={(reports?.orderStatusBreakdown ?? []).reduce((s, o) => s + o.count, 0).toString()}
                centerSub="pesanan"
              />
            </div>
            <div className="flex-1 space-y-2.5">
              {(reports?.orderStatusBreakdown ?? []).map((item, i) => {
                const cfg = orderStatusConfig[item.status] ?? { label: item.status, color: "#94a3b8", bg: "bg-slate-50", icon: null };
                const total = (reports?.orderStatusBreakdown ?? []).reduce((s, o) => s + o.count, 0);
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                    <span className="text-sm text-slate-600 flex-1 capitalize">{cfg.label}</span>
                    <span className="text-xs text-slate-400">{item.count}</span>
                    <span className="text-xs font-bold text-slate-700 w-9 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Progress bars */}
          <div className="mt-4 space-y-2">
            {(reports?.orderStatusBreakdown ?? []).map((item, i) => {
              const cfg = orderStatusConfig[item.status] ?? { label: item.status, color: "#94a3b8", bg: "bg-slate-50", icon: null };
              const total = (reports?.orderStatusBreakdown ?? []).reduce((s, o) => s + o.count, 0);
              const pct = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <div key={i}>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                      className="h-1.5 rounded-full"
                      style={{ background: cfg.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Payment Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Wallet className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-900">Status Pembayaran</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 shrink-0">
              <DonutChart
                segments={(reports?.financialBreakdown ?? []).map(f => ({
                  label: f.status,
                  value: f.totalAmount,
                  color: paymentStatusConfig[f.status]?.color ?? "#94a3b8",
                }))}
                centerLabel={shortRupiah(reports?.financialBreakdown.find(f => f.status === "settlement")?.totalAmount ?? 0)}
                centerSub="settlement"
              />
            </div>
            <div className="flex-1 space-y-2.5">
              {(reports?.financialBreakdown ?? []).map((item, i) => {
                const cfg = paymentStatusConfig[item.status] ?? { label: item.status, color: "#94a3b8", bg: "bg-slate-50" };
                const total = (reports?.financialBreakdown ?? []).reduce((s, f) => s + f.totalAmount, 0);
                const pct = total > 0 ? Math.round((item.totalAmount / total) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                    <span className="text-sm text-slate-600 flex-1 capitalize">{cfg.label}</span>
                    <span className="text-xs text-slate-400">{item.orderCount}</span>
                    <span className="text-xs font-bold text-slate-700 w-9 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Revenue breakdown */}
          <div className="mt-4 space-y-1.5">
            {(reports?.financialBreakdown ?? []).map((item, i) => {
              const cfg = paymentStatusConfig[item.status] ?? { label: item.status, color: "#94a3b8", bg: "bg-slate-50" };
              return (
                <div key={i} className={`flex justify-between items-center px-3 py-2 rounded-lg ${cfg.bg} text-sm`}>
                  <span className="capitalize font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="font-bold text-slate-800">{shortRupiah(item.totalAmount)}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Top Products ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-violet-500" />
            <h3 className="font-bold text-slate-900">Produk Terlaris</h3>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
            {reports?.topProducts.length ?? 0} produk
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left py-3 px-6 font-semibold text-slate-600 w-12">#</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Produk</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 hidden sm:table-cell">Brand</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">Terjual</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600 hidden md:table-cell">Pendapatan</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 hidden lg:table-cell w-40">Kontribusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(reports?.topProducts ?? []).map((product, i) => {
                const revPct = maxProductRevenue > 0 ? (product.revenue / maxProductRevenue) * 100 : 0;
                const rankColors = ["bg-amber-400", "bg-slate-400", "bg-orange-400"];
                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.05 }}
                    className="hover:bg-sky-50/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${rankColors[i] ?? "bg-slate-200 text-slate-600"}`}>
                        {i < 3 ? (i + 1) : <span className="text-slate-500">{i + 1}</span>}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-400">{product.capacity}</p>
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-lg text-xs font-medium">{product.brand}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-bold">
                        {product.quantity} unit
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-emerald-600 hidden md:table-cell">
                      {formatRupiah(product.revenue)}
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${revPct}%` }}
                            transition={{ duration: 0.8, delay: 0.4 + i * 0.06 }}
                            className="h-2 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-8 text-right">{Math.round(revPct)}%</span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {(reports?.topProducts.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Belum ada data produk
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Teknisi Performance ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-slate-900">Performa Teknisi</h3>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
            {reports?.topTeknisi.length ?? 0} teknisi
          </span>
        </div>

        {(reports?.topTeknisi.length ?? 0) === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            Belum ada data teknisi
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {(reports?.topTeknisi ?? []).map((teknisi, i) => {
              const rate = teknisi.assigned > 0 ? Math.round((teknisi.completed / teknisi.assigned) * 100) : 0;
              const ringColor = rate >= 80 ? "#10b981" : rate >= 50 ? "#f59e0b" : "#ef4444";
              const initial = teknisi.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <motion.div
                  key={teknisi.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.07 }}
                  className="border border-slate-200 rounded-2xl p-5 hover:border-sky-200 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-slate-50/50"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {/* Circular progress */}
                    <div className="relative shrink-0">
                      <CircleProgress pct={rate} color={ringColor} size={56} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{teknisi.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">ID #{teknisi.id}</p>
                    </div>
                    <div className={`ml-auto px-2 py-1 rounded-lg text-xs font-bold shrink-0 ${
                      rate >= 80 ? "bg-emerald-50 text-emerald-700" : rate >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"
                    }`}>
                      {rate >= 80 ? "Baik" : rate >= 50 ? "Cukup" : "Perlu Perhatian"}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: "Ditugaskan", value: teknisi.assigned, color: "text-sky-600" },
                      { label: "Selesai", value: teknisi.completed, color: "text-emerald-600" },
                      { label: "Pending", value: teknisi.assigned - teknisi.completed, color: "text-amber-500" },
                    ].map(stat => (
                      <div key={stat.label} className="bg-white rounded-xl p-2 border border-slate-100">
                        <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-[10px] text-slate-400 leading-none mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${rate}%` }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                        className="h-1.5 rounded-full"
                        style={{ background: ringColor }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

    </div>
  );
}
