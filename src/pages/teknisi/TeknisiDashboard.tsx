import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar, MapPin, Phone, User, CheckCircle, Clock,
  RefreshCw, Wrench, MessageSquare, Camera, ImagePlus, Plus,
} from 'lucide-react';
import OrderAdditionForm from '../../components/OrderAdditionForm';

interface Schedule {
  id: string;
  product_name: string;
  customer_name: string;
  phone: string;
  address: string;
  notes?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
}

interface OrderPhoto {
  id: number;
  photo_type: 'before' | 'after';
  image: string;
  created_at: string;
}

// ── Komponen foto didefinisikan di luar agar tidak di-reset tiap render ──
interface PhotoSlotProps {
  orderId: string;
  type: 'before' | 'after';
  photos: OrderPhoto[];
  isUploading: boolean;
  onUpload: (file: File) => void;
}

function PhotoSlot({ type, photos, isUploading, onUpload }: PhotoSlotProps) {
  const isBefore = type === 'before';
  const label = isBefore ? 'Sebelum Service' : 'Sesudah Service';
  const borderColor = isBefore
    ? 'border-amber-200 hover:border-amber-400 hover:bg-amber-50'
    : 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50';
  const iconColor = isBefore ? 'text-amber-400' : 'text-emerald-400';
  const textColor = isBefore ? 'text-amber-500' : 'text-emerald-500';
  const labelColor = isBefore ? 'text-amber-700' : 'text-emerald-700';

  return (
    <div>
      <p className={`text-xs font-bold mb-1.5 ${labelColor}`}>{label}</p>
      <div className="space-y-1.5">
        {photos.map((photo) => (
          <img
            key={photo.id}
            src={photo.image}
            alt={label}
            className="w-full h-28 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => window.open(photo.image, '_blank')}
          />
        ))}
        <label
          className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isUploading ? 'border-slate-200 bg-slate-50 cursor-not-allowed' : borderColor
          }`}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = '';
            }}
          />
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ImagePlus className={`w-5 h-5 mb-0.5 ${iconColor}`} />
              <span className={`text-xs ${textColor}`}>
                {photos.length > 0 ? '+ Tambah' : 'Upload Foto'}
              </span>
            </>
          )}
        </label>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function TeknisiDashboard({
  token,
  onLogout,
}: {
  token: string;
  onLogout: () => void;
}) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [orderPhotos, setOrderPhotos] = useState<Record<string, OrderPhoto[]>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState<Record<string, boolean>>({});
  const [showAddForm, setShowAddForm] = useState<string | null>(null); // orderId
  const [myAdditions, setMyAdditions] = useState<any[]>([]);
  const [revisingId, setRevisingId] = useState<string | null>(null); // addition id being revised

  const isFetchingRef = useRef(false);
  const pendingUpdateRef = useRef<string | null>(null);

  const fetchMyAdditions = useCallback(async () => {
    try {
      const r = await fetch('/api/order-additions/my', { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setMyAdditions(d.data);
    } catch {}
  }, [token]);

  const fetchPhotos = useCallback(async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/photos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrderPhotos((prev) => ({ ...prev, [orderId]: data.data }));
      }
    } catch {}
  }, [token]);

  const fetchSchedules = useCallback(async (isRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/teknisi/jadwal', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSchedules(data.data);
        data.data.forEach((s: Schedule) => fetchPhotos(s.id));
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
  }, [token, fetchPhotos]);

  useEffect(() => {
    fetchSchedules();
    fetchMyAdditions();
    const handleFocus = () => fetchSchedules(true);
    window.addEventListener('focus', handleFocus);
    const intervalId = setInterval(() => {
      if (!pendingUpdateRef.current) fetchSchedules(true);
    }, 30000);
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    pendingUpdateRef.current = id;

    const oldSchedules = schedules;
    setSchedules(schedules.map((s) =>
      s.id === id ? { ...s, status: newStatus as Schedule['status'] } : s,
    ));

    try {
      const res = await fetch(`/api/teknisi/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSchedules(oldSchedules);
        alert(data.error || 'Gagal memperbarui status');
        pendingUpdateRef.current = null;
        setUpdatingId(null);
      } else {
        setTimeout(() => {
          fetchSchedules(true);
          pendingUpdateRef.current = null;
          setUpdatingId(null);
        }, 1500);
      }
    } catch {
      setSchedules(oldSchedules);
      alert('Gagal memperbarui status');
      pendingUpdateRef.current = null;
      setUpdatingId(null);
    }
  };

  const uploadPhoto = useCallback(
    async (orderId: string, type: 'before' | 'after', file: File) => {
      const key = `${orderId}-${type}`;
      setUploadingPhoto((prev) => ({ ...prev, [key]: true }));

      const formData = new FormData();
      formData.append('photo', file);
      formData.append('type', type);

      try {
        const res = await fetch(`/api/teknisi/orders/${orderId}/photos`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          await fetchPhotos(orderId);
        } else {
          alert(data.error || 'Gagal upload foto');
        }
      } catch {
        alert('Gagal upload foto, periksa koneksi internet');
      } finally {
        setUploadingPhoto((prev) => ({ ...prev, [key]: false }));
      }
    },
    [token, fetchPhotos],
  );

  const ADDITION_STATUS: Record<string, { label: string; cls: string }> = {
    pending_admin:       { label: 'Menunggu Admin',    cls: 'bg-amber-100 text-amber-700' },
    admin_approved:      { label: 'Admin Setuju',       cls: 'bg-blue-100 text-blue-700' },
    admin_rejected:      { label: 'Ditolak Admin',      cls: 'bg-red-100 text-red-700' },
    pending_customer:    { label: 'Menunggu Customer',  cls: 'bg-amber-100 text-amber-700' },
    customer_approved:   { label: 'Customer Setuju',    cls: 'bg-blue-100 text-blue-700' },
    customer_rejected:   { label: 'Ditolak Customer',   cls: 'bg-red-100 text-red-700' },
    paid:                { label: 'Lunas',              cls: 'bg-emerald-100 text-emerald-700' },
    cancelled:           { label: 'Dibatalkan',         cls: 'bg-slate-100 text-slate-500' },
  };

  const handleAdditionAction = async (additionId: number, action: 'escalate' | 'cancel') => {
    const confirmMsg = action === 'cancel' ? 'Batalkan pengajuan ini?' : 'Eskalasi ke admin?';
    if (!confirm(confirmMsg)) return;
    const r = await fetch(`/api/order-additions/${additionId}/${action}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    if (d.success) fetchMyAdditions();
    else alert(d.message || 'Gagal');
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

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
      {/* Header */}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => fetchSchedules()} className="text-sm font-medium underline hover:no-underline">
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
            {schedules.map((schedule) => {
              const photos = orderPhotos[schedule.id] || [];
              return (
                <div
                  key={schedule.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col"
                >
                  <div className="p-6 grow">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      {getStatusBadge(schedule.status)}
                      <span className="text-xs text-slate-400">
                        {new Date(schedule.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-4">
                      {schedule.product_name}
                    </h3>

                    {/* Info pelanggan */}
                    <div className="space-y-2.5">
                      <div className="flex items-start">
                        <User className="w-4 h-4 text-slate-400 mr-2 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-600">{schedule.customer_name}</span>
                      </div>
                      <div className="flex items-start">
                        <Phone className="w-4 h-4 text-slate-400 mr-2 mt-0.5 shrink-0" />
                        <a href={`tel:${schedule.phone}`} className="text-sm text-blue-600 hover:underline">
                          {schedule.phone}
                        </a>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 text-slate-400 mr-2 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-600 line-clamp-2">{schedule.address}</span>
                      </div>

                      {/* Keluhan */}
                      {schedule.notes && (
                        <div className="flex items-start pt-2.5 mt-1 border-t border-amber-100">
                          <MessageSquare className="w-4 h-4 text-amber-500 mr-2 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-xs font-bold text-amber-700 block mb-0.5">
                              Keluhan Pelanggan
                            </span>
                            <span className="text-sm text-slate-700">{schedule.notes}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dokumentasi Foto */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-slate-500" />
                        Dokumentasi Foto
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <PhotoSlot
                          orderId={schedule.id}
                          type="before"
                          photos={photos.filter((p) => p.photo_type === 'before')}
                          isUploading={!!uploadingPhoto[`${schedule.id}-before`]}
                          onUpload={(file) => uploadPhoto(schedule.id, 'before', file)}
                        />
                        <PhotoSlot
                          orderId={schedule.id}
                          type="after"
                          photos={photos.filter((p) => p.photo_type === 'after')}
                          isUploading={!!uploadingPhoto[`${schedule.id}-after`]}
                          onUpload={(file) => uploadPhoto(schedule.id, 'after', file)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3 flex-col">
                    <div className="flex gap-3">
                      {schedule.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(schedule.id, 'processing')}
                          disabled={updatingId === schedule.id}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {updatingId === schedule.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <><Clock className="w-4 h-4 mr-2" /> Mulai Proses</>
                          )}
                        </button>
                      )}
                      {schedule.status === 'processing' && (
                        <button
                          onClick={() => updateStatus(schedule.id, 'completed')}
                          disabled={updatingId === schedule.id}
                          className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {updatingId === schedule.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <><CheckCircle className="w-4 h-4 mr-2" /> Selesai</>
                          )}
                        </button>
                      )}
                    </div>
                    {schedule.status === 'processing' && (
                      <button
                        onClick={() => setShowAddForm(prev => prev === schedule.id ? null : schedule.id)}
                        className="flex items-center gap-1.5 text-sm font-medium text-sky-600 border border-sky-200 px-3 py-1.5 rounded-xl hover:bg-sky-50 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {showAddForm === schedule.id ? 'Tutup' : 'Tambah Material/Jasa'}
                      </button>
                    )}
                    {showAddForm === schedule.id && (
                      <div className="mt-3">
                        <OrderAdditionForm
                          orderId={schedule.id}
                          token={token}
                          onSuccess={() => { setShowAddForm(null); fetchMyAdditions(); }}
                          onCancel={() => setShowAddForm(null)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* Riwayat Penambahan */}
        {myAdditions.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Riwayat Penambahan</h2>
            <div className="space-y-3">
              {myAdditions.map((add: any) => {
                const st = ADDITION_STATUS[add.status] ?? { label: add.status, cls: 'bg-slate-100 text-slate-500' };
                const isCustomerRejected = add.status === 'customer_rejected';
                return (
                  <div key={add.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Order #{add.order_id}
                          {add.customer_name && <span className="font-normal text-slate-500"> — {add.customer_name}</span>}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(add.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        {add.admin_notes && (
                          <p className="text-xs text-slate-600 mt-1 italic">Catatan admin: {add.admin_notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-sky-600">{fmt(Number(add.total))}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${st.cls}`}>{st.label}</span>
                      </div>
                    </div>

                    {isCustomerRejected && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => setRevisingId(prev => prev === String(add.id) ? null : String(add.id))}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-sky-200 text-sky-600 hover:bg-sky-50"
                        >
                          {revisingId === String(add.id) ? 'Tutup Revisi' : 'Revisi'}
                        </button>
                        <button
                          onClick={() => handleAdditionAction(add.id, 'escalate')}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50"
                        >
                          Eskalasi ke Admin
                        </button>
                        <button
                          onClick={() => handleAdditionAction(add.id, 'cancel')}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Batalkan
                        </button>
                      </div>
                    )}

                    {revisingId === String(add.id) && (
                      <div className="mt-3">
                        <OrderAdditionForm
                          orderId={add.order_id}
                          token={token}
                          revisionAdditionId={String(add.id)}
                          onSuccess={() => { setRevisingId(null); fetchMyAdditions(); }}
                          onCancel={() => setRevisingId(null)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
