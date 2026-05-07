const fs = require("fs");

const content = `import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, Check, Droplets, Wrench, Snowflake, ShoppingBag, Filter, MessageCircle } from 'lucide-react';
import { products as staticProducts, services, Product } from '../data';
import { motion, AnimatePresence } from 'motion/react';

interface CatalogProps {
  onCheckout?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export default function Catalog({ onCheckout, onAddToCart }: CatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>(staticProducts);
  
  const [selectedBrand, setSelectedBrand] = useState('Semua');
  const [selectedType, setSelectedType] = useState('Semua');
  const [selectedCapacity, setSelectedCapacity] = useState('Semua');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          const apiProducts = data.data.map((p: any) => ({
            id: p.id.toString(),
            name: p.name,
            brand: p.brand,
            type: p.type,
            capacity: p.capacity,
            price: parseFloat(p.price),
            description: p.description,
            features: ['Garansi Resmi', 'Pemasangan Profesional'],
            image: p.image
          }));
          setProducts(apiProducts);
        }
      } catch (error) {
        console.error('Failed to fetch products, using static data', error);
      }
    };
    fetchProducts();
  }, []);

  const uniqueBrands = ['Semua', ...Array.from(new Set(products.map(p => p.brand)))];
  const uniqueTypes = ['Semua', ...Array.from(new Set(products.map(p => p.type)))];
  const uniqueCapacities = ['Semua', ...Array.from(new Set(products.map(p => p.capacity)))];

  const filteredProducts = products.filter(product => {
    const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBrand = selectedBrand === 'Semua' || product.brand === selectedBrand;
    const matchType = selectedType === 'Semua' || product.type === selectedType;
    const matchCapacity = selectedCapacity === 'Semua' || product.capacity === selectedCapacity;
    
    return matchSearch && matchBrand && matchType && matchCapacity;
  });

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  };

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'snowflake': return <Snowflake className="w-6 h-6" />;
      case 'droplets': return <Droplets className="w-6 h-6" />;
      case 'wrench': return <Wrench className="w-6 h-6" />;
      case 'shopping-bag': return <ShoppingBag className="w-6 h-6" />;
      default: return <Wrench className="w-6 h-6" />;
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedBrand('Semua');
    setSelectedType('Semua');
    setSelectedCapacity('Semua');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-slate-50 min-h-screen pb-24">
      <AnimatePresence mode="wait">
        {selectedProduct ? (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
          >
            <button 
              onClick={() => setSelectedProduct(null)}
              className="flex items-center text-slate-500 hover:text-slate-900 mb-8 transition-colors font-medium"
            >
              <ChevronLeft className="w-5 h-5 mr-1" /> Kembali ke Katalog
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                <div className="aspect-square md:aspect-auto bg-slate-100 relative">
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="px-3 py-1 bg-slate-800 text-white text-xs font-semibold rounded-md tracking-wide">{selectedProduct.brand}</span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md tracking-wide">{selectedProduct.type}</span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md tracking-wide">{selectedProduct.capacity}</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">{selectedProduct.name}</h1>
                  <p className="text-2xl font-semibold text-slate-700 mb-8">{formatRupiah(selectedProduct.price)}</p>
                  
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Deskripsi</h3>
                    <p className="text-slate-600 leading-relaxed">{selectedProduct.description}</p>
                  </div>

                  <div className="mb-10">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Fitur Utama</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedProduct.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                          <span className="text-slate-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => onCheckout && onCheckout(selectedProduct)}
                      className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-lg font-bold hover:bg-blue-700 transition-colors flex justify-center items-center shadow-md"
                    >
                      Pesan Sekarang
                    </button>
                    <button 
                      onClick={() => {
                        if (onAddToCart) {
                          onAddToCart(selectedProduct);
                          alert('Produk ditambahkan ke keranjang!');
                        }
                      }}
                      className="flex-1 bg-white border-2 border-blue-600 text-blue-600 py-4 px-6 rounded-lg font-bold hover:bg-blue-50 transition-colors flex justify-center items-center"
                    >
                      Tambah ke Keranjang
                    </button>
                  </div>
              </div>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white border-b border-slate-200 py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl">
                  <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Katalog Produk & Layanan</h1>
                  <p className="text-lg text-slate-500 mb-8">Temukan unit AC terbaik dan layanan profesional dari HDB Airconds.</p>
                  
                  <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-blue-400" />
                    </div>
                    <input 
                      type="text" 
                      className="block w-full pl-12 pr-4 py-4 bg-white border border-blue-100 shadow-sm rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Cari merk, tipe, atau kapasitas..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Filter className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Filter:</span>
                    </div>
                    
                    <select 
                      className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                    >
                      {uniqueBrands.map(brand => (
                        <option key={brand} value={brand}>{brand === 'Semua' ? 'Semua Merk' : brand}</option>
                      ))}
                    </select>

                    <select 
                      className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                    >
                      {uniqueTypes.map(type => (
                        <option key={type} value={type}>{type === 'Semua' ? 'Semua Jenis' : type}</option>
                      ))}
                    </select>

                    <select 
                      className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                      value={selectedCapacity}
                      onChange={(e) => setSelectedCapacity(e.target.value)}
                    >
                      {uniqueCapacities.map(capacity => (
                        <option key={capacity} value={capacity}>{capacity === 'Semua' ? 'Semua Kapasitas' : capacity}</option>
                      ))}
                    </select>

                    {(searchTerm || selectedBrand !== 'Semua' || selectedType !== 'Semua' || selectedCapacity !== 'Semua') && (
                      <button 
                        onClick={resetFilters}
                        className="w-full sm:w-auto text-sm text-blue-600 hover:text-blue-800 font-medium ml-auto"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
              </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map((product, index) => (
                    <motion.div 
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer group flex flex-col hover:shadow-xl transition-all"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="aspect-4/3 overflow-hidden bg-slate-100 relative">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-white/90 backdrop-blur-sm text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm">
                            {product.brand}
                          </span>
                        </div>
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{product.type}</span>
                          <span className="text-xs text-slate-300">&bull;</span>
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{product.capacity}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                        <p className="text-slate-500 text-sm mb-6 line-clamp-2 flex-1">{product.description}</p>
                        <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100">
                          <span className="text-lg font-bold text-blue-700">{formatRupiah(product.price)}</span>
                          <span className="text-blue-600 font-bold text-sm group-hover:underline">Detail</span>
                        </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-white rounded-xl border border-slate-200 border-dashed">
                  <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Tidak ada hasil</h3>
                  <p className="text-slate-500 mb-6">Kami tidak dapat menemukan produk yang sesuai dengan pencarian Anda.</p>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="bg-slate-100 text-slate-900 px-6 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                  >
                    Reset Pencarian
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white border-t border-slate-200 py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <p className="text-blue-600 font-medium mb-2 uppercase tracking-wider text-sm">Layanan Profesional</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Apa yang Bisa Kami Bantu?</h2>
                  <p className="text-slate-500 text-lg max-w-2xl mx-auto">Solusi lengkap untuk semua kebutuhan pendingin udara Anda.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {services.map((service, index) => (
                    <motion.div 
                      key={service.id} 
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -10 }}
                      className="bg-blue-50 p-8 rounded-2xl border border-blue-100 text-center group hover:shadow-xl transition-all duration-300"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:bg-blue-600 transition-colors duration-300">
                        <div className="text-blue-600 group-hover:text-white transition-colors duration-300">
                          {getServiceIcon(service.icon)}
                        </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-3">{service.name}</h3>
                      <p className="text-slate-500 text-sm mb-4 leading-relaxed">{service.description}</p>
                      <div className="text-blue-600 font-bold text-sm">Mulai {formatRupiah(service.price)}</div>
                    </motion.div>
                  ))}
                </div>
            </div>

            <div className="bg-slate-900 text-white py-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-blue-400 font-medium mb-2 uppercase tracking-wider text-sm">Alur Kerja</p>
                <h2 className="text-3xl md:text-4xl font-bold mb-16 tracking-tight">Proses Pelayanan Kami</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
                  {[
                    { step: '1', title: 'Konsultasi', desc: 'Hubungi kami via WA/telp untuk jelaskan kebutuhan' },
                    { step: '2', title: 'Survei', desc: 'Tim kami survei lokasi dan berikan estimasi biaya' },
                    { step: '3', title: 'Pengerjaan', desc: 'Teknisi datang dan kerjakan sesuai SOP' },
                    { step: '4', title: 'Tes Ulang', desc: 'Pastikan AC berfungsi sempurna sebelum pulang' },
                    { step: '5', title: 'Garansi', desc: 'Nikmati garansi layanan dan after-sales support' }
                  ].map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold mb-4">
                        {item.step}
                      </div>
                      <h3 className="font-bold mb-2">{item.title}</h3>
                      <p className="text-slate-400 text-sm">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
            </div>

            <div className="py-24 bg-blue-600 text-white">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Butuh Bantuan AC Sekarang?</h2>
                <p className="text-blue-100 mb-10 text-lg">Hubungi kami melalui WhatsApp untuk respon tercepat. Tim teknisi kami siap membantu Anda.</p>
                <a
                  href="https://wa.me/6281515729739?text=Halo%20saya%20ingin%20bertanya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold hover:bg-blue-50 transition-colors shadow-lg inline-flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" /> Chat WhatsApp
                </a>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}`;

fs.writeFileSync("d:/proyek_psi/src/pages/Catalog.tsx", content, "utf8");
console.log("File written successfully");
