import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  ArrowRight, Star, Zap, Phone, MessageCircle, CheckCircle,
  Wrench, Settings, Droplets, Truck, ShieldCheck, HeadphonesIcon,
  BadgeCheck, Clock, ThumbsUp, ChevronDown, ChevronLeft, ChevronRight,
  Quote, Users, Briefcase, Award, Shield, ShoppingCart,
} from "lucide-react";

const heroSlides = [
  {
    title: "Solusi AC Terbaik",
    subtitle: "untuk Rumah & Bisnis Anda",
    description: "Nikmati kesejukan sempurna dengan produk AC pilihan dan layanan profesional dari tim berpengalaman HDB Airconds.",
    image: "https://images.unsplash.com/photo-1761782791727-3994283faa88?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
    accent: "Hemat Energi Hingga 40%",
  },
  {
    title: "Instalasi Profesional",
    subtitle: "Cepat, Bersih & Bergaransi",
    description: "Teknisi bersertifikat kami siap melakukan instalasi AC di lokasi Anda dengan standar keamanan tertinggi.",
    image: "https://images.unsplash.com/photo-1773101883566-0827c4fd907c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
    accent: "Garansi 2 Tahun",
  },
  {
    title: "Perawatan & Servis",
    subtitle: "Layanan 24/7 Siap Hadir",
    description: "Jangan biarkan AC Anda rusak di saat paling dibutuhkan. Tim servis darurat kami hadir kapanpun dan dimanapun.",
    image: "https://images.unsplash.com/photo-1660330589827-da8ab7dd3c02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
    accent: "Respon < 2 Jam",
  },
];

const floatingBadges = [
  { icon: Shield, text: "Bergaransi Resmi", color: "from-sky-500 to-blue-600" },
  { icon: Zap, text: "Hemat Listrik", color: "from-amber-400 to-orange-500" },
  { icon: Star, text: "Rating 4.9/5", color: "from-emerald-400 to-teal-500" },
];

const statsData = [
  { icon: Users, value: 5000, suffix: "+", label: "Pelanggan Puas", desc: "Di seluruh Indonesia", color: "from-sky-400 to-sky-600" },
  { icon: Briefcase, value: 10, suffix: "+", label: "Tahun Pengalaman", desc: "Berdiri sejak 2014", color: "from-blue-400 to-blue-600" },
  { icon: Award, value: 50, suffix: "+", label: "Merek Tersedia", desc: "Pilihan terlengkap", color: "from-cyan-400 to-cyan-600" },
  { icon: Clock, value: 24, suffix: "/7", label: "Layanan Darurat", desc: "Siap kapan saja", color: "from-indigo-400 to-indigo-600" },
];

const servicesData = [
  {
    icon: Truck, title: "Instalasi AC Baru",
    description: "Pemasangan AC baru di rumah atau gedung Anda oleh teknisi bersertifikat dengan pengerjaan rapi dan bersih.",
    iconBg: "bg-sky-100", iconColor: "text-sky-600", price: "Mulai Rp 250.000",
    features: ["Gratis survei lokasi", "Garansi instalasi 1 tahun", "Bahan berkualitas"],
  },
  {
    icon: Settings, title: "Perawatan Rutin",
    description: "Service dan pembersihan AC secara rutin untuk menjaga performa optimal dan mencegah kerusakan dini.",
    iconBg: "bg-blue-100", iconColor: "text-blue-600", price: "Mulai Rp 75.000",
    features: ["Cuci AC deep cleaning", "Cek performa sistem", "Laporan kondisi AC"],
  },
  {
    icon: Wrench, title: "Perbaikan AC",
    description: "Diagnosa dan perbaikan kerusakan AC dengan spare part original bergaransi. Semua merek dan tipe ditangani.",
    iconBg: "bg-cyan-100", iconColor: "text-cyan-600", price: "Mulai Rp 100.000",
    features: ["Diagnosa gratis", "Spare part original", "Garansi perbaikan"],
  },
  {
    icon: Droplets, title: "Pengisian Freon",
    description: "Pengisian freon AC dengan refrigerant asli dan peralatan modern untuk performa pendinginan maksimal.",
    iconBg: "bg-indigo-100", iconColor: "text-indigo-600", price: "Mulai Rp 150.000",
    features: ["Freon R32/R410A/R22", "Cek kebocoran sistem", "Pengerjaan cepat"],
  },
  {
    icon: Truck, title: "Bongkar Pasang",
    description: "Layanan bongkar pasang AC untuk pindah rumah atau renovasi dengan penanganan hati-hati dan profesional.",
    iconBg: "bg-violet-100", iconColor: "text-violet-600", price: "Mulai Rp 200.000",
    features: ["Pindah lokasi aman", "Re-instalasi presisi", "Uji coba ulang"],
  },
  {
    icon: HeadphonesIcon, title: "Konsultasi Gratis",
    description: "Tidak yakin AC apa yang cocok? Tim ahli kami siap konsultasi gratis untuk kebutuhan pendingin Anda.",
    iconBg: "bg-emerald-100", iconColor: "text-emerald-600", price: "GRATIS",
    features: ["Via WhatsApp/telepon", "Rekomendasi produk", "Estimasi biaya"],
  },
];

