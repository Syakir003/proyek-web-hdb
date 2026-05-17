// src/pages/admin/AdminMaterialCatalog.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight, X, Check } from 'lucide-react';

interface Item {
  id: number; name: string; unit: string;
  price: number; category: string; is_active: boolean;
}
const EMPTY: Omit<Item,'id'|'is_active'> = { name:'', unit:'pcs', price:0, category:'' };

export default function AdminMaterialCatalog({ token }: { token: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [modal, setModal] = useState<{ open: boolean; editing: Item | null }>({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchItems = async () => {
    setLoading(true);
    const r = await fetch('/api/material-catalog', { headers });
    const d = await r.json();
    if (d.success) setItems(d.data);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, editing: null }); };
  const openEdit = (item: Item) => {
    setForm({ name: item.name, unit: item.unit, price: item.price, category: item.category });
    setModal({ open: true, editing: item });
  };

  const save = async () => {
    if (!form.name || !form.unit || !form.price) return alert('Nama, satuan, dan harga wajib diisi');
    const method = modal.editing ? 'PUT' : 'POST';
    const url = modal.editing ? `/api/material-catalog/${modal.editing.id}` : '/api/material-catalog';
    await fetch(url, { method, headers, body: JSON.stringify(form) });
    setModal({ open: false, editing: null });
    fetchItems();
  };

  const toggle = async (id: number) => {
    await fetch(`/api/material-catalog/${id}/toggle`, { method: 'PATCH', headers });
    fetchItems();
  };

  const formatRp = (n: number) => new Intl.NumberFormat('id-ID',{ style:'currency', currency:'IDR', maximumFractionDigits:0 }).format(n);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Katalog Material & Sparepart</h2>
        <button onClick={openAdd} className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-sky-600 transition-colors">
          <Plus className="w-4 h-4" /> Tambah Item
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Memuat...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Nama', 'Kategori', 'Satuan', 'Harga', 'Status', 'Aksi'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                  <td className="px-4 py-3 text-slate-500">{item.category || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                  <td className="px-4 py-3 font-semibold text-sky-600">{formatRp(item.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${item.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggle(item.id)} className={`p-1.5 rounded-lg transition-colors ${item.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}>
                        {item.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && <div className="text-center py-12 text-slate-400">Belum ada item</div>}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">{modal.editing ? 'Edit Item' : 'Tambah Item'}</h3>
              <button onClick={() => setModal({ open: false, editing: null })} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Nama Material', key: 'name', type: 'text', placeholder: 'Pipa AC 1/4"' },
                { label: 'Kategori', key: 'category', type: 'text', placeholder: 'Pipa, Freon, Bracket...' },
                { label: 'Satuan', key: 'unit', type: 'text', placeholder: 'meter, pcs, roll' },
                { label: 'Harga Satuan (Rp)', key: 'price', type: 'number', placeholder: '50000' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-400"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal({ open: false, editing: null })} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl font-medium hover:bg-slate-50">Batal</button>
              <button onClick={save} className="flex-1 bg-sky-500 text-white py-2.5 rounded-xl font-medium hover:bg-sky-600 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
