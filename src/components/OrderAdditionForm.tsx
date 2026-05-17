// src/components/OrderAdditionForm.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Send } from 'lucide-react';
import { MaterialCatalogItem, AdditionItemInput } from '../types/additions';

interface Props {
  orderId: string;
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function OrderAdditionForm({ orderId, token, onSuccess, onCancel }: Props) {
  const [catalog, setCatalog] = useState<MaterialCatalogItem[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [items, setItems] = useState<AdditionItemInput[]>([{ item_type: 'material', ref_id: '', quantity: 1 }]);
  const [submitting, setSubmitting] = useState(false);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch('/api/material-catalog', { headers }).then(r=>r.json()).then(d=>{ if(d.success) setCatalog(d.data); });
    fetch('/api/services').then(r=>r.json()).then(d=>{ if(d.success) setServices(d.data); });
  }, []);

  const addRow = () => setItems(prev => [...prev, { item_type: 'material', ref_id: '', quantity: 1 }]);
  const removeRow = (i: number) => setItems(prev => prev.filter((_,idx)=>idx!==i));
  const updateRow = (i: number, patch: Partial<AdditionItemInput>) =>
    setItems(prev => prev.map((r,idx) => idx===i ? { ...r, ...patch, ref_id: patch.item_type ? '' : r.ref_id } : r));

  const getOptions = (type: 'material'|'service') =>
    type === 'material' ? catalog : services;

  const getPrice = (type: 'material'|'service', refId: string): number => {
    const list = getOptions(type) as any[];
    return Number(list.find(i => String(i.id) === refId)?.price ?? 0);
  };

  const total = items.reduce((s, item) => s + getPrice(item.item_type, item.ref_id) * item.quantity, 0);
  const fmt = (n: number) => new Intl.NumberFormat('id-ID',{ style:'currency',currency:'IDR',maximumFractionDigits:0 }).format(n);

  const submit = async () => {
    if (items.some(i => !i.ref_id || i.quantity <= 0)) return alert('Semua item harus diisi');
    setSubmitting(true);
    const r = await fetch(`/api/orders/${orderId}/additions`, {
      method: 'POST', headers,
      body: JSON.stringify({ items }),
    });
    const d = await r.json();
    setSubmitting(false);
    if (d.success) onSuccess();
    else alert(d.message || 'Gagal mengirim pengajuan');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="font-bold text-slate-800 mb-4">Tambah Material / Jasa</h3>
      <div className="space-y-3 mb-4">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <select value={item.item_type} onChange={e=>updateRow(i,{item_type:e.target.value as any})}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-400">
              <option value="material">Material</option>
              <option value="service">Jasa</option>
            </select>
            <select value={item.ref_id} onChange={e=>updateRow(i,{ref_id:e.target.value})}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-400">
              <option value="">— Pilih {item.item_type === 'material' ? 'Material' : 'Jasa'} —</option>
              {getOptions(item.item_type).map((opt:any) => (
                <option key={opt.id} value={String(opt.id)}>
                  {opt.name} — {fmt(Number(opt.price))}{item.item_type==='material' ? `/${opt.unit}` : ''}
                </option>
              ))}
            </select>
            <input type="number" min={1} value={item.quantity} onChange={e=>updateRow(i,{quantity:Number(e.target.value)})}
              className="w-20 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-400" />
            <span className="py-2 text-sm font-semibold text-sky-600 w-28 text-right">
              {item.ref_id ? fmt(getPrice(item.item_type,item.ref_id)*item.quantity) : '—'}
            </span>
            {items.length > 1 && (
              <button onClick={()=>removeRow(i)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button onClick={addRow} className="flex items-center gap-1.5 text-sky-600 text-sm mb-5 hover:text-sky-700">
        <Plus className="w-4 h-4" /> Tambah baris
      </button>
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          <span className="text-slate-500 text-sm">Total: </span>
          <span className="font-bold text-sky-600 text-lg">{fmt(total)}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
          <button onClick={submit} disabled={submitting} className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-600 disabled:opacity-50">
            <Send className="w-4 h-4" /> {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
          </button>
        </div>
      </div>
    </div>
  );
}
