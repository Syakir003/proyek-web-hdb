import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, X, Wrench, Droplets, Gauge, Zap } from 'lucide-react';

export default function AdminServices({ token }: { token: string }) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '', price: '', description: '', icon: 'wrench'
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setServices(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch services', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus layanan ini?')) return;
    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchServices();
    } catch (error) {
      console.error('Failed to delete service', error);
    }
  };

  const handleEdit = (service: any) => {
    setFormData({
      name: service.name,
      price: service.price.toString(),
      description: service.description,
      icon: service.icon
    });
    setEditingId(service.id);
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/admin/services/${editingId}` : '/api/admin/services';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowAddModal(false);
        setEditingId(null);
        setFormData({ name: '', price: '', description: '', icon: 'wrench' });
        fetchServices();
      }
    } catch (error) {
      console.error('Failed to save service', error);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', description: '', icon: 'wrench' });
    setShowAddModal(true);
  };

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  };

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900">Kelola Layanan</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari layanan..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>
          <button 
            onClick={openAddModal}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center hover:bg-slate-800 transition-colors shrink-0"
          >
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
            ) : (
              filteredServices.map((service) => (
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
                  <td className="p-4 text-sm font-semibold text-slate-900">{formatRupiah(service.price)}</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleEdit(service)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(service.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Layanan' : 'Tambah Layanan Baru'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900"><X className="w-6 h-6"/></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Layanan</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Harga (Rp)</label>
                <input required type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ikon</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})}>
                  <option value="wrench">Wrench (Kunci Pas)</option>
                  <option value="droplets">Droplets (Air/Cuci)</option>
                  <option value="gauge">Gauge (Meteran/Freon)</option>
                  <option value="zap">Zap (Listrik/Modul)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                <textarea required rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
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