const productCategories = ["Semua", "Residential", "Commercial", "Inverter"];

const productsData = [
  { id: 1, name: "HDB Cool Pro 1 PK", category: "Residential", brand: "Samsung", price: 3500000, originalPrice: 4200000, rating: 4.8, reviews: 124, image: "https://images.unsplash.com/photo-1711696488222-3a5af2a3dd72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80", tag: "Terlaris", tagColor: "bg-sky-500", specs: ["1 PK", "R32 Freon", "Hemat Listrik"], isNew: false },
  { id: 2, name: "HDB Inverter 1.5 PK", category: "Inverter", brand: "Daikin", price: 5800000, originalPrice: 6500000, rating: 4.9, reviews: 89, image: "https://images.unsplash.com/photo-1760002208185-c1200df053e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80", tag: "Terbaru", tagColor: "bg-emerald-500", specs: ["1.5 PK", "Inverter", "WiFi Ready"], isNew: true },
  { id: 3, name: "HDB Smart 2 PK", category: "Residential", brand: "Panasonic", price: 7200000, originalPrice: 8000000, rating: 4.7, reviews: 56, image: "https://images.unsplash.com/photo-1761782791727-3994283faa88?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80", tag: "Promo", tagColor: "bg-orange-500", specs: ["2 PK", "Smart Control", "Auto Clean"], isNew: false },
  { id: 4, name: "HDB Commercial 3 PK", category: "Commercial", brand: "Mitsubishi", price: 12500000, originalPrice: 14000000, rating: 4.9, reviews: 34, image: "https://images.unsplash.com/photo-1708705261211-b2a244a811dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80", tag: "Premium", tagColor: "bg-violet-500", specs: ["3 PK", "Cassette Type", "Commercial Grade"], isNew: false },
  { id: 5, name: "HDB Eco 1 PK", category: "Residential", brand: "LG", price: 2900000, originalPrice: 3400000, rating: 4.6, reviews: 201, image: "https://images.unsplash.com/photo-1773101883566-0827c4fd907c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80", tag: "Hemat", tagColor: "bg-teal-500", specs: ["1 PK", "Low Watt", "R410A"], isNew: false },
  { id: 6, name: "HDB Ultra Inverter 2 PK", category: "Inverter", brand: "Sharp", price: 9100000, originalPrice: 10500000, rating: 4.8, reviews: 67, image: "https://images.unsplash.com/photo-1660330589827-da8ab7dd3c02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80", tag: "Best Value", tagColor: "bg-pink-500", specs: ["2 PK", "AI Inverter", "Self Cleaning"], isNew: true },
];

