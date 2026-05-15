import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, X, Wrench, Droplets, Gauge, Zap, Layers, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminServices({ token }: { token: string }) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', description: '', icon: 'wrench' });

  // Tier harga state
  const [tierServiceId, setTierServiceId] = useState<string | null>(null);
  const [tierServiceName, setTierServiceName] = useState('');
  const [tiers, setTiers] = useState<any[]>([]);
  const [tierLoading, setTierLoading] = useState(false);
  const [tierForm, setTierForm] = useState({ label: '', price: '', sort_order: '0' });
  const [editingTierId, setEditingTierId] = useState<number | null>(null);

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/services', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setServices(data.data);
    } catch { } finally { setLoading(false); }
  };

  const fetchTiers = async (serviceId: string) => {
    setTierLoading(true);
    try {
      const res = await fetch(`/api/admin/service-tiers/${serviceId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setTiers(data.data);
    } catch { } finally { setTierLoading(false); }
  };

  const openTierModal = (service: any) => {
    setTierServiceId(service.id.toString());
    setTierServiceName(service.name);
    setTiers([]);
    setTierForm({ label: '', price: '', sort_order: '0' });
    setEditingTierId(null);
    fetchTiers(service.id.toString());
  };

  const closeTierModal = () => {
    setTierServiceId(null);
    setTierServiceName('');
    setTiers([]);
    setEditingTierId(null);
  };

  const handleTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTierId) {
        await fetch(`/api/admin/service-tiers/${editingTierId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ label: tierForm.label, price: Number(tierForm.price), sort_order: Number(tierForm.sort_order) }),
        });
      } else {
        await fetch('/api/admin/service-tiers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ service_id: tierServiceId, label: tierForm.label, price: Number(tierForm.price), sort_order: Number(tierForm.sort_order) }),
        });
      }
      setTierForm({ label: '', price: '', sort_order: '0' });
      setEditingTierId(null);
      fetchTiers(tierServiceId!);
    } catch { }
  };

  const handleEditTier = (tier: any) => {
    setEditingTierId(tier.id);
    setTierForm({ label: tier.label, price: tier.price.toString(), sort_order: tier.sort_order.toString() });
  };

  const handleDeleteTier = async (id: number) => {
    if (!confirm('Hapus tier harga ini?')) return;
    await fetch(`/api/admin/service-tiers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchTiers(tierServiceId!);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus layanan ini?')) return;
    try {
      await fetch(`/api/admin/services/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchServices();
    } catch { }
  };

  const handleEdit = (service: any) => {
    setFormData({ name: service.name, price: service.price.toString(), description: service.description, icon: service.icon });
    setEditingId(service.id);
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/admin/services/${editingId}` : '/api/admin/services';
      const method = editingId ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      setShowAddModal(false);
      setEditingId(null);
      setFormData({ name: '', price: '', description: '', icon: 'wrench' });
      fetchServices();
    } catch { }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', description: '', icon: 'wrench' });
    setShowAddModal(true);
  };

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'droplets': return <Droplets className="w-5 h-5 text-slate-700" />;
      case 'gauge': return <Gauge className="w-5 h-5 text-slate-700" />;
      case 'wrench': return <Wrench className="w-5 h-5 text-slate-700" />;
      case 'zap': return <Zap className="w-5 h-5 text-slate-700" />;
      default: return <Wrench className="w-5 h-5 text-slate-700" />;
    }
  };

  const filteredServices = services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900">Kelola Layanan</h2>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Cari layanan..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800" />
            </div>
            <button onClick={openAddModal} className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center hover:bg-slate-800 transition-colors shrink-0">
              <Plus className="w-4 h-4 mr-2" /> Tambah
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Layanan</th>
                <th className="p-4 font-medium">Harga Mulai</th>
                <th className="p-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={3} className="p-8 text-center text-slate-500">Memuat data...</td></tr>
              ) : filteredServices.length === 0 ? (
                <tr><td colSpan={3} className="p-8 text-center text-slate-500">Tidak ada layanan ditemukan.</td></tr>
              ) : filteredServices.map(service => (
                <tr key={service.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mr-4 shrink-0">
                        {getIcon(service.icon)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{service.name}</div>
                        <div className="text-sm text-slate-500 line-clamp-1">{service.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-semibold text-slate-900">
                    {service.name.toLowerCase().includes('cuci')
                      ? <span className="text-emerald-600">Tier Harga</span>
                      : formatRupiah(service.price)}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {service.name.toLowerCase().includes('cuci') && (
                      <button onClick={() => openTierModal(service)}
                        className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title="Kelola Tier Harga">
                        <Layers className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleEdit(service)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(service.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tier Harga Modal */}
      {tierServiceId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Tier Harga — {tierServiceName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Harga berdasarkan ukuran / tipe AC</p>
              </div>
              <button onClick={closeTierModal} className="text-slate-400 hover:text-slate-900"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Form tambah/edit tier */}
              <form onSubmit={handleTierSubmit} className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
                <p className="text-sm font-semibold text-slate-700">{editingTierId ? 'Edit Tier' : 'Tambah Tier Baru'}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Label (mis: 1 PK, 2 PK)</label>
                    <input required type="text" placeholder="Contoh: 1 PK"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      value={tierForm.label} onChange={e => setTierForm({ ...tierForm, label: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Harga (Rp)</label>
                    <input required type="number" min="0" placeholder="90000"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      value={tierForm.price} onChange={e => setTierForm({ ...tierForm, price: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Urutan tampil</label>
                  <input type="number" min="0" placeholder="0"
                    className="w-32 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    value={tierForm.sort_order} onChange={e => setTierForm({ ...tierForm, sort_order: e.target.value })} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
                    {editingTierId ? 'Simpan Perubahan' : 'Tambah Tier'}
                  </button>
                  {editingTierId && (
                    <button type="button" onClick={() => { setEditingTierId(null); setTierForm({ label: '', price: '', sort_order: '0' }); }}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                      Batal
                    </button>
                  )}
                </div>
              </form>

              {/* Daftar tier */}
              {tierLoading ? (
                <p className="text-sm text-slate-500 text-center py-4">Memuat tier...</p>
              ) : tiers.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Belum ada tier harga. Tambahkan di atas.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tier yang Ada</p>
                  {tiers.map(tier => (
                    <div key={tier.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
                      <div>
                        <span className="font-semibold text-slate-800 text-sm">{tier.label}</span>
                        <span className="ml-3 text-sky-600 font-bold text-sm">{formatRupiah(tier.price)}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleEditTier(tier)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteTier(tier.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Layanan' : 'Tambah Layanan Baru'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Layanan</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Harga (Rp)
                  {formData.name.toLowerCase().includes('cuci') && (
                    <span className="ml-2 text-xs text-emerald-600 font-normal">— gunakan harga terkecil; tier harga dikelola terpisah</span>
                  )}
                </label>
                <input required type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ikon</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })}>
                  <option value="wrench">Wrench (Kunci Pas)</option>
                  <option value="droplets">Droplets (Air/Cuci)</option>
                  <option value="gauge">Gauge (Meteran/Freon)</option>
                  <option value="zap">Zap (Listrik/Modul)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                <textarea required rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Batal</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
