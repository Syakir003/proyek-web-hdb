import React, { useState, useEffect } from "react";
import {
  Search, ChevronLeft, Check, Droplets, Wrench, Snowflake,
  ShoppingBag, MessageCircle, Star, Heart, X, ArrowRight,
  Shield, SlidersHorizontal, Zap, Wind, ShoppingCart, Phone,
} from "lucide-react";
import { products as staticProducts, services, Product } from "../data";
import { motion, AnimatePresence } from "motion/react";

interface CatalogProps {
  onCheckout?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

const getServiceIcon = (iconName: string) => {
  switch (iconName) {
    case "snowflake": return <Snowflake className="w-6 h-6" />;
    case "droplets": return <Droplets className="w-6 h-6" />;
    case "wrench": return <Wrench className="w-6 h-6" />;
    case "shopping-bag": return <ShoppingBag className="w-6 h-6" />;
    default: return <Wrench className="w-6 h-6" />;
  }
};

export default function Catalog({ onCheckout, onAddToCart }: CatalogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>(staticProducts);
  const [selectedBrand, setSelectedBrand] = useState("Semua");
  const [selectedType, setSelectedType] = useState("Semua");
  const [selectedCapacity, setSelectedCapacity] = useState("Semua");
  const [sortBy, setSortBy] = useState("default");
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          const apiProducts = data.data.map((p: any) => ({
            id: p.id.toString(), name: p.name, brand: p.brand, type: p.type,
            capacity: p.capacity, price: parseFloat(p.price), description: p.description,
            features: ["Garansi Resmi", "Pemasangan Profesional"], image: p.image,
          }));
          setProducts(apiProducts);
        }
      } catch {
        // use static data
      }
    };
    fetchProducts();
  }, []);

  const uniqueBrands = ["Semua", ...Array.from(new Set(products.map((p) => p.brand)))];
  const uniqueTypes = ["Semua", ...Array.from(new Set(products.map((p) => p.type)))];
  const uniqueCapacities = ["Semua", ...Array.from(new Set(products.map((p) => p.capacity)))];
  const categories = ["Semua", ...Array.from(new Set(products.map((p) => p.type)))];

  const formatRupiah = (price: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price);

  const toggleWishlist = (id: string) =>
    setWishlist((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  let filteredProducts = products.filter((product) => {
    const matchSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBrand = selectedBrand === "Semua" || product.brand === selectedBrand;
    const matchType = selectedType === "Semua" || product.type === selectedType;
    const matchCapacity = selectedCapacity === "Semua" || product.capacity === selectedCapacity;
    return matchSearch && matchBrand && matchType && matchCapacity;
  });

  if (sortBy === "price-asc") filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  if (sortBy === "price-desc") filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);

  const activeFiltersCount = [
    selectedBrand !== "Semua", selectedType !== "Semua", selectedCapacity !== "Semua",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchTerm(""); setSelectedBrand("Semua"); setSelectedType("Semua"); setSelectedCapacity("Semua");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-slate-50 min-h-screen pb-24">
      <AnimatePresence mode="wait">
        {selectedProduct ? (
          /* ===== PRODUCT DETAIL ===== */
          <motion.div key="detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <button onClick={() => setSelectedProduct(null)} className="flex items-center gap-2 text-slate-500 hover:text-sky-600 mb-8 transition-colors font-medium text-sm">
              <ChevronLeft className="w-5 h-5" /> Kembali ke Katalog
            </button>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="aspect-square md:aspect-auto bg-gradient-to-br from-sky-50 to-slate-100 relative overflow-hidden">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <span className="px-3 py-1 bg-sky-500 text-white text-xs font-semibold rounded-lg">{selectedProduct.brand}</span>
                    <span className="px-3 py-1 bg-sky-50 text-sky-600 text-xs font-semibold rounded-lg">{selectedProduct.type}</span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg">{selectedProduct.capacity}</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">{selectedProduct.name}</h1>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex gap-1">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}</div>
                    <span className="text-slate-500 text-sm">(124 ulasan)</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-sky-600">{formatRupiah(selectedProduct.price)}</span>
                    <span className="text-slate-400 text-sm line-through ml-3">{formatRupiah(selectedProduct.price * 1.15)}</span>
                    <span className="ml-2 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-lg">-15%</span>
                  </div>
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed">{selectedProduct.description}</p>
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3">Fitur Utama</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedProduct.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-sky-600" />
                          </div>
                          <span className="text-slate-600 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onCheckout && onCheckout(selectedProduct)} className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-3.5 px-6 rounded-xl font-semibold transition-colors shadow-lg shadow-sky-500/30 flex justify-center items-center gap-2">
                      <ShoppingCart className="w-5 h-5" /> Pesan Sekarang
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { onAddToCart?.(selectedProduct); alert("Produk ditambahkan ke keranjang!"); }} className="flex-1 bg-white border-2 border-sky-500 text-sky-600 py-3.5 px-6 rounded-xl font-semibold hover:bg-sky-50 transition-colors flex justify-center items-center gap-2">
                      Tambah ke Keranjang
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ===== PRODUCT LIST ===== */
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-sky-700 to-sky-500 pb-16 pt-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center text-white mb-8">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    Pilihan Terlengkap
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-3">Katalog Produk AC</h1>
                  <p className="text-sky-200 text-lg max-w-2xl mx-auto">
                    Temukan AC impian Anda dari berbagai merek terkemuka dengan harga terbaik dan garansi resmi.
                  </p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="max-w-2xl mx-auto">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari produk atau merek..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white rounded-2xl pl-12 pr-10 py-4 text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-300 shadow-lg text-sm"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-3 mb-6">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedType(cat === "Semua" ? "Semua" : cat)} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${(cat === "Semua" ? selectedType === "Semua" : selectedType === cat) ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30" : "bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-600 border border-slate-200"}`}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Controls Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${showFilters ? "bg-sky-500 text-white border-sky-500" : "bg-white border-slate-200 text-slate-600 hover:border-sky-300"}`}>
                    <SlidersHorizontal className="w-4 h-4" />
                    Filter
                    {activeFiltersCount > 0 && (
                      <span className="bg-white text-sky-600 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold">{activeFiltersCount}</span>
                    )}
                  </button>
                  <span className="text-slate-500 text-sm">
                    <span className="font-semibold text-slate-700">{filteredProducts.length}</span> produk ditemukan
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Urutkan:</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 outline-none focus:border-sky-400 cursor-pointer">
                    <option value="default">Default</option>
                    <option value="price-asc">Harga: Terendah</option>
                    <option value="price-desc">Harga: Tertinggi</option>
                  </select>
                </div>
              </div>

              {/* Filter Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <label className="text-slate-700 font-semibold text-sm mb-3 block">Merek</label>
                        <div className="flex flex-wrap gap-2">
                          {uniqueBrands.map((b) => (
                            <button key={b} onClick={() => setSelectedBrand(b)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedBrand === b ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-600"}`}>{b}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-700 font-semibold text-sm mb-3 block">Tipe</label>
                        <div className="flex flex-wrap gap-2">
                          {uniqueTypes.map((t) => (
                            <button key={t} onClick={() => setSelectedType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedType === t ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-600"}`}>{t}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-700 font-semibold text-sm mb-3 block">Kapasitas</label>
                        <div className="flex flex-wrap gap-2">
                          {uniqueCapacities.map((c) => (
                            <button key={c} onClick={() => setSelectedCapacity(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCapacity === c ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-600"}`}>{c}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {activeFiltersCount > 0 && (
                      <button onClick={resetFilters} className="mt-4 text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                        <X className="w-4 h-4" /> Reset semua filter
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Product Grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-slate-100">
                  <Snowflake className="w-14 h-14 text-sky-300 mx-auto mb-4" />
                  <h3 className="text-slate-700 font-semibold text-xl mb-2">Produk tidak ditemukan</h3>
                  <p className="text-slate-400 mb-6">Coba ubah filter atau kata kunci pencarian Anda</p>
                  <button onClick={resetFilters} className="bg-sky-50 text-sky-600 px-6 py-2.5 rounded-xl font-medium hover:bg-sky-100 transition-colors text-sm">
                    Reset Pencarian
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((product, i) => (
                      <motion.div key={product.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3, delay: i * 0.04 }} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300 group">
                        {/* Image */}
                        <div className="relative h-52 bg-gradient-to-br from-sky-50 to-slate-100 overflow-hidden">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                          <span className="absolute top-3 left-3 bg-sky-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">{product.brand}</span>
                          <div className="absolute bottom-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">-15%</div>
                          <button onClick={() => toggleWishlist(product.id)} className={`absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${wishlist.includes(product.id) ? "bg-red-500 text-white" : "bg-white/80 text-slate-500 hover:text-red-500"}`}>
                            <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? "fill-white" : ""}`} />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          <div className="flex items-center gap-2 text-xs text-sky-500 font-semibold uppercase tracking-wide mb-2">
                            <Wind className="w-3 h-3" />
                            {product.type} · {product.capacity}
                          </div>
                          <h3 className="text-slate-800 font-semibold mb-3 group-hover:text-sky-600 transition-colors line-clamp-2">{product.name}</h3>

                          {/* Features */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {product.features.slice(0, 3).map((f) => (
                              <span key={f} className="bg-sky-50 text-sky-600 text-xs px-2 py-0.5 rounded-md font-medium">{f}</span>
                            ))}
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-1.5 mb-4">
                            <div className="flex">{[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}</div>
                            <span className="text-slate-400 text-xs">(124 ulasan)</span>
                          </div>

                          {/* Price & CTA */}
                          <div className="flex items-end justify-between">
                            <div>
                              <div className="text-sky-600 font-bold text-xl">{formatRupiah(product.price)}</div>
                              <div className="text-slate-400 text-xs line-through">{formatRupiah(product.price * 1.15)}</div>
                            </div>
                            <div className="flex gap-2">
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedProduct(product)} className="px-3 py-2 rounded-xl border border-sky-200 text-sky-600 hover:bg-sky-50 text-sm font-medium transition-colors">
                                Detail
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onCheckout?.(product)} className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors shadow-md shadow-sky-500/20">
                                <ShoppingCart className="w-4 h-4" /> Pesan
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* CTA Banner */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-14 bg-gradient-to-r from-sky-600 to-sky-400 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-white text-center sm:text-left">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Tidak menemukan yang Anda cari?</h3>
                  <p className="text-sky-200">Hubungi kami untuk pemesanan khusus atau konsultasi gratis.</p>
                </div>
                <a href="https://wa.me/6281515729739?text=Halo%20saya%20ingin%20konsultasi%20AC" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white text-sky-600 hover:bg-sky-50 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-colors">
                  <Phone className="w-4 h-4" /> Konsultasi Gratis
                </a>
              </motion.div>
            </div>

            {/* Services Section */}
            <div className="bg-white border-t border-slate-100 py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-14">
                  <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    Layanan Profesional
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                    Apa yang Bisa Kami Bantu?
                  </h2>
                  <p className="text-slate-500 max-w-2xl mx-auto">Solusi lengkap untuk semua kebutuhan pendingin udara Anda.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {services.map((service, index) => (
                    <motion.div key={service.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} whileHover={{ y: -6 }} className="group bg-white border border-slate-100 rounded-2xl p-6 text-center shadow-sm hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300">
                      <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-sky-100 group-hover:scale-110 transition-all duration-300">
                        <div className="text-sky-600">{getServiceIcon(service.icon)}</div>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-sky-600 transition-colors">{service.name}</h3>
                      <p className="text-slate-500 text-sm mb-4 leading-relaxed">{service.description}</p>
                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-xl font-bold text-sky-600 mb-3">{formatRupiah(service.price)}</p>
                        <button className="text-sky-600 font-semibold text-sm hover:text-sky-700 inline-flex items-center gap-1.5 group/btn">
                          Pesan Sekarang <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Process Steps */}
            <div className="bg-slate-900 text-white py-24 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-sky-600/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-sky-600/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />Alur Kerja
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-16">Proses Pelayanan Kami</h2>
                </motion.div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8 relative">
                  {[
                    { step: "1", title: "Konsultasi", desc: "Hubungi kami via WA/telp untuk jelaskan kebutuhan", icon: MessageCircle },
                    { step: "2", title: "Survei", desc: "Tim kami survei lokasi dan berikan estimasi biaya", icon: Wrench },
                    { step: "3", title: "Pengerjaan", desc: "Teknisi datang dan kerjakan sesuai SOP", icon: Snowflake },
                    { step: "4", title: "Tes Ulang", desc: "Pastikan AC berfungsi sempurna sebelum pulang", icon: Check },
                    { step: "5", title: "Garansi", desc: "Nikmati garansi layanan dan after-sales support", icon: Shield },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: idx * 0.1 }} whileHover={{ y: -8 }} className="flex flex-col items-center group">
                        <div className="relative mb-6">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                            {item.step}
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-slate-800 border-2 border-sky-500/30 flex items-center justify-center">
                            <Icon className="w-3.5 h-3.5 text-sky-400" />
                          </div>
                        </div>
                        <h3 className="font-bold mb-2 text-lg group-hover:text-sky-400 transition-colors">{item.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="py-20 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative bg-gradient-to-br from-sky-600 via-sky-500 to-blue-600 rounded-3xl p-8 md:p-10 lg:p-14 text-center overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
                  <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Butuh Bantuan AC Sekarang?</h2>
                    <p className="text-sky-100 text-lg mb-8 max-w-xl mx-auto">Hubungi kami melalui WhatsApp untuk respon tercepat. Tim teknisi profesional kami siap membantu Anda.</p>
                    <motion.a href="https://wa.me/6281515729739?text=Halo%20saya%20ingin%20bertanya" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-flex items-center gap-2 bg-white text-sky-600 hover:bg-sky-50 px-8 py-4 rounded-2xl font-bold shadow-xl transition-all">
                      <MessageCircle className="w-5 h-5" /> Chat WhatsApp
                    </motion.a>
                  </div>
                </motion.div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