const whyUsReasons = [
  { icon: BadgeCheck, title: "Teknisi Bersertifikat", description: "Semua teknisi kami telah mendapatkan sertifikasi resmi dan pelatihan intensif untuk memastikan kualitas kerja terbaik.", color: "bg-sky-500" },
  { icon: Clock, title: "Respon Cepat", description: "Layanan darurat dengan waktu respons kurang dari 2 jam. Kami hadir ketika Anda paling membutuhkan.", color: "bg-blue-500" },
  { icon: ShieldCheck, title: "Bergaransi Resmi", description: "Setiap produk dan layanan dilengkapi garansi resmi. Kami bertanggung jawab atas setiap pekerjaan kami.", color: "bg-cyan-500" },
  { icon: ThumbsUp, title: "Harga Transparan", description: "Tidak ada biaya tersembunyi. Kami memberikan estimasi biaya yang jelas sebelum pekerjaan dimulai.", color: "bg-indigo-500" },
  { icon: Wrench, title: "Spare Part Original", description: "Kami hanya menggunakan komponen original dari merek terpercaya untuk menjamin keawetan peralatan Anda.", color: "bg-violet-500" },
  { icon: Phone, title: "After-Sale Support", description: "Layanan purna jual yang responsif. Tim kami siap membantu via WhatsApp, telepon, atau kunjungan langsung.", color: "bg-emerald-500" },
];

const brands = [
  { name: "Samsung", logo: "S", slug: "samsung", color: "from-blue-500 to-blue-700" },
  { name: "Daikin", logo: "D", slug: "", color: "from-sky-500 to-sky-700" },
  { name: "Panasonic", logo: "P", slug: "panasonic", color: "from-indigo-500 to-indigo-700" },
  { name: "Mitsubishi", logo: "M", slug: "mitsubishi", color: "from-red-500 to-red-700" },
  { name: "LG", logo: "LG", slug: "lg", color: "from-violet-500 to-violet-700" },
  { name: "Sharp", logo: "Sh", slug: "sharp", color: "from-teal-500 to-teal-700" },
  { name: "Gree", logo: "G", slug: "", color: "from-emerald-500 to-emerald-700" },
  { name: "Midea", logo: "Md", slug: "", color: "from-blue-600 to-indigo-700" },
  { name: "Haier", logo: "H", slug: "", color: "from-sky-600 to-blue-700" },
  { name: "Toshiba", logo: "T", slug: "toshiba", color: "from-cyan-500 to-sky-700" },
];

const testimonials = [
  { id: 1, name: "Budi Santoso", role: "Pemilik Rumah", location: "Jakarta Selatan", avatar: "https://images.unsplash.com/photo-1758600432569-4fcd02721f80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&q=80", rating: 5, service: "Instalasi AC Baru", date: "Maret 2025", text: "Pelayanan HDB Airconds sangat memuaskan! Teknisi datang tepat waktu, pemasangan AC baru berjalan lancar dan bersih. Harga pun sangat transparan tanpa biaya kejutan. Sangat direkomendasikan!" },
  { id: 2, name: "Siti Rahayu", role: "Ibu Rumah Tangga", location: "Bekasi", avatar: "https://images.unsplash.com/photo-1702406647675-108ee05b20b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&q=80", rating: 5, service: "Servis Darurat", date: "Februari 2025", text: "AC saya rusak mendadak di malam hari, langsung hubungi HDB Airconds. Kurang dari 2 jam teknisi sudah datang dan masalah teratasi. Benar-benar layanan 24 jam yang bisa diandalkan!" },
  { id: 3, name: "Ahmad Rizky", role: "Manager Operasional", location: "Tangerang", avatar: "https://images.unsplash.com/photo-1660330589827-da8ab7dd3c02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&q=80", rating: 5, service: "Perawatan Rutin (Commercial)", date: "Januari 2025", text: "Kami mempercayakan perawatan 20+ unit AC di kantor kami kepada HDB Airconds. Kerja mereka profesional, jadwal maintenance selalu tepat, dan laporan kondisi AC diberikan setiap kali service." },
  { id: 4, name: "Dewi Kartika", role: "Arsitek Interior", location: "Jakarta Barat", avatar: "https://images.unsplash.com/photo-1773101883566-0827c4fd907c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&q=80", rating: 5, service: "Instalasi Multiple Unit", date: "April 2025", text: "Saya sering merekomendasikan HDB Airconds ke klien saya. Instalasi mereka sangat rapi dan memperhatikan estetika. Tim mereka juga sangat komunikatif dalam menjelaskan opsi terbaik." },
  { id: 5, name: "Reza Firmansyah", role: "Pengusaha Kuliner", location: "Depok", avatar: "https://images.unsplash.com/photo-1711696488222-3a5af2a3dd72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&q=80", rating: 4, service: "Penjualan + Instalasi", date: "Maret 2025", text: "Beli AC baru di HDB Airconds, harga kompetitif dengan produk original bergaransi resmi. Proses pembelian mudah dan pengiriman + instalasi selesai dalam 1 hari. Puas dengan pelayanannya!" },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 25);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref} className="tabular-nums">{count}{suffix}</span>;
}

