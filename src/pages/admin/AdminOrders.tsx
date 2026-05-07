import React, { useState, useEffect } from "react";
import { Check, X, Clock, Search, Trash2, UserCog } from "lucide-react";

export default function AdminOrders({ token }: { token: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [teknisiList, setTeknisiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOrders();
    fetchTeknisi();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeknisi = async () => {
    try {
      const response = await fetch("/api/admin/teknisi", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTeknisiList(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch teknisi", error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        fetchOrders(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const assignTeknisi = async (id: string, teknisiId: string) => {
    if (!teknisiId) {
      alert("Pilih teknisi terlebih dahulu");
      return;
    }

    try {
      console.log("Assigning teknisi:", { id, teknisiId });

      const response = await fetch(`/api/admin/orders/${id}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teknisi_id: teknisiId }),
      });

      const data = await response.json();
      console.log("Assign response:", data);

      if (response.ok && data.success) {
        console.log("Teknisi assigned successfully");
        fetchOrders();
      } else {
        alert(data.error || "Gagal menugaskan teknisi");
      }
    } catch (error) {
      console.error("Failed to assign teknisi:", error);
      alert("Gagal menugaskan teknisi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus pesanan ini?")) return;
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) fetchOrders();
    } catch (error) {
      console.error("Failed to delete order", error);
    }
  };

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "transfer_bank":
        return "Transfer Bank";
      case "qris":
        return "QRIS";
      case "cod":
        return "Bayar di Tempat";
      case "midtrans":
        return "Midtrans";
      default:
        return method || "-";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center w-fit">
            <Check className="w-3 h-3 mr-1" /> Selesai
          </span>
        );
      case "cancelled":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center w-fit">
            <X className="w-3 h-3 mr-1" /> Dibatalkan
          </span>
        );
      case "processing":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center w-fit">
            <Clock className="w-3 h-3 mr-1" /> Diproses
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold flex items-center w-fit">
            <Clock className="w-3 h-3 mr-1" /> Menunggu
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "settlement":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
            <Check className="w-3 h-3 inline mr-1" /> Lunas
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
            <Clock className="w-3 h-3 inline mr-1" /> Menunggu
          </span>
        );
      case "cancel":
      case "deny":
      case "expire":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
            <X className="w-3 h-3 inline mr-1" />{" "}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      case "refund":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            Refund
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900">Daftar Pesanan</h2>
        <div className="relative w-full sm:w-64">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pesanan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Pelanggan</th>
              <th className="p-4 font-medium">Produk</th>
              <th className="p-4 font-medium text-center">Jumlah</th>
              <th className="p-4 font-medium">Pembayaran</th>
              <th className="p-4 font-medium">Status Bayar</th>
              <th className="p-4 font-medium">Total</th>
              <th className="p-4 font-medium">Teknisi</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500">
                  Memuat data...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500">
                  Tidak ada pesanan ditemukan.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-4 text-sm font-medium text-slate-900">
                    #{order.id}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900">
                      {order.customer_name}
                    </div>
                    <div className="text-sm text-slate-500">{order.phone}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-700">
                    {order.product_name}
                  </td>
                  <td className="p-4 text-sm text-slate-700 text-center font-medium">
                    {order.total_quantity}
                  </td>
                  <td className="p-4 text-sm text-slate-700">
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                      {getPaymentMethodLabel(order.payment_method)}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {getPaymentStatusBadge(order.payment_status)}
                  </td>
                  <td className="p-4 text-sm font-semibold text-slate-900">
                    {formatRupiah(order.total_price || 0)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <UserCog className="w-4 h-4 text-slate-400" />
                      <select
                        className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={order.teknisi_id || ""}
                        onChange={(e) =>
                          assignTeknisi(order.id, e.target.value)
                        }
                        disabled={
                          order.status === "completed" ||
                          order.status === "cancelled"
                        }
                      >
                        <option value="">-- Belum Ditugaskan --</option>
                        {teknisiList.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="p-4">{getStatusBadge(order.status)}</td>
                  <td className="p-4 text-right space-x-2">
                    {(order.status === "pending" ||
                      order.status === "processing") && (
                      <>
                        <button
                          onClick={() => updateStatus(order.id, "completed")}
                          className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Tandai Selesai"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateStatus(order.id, "cancelled")}
                          className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                          title="Batalkan"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="lg:hidden divide-y divide-slate-200">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat data...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Tidak ada pesanan ditemukan.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    #{order.id}
                  </div>
                  <div className="text-sm text-slate-500">
                    {order.customer_name} — {order.phone}
                  </div>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="text-sm text-slate-700 mb-2">
                <span className="font-medium">Produk:</span>{" "}
                {order.product_name}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="text-slate-500">Jumlah:</span>{" "}
                  <span className="font-medium">{order.total_quantity}</span>
                </div>
                <div>
                  <span className="text-slate-500">Metode:</span>{" "}
                  <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                    {getPaymentMethodLabel(order.payment_method)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Pembayaran:</span>{" "}
                  {getPaymentStatusBadge(order.payment_status)}
                </div>
                <div>
                  <span className="text-slate-500">Total:</span>{" "}
                  <span className="font-semibold text-slate-900">
                    {formatRupiah(order.total_price || 0)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <UserCog className="w-4 h-4 text-slate-400" />
                <select
                  className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none flex-1"
                  value={order.teknisi_id || ""}
                  onChange={(e) => assignTeknisi(order.id, e.target.value)}
                  disabled={
                    order.status === "completed" || order.status === "cancelled"
                  }
                >
                  <option value="">-- Belum Ditugaskan --</option>
                  {teknisiList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                {(order.status === "pending" ||
                  order.status === "processing") && (
                  <>
                    <button
                      onClick={() => updateStatus(order.id, "completed")}
                      className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Tandai Selesai"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, "cancelled")}
                      className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                      title="Batalkan"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(order.id)}
                  className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
