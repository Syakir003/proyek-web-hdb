import React, { useState, useEffect } from 'react';
import { Package, Clock, Check, X, RefreshCw } from 'lucide-react';

interface UserOrdersProps {
  token: string;
}

export default function UserOrders({ token }: UserOrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/user/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch user orders', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Auto-refresh setiap 5 detik untuk update status pembayaran (webhook/polling)
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const checkPaymentStatus = async (orderId: string) => {
    setCheckingStatus(orderId);
    try {
      const response = await fetch('/api/midtrans/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      });
      const data = await response.json();
      console.log('🔍 Check status result:', data);
      
      // Refresh orders after checking
      const ordersResponse = await fetch('/api/user/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const ordersData = await ordersResponse.json();
      if (ordersData.success) {
        setOrders(ordersData.data);
      }
    } catch (error) {
      console.error('Failed to check payment status', error);
    } finally {
      setCheckingStatus(null);
    }
  };

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center w-fit"><Check className="w-3 h-3 mr-1"/> Selesai</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center w-fit"><X className="w-3 h-3 mr-1"/> Dibatalkan</span>;
      case 'processing':
        return <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-semibold flex items-center w-fit"><Clock className="w-3 h-3 mr-1"/> Diproses</span>;
      default:
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold flex items-center w-fit"><Clock className="w-3 h-3 mr-1"/> Menunggu</span>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'settlement':
        return <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium"><Check className="w-3 h-3 inline mr-1"/> Lunas</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium"><Clock className="w-3 h-3 inline mr-1"/> Menunggu</span>;
      case 'cancel':
      case 'deny':
      case 'expire':
        return <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium"><X className="w-3 h-3 inline mr-1"/> {status.charAt(0).toUpperCase() + status.slice(1)}</span>;
      case 'refund':
        return <span className="px-2 py-1 bg-sky-50 text-sky-700 rounded text-xs font-medium">Refund</span>;
      default:
        return <span className="px-2 py-1 bg-slate-50 text-slate-700 rounded text-xs font-medium">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-sky-100 rounded-xl">
            <Package className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Pesanan Saya</h1>
            <p className="text-slate-500 text-sm mt-0.5">Riwayat dan status pemesanan Anda</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 text-sky-400 animate-spin" />
            Memuat pesanan...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Belum Ada Pesanan</h2>
            <p className="text-slate-500">Anda belum melakukan pemesanan apapun.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:border-sky-100 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-slate-100 gap-4">
                  <div>
                    <span className="text-sm font-semibold text-sky-600">Order #<span className="text-slate-700">{order.id}</span></span>
                    <p className="text-sm text-slate-500 mt-0.5">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status)}
                    {order.payment_status === 'pending' && (
                      <button
                        onClick={() => checkPaymentStatus(order.id)}
                        disabled={checkingStatus === order.id}
                        className="px-3 py-1 bg-sky-500 text-white rounded-full text-xs font-medium flex items-center hover:bg-sky-600 transition-colors disabled:opacity-50 shadow-sm"
                        title="Cek status pembayaran ke Midtrans"
                      >
                        <RefreshCw className={`w-3 h-3 mr-1 ${checkingStatus === order.id ? 'animate-spin' : ''}`} />
                        Cek Status
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{order.product_name}</h3>
                    <p className="text-sm text-slate-600 mb-1">Jumlah: <span className="font-medium">{order.quantity || 1} Barang</span></p>
                    <p className="text-sm text-slate-600 mb-2">Metode Pembayaran: <span className="font-medium uppercase">{order.payment_method.replace('_', ' ')}</span></p>
                    <div className="text-sm">
                      Status Pembayaran: {getPaymentStatusBadge(order.payment_status)}
                    </div>
                    {order.assigned_teknisi && (
                      <p className="text-sm text-sky-600 mt-2 font-medium">Teknisi Ditugaskan: {order.assigned_teknisi}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-slate-500 mb-1">Total Belanja</p>
                    <p className="font-bold text-xl text-sky-600">{formatRupiah(order.price)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