export default function Home({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [testimonialDir, setTestimonialDir] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => setActiveSlide((p) => (p + 1) % heroSlides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const filteredProducts = activeCategory === "Semua" ? productsData : productsData.filter((p) => p.category === activeCategory);

  const prevTestimonial = () => { setTestimonialDir(-1); setTestimonialIndex((p) => (p - 1 + testimonials.length) % testimonials.length); };
  const nextTestimonial = () => { setTestimonialDir(1); setTestimonialIndex((p) => (p + 1) % testimonials.length); };
  const goToTestimonial = (i: number) => { setTestimonialDir(i > testimonialIndex ? 1 : -1); setTestimonialIndex(i); };

  const slide = heroSlides[activeSlide];
  const testimonial = testimonials[testimonialIndex];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white">

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-slate-900">
        {heroSlides.map((s, i) => (
          <motion.div key={i} className="absolute inset-0" animate={{ opacity: i === activeSlide ? 1 : 0 }} transition={{ duration: 1.2 }}>
            <img src={s.image} alt="" className="w-full h-full object-cover" />
          </motion.div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div key={i} className="absolute w-2 h-2 rounded-full bg-sky-400/30" style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }} animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }} />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 w-full">
          <div className="max-w-3xl">
            <motion.div key={activeSlide + "b"} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 bg-sky-500/20 backdrop-blur-sm border border-sky-400/30 text-sky-300 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              {slide.accent}
            </motion.div>
            <motion.div key={activeSlide + "t"} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-2">{slide.title}</h1>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-sky-400 leading-tight mb-5">{slide.subtitle}</h2>
            </motion.div>
            <motion.p key={activeSlide + "d"} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-slate-300 text-base sm:text-lg leading-relaxed mb-7 max-w-xl">{slide.description}</motion.p>
            <motion.div key={activeSlide + "f"} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="hidden sm:flex flex-wrap gap-x-6 gap-y-2 mb-8">
              {["Gratis Konsultasi", "Teknisi Bersertifikat", "Spare Part Original"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-slate-300 text-sm"><CheckCircle className="w-4 h-4 text-sky-400 flex-shrink-0" />{f}</div>
              ))}
            </motion.div>
            <motion.div key={activeSlide + "c"} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="flex flex-wrap gap-3 sm:gap-4">
              <motion.button onClick={() => setCurrentPage("katalog")} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="bg-sky-500 hover:bg-sky-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-sky-500/30 transition-colors text-sm sm:text-base">
                Lihat Produk <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
              <motion.button onClick={() => setCurrentPage("kontak")} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/30 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold flex items-center gap-2 transition-all text-sm sm:text-base">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" /> Konsultasi Gratis
              </motion.button>
            </motion.div>
          </div>

          <div className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4">
            {floatingBadges.map((badge, i) => (
              <motion.div key={badge.text} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.15, duration: 0.5 }} whileHover={{ x: -5 }} className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center flex-shrink-0`}>
                  <badge.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium whitespace-nowrap">{badge.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
            {heroSlides.map((_, i) => (
              <button key={i} onClick={() => setActiveSlide(i)} className={`transition-all duration-300 rounded-full ${i === activeSlide ? "w-8 h-2.5 bg-sky-400" : "w-2.5 h-2.5 bg-white/40 hover:bg-white/60"}`} />
            ))}
          </div>
          <motion.button onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })} className="absolute bottom-10 right-8 text-white/50 hover:text-white/80 transition-colors flex flex-col items-center gap-1 text-xs" animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <span className="hidden sm:block">Scroll</span>
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        </div>
      </section>

      {/* STATS */}
      <section className="relative bg-gradient-to-br from-sky-600 via-sky-500 to-blue-600 py-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/3" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <div className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-1"><CountUp target={stat.value} suffix={stat.suffix} /></div>
                  <div className="text-white font-semibold text-sm mb-1">{stat.label}</div>
                  <div className="text-sky-200 text-xs">{stat.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />Layanan Kami
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">Semua Kebutuhan AC Anda, <span className="text-sky-500">Kami Tangani</span></h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Dari instalasi hingga perbaikan, kami menyediakan layanan AC lengkap dengan standar kualitas tertinggi dan teknisi berpengalaman.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicesData.map((service, i) => (
              <motion.div key={service.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} whileHover={{ y: -6 }} className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300 cursor-pointer" onClick={() => setCurrentPage("kontak")}>
                <div className={`w-13 h-13 rounded-xl ${service.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`} style={{ width: 52, height: 52 }}>
                  <service.icon className={`w-6 h-6 ${service.iconColor}`} />
                </div>
                <div className="flex items-start justify-between mb-3 gap-2">
                  <h3 className="text-slate-800 font-semibold text-lg leading-tight">{service.title}</h3>
                  <span className="bg-sky-50 text-sky-600 text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap flex-shrink-0">{service.price}</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">{service.description}</p>
                <ul className="space-y-2 mb-5">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-600"><ShieldCheck className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />{f}</li>
                  ))}
                </ul>
                <div className={`flex items-center gap-1.5 text-sm font-semibold ${service.iconColor} group-hover:gap-3 transition-all duration-200`}>
                  Selengkapnya <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="text-center mt-12">
            <button onClick={() => setCurrentPage("kontak")} className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-sky-500/30 transition-all duration-200 hover:-translate-y-0.5">
              Lihat Semua Layanan <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />Produk Kami
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-800">Pilihan AC <span className="text-sky-500">Terlengkap</span></h2>
              <p className="text-slate-500 mt-2 max-w-lg">Dari berbagai merek terkemuka dengan harga terbaik dan garansi resmi.</p>
            </div>
            <button onClick={() => setCurrentPage("katalog")} className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold text-sm border border-sky-200 hover:border-sky-400 px-4 py-2 rounded-xl transition-all">
              Semua Produk <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-wrap gap-3 mb-10">
            {productCategories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${activeCategory === cat ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30" : "bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-600 border border-slate-200"}`}>{cat}</button>
            ))}
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, i) => (
                <motion.div key={product.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3, delay: i * 0.06 }} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-sky-100/60 transition-all duration-300 group cursor-pointer" onClick={() => setCurrentPage("katalog")}>
                  <div className="relative h-52 overflow-hidden bg-gradient-to-br from-sky-50 to-slate-100">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className={`absolute top-3 left-3 ${product.tagColor} text-white text-xs font-semibold px-2.5 py-1 rounded-lg`}>{product.tag}</span>
                    {product.isNew && <span className="absolute top-3 right-3 bg-white text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg shadow">Baru</span>}
                    {product.originalPrice > product.price && (
                      <div className="absolute bottom-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">-{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%</div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="text-xs text-sky-500 font-semibold uppercase tracking-wide mb-1">{product.brand} · {product.category}</div>
                    <h3 className="text-slate-800 font-semibold mb-3 group-hover:text-sky-600 transition-colors">{product.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {product.specs.map((spec) => <span key={spec} className="bg-sky-50 text-sky-600 text-xs px-2 py-0.5 rounded-md font-medium">{spec}</span>)}
                    </div>
                    <div className="flex items-center gap-1.5 mb-4">
                      <div className="flex">{[...Array(5)].map((_, j) => <Star key={j} className={`w-3.5 h-3.5 ${j < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />)}</div>
                      <span className="text-slate-600 text-xs font-medium">{product.rating}</span>
                      <span className="text-slate-400 text-xs">({product.reviews} ulasan)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sky-600 font-bold text-lg">{formatPrice(product.price)}</div>
                        {product.originalPrice > product.price && <div className="text-slate-400 text-xs line-through">{formatPrice(product.originalPrice)}</div>}
                      </div>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-md shadow-sky-500/20" onClick={(e) => { e.stopPropagation(); setCurrentPage("kontak"); }}>
                        <ShoppingCart className="w-4 h-4" /> Pesan
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="relative pt-8 pb-10 px-6 lg:pt-0 lg:pb-0 lg:px-0">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/5] max-h-[500px] lg:max-h-[600px]">
                <img src="https://images.unsplash.com/photo-1702406647675-108ee05b20b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80" alt="Tim Profesional HDB Airconds" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
              </div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-2xl p-5 max-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center"><ThumbsUp className="w-5 h-5 text-white" /></div>
                  <div><div className="text-2xl font-bold text-slate-800">98%</div><div className="text-xs text-slate-500">Kepuasan Klien</div></div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-sky-500 h-1.5 rounded-full" style={{ width: "98%" }} /></div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="absolute -top-6 -left-6 bg-sky-500 text-white rounded-2xl shadow-2xl p-5">
                <div className="text-3xl font-bold mb-1">10+</div>
                <div className="text-sky-200 text-sm">Tahun Berpengalaman</div>
                <div className="text-xs text-sky-300 mt-1">Sejak 2014</div>
              </motion.div>
              <div className="absolute -z-10 inset-0 translate-x-6 translate-y-6 rounded-3xl bg-gradient-to-br from-sky-100 to-blue-100" />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />Mengapa Pilih Kami
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-5">Kepercayaan Anda adalah <span className="text-sky-500">Prioritas Utama</span> Kami</h2>
              <p className="text-slate-500 mb-10 leading-relaxed">Dengan lebih dari 10 tahun pengalaman dan ribuan pelanggan puas, kami berkomitmen menghadirkan layanan AC terbaik dengan standar industri tertinggi.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {whyUsReasons.map((reason, i) => (
                  <motion.div key={reason.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }} className="flex items-start gap-4 group">
                    <div className={`w-10 h-10 rounded-xl ${reason.color} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200`}>
                      <reason.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-slate-800 font-semibold text-sm mb-1">{reason.title}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">{reason.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.button onClick={() => setCurrentPage("tentang")} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-10 inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-7 py-3.5 rounded-xl font-semibold shadow-lg shadow-sky-500/30 transition-all">
                Tentang Kami <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <section className="py-16 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />Merek Partner
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Tersedia 50+ Merek <span className="text-sky-500">Terpercaya</span></h2>
            <p className="text-slate-500 mt-2">Kami adalah distributor resmi berbagai merek AC ternama di dunia.</p>
          </motion.div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 sm:gap-4">
            {brands.map((brand, i) => (
              <motion.div key={brand.name} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.05 }} whileHover={{ y: -5, scale: 1.05 }} className="group flex flex-col items-center gap-2 cursor-pointer">
                <div className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${brand.color} flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-300 overflow-hidden`}>
                  <span className="text-white font-bold text-sm">{brand.logo}</span>
                  {brand.slug && (
                    <div className="absolute inset-0 bg-white flex items-center justify-center p-2.5">
                      <img
                        src={`https://cdn.simpleicons.org/${brand.slug}`}
                        alt={brand.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const wrapper = (e.currentTarget as HTMLImageElement).parentElement;
                          if (wrapper) wrapper.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
                <span className="text-slate-500 text-xs font-medium hidden sm:block text-center leading-tight">{brand.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-gradient-to-br from-sky-50 via-white to-blue-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />Testimoni
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800">Kata Mereka Tentang <span className="text-sky-500">HDB Airconds</span></h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Kepuasan pelanggan adalah bukti nyata komitmen kami dalam memberikan layanan terbaik.</p>
          </motion.div>
          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait" custom={testimonialDir}>
              <motion.div key={testimonial.id} custom={testimonialDir} initial={{ opacity: 0, x: testimonialDir * 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: testimonialDir * -60 }} transition={{ duration: 0.4 }} className="bg-white rounded-3xl shadow-xl shadow-sky-100/50 p-8 md:p-12 relative">
                <div className="absolute top-6 right-8 text-sky-100"><Quote className="w-20 h-20" /></div>
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex-shrink-0 relative">
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-sky-500 flex items-center justify-center"><Star className="w-3.5 h-3.5 text-white fill-white" /></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-1 mb-4">{[...Array(5)].map((_, i) => <Star key={i} className={`w-5 h-5 ${i < testimonial.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`} />)}</div>
                    <p className="text-slate-600 text-lg leading-relaxed mb-6 italic">"{testimonial.text}"</p>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div><div className="text-slate-800 font-bold">{testimonial.name}</div><div className="text-slate-500 text-sm">{testimonial.role} · {testimonial.location}</div></div>
                      <div className="text-right"><span className="bg-sky-50 text-sky-600 text-xs font-semibold px-3 py-1.5 rounded-lg">{testimonial.service}</span><div className="text-slate-400 text-xs mt-1">{testimonial.date}</div></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center justify-between mt-8">
              <button onClick={prevTestimonial} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 flex items-center justify-center transition-all shadow-sm"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => <button key={i} onClick={() => goToTestimonial(i)} className={`transition-all duration-300 rounded-full ${i === testimonialIndex ? "w-8 h-2.5 bg-sky-500" : "w-2.5 h-2.5 bg-slate-300 hover:bg-sky-300"}`} />)}
              </div>
              <button onClick={nextTestimonial} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 flex items-center justify-center transition-all shadow-sm"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="flex flex-wrap justify-center gap-8 mt-14">
            {[{ label: "Google Reviews", value: "4.9", count: "500+" }, { label: "Tokopedia", value: "4.8", count: "200+" }, { label: "Shopee", value: "4.9", count: "350+" }].map((platform) => (
              <div key={platform.label} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}</div>
                <div className="text-2xl font-bold text-slate-800">{platform.value}</div>
                <div className="text-slate-500 text-xs">{platform.label}</div>
                <div className="text-slate-400 text-xs">{platform.count} ulasan</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="relative bg-gradient-to-br from-sky-600 via-sky-500 to-blue-600 rounded-3xl p-8 sm:p-12 md:p-16 overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
            {[...Array(4)].map((_, i) => (
              <motion.div key={i} className="absolute" style={{ left: `${10 + i * 25}%`, top: i % 2 === 0 ? "15%" : "75%" }} animate={{ y: [0, -15, 0], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}>
                <Zap className="w-6 h-6 text-white/30" />
              </motion.div>
            ))}
            <div className="relative z-10">
              <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />Layanan 24/7 Tersedia
              </motion.div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 max-w-3xl mx-auto leading-tight">Siap Merasakan <span className="text-sky-200">Kesejukan Sempurna</span>?</h2>
              <p className="text-sky-100 text-lg mb-10 max-w-2xl mx-auto">Hubungi tim HDB Airconds sekarang untuk konsultasi gratis, survei lokasi, dan penawaran harga terbaik yang sesuai dengan kebutuhan Anda.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <motion.button onClick={() => setCurrentPage("kontak")} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto bg-white text-sky-600 hover:bg-sky-50 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl transition-all text-sm sm:text-base">
                  <Phone className="w-5 h-5" /> Hubungi Kami <ArrowRight className="w-4 h-4" />
                </motion.button>
                <motion.a href="https://wa.me/6281515729739" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl transition-all text-sm sm:text-base">
                  <MessageCircle className="w-5 h-5" /> Chat via WhatsApp
                </motion.a>
              </div>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-10 sm:mt-12 text-sm">
                {["✓ Gratis Konsultasi", "✓ Teknisi Bersertifikat", "✓ Bergaransi Resmi", "✓ Harga Transparan"].map((item) => (
                  <span key={item} className="text-sky-200 font-medium">{item}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </motion.div>
  );
}
