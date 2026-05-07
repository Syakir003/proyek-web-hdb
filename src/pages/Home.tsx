import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Play,
  Image as ImageIcon,
  User,
  Wrench,
  Wind,
  Shield,
  CheckCircle,
  Zap,
  Snowflake,
  Phone,
  MessageCircle,
  Star,
  TrendingUp,
  Users,
  Award,
} from "lucide-react";
import { products, services } from "../data";
import { motion, AnimatePresence } from "motion/react";

export default function Home({
  setCurrentPage,
}: {
  setCurrentPage: (page: string) => void;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const heroSlides = [
    {
      image:
        "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=1200",
      title: "Ruangan Sejuk, Hidup Nyaman",
      subtitle: "Solusi pendingin udara profesional oleh HDB Airconds.",
    },
    {
      image:
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=1200",
      title: "Servis AC Cepat & Tuntas",
      subtitle:
        "Tim teknisi berpengalaman siap membantu kapan saja Anda butuhkan.",
    },
    {
      image:
        "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&q=80&w=1200",
      title: "Instalasi Profesional Bergaransi",
      subtitle:
        "Pemasangan unit AC baru dengan standar tertinggi dan garansi 30 hari.",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const featuredServices = [
    {
      icon: <Snowflake className="w-8 h-8" />,
      title: "Instalasi AC Profesional",
      description:
        "Pemasangan unit baru untuk rumah dan kantor dengan standar tertinggi.",
      link: "kontak",
    },
    {
      icon: <Wrench className="w-8 h-8" />,
      title: "Servis & Perawatan Rutin",
      description:
        "Menjaga AC Anda tetap prima, hemat energi, dan bebas dari bakteri.",
      link: "kontak",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Perbaikan Cepat & Tuntas",
      description:
        "Solusi cepat untuk segala masalah AC, dari bocor hingga tidak dingin.",
      link: "kontak",
    },
  ];

  const galleryImages = [
    {
      src: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=600",
      alt: "Teknisi instalasi AC",
    },
    {
      src: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600",
      alt: "Teknisi servis unit outdoor",
    },
    {
      src: "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&q=80&w=600",
      alt: "Teknisi membersihkan unit indoor",
    },
    {
      src: "https://images.unsplash.com/photo-1585058178115-d9120f2b3806?auto=format&fit=crop&q=80&w=600",
      alt: "Teknisi berdiskusi dengan klien",
    },
  ];

  const whyUsItems = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Teknisi Profesional",
      description:
        "Tim kami bersertifikat, berpengalaman, dan bekerja dengan SOP yang rapi.",
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Bergaransi",
      description:
        "Kami memberikan garansi 30 hari untuk setiap servis dan perbaikan.",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Respon Cepat",
      description:
        "Admin kami siaga dan teknisi kami siap datang ke lokasi Anda dengan cepat.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-blue-50"
    >
      {/* Hero Section with Slider */}
      <section className="relative h-[600px] md:h-[700px] overflow-hidden">
        {heroSlides.map((slide, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: currentSlide === index ? 1 : 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            <div className="absolute inset-0 bg-slate-900/60" />
          </motion.div>
        ))}

        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl"
            >
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white leading-tight">
                {heroSlides[currentSlide].title}
              </h1>
              <p className="text-xl text-slate-200 mb-10 leading-relaxed">
                {heroSlides[currentSlide].subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage("kontak")}
                  className="bg-blue-600 text-white px-8 py-4 rounded-full font-medium hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Dapatkan Penawaran Gratis
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage("katalog")}
                  className="bg-white/10 backdrop-blur-sm text-white border border-white/30 px-8 py-4 rounded-full font-medium hover:bg-white/20 transition-colors"
                >
                  Lihat Katalog
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${currentSlide === index ? "bg-white w-8" : "bg-white/50"}`}
            />
          ))}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "19+", label: "Tahun Pengalaman", icon: Award },
              { number: "5000+", label: "Pelanggan Puas", icon: Users },
              { number: "100%", label: "Garansi Kerja", icon: CheckCircle },
              { number: "24/7", label: "Siap Melayani", icon: TrendingUp },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300"
                >
                  <Icon className="w-8 h-8 mx-auto mb-3 text-blue-200" />
                  <motion.div className="text-3xl md:text-4xl font-bold mb-2">
                    {stat.number}
                  </motion.div>
                  <p className="text-blue-100 text-sm">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-medium mb-2 uppercase tracking-wider text-sm">
              Layanan Kami
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Apa yang Bisa Kami Bantu?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredServices.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{
                  y: -10,
                  boxShadow: "0 20px 40px rgba(59, 130, 246, 0.15)",
                }}
                className="relative bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100 text-center group hover:border-blue-300 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-40 h-40 bg-blue-100/50 rounded-full -translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>

                <div className="relative z-10">
                  <motion.div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 border-2 border-blue-100">
                    <div className="text-blue-600 group-hover:text-blue-700">
                      {service.icon}
                    </div>
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 mb-6 leading-relaxed text-sm">
                    {service.description}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(service.link)}
                    className="text-blue-600 font-bold text-sm hover:text-blue-700 inline-flex items-center gap-2 group/btn"
                  >
                    Lihat Detail{" "}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Short */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="aspect-video rounded-2xl overflow-hidden shadow-xl order-2 md:order-1 relative group"
            >
              <img
                src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800"
                alt="Tim HDB Airconds Profesional"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/40 to-transparent"></div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-1 md:order-2"
            >
              <p className="text-blue-600 font-medium mb-2 uppercase tracking-wider text-sm">
                Tentang HDB Airconds
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight text-slate-900 leading-tight">
                Partner Pendingin
                <br />
                Udara Tepercaya Anda.
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed max-w-lg mb-4">
                Selama lebih dari 19 tahun, HDB Airconds telah berkomitmen untuk
                memberikan solusi pendingin udara yang sejuk, efisien, dan
                andal.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed max-w-lg mb-8">
                Kami bukan hanya teknisi, kami adalah konsultan kenyamanan Anda.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage("tentang")}
                className="bg-blue-600 text-white px-8 py-4 rounded-full font-medium hover:bg-blue-700 transition-colors shadow-md"
              >
                Pelajari Lebih Lanjut
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-24 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-medium mb-2 uppercase tracking-wider text-sm">
              Galeri
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Kegiatan Kami
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryImages.map((img, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="aspect-square rounded-xl overflow-hidden group cursor-pointer relative"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors duration-300 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 relative">
            <p className="text-blue-600 font-medium mb-2 uppercase tracking-wider text-sm">
              Paling Populer
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Produk Unggulan Kami
            </h2>

            <div className="hidden md:flex absolute right-0 bottom-0 gap-2">
              <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all duration-300">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all duration-300">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.slice(0, 3).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-blue-200"
              >
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <motion.div
                    initial={{ scale: 0 }}
                    whileHover={{ scale: 1 }}
                    className="absolute top-4 right-4 bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-sm font-bold"
                  >
                    -15%
                  </motion.div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex-1">
                      {product.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-blue-400 text-blue-400"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">(48)</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    {product.type} &bull; {product.capacity}
                  </p>
                  <div className="mb-4 pb-4 border-b border-slate-100">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatRupiah(product.price).replace("Rp", "Rp")}
                    </p>
                    <p className="text-xs text-slate-400 line-through">
                      {formatRupiah(product.price * 1.15)}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage("katalog")}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                  >
                    Lihat Detail
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button
              onClick={() => setCurrentPage("katalog")}
              className="bg-white border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
            >
              Lihat Semua Produk <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-24 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-blue-600 font-medium mb-2 uppercase tracking-wider text-sm">
            Layanan Utama
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-16">
            Pilih Layanan Favorit Anda
          </h2>

          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              "Cuci AC",
              "Bongkar Pasang",
              "Isi Freon",
              "Perbaikan",
              "Pengecekan",
              "Kontrak Servis",
            ].map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-24 h-24 rounded-full bg-white shadow-sm border border-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors duration-300 group-hover:shadow-lg">
                  <Wrench className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {service}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-blue-600 font-medium mb-2 uppercase tracking-wider text-sm">
            Keunggulan Kami
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-16">
            Mengapa Memilih HDB Airconds?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {whyUsItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300 group-hover:-translate-y-2 transform">
                  <div className="text-blue-600 group-hover:text-white transition-colors duration-300">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video / Why Choose Us */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-blue-400 font-medium mb-2 uppercase tracking-wider text-sm">
            Alasan
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">
            Kenapa Memilih Kami?
          </h2>

          <div className="aspect-video rounded-2xl flex items-center justify-center cursor-pointer shadow-2xl relative overflow-hidden group">
            <img
              src="https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&q=80&w=1000"
              alt="Why Choose Us Video"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/50 transition-colors"></div>
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg relative z-10 group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-white ml-2" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-medium mb-2 uppercase tracking-wider text-sm">
              Testimoni
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Apa kata pelanggan kami?
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Ribuan pelanggan telah mempercayai kami untuk kebutuhan pendingin
              udara mereka
            </p>
          </div>

          <div className="relative">
            <button className="hidden md:flex absolute -left-12 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full border border-slate-300 items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all duration-300 shadow-md hover:shadow-lg">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button className="hidden md:flex absolute -right-12 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full border border-slate-300 items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all duration-300 shadow-md hover:shadow-lg">
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Budi Santoso",
                  role: "Pemilik Rumah",
                  text: "Pelayanan sangat memuaskan! Teknisi datang tepat waktu dan AC saya kembali dingin seperti baru. Harganya juga sangat transparan dan tidak ada biaya tersembunyi.",
                  rating: 5,
                  verified: true,
                },
                {
                  name: "Siti Rahayu",
                  role: "Pemilik Toko",
                  text: "Sudah 3 tahun saya pakai jasa HDB Airconds untuk perawatan rutin AC. Selalu puas dengan hasilnya dan teknisinya sangat ramah dan profesional.",
                  rating: 5,
                  verified: true,
                },
                {
                  name: "Ahmad Fauzi",
                  role: "Pemilik Kost",
                  text: "Instalasi AC untuk 10 kamar kost saya dikerjakan dengan rapi dan cepat. Harga bersaing dan ada garansi. Sangat recommended untuk yang butuh AC berkualitas!",
                  rating: 5,
                  verified: true,
                },
              ].map((testi, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-white p-6 rounded-2xl text-left border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1">
                      {[...Array(testi.rating)].map((_, j) => (
                        <Star
                          key={j}
                          className="w-4 h-4 fill-blue-400 text-blue-400"
                        />
                      ))}
                    </div>
                    {testi.verified && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Terverifikasi
                      </div>
                    )}
                  </div>
                  <p className="text-slate-700 mb-6 leading-relaxed italic">
                    "{testi.text}"
                  </p>
                  <div className="flex items-center pt-4 border-t border-slate-100">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-4 text-white font-bold text-lg group-hover:scale-110 transition-transform">
                      {testi.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{testi.name}</h4>
                      <p className="text-sm text-slate-500">{testi.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center gap-2 mt-12">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: i === 0 ? 1 : 0.5 }}
                  animate={{ scale: i === 0 ? 1 : 0.5 }}
                  className={`h-2 rounded-full transition-all ${
                    i === 0
                      ? "w-8 bg-blue-600"
                      : "w-2 bg-blue-200 hover:bg-blue-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
              Butuh Bantuan AC Sekarang?
            </h2>
            <p className="text-xl text-blue-100 mb-12 leading-relaxed">
              Hubungi kami melalui WhatsApp untuk respon tercepat. Tim teknisi
              profesional kami siap membantu Anda 24/7.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.a
              href="https://wa.me/6281515729739?text=Halo%20saya%20ingin%20bertanya"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold hover:bg-blue-50 transition-all shadow-lg inline-flex items-center justify-center gap-3 text-lg"
            >
              <MessageCircle className="w-5 h-5" /> Chat WhatsApp
            </motion.a>
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage("kontak")}
              className="bg-blue-700 text-white px-8 py-4 rounded-full font-bold hover:bg-blue-800 transition-all border-2 border-blue-500 shadow-lg text-lg"
            >
              Hubungi Kami
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 pt-12 border-t border-blue-500/30"
          >
            <p className="text-blue-100 text-sm">
              ⏱️ Respons cepat dalam 5 menit | 📍 Layanan ke seluruh kota | ✅
              Teknisi bersertifikat
            </p>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
