// src/pages/CustomerAdditionApproval.tsx
import React, { useState, useEffect } from 'react';
import { Check, X, Loader2, FileText } from 'lucide-react';

declare global {
  interface Window { snap: any; }
}

interface Props { token: string; }

export default function CustomerAdditionApproval({ token }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'view'|'choose-payment'|'done'>('view');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [outcome, setOutcome] = useState<'approved'|'rejected'|'pending'|null>(null);

  const fmt = (n: number) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);

  useEffect(() => {
    fetch(`/api/order-additions/token/${token}`)
      .then(r=>r.json())
      .then(d=>{ if(d.success) setData(d.data); })
      .finally(()=>setLoading(false));
  }, [token]);

  // Muat skrip Midtrans Snap (pakai popup embed, bukan redirect)
  useEffect(() => {
    const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
    const scriptUrl = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    if (document.querySelector(`script[src="${scriptUrl}"]`)) return;
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '');
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const handleApprove = async (payment_method: 'cash'|'online') => {
    if (!data) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const r = await fetch(`/api/order-additions/${data.id}/customer-response`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'approve', payment_method }),
      });
      const d = await r.json();
      if (!d.success) {
        setErrorMsg(d.message || 'Gagal memproses persetujuan.');
        setSubmitting(false);
        return;
      }

      if (payment_method === 'cash') {
        // Tunai langsung masuk invoice → tampilkan halaman terima kasih
        setOutcome('approved');
        setStep('done');
        setSubmitting(false);
        return;
      }

      // Online: buat transaksi lalu tampilkan popup Snap
      const pr = await fetch(`/api/order-additions/${data.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const pd = await pr.json();
      if (!pd.success || !pd.snapToken) {
        setErrorMsg(pd.message || 'Gagal membuat transaksi pembayaran.');
        setSubmitting(false);
        return;
      }

      const finalize = async (result?: any) => {
        // Verifikasi status ke server sebelum dianggap lunas
        const cr = await fetch(`/api/order-additions/${data.id}/confirm-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, midtransOrderId: result?.order_id || pd.midtransOrderId }),
        });
        const cd = await cr.json();
        setOutcome(cd.success && cd.status === 'paid' ? 'approved' : 'pending');
        setStep('done');
        setSubmitting(false);
      };

      if (window.snap && typeof window.snap.pay === 'function') {
        window.snap.pay(pd.snapToken, {
          onSuccess: (result: any) => finalize(result),
          onPending: (result: any) => finalize(result),
          onError: () => { setErrorMsg('Pembayaran gagal. Silakan coba lagi.'); setSubmitting(false); },
          onClose: () => { setSubmitting(false); },
        });
      } else if (pd.redirectUrl) {
        // Fallback: Snap belum termuat → redirect (finish URL sudah diset di server)
        window.location.href = pd.redirectUrl;
      } else {
        setErrorMsg('Komponen pembayaran belum siap. Muat ulang halaman.');
        setSubmitting(false);
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan. Silakan coba lagi.');
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!data) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const r = await fetch(`/api/order-additions/${data.id}/customer-response`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'reject' }),
      });
      const d = await r.json();
      if (!d.success) {
        setErrorMsg(d.message || 'Gagal memproses penolakan.');
        return;
      }
      setOutcome('rejected');
      setStep('done');
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-slate-500">Link tidak valid atau sudah kadaluarsa.</p>
      </div>
    </div>
  );

  if (step === 'done') return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-sm border border-slate-100">
        <Check className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Terima kasih!</h2>
        {outcome === 'approved' ? (
          <>
            <p className="text-slate-500 text-sm mb-6">
              Pembayaran Anda telah kami terima. Invoice untuk penambahan ini sudah tersedia.
            </p>
            <a
              href={`/invoice/${token}`}
              className="inline-flex items-center justify-center gap-2 w-full bg-sky-500 text-white py-3 rounded-xl font-semibold hover:bg-sky-600 transition-colors"
            >
              <FileText className="w-5 h-5" /> Lihat Invoice
            </a>
          </>
        ) : outcome === 'pending' ? (
          <p className="text-slate-500 text-sm">
            Pembayaran Anda sedang diproses. Invoice akan otomatis tersedia setelah pembayaran dikonfirmasi.
          </p>
        ) : (
          <p className="text-slate-500 text-sm">Respons Anda telah diterima. Tim kami akan segera menindaklanjuti.</p>
        )}
      </div>
    </div>
  );

  const alreadyActed = !['pending_customer'].includes(data.status);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-full font-bold mb-3">
            ❄ HDB Airconds
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Persetujuan Penambahan</h1>
          <p className="text-slate-500 text-sm mt-1">Order #{data.order_id} — {data.customer_name}</p>
        </div>

        {alreadyActed && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-700 text-center">
            Anda sudah memberikan respons untuk pengajuan ini.
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
          <h3 className="font-semibold text-slate-700 mb-3">Rincian Penambahan</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-slate-400 text-left border-b border-slate-100">
              <th className="pb-2">Item</th><th className="pb-2 text-right">Qty</th><th className="pb-2 text-right">Total</th>
            </tr></thead>
            <tbody>
              {(data.items||[]).map((it: any, i: number) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2 font-medium text-slate-800">{it.name}</td>
                  <td className="py-2 text-right text-slate-500">{it.quantity} {it.unit}</td>
                  <td className="py-2 text-right font-semibold text-sky-600">{fmt(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-100">
            <span className="font-semibold text-slate-700">Total Tambahan</span>
            <span className="text-xl font-bold text-sky-600">{fmt(data.total)}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-600 text-center">
            {errorMsg}
          </div>
        )}

        {!alreadyActed && step === 'view' && (
          <div className="flex gap-3">
            <button onClick={handleReject} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-red-200 text-red-600 py-3.5 rounded-xl font-semibold hover:bg-red-50 transition-colors disabled:opacity-50">
              <X className="w-5 h-5" /> Tolak
            </button>
            <button onClick={() => setStep('choose-payment')} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-sky-500 text-white py-3.5 rounded-xl font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50">
              <Check className="w-5 h-5" /> Setuju
            </button>
          </div>
        )}

        {!alreadyActed && step === 'choose-payment' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Pilih Metode Pembayaran</h3>
            <div className="space-y-3">
              <button onClick={() => handleApprove('cash')} disabled={submitting}
                className="w-full flex items-center gap-3 border-2 border-slate-200 rounded-xl p-4 hover:border-sky-400 hover:bg-sky-50 transition-colors text-left disabled:opacity-50">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">💵</div>
                <div><p className="font-semibold text-slate-800">Tunai (Cash)</p><p className="text-slate-500 text-sm">Bayar langsung ke teknisi di lokasi</p></div>
              </button>
              <button onClick={() => handleApprove('online')} disabled={submitting}
                className="w-full flex items-center gap-3 border-2 border-slate-200 rounded-xl p-4 hover:border-sky-400 hover:bg-sky-50 transition-colors text-left disabled:opacity-50">
                <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center text-xl">💳</div>
                <div><p className="font-semibold text-slate-800">Transfer / Online</p><p className="text-slate-500 text-sm">Bayar via Midtrans (transfer, e-wallet, dll)</p></div>
              </button>
            </div>
            <button onClick={() => setStep('view')} className="mt-3 w-full text-slate-400 text-sm hover:text-slate-600">← Kembali</button>
          </div>
        )}
      </div>
    </div>
  );
}
