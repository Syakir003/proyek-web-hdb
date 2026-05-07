import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Package,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";

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
  topProducts: TopProduct[];
  topTeknisi: TopTeknisi[];
  financialBreakdown: FinancialItem[];
  orderStatusBreakdown: Array<{ status: string; count: number }>;
}

export default function AdminReports({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<ReportData | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, reportsRes] = await Promise.all([
        fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/reports/detailed", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const statsData = await statsRes.json();
      const reportsData = await reportsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (reportsData.success) setReports(reportsData.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Get max revenue for chart scaling
  const maxRevenue =
    reports?.monthlyRevenue.reduce(
      (max, item) => Math.max(max, item.revenue),
      0,
    ) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900">Laporan Penjualan</h2>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center hover:bg-slate-50 transition-colors">
            <Calendar className="w-4 h-4 mr-2" /> 12 Bulan Terakhir
          </button>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center hover:bg-slate-800 transition-colors">
            <Download className="w-4 h-4 mr-2" /> Unduh PDF
          </button>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              Grafik Pendapatan Bulanan
            </h3>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {reports?.monthlyRevenue.map((item, i) => {
              const heightPercent =
                maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: "100%" }}
                  transition={{ delay: i * 0.05 }}
                  className="w-full flex flex-col justify-end relative group"
                >
                  <div className="w-full bg-blue-100 rounded-t-sm relative flex-1 flex items-end">
                    <div
                      className="absolute bottom-0 w-full bg-blue-600 rounded-t-sm transition-all duration-500"
                      style={{ height: `${heightPercent}%` }}
                    ></div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs py-2 px-3 rounded whitespace-nowrap transition-opacity z-10">
                    <div className="font-semibold">
                      {formatRupiah(item.revenue)}
                    </div>
                    <div className="text-slate-300">
                      {item.orderCount} order
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 text-center mt-2">
                    {item.monthLabel}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Ringkasan</h3>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-slate-500 mb-1">Total Pendapatan</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatRupiah(stats?.totalRevenue || 0)}
              </p>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-500 mb-1">Pesanan Selesai</p>
              <p className="text-xl font-bold text-slate-900">
                {stats?.totalOrders - stats?.pendingOrders || 0}
              </p>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-500 mb-1">Pesanan Menunggu</p>
              <p className="text-xl font-bold text-amber-600">
                {stats?.pendingOrders || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center gap-2 mb-6">
            <Wallet className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Status Pembayaran
            </h3>
          </div>
          <div className="space-y-4">
            {reports?.financialBreakdown.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-between justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 capitalize">
                    {item.status}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.orderCount} pesanan
                  </p>
                </div>
                <p className="text-sm font-bold text-emerald-600">
                  {formatRupiah(item.totalAmount)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold text-slate-900">Status Pesanan</h3>
          </div>
          <div className="space-y-4">
            {reports?.orderStatusBreakdown.map((item, i) => {
              const colors: any = {
                pending: "bg-amber-50 text-amber-700",
                processing: "bg-blue-50 text-blue-700",
                completed: "bg-green-50 text-green-700",
                cancelled: "bg-red-50 text-red-700",
              };
              const color = colors[item.status] || "bg-slate-50 text-slate-700";

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center justify-between p-3 rounded-lg ${color}`}
                >
                  <p className="font-semibold capitalize">{item.status}</p>
                  <p className="font-bold">{item.count} pesanan</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Top Products */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
      >
        <div className="flex items-center gap-2 mb-6">
          <Package className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-slate-900">
            Produk Paling Banyak Dibeli
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">
                  Produk
                </th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">
                  Brand
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">
                  Terjual
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">
                  Pendapatan
                </th>
              </tr>
            </thead>
            <tbody>
              {reports?.topProducts.map((product, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.capacity}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{product.brand}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold text-xs">
                      {product.quantity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                    {formatRupiah(product.revenue)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Top Teknisi */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
      >
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-bold text-slate-900">
            Teknisi Paling Sering Ditugaskan
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports?.topTeknisi.map((teknisi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200"
            >
              <p className="font-bold text-slate-900 mb-3">{teknisi.name}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Ditugaskan</span>
                  <span className="font-semibold text-orange-600">
                    {teknisi.assigned}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Selesai</span>
                  <span className="font-semibold text-green-600">
                    {teknisi.completed}
                  </span>
                </div>
                <div className="border-t border-orange-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tingkat Selesai</span>
                    <span className="font-bold text-slate-900">
                      {teknisi.assigned > 0
                        ? Math.round(
                            (teknisi.completed / teknisi.assigned) * 100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
