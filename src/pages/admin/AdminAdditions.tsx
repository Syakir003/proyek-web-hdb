// src/pages/admin/AdminAdditions.tsx
import React, { useState, useEffect } from 'react';
import { Check, X, Send, ExternalLink, RefreshCw } from 'lucide-react';
import { OrderAddition } from '../../types/additions';

// Base URL untuk link yang dikirim ke customer. Default ke domain produksi
// supaya link approval TIDAK pernah jadi localhost walau admin membukanya dari
// localhost saat testing. Override lewat VITE_PUBLIC_URL kalau perlu.
const PUBLIC_BASE_URL = (import.meta as any).env?.VITE_PUBLIC_URL || 'https://www.hdbairconds.id';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending_admin:      { label: 'Menunggu Review', color: 'bg-amber-50 text-amber-600' },
  admin_approved:     { label: 'Disetujui Admin', color: 'bg-sky-50 text-sky-600' },
  admin_rejected:     { label: 'Ditolak Admin', color: 'bg-red-50 text-red-600' },
  pending_customer:   { label: 'Menunggu Customer', color: 'bg-blue-50 text-blue-600' },
  customer_approved:  { label: 'Disetujui Customer', color: 'bg-teal-50 text-teal-600' },
  customer_rejected:  { label: 'Ditolak Customer', color: 'bg-orange-50 text-orange-600' },
  paid:               { label: 'Lunas', color: 'bg-emerald-50 text-emerald-600' },
  cancelled:          { label: 'Dibatalkan', color: 'bg-slate-100 text-slate-400' },
};

export default function AdminAdditions({ token }: { token: string }) {
  const [additions, setAdditions] = useState<OrderAddition[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [reviewModal, setReviewModal] = useState<{ open: boolean; id: number | null; action: 'approve'|'reject' }>({ open: false, id: null, action: 'approve' });
  const [adminNotes, setAdminNotes] = useState('');
  const [waLink, setWaLink] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const fmt = (n: number) => new Intl.NumberFormat('id-ID',{ style:'currency',currency:'IDR',maximumFractionDigits:0 }).format(n);

  const fetchAdditions = async () => {
    setLoading(true);
    const r = await fetch('/api/order-additions', { headers });
    const d = await r.json();
    if (d.success) setAdditions(d.data);
    setLoading(false);
  };

  useEffect(() => { fetchAdditions(); }, []);

  const submitReview = async () => {
    if (!reviewModal.id) return;
    const r = await fetch(`/api/order-additions/${reviewModal.id}/admin-review`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ action: reviewModal.action, admin_notes: adminNotes }),
    });
    const d = await r.json();
    if (d.success && d.waLink) setWaLink(d.waLink);
    setReviewModal({ open: false, id: null, action: 'approve' });
    setAdminNotes('');
    fetchAdditions();
  };

  const sendInvoice = async (id: number) => {
    const r = await fetch(`/api/order-additions/${id}/send-invoice`, { method: 'POST', headers });
    const d = await r.json();
    if (d.success) {
      setWaLink(d.waLink);
      fetchAdditions();
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Penambahan Material & Jasa</h2>
        <button onClick={fetchAdditions} className="flex items-center gap-2 text-slate-500 hover:text-sky-600 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* WA Link Banner */}
      {waLink && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-emerald-700 text-sm font-medium">Link WA siap dikirim ke customer</span>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-600">
            <ExternalLink className="w-3.5 h-3.5" /> Buka WA
          </a>
        </div>
      )}

      {loading ? <div className="text-center py-16 text-slate-400">Memuat...</div> : (
        <div className="space-y-4">
          {!additions.length && <div className="text-center py-16 text-slate-400">Belum ada penambahan</div>}
          {additions.map(add => {
            const st = STATUS_LABEL[add.status] || { label: add.status, color: 'bg-slate-100 text-slate-500' };
            const isExpanded = expanded === add.id;
            return (
              <div key={add.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(isExpanded ? null : add.id)}>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${st.color}`}>{st.label}</span>
                    <span className="font-semibold text-slate-800">{add.customer_name}</span>
                    <span className="text-slate-400 text-sm">Order #{add.order_id}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sky-600">{fmt(add.total ?? 0)}</span>
                    <span className="text-slate-400 text-xs">{new Date(add.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4">
                    <table className="w-full text-sm mb-4">
                      <thead><tr className="text-slate-500 text-left">{['Item','Tipe','Qty','Satuan','Harga','Subtotal'].map(h=><th key={h} className="pb-2 pr-4">{h}</th>)}</tr></thead>
                      <tbody>
                        {(add.items||[]).map((it,i) => (
                          <tr key={i} className="border-t border-slate-50">
                            <td className="py-1.5 pr-4 font-medium">{it.name}</td>
                            <td className="pr-4"><span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{it.item_type}</span></td>
                            <td className="pr-4">{it.quantity}</td>
                            <td className="pr-4 text-slate-500">{it.unit}</td>
                            <td className="pr-4">{fmt(it.unit_price)}</td>
                            <td className="font-semibold text-sky-600">{fmt(it.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {add.admin_notes && <p className="text-sm text-slate-500 mb-3">Catatan: {add.admin_notes}</p>}
                    <div className="flex gap-2 flex-wrap">
                      {add.status === 'pending_admin' && (<>
                        <button onClick={() => { setReviewModal({ open:true, id:add.id, action:'approve' }); setAdminNotes(''); }} className="flex items-center gap-1.5 bg-sky-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-sky-600">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => { setReviewModal({ open:true, id:add.id, action:'reject' }); setAdminNotes(''); }} className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100">
                          <X className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </>)}
                      {add.status === 'pending_customer' && add.customer_token && (
                        <a href={`https://wa.me/?text=${encodeURIComponent(`Link persetujuan: ${PUBLIC_BASE_URL}/tambahan/${add.customer_token}`)}`}
                           target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-100">
                          <Send className="w-3.5 h-3.5" /> Kirim Ulang Link
                        </a>
                      )}
                      {add.status === 'paid' && !add.invoice_sent_at && (
                        <button onClick={() => sendInvoice(add.id)} className="flex items-center gap-1.5 bg-sky-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-sky-600">
                          <Send className="w-3.5 h-3.5" /> Kirim Invoice
                        </button>
                      )}
                      {add.invoice_number && (
                        <a href={`/invoice/${add.customer_token}`} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1.5 text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50">
                          <ExternalLink className="w-3.5 h-3.5" /> Lihat Invoice {add.invoice_number}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4">
              {reviewModal.action === 'approve' ? 'Approve Penambahan' : 'Tolak Penambahan'}
            </h3>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan (opsional)</label>
            <textarea value={adminNotes} onChange={e=>setAdminNotes(e.target.value)} rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-sky-400 mb-4"
              placeholder="Catatan untuk teknisi/customer..." />
            <div className="flex gap-3">
              <button onClick={() => setReviewModal({ open:false, id:null, action:'approve' })} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
              <button onClick={submitReview} className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white ${reviewModal.action==='approve' ? 'bg-sky-500 hover:bg-sky-600' : 'bg-red-500 hover:bg-red-600'}`}>
                {reviewModal.action === 'approve' ? 'Ya, Approve' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
