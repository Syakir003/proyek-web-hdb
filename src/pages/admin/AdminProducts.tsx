import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, X } from 'lucide-react';

export default function AdminProducts({ token }: { token: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '', brand: '', type: '', capacity: '', price: '', description: '', image: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchProducts();
    } catch (error) {
      console.error('Failed to delete product', error);
    }
  };

  const handleEdit = (product: any) => {
    setFormData({
      name: product.name,
      brand: product.brand,
      type: product.type,
      capacity: product.capacity,
      price: product.price.toString(),
      description: product.description,
      image: product.image
    });
    setEditingId(product.id);
    setImageFile(null);
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products';
      const method = editingId ? 'PUT' : 'POST';
      
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('brand', formData.brand);
      submitData.append('type', formData.type);
      submitData.append('capacity', formData.capacity);
      submitData.append('price', formData.price);
      submitData.append('description', formData.description);
      
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
        body: submitData
      });
      if (response.ok) {
        setShowAddModal(false);
        setEditingId(null);
        setImageFile(null);
        setFormData({ name: '', brand: '', type: '', capacity: '', price: '', description: '', image: '' });
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to save product', error);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setImageFile(null);
    setFormData({ name: '', brand: '', type: '', capacity: '', price: '', description: '', image: '' });
    setShowAddModal(true);
  };

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900">Kelola Produk</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari produk..." 
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
              <th className="p-4 font-medium">Produk</th>
              <th className="p-4 font-medium">Merk & Tipe</th>
              <th className="p-4 font-medium">Harga</th>
              <th className="p-4 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Memuat data...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Tidak ada produk ditemukan.</td></tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden mr-4 shrink-0">
                        <img src={product.image || 'https://via.placeholder.com/150'} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="font-medium text-slate-900 line-clamp-2">{product.name}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-900">{product.brand}</div>
                    <div className="text-xs text-slate-500">{product.type} • {product.capacity}</div>
                  </td>
                  <td className="p-4 text-sm font-semibold text-slate-900">{formatRupiah(product.price)}</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleEdit(product)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Hapus">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900"><X className="w-6 h-6"/></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Produk</label>
                  <input required type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Merk</label>
                  <input required type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipe (Inverter/Standard)</label>
                  <input required type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kapasitas (PK)</label>
                  <input required type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Harga (Rp)</label>
                  <input required type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gambar Produk</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    required={!editingId}
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }} 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2" 
                  />
                  {editingId && !imageFile && formData.image && (
                    <div className="mt-2 text-sm text-slate-500">
                      <p>Gambar saat ini:</p>
                      <img src={formData.image} alt="Current" className="h-16 mt-1 rounded object-cover" />
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                  <textarea required rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Batal</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">Simpan Produk</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
