import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Clock, Package, ArrowUpRight } from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
}

interface Order {
  id: number;
  product_name: string;
  customer_name: string;
  price: number;
  status: string;
  created_at: string;
}

export default function AdminDashboard({ token }: { token: string }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/orders', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();

      console.log('Stats Response:', statsData);
      console.log('Orders Response:', ordersData);
      
      if (statsData.success && statsData.data) {
        setStats({
          totalOrders: Number(statsData.data.totalOrders) || 0,
          totalRevenue: Number(statsData.data.totalRevenue) || 0,
          pendingOrders: Number(statsData.data.pendingOrders) || 0,
          totalProducts: Number(statsData.data.totalProducts) || 0,
        });
      } else {
        setError(statsData.error || 'Gagal memuat statistik');
      }

      if (ordersData.success && ordersData.data && Array.isArray(ordersData.data)) {
        const recentOrders = ordersData.data.slice(0, 5).map((order: any) => ({
          id: order.id,
          product_name: order.product_name || 'N/A',
          customer_name: order.customer_name,
          price: Number(order.price) || Number(order.total_price) || 0,
          status: order.status,
          created_at: order.created_at,
        }));
        setRecentOrders(recentOrders);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>;
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>;

  const statCards = [
    { title: 'Total Pendapatan', value: formatRupiah(Number(stats?.totalRevenue) || 0), icon: <DollarSign className="w-6 h-6 text-emerald-600" />, bg: 'bg-emerald-100' },
    { title: 'Total Pesanan', value: stats?.totalOrders || 0, icon: <ShoppingBag className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-100' },
    { title: 'Pesanan Menunggu', value: stats?.pendingOrders || 0, icon: <Clock className="w-6 h-6 text-amber-600" />, bg: 'bg-amber-100' },
    { title: 'Total Produk', value: stats?.totalProducts || 0, icon: <Package className="w-6 h-6 text-indigo-600" />, bg: 'bg-indigo-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                {stat.icon}
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Aktivitas Terbaru</h3>
        </div>
        
        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-sm">
                  <th className="pb-3 font-medium">Pelanggan</th>
                  <th className="pb-3 font-medium">Produk</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-4 font-medium text-slate-900">{order.customer_name}</td>
                    <td className="py-4 text-slate-600">{order.product_name}</td>
                    <td className="py-4 font-medium text-slate-900">{formatRupiah(Number(order.price) || 0)}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {order.status === 'completed' ? 'Selesai' :
                         order.status === 'processing' ? 'Diproses' : 'Menunggu'}
                      </span>
                    </td>
                    <td className="py-4 text-slate-500">
                      {new Date(order.created_at).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>Belum ada aktivitas terbaru.</p>
          </div>
        )}
      </div>
    </div>
  );
}
