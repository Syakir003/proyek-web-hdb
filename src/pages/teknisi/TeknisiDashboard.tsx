import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, MapPin, Phone, User, CheckCircle, Clock, RefreshCw, Wrench } from 'lucide-react';

interface Schedule {
  id: string;
  product_name: string;
  customer_name: string;
  phone: string;
  address: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
}

export default function TeknisiDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 🔥 LOCK biar gak spam request
  const isFetchingRef = useRef(false);
  // 🔥 Track pending update untuk skip auto-refresh
  const pendingUpdateRef = useRef<string | null>(null);

  const fetchSchedules = useCallback(async (isRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError('');

    try {
      const response = await fetch('/api/teknisi/jadwal', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSchedules(data.data);
      } else {
        setError(data.error || 'Gagal memuat jadwal');
      }
    } catch {
      setError('Gagal memuat jadwal service');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [token]);

  // 🔥 FIX: jangan pakai dependency function (biar gak loop aneh)
  useEffect(() => {
    fetchSchedules();

    // Auto-refresh saat user kembali ke tab ini
    const handleFocus = () => {
      console.log('🔄 Tab focused - refreshing jadwal');
      fetchSchedules(true);
    };

    window.addEventListener('focus', handleFocus);

    // Periodic refresh setiap 30 detik untuk detect perubahan dari admin
    // Skip jika ada update status yang pending (check via ref, bukan state)
    const intervalId = setInterval(() => {
      if (!pendingUpdateRef.current) {
        fetchSchedules(true);
      }
    }, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, []); // penting: kosong

  const updateStatus = async (id: string, newStatus: string) => {
    console.log('🔄 updateStatus called:', { id, newStatus });
    
    setUpdatingId(id);
    pendingUpdateRef.current = id; // 🔥 Track pending update

    // 🎯 Optimistic update - langsung ubah state sebelum server response
    const oldSchedules = schedules;
    const updatedSchedules = schedules.map(s => 
      s.id === id ? { ...s, status: newStatus as Schedule['status'] } : s
    );
    
    console.log('✅ Optimistic update applied');
    setSchedules(updatedSchedules);

    try {
      const response = await fetch(`/api/teknisi/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      console.log('📡 Server response:', { status: response.status, data });

      if (!response.ok || !data.success) {
        console.error('❌ Server rejected:', data.error);
        setSchedules(oldSchedules);
        alert(data.error || 'Gagal memperbarui status');
        // Clear pending update jika gagal
        pendingUpdateRef.current = null;
        setUpdatingId(null);
      } else {
        console.log('✨ Status updated successfully');
        // Delay lebih lama (1.5 detik) untuk memastikan database ter-update
        setTimeout(() => {
          console.log('🔄 Refreshing jadwal after delay...');
          fetchSchedules(true);
          // Clear pending update setelah fetch selesai
          pendingUpdateRef.current = null;
          setUpdatingId(null);
        }, 1500);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setSchedules(oldSchedules);
      alert('Gagal memperbarui status');
      // Clear pending update jika error
      pendingUpdateRef.current = null;
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: Schedule['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Menunggu</span>;
      case 'processing':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Diproses</span>;
      case 'completed':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Selesai</span>;
      case 'cancelled':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Dibatalkan</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Wrench className="w-6 h-6 text-blue-600 mr-2" />
              <span className="font-bold text-xl text-slate-900">Dashboard Teknisi</span>
            </div>
            <button
              onClick={onLogout}
              className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Jadwal Service</h1>
            <p className="text-slate-500">Daftar pekerjaan yang perlu diselesaikan.</p>
          </div>
          <button
            onClick={() => fetchSchedules(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => fetchSchedules()}
              className="text-sm font-medium underline hover:no-underline"
            >
              Coba lagi
            </button>
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Tidak Ada Jadwal</h3>
            <p className="text-slate-500">Belum ada jadwal service yang ditugaskan.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col"
              >
                <div className="p-6 grow">
                  <div className="flex justify-between items-start mb-4">
                    {getStatusBadge(schedule.status)}
                    <span className="text-xs text-slate-400">
                      {new Date(schedule.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-4">{schedule.product_name}</h3>

                  <div className="space-y-3">
                    <div className="flex items-start">
                      <User className="w-4 h-4 text-slate-400 mr-2 mt-0.5 shrink-0" />
                      <span className="text-sm text-slate-600">{schedule.customer_name}</span>
                    </div>
                    <div className="flex items-start">
                      <Phone className="w-4 h-4 text-slate-400 mr-2 mt-0.5 shrink-0" />
                      <a
                        href={`tel:${schedule.phone}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {schedule.phone}
                      </a>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 text-slate-400 mr-2 mt-0.5 shrink-0" />
                      <span className="text-sm text-slate-600 line-clamp-2">{schedule.address}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3">
                  {schedule.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(schedule.id, 'processing')}
                      disabled={updatingId === schedule.id}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {updatingId === schedule.id
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><Clock className="w-4 h-4 mr-2" /> Mulai Proses</>
                      }
                    </button>
                  )}
                  {schedule.status === 'processing' && (
                    <button
                      onClick={() => updateStatus(schedule.id, 'completed')}
                      disabled={updatingId === schedule.id}
                      className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {updatingId === schedule.id
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><CheckCircle className="w-4 h-4 mr-2" /> Selesai</>
                      }
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}