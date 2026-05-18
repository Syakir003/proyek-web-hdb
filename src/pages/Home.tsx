import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  ArrowRight,
  Star,
  Zap,
  Phone,
  MessageCircle,
  CheckCircle,
  Wrench,
  Settings,
  Droplets,
  Thermometer,
  ShieldCheck,
  BadgeCheck,
  Clock,
  ThumbsUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Quote,
  Users,
  Briefcase,
  Award,
  Shield,
  ShoppingCart,
  MapPin,
} from "lucide-react";

// Daftar area layanan untuk SEO long-tail "service AC [kecamatan]"
const serviceAreas = [
  { kabupaten: "Kota Mojokerto", kecamatan: ["Magersari", "Prajurit Kulon", "Kranggan"] },
  {
    kabupaten: "Kabupaten Mojokerto",
    kecamatan: [
      "Mojosari", "Sooko", "Trowulan", "Puri", "Trawas",
      "Pacet", "Pungging", "Dlanggar", "Bangsal", "Mojoanyar",
      "Jatirejo", "Gondang", "Kemlagi", "Jetis", "Dawarblandong",
      "Ngoro", "Kutorejo", "Gedeg",
    ],
  },
];

const heroSlides = [
  {
    title: "Jasa Service AC Mojokerto",
    subtitle: "Terpercaya & Bergaransi Resmi",
    description:
      "Jasa cuci AC, instalasi, dan perbaikan AC profesional di Mojokerto & Mojosari. Teknisi bersertifikat, harga transparan, layanan 24/7.",
    image: "/images/instalasi-ac-mojokerto-hdb-airconds.webp",
    accent: "Hemat Energi Hingga 40%",
  },
  {
    title: "Instalasi AC Profesional",
    subtitle: "Mojokerto, Mojosari & Sekitarnya",
    description:
      "Teknisi bersertifikat HDB Airconds siap melakukan instalasi AC di rumah, kantor, dan industri Anda dengan standar keamanan tertinggi.",
    image: "/images/proyek-instalasi-ac-mojokerto.webp",
    accent: "Garansi 2 Tahun",
  },
  {
    title: "Cuci & Servis AC Terdekat",
    subtitle: "Layanan 24/7 Siap Hadir",
    description:
      "Jangan biarkan AC Anda rusak di saat paling dibutuhkan. Tim servis darurat kami hadir kapanpun dan dimanapun.",
    image: "/images/service-ac-properti-mojokerto.webp",
    accent: "Respon < 2 Jam",
  },
];

const floatingBadges = [
  { icon: Shield, text: "Bergaransi Resmi", color: "from-sky-500 to-blue-600" },
  { icon: Zap, text: "Hemat Listrik", color: "from-amber-400 to-orange-500" },
  { icon: Star, text: "Rating 4.9/5", color: "from-emerald-400 to-teal-500" },
];

const statsData = [
  {
    icon: Users,
    value: 5000,
    suffix: "+",
    label: "Pelanggan Puas",
    desc: "Di seluruh Indonesia",
    color: "from-sky-400 to-sky-600",
  },
  {
    icon: Briefcase,
    value: 10,
    suffix: "+",
    label: "Tahun Pengalaman",
    desc: "Berdiri sejak 2014",
    color: "from-blue-400 to-blue-600",
  },
  {
    icon: Award,
    value: 50,
    suffix: "+",
    label: "Merek Tersedia",
    desc: "Pilihan terlengkap",
    color: "from-cyan-400 to-cyan-600",
  },
  {
    icon: Clock,
    value: 24,
    suffix: "/7",
    label: "Layanan Darurat",
    desc: "Siap kapan saja",
    color: "from-indigo-400 to-indigo-600",
  },
];

const serviceIconMap: Record<string, React.ElementType> = {
  droplets: Droplets,
  wrench: Wrench,
  settings: Settings,
  zap: Zap,
  thermometer: Thermometer,
  gauge: Thermometer,
};

const serviceColorConfig = [
  { iconBg: "bg-sky-100", iconColor: "text-sky-600" },
  { iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
  { iconBg: "bg-violet-100", iconColor: "text-violet-600" },
  { iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  { iconBg: "bg-amber-100", iconColor: "text-amber-600" },
];

const serviceGradMap = [
  "from-sky-400 to-sky-600",
  "from-blue-400 to-blue-600",
  "from-indigo-400 to-indigo-600",
  "from-violet-400 to-violet-600",
  "from-emerald-400 to-emerald-600",
  "from-amber-400 to-orange-500",
];

const tagColors = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-violet-500",
  "bg-teal-500",
  "bg-pink-500",
];

const whyUsReasons = [
  {
    icon: BadgeCheck,
    title: "Teknisi Bersertifikat",
    description:
      "Semua teknisi kami telah mendapatkan sertifikasi resmi dan pelatihan intensif untuk memastikan kualitas kerja terbaik.",
    color: "bg-sky-500",
  },
  {
    icon: Clock,
    title: "Respon Cepat",
    description:
      "Layanan darurat dengan waktu respons kurang dari 2 jam. Kami hadir ketika Anda paling membutuhkan.",
    color: "bg-blue-500",
  },
  {
    icon: ShieldCheck,
    title: "Bergaransi Resmi",
    description:
      "Setiap produk dan layanan dilengkapi garansi resmi. Kami bertanggung jawab atas setiap pekerjaan kami.",
    color: "bg-cyan-500",
  },
  {
    icon: ThumbsUp,
    title: "Harga Transparan",
    description:
      "Tidak ada biaya tersembunyi. Kami memberikan estimasi biaya yang jelas sebelum pekerjaan dimulai.",
    color: "bg-indigo-500",
  },
  {
    icon: Wrench,
    title: "Spare Part Original",
    description:
      "Kami hanya menggunakan komponen original dari merek terpercaya untuk menjamin keawetan peralatan Anda.",
    color: "bg-violet-500",
  },
  {
    icon: Phone,
    title: "After-Sale Support",
    description:
      "Layanan purna jual yang responsif. Tim kami siap membantu via WhatsApp, telepon, atau kunjungan langsung.",
    color: "bg-emerald-500",
  },
];

const brands = [
  {
    name: "Samsung",
    logoUrl: "https://cdn.simpleicons.org/samsung",
    abbr: "S",
    color: "from-blue-600 to-blue-800",
  },
  {
    name: "Daikin",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/DAIKIN_logo.svg/330px-DAIKIN_logo.svg.png",
    abbr: "DAIKIN",
    color: "from-sky-400 to-sky-600",
  },
  {
    name: "Panasonic",
    logoUrl: "https://cdn.simpleicons.org/panasonic",
    abbr: "P",
    color: "from-indigo-600 to-indigo-800",
  },
  {
    name: "Mitsubishi",
    logoUrl: "https://cdn.simpleicons.org/mitsubishi",
    abbr: "M",
    color: "from-red-600 to-red-800",
  },
  {
    name: "LG",
    logoUrl: "https://cdn.simpleicons.org/lg",
    abbr: "LG",
    color: "from-rose-600 to-rose-800",
  },
  {
    name: "Sharp",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Sharp-Logo.svg/330px-Sharp-Logo.svg.png",
    abbr: "Sh",
    color: "from-teal-500 to-teal-700",
  },
  {
    name: "Gree",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Gree_electric_appliances_logo.svg/960px-Gree_electric_appliances_logo.svg.png",
    abbr: "GREE",
    color: "from-green-600 to-green-800",
  },
  {
    name: "Midea",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Midea.svg/330px-Midea.svg.png",
    abbr: "midea",
    color: "from-blue-500 to-blue-700",
  },
  {
    name: "Haier",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Haier_logo.svg/330px-Haier_logo.svg.png",
    abbr: "Haier",
    color: "from-sky-600 to-blue-700",
  },
  {
    name: "Toshiba",
    logoUrl: "https://cdn.simpleicons.org/toshiba",
    abbr: "T",
    color: "from-red-500 to-red-700",
  },
];

function BrandCard({
  name,
  logoUrl,
  abbr,
  color,
}: {
  name: string;
  logoUrl: string;
  abbr: string;
  color: string;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="flex-shrink-0 flex flex-col items-center gap-3 group">
      <div className="w-28 h-28 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center p-4 group-hover:shadow-xl group-hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
        {!imgError ? (
          <img
            src={logoUrl}
            alt={`Logo ${name} - merek AC tersedia di HDB Airconds Mojokerto`}
            width="80"
            height="80"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={`w-full h-full rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}
          >
            <span className="text-white font-black text-xs tracking-wider text-center px-1 leading-snug">
              {abbr}
            </span>
          </div>
        )}
      </div>
      <span className="text-sm font-semibold text-slate-600 group-hover:text-sky-600 transition-colors">
        {name}
      </span>
    </div>
  );
}

const testimonials = [
  {
    id: 1,
    name: "Budi Santoso",
    role: "Pemilik Rumah",
    location: "Mojosari, Kab. Mojokerto",
    avatar:
      "https://images.unsplash.com/photo-1758600432569-4fcd02721f80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&q=80",
    rating: 5,
    service: "Instalasi AC Baru",
    date: "Maret 2025",
    text: "Pelayanan HDB Airconds sangat memuaskan! Teknisi datang tepat waktu, pemasangan AC baru berjalan lancar dan bersih. Harga pun sangat transparan tanpa biaya kejutan. Sangat direkomendasikan!",
  },
  {
    id: 2,
    name: "Siti Rahayu",
    role: "Ibu Rumah Tangga",
    location: "Sooko, Kab. Mojokerto",
    avatar:
      "https://images.unsplash.com/photo-1702406647675-108ee05b20b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&q=80",
    rating: 5,
    service: "Servis Darurat",
    date: "Februari 2025",
    text: "AC saya rusak mendadak di malam hari, langsung hubungi HDB Airconds. Kurang dari 2 jam teknisi sudah datang dan masalah teratasi. Benar-benar layanan 24 jam yang bisa diandalkan!",
  },
  {
    id: 3,
    name: "Ahmad Rizky",
    role: "Manager Operasional",
    location: "Magersari, Kota Mojokerto",
    avatar:
      "https://images.unsplash.com/photo-1660330589827-da8ab7dd3c02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&q=80",
    rating: 5,
    service: "Perawatan Rutin (Commercial)",
    date: "Januari 2025",
    text: "Kami mempercayakan perawatan 20+ unit AC di kantor kami kepada HDB Airconds. Kerja mereka profesional, jadwal maintenance selalu tepat, dan laporan kondisi AC diberikan setiap kali service.",
  },
  {
    id: 4,
    name: "Dewi Kartika",
    role: "Arsitek Interior",
    location: "Puri, Kab. Mojokerto",
    avatar:
      "https://images.unsplash.com/photo-1773101883566-0827c4fd907c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&q=80",
    rating: 5,
    service: "Instalasi Multiple Unit",
    date: "April 2025",
    text: "Saya sering merekomendasikan HDB Airconds ke klien saya. Instalasi mereka sangat rapi dan memperhatikan estetika. Tim mereka juga sangat komunikatif dalam menjelaskan opsi terbaik.",
  },
  {
    id: 5,
    name: "Reza Firmansyah",
    role: "Pengusaha Kuliner",
    location: "Prajurit Kulon, Kota Mojokerto",
    avatar:
      "https://images.unsplash.com/photo-1711696488222-3a5af2a3dd72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&q=80",
    rating: 4,
    service: "Penjualan + Instalasi",
    date: "Maret 2025",
    text: "Beli AC baru di HDB Airconds, harga kompetitif dengan produk original bergaransi resmi. Proses pembelian mudah dan pengiriman + instalasi selesai dalam 1 hari. Puas dengan pelayanannya!",
  },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
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
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(start);
    }, 25);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

export default function Home({
  setCurrentPage,
}: {
  setCurrentPage: (page: string) => void;
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [testimonialDir, setTestimonialDir] = useState(1);
  const [servicesData, setServicesData] = useState<any[]>([]);
  const [productsData, setProductsData] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(
      () => setActiveSlide((p) => (p + 1) % heroSlides.length),
      5000,
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setServicesData(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          const mapped = data.data.map((p: any, i: number) => ({
            id: p.id,
            name: p.name,
            category: p.type || "Lainnya",
            brand: p.brand || "-",
            price: Number(p.price) || 0,
            rating: 4.8,
            reviews: 0,
            image: p.image || null,
            image_alt: p.image_alt || `${p.name} ${p.brand || ""} ${p.type || ""} ${p.capacity || ""} - jual AC Mojokerto HDB Airconds`.replace(/\s+/g, " ").trim(),
            tag: i === 0 ? "Terbaru" : p.type || "",
            tagColor: tagColors[i % tagColors.length],
            specs: [p.capacity, p.type, p.brand].filter(Boolean),
            isNew: i === 0,
          }));
          setProductsData(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const previewProducts = productsData.slice(0, 6);

  const prevTestimonial = () => {
    setTestimonialDir(-1);
    setTestimonialIndex(
      (p) => (p - 1 + testimonials.length) % testimonials.length,
    );
  };
  const nextTestimonial = () => {
    setTestimonialDir(1);
    setTestimonialIndex((p) => (p + 1) % testimonials.length);
  };
  const goToTestimonial = (i: number) => {
    setTestimonialDir(i > testimonialIndex ? 1 : -1);
    setTestimonialIndex(i);
  };

  const slide = heroSlides[activeSlide];
  const testimonial = testimonials[testimonialIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white"
    >
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-slate-900">
        {heroSlides.map((s, i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            animate={{ opacity: i === activeSlide ? 1 : 0 }}
            transition={{ duration: 1.2 }}
          >
            <img
              src={s.image}
              alt={`${s.title} – HDB Airconds`}
              width="1920"
              height="1080"
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "low"}
              decoding="async"
              className="w-full h-full object-cover"
            />
          </motion.div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-sky-400/30"
              style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.4,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 w-full">
          {/* H1 statis untuk SEO — selalu konsisten, tidak berubah karena slider */}
          <h1 className="sr-only">
            HDB Airconds — Jasa Cuci & Service AC Mojokerto, Mojosari & Sekitarnya
          </h1>
          <div className="max-w-3xl">
            <motion.div
              key={activeSlide + "b"}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-sky-500/20 backdrop-blur-sm border border-sky-400/30 text-sky-300 px-4 py-1.5 rounded-full text-sm font-medium mb-5"
            >
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              {slide.accent}
            </motion.div>
            <motion.div
              key={activeSlide + "t"}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-2">
                {slide.title}
              </h2>
              <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-sky-400 leading-tight mb-5">
                {slide.subtitle}
              </p>
            </motion.div>
            <motion.p
              key={activeSlide + "d"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-slate-300 text-base sm:text-lg leading-relaxed mb-7 max-w-xl"
            >
              {slide.description}
            </motion.p>
            <motion.div
              key={activeSlide + "f"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="hidden sm:flex flex-wrap gap-x-6 gap-y-2 mb-8"
            >
              {[
                "Gratis Konsultasi",
                "Teknisi Bersertifikat",
                "Spare Part Original",
              ].map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-2 text-slate-300 text-sm"
                >
                  <CheckCircle className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </motion.div>
            <motion.div
              key={activeSlide + "c"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-3 sm:gap-4"
            >
              <motion.button
                onClick={() => setCurrentPage("katalog")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-sky-500 hover:bg-sky-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-sky-500/30 transition-colors text-sm sm:text-base"
              >
                Lihat Produk <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
              <motion.button
                onClick={() => setCurrentPage("kontak")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/30 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold flex items-center gap-2 transition-all text-sm sm:text-base"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" /> Konsultasi Gratis
              </motion.button>
            </motion.div>
          </div>

          <div className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4">
            {floatingBadges.map((badge, i) => (
              <motion.div
                key={badge.text}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.15, duration: 0.5 }}
                whileHover={{ x: -5 }}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3"
              >
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center flex-shrink-0`}
                >
                  <badge.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium whitespace-nowrap">
                  {badge.text}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`transition-all duration-300 rounded-full ${i === activeSlide ? "w-8 h-2.5 bg-sky-400" : "w-2.5 h-2.5 bg-white/40 hover:bg-white/60"}`}
              />
            ))}
          </div>
          <motion.button
            onClick={() =>
              window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
            }
            className="absolute bottom-10 right-8 text-white/50 hover:text-white/80 transition-colors flex flex-col items-center gap-1 text-xs"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
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
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} mx-auto mb-4 flex items-center justify-center shadow-lg`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">
                    <CountUp target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-white font-semibold text-sm mb-1">
                    {stat.label}
                  </div>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              Layanan Kami
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
              Jasa Service AC Mojokerto &amp; Mojosari,{" "}
              <span className="text-sky-500">Semua Kami Tangani</span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Cuci AC, isi freon, instalasi, hingga perbaikan – layanan AC
              lengkap di Mojokerto, Mojosari, dan sekitarnya dengan teknisi
              bersertifikat dan harga transparan.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicesData.map((service, i) => {
              const colors = serviceColorConfig[i % serviceColorConfig.length];
              const IconComponent = serviceIconMap[service.icon] || Wrench;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300 cursor-pointer"
                  onClick={() => setCurrentPage("layanan")}
                >
                  <div
                    className={`rounded-xl ${colors.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                    style={{ width: 52, height: 52 }}
                  >
                    <IconComponent className={`w-6 h-6 ${colors.iconColor}`} />
                  </div>
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <h3 className="text-slate-800 font-semibold text-lg leading-tight">
                      {service.name}
                    </h3>
                    <span className="bg-sky-50 text-sky-600 text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap flex-shrink-0">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed mb-5">
                    {service.description}
                  </p>
                  <div
                    className={`flex items-center gap-1.5 text-sm font-semibold ${colors.iconColor} group-hover:gap-3 transition-all duration-200`}
                  >
                    Selengkapnya <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.div>
              );
            })}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-12"
          >
            <button
              onClick={() => setCurrentPage("layanan")}
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-sky-500/30 transition-all duration-200 hover:-translate-y-0.5"
            >
              Lihat Semua Layanan <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-10"
          >
            <div>
              <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                Produk Kami
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-800">
                Sparepart &amp; AC <span className="text-sky-500">Terlengkap di Mojokerto</span>
              </h2>
              <p className="text-slate-500 mt-2 max-w-lg">
                50+ merek AC terkemuka dengan harga terbaik, garansi resmi, dan
                pengiriman ke seluruh Mojokerto & Mojosari.
              </p>
            </div>
            <button
              onClick={() => setCurrentPage("katalog")}
              className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold text-sm border border-sky-200 hover:border-sky-400 px-4 py-2 rounded-xl transition-all"
            >
              Semua Produk <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {previewProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-sky-100/60 transition-all duration-300 group cursor-pointer"
                  onClick={() => setCurrentPage("katalog")}
                >
                  <div className="relative h-52 overflow-hidden bg-gradient-to-br from-sky-50 to-slate-100">
                    <img
                      src={product.image}
                      alt={product.image_alt || `${product.name} ${product.brand} ${product.category} - jual AC Mojokerto HDB Airconds`}
                      width="400"
                      height="208"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span
                      className={`absolute top-3 left-3 ${product.tagColor} text-white text-xs font-semibold px-2.5 py-1 rounded-lg`}
                    >
                      {product.tag}
                    </span>
                    {product.isNew && (
                      <span className="absolute top-3 right-3 bg-white text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg shadow">
                        Baru
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="text-xs text-sky-500 font-semibold uppercase tracking-wide mb-1">
                      {product.brand} · {product.category}
                    </div>
                    <h3 className="text-slate-800 font-semibold mb-3 group-hover:text-sky-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {product.specs.map((spec: string) => (
                        <span
                          key={spec}
                          className="bg-sky-50 text-sky-600 text-xs px-2 py-0.5 rounded-md font-medium"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sky-600 font-bold text-lg">
                          {formatPrice(product.price)}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-md shadow-sky-500/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPage("kontak");
                        }}
                      >
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
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative pt-8 pb-10 px-6 lg:pt-0 lg:pb-0 lg:px-0"
            >
              <div className="relative rounded-3xl overflow-hidden aspect-[4/5] max-h-[500px] lg:max-h-[600px]">
                <img
                  src="/images/tim-teknisi-ac-mojokerto-hdb.webp"
                  alt="Tim teknisi profesional HDB Airconds – jasa service AC Mojokerto berpengalaman"
                  width="800"
                  height="1000"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-2xl p-5 max-w-[200px]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center">
                    <ThumbsUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">98%</div>
                    <div className="text-xs text-slate-500">Kepuasan Klien</div>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-sky-500 h-1.5 rounded-full"
                    style={{ width: "98%" }}
                  />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -top-6 -left-6 bg-sky-500 text-white rounded-2xl shadow-2xl p-5"
              >
                <div className="text-3xl font-bold mb-1">10+</div>
                <div className="text-sky-200 text-sm">Tahun Berpengalaman</div>
                <div className="text-xs text-sky-300 mt-1">Sejak 2014</div>
              </motion.div>
              <div className="absolute -z-10 inset-0 translate-x-6 translate-y-6 rounded-3xl bg-gradient-to-br from-sky-100 to-blue-100" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                Mengapa Pilih Kami
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-5">
                Kepercayaan Anda adalah{" "}
                <span className="text-sky-500">Prioritas Utama</span> Kami
              </h2>
              <p className="text-slate-500 mb-10 leading-relaxed">
                Dengan lebih dari 10 tahun pengalaman dan ribuan pelanggan puas,
                kami berkomitmen menghadirkan layanan AC terbaik dengan standar
                industri tertinggi.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {whyUsReasons.map((reason, i) => (
                  <motion.div
                    key={reason.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="flex items-start gap-4 group"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${reason.color} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200`}
                    >
                      <reason.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-slate-800 font-semibold text-sm mb-1">
                        {reason.title}
                      </h4>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        {reason.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.button
                onClick={() => setCurrentPage("tentang")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-10 inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-7 py-3.5 rounded-xl font-semibold shadow-lg shadow-sky-500/30 transition-all"
              >
                Tentang Kami <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AREA LAYANAN — SEO long-tail per kecamatan */}
      <section className="py-20 bg-gradient-to-br from-sky-50 via-white to-blue-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <MapPin className="w-4 h-4" />
              Area Layanan
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
              Jasa Service AC{" "}
              <span className="text-sky-500">Mojokerto Raya & Sekitarnya</span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              HDB Airconds melayani panggilan service, cuci, dan instalasi AC ke
              seluruh wilayah Kota Mojokerto, Kabupaten Mojokerto, hingga Mojosari
              dan kecamatan sekitarnya. Hubungi kami untuk wilayah yang belum
              tercantum di bawah.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {serviceAreas.map((area, idx) => (
              <motion.div
                key={area.kabupaten}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white rounded-2xl border border-sky-100 shadow-sm hover:shadow-md transition-shadow p-6 sm:p-8"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                    {area.kabupaten}
                  </h3>
                </div>
                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {area.kecamatan.map((kec) => (
                    <li
                      key={kec}
                      className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-sky-600 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                      <span>Service AC {kec}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mt-10 bg-white rounded-2xl border border-sky-100 p-6 max-w-3xl mx-auto"
          >
            <p className="text-slate-600 text-sm mb-4">
              <strong className="text-slate-800">Lokasi Kantor:</strong>{" "}
              Jl. Gajah Mada No.19, Rw. III, Seduri, Kec. Mojosari, Kabupaten
              Mojokerto, Jawa Timur 61382
            </p>
            <a
              href="https://wa.me/6281515729739?text=Halo%20saya%20ingin%20bertanya%20layanan%20AC"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md shadow-sky-500/20 transition-all hover:-translate-y-0.5"
            >
              <Phone className="w-4 h-4" /> Cek Ketersediaan Wilayah Anda
            </a>
          </motion.div>
        </div>
      </section>

      {/* BRANDS */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              Merek Partner
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800">
              Tersedia 50+ Merek{" "}
              <span className="text-sky-500">Terpercaya</span>
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Kami adalah distributor resmi berbagai merek AC ternama di dunia.
            </p>
          </motion.div>
        </div>
        <div className="relative marquee-wrapper py-4">
          <div className="absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          <div className="animate-marquee gap-8 px-8">
            {[...brands, ...brands].map((brand, i) => (
              <BrandCard key={i} {...brand} />
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-gradient-to-br from-sky-50 via-white to-blue-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              Testimoni
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800">
              Kata Mereka Tentang{" "}
              <span className="text-sky-500">HDB Airconds</span>
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Kepuasan pelanggan adalah bukti nyata komitmen kami dalam
              memberikan layanan terbaik.
            </p>
          </motion.div>
          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait" custom={testimonialDir}>
              <motion.div
                key={testimonial.id}
                custom={testimonialDir}
                initial={{ opacity: 0, x: testimonialDir * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: testimonialDir * -60 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-3xl shadow-xl shadow-sky-100/50 p-8 md:p-12 relative"
              >
                <div className="absolute top-6 right-8 text-sky-100">
                  <Quote className="w-20 h-20" />
                </div>
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex-shrink-0 relative">
                    <img
                      src={testimonial.avatar}
                      alt={`Testimoni ${testimonial.name} - pelanggan HDB Airconds, ${testimonial.service}`}
                      width="80"
                      height="80"
                      loading="lazy"
                      decoding="async"
                      className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-sky-500 flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${i < testimonial.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`}
                        />
                      ))}
                    </div>
                    <p className="text-slate-600 text-lg leading-relaxed mb-6 italic">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="text-slate-800 font-bold">
                          {testimonial.name}
                        </div>
                        <div className="text-slate-500 text-sm">
                          {testimonial.role} · {testimonial.location}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="bg-sky-50 text-sky-600 text-xs font-semibold px-3 py-1.5 rounded-lg">
                          {testimonial.service}
                        </span>
                        <div className="text-slate-400 text-xs mt-1">
                          {testimonial.date}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={prevTestimonial}
                className="w-12 h-12 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 flex items-center justify-center transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToTestimonial(i)}
                    className={`transition-all duration-300 rounded-full ${i === testimonialIndex ? "w-8 h-2.5 bg-sky-500" : "w-2.5 h-2.5 bg-slate-300 hover:bg-sky-300"}`}
                  />
                ))}
              </div>
              <button
                onClick={nextTestimonial}
                className="w-12 h-12 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 flex items-center justify-center transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative bg-gradient-to-br from-sky-600 via-sky-500 to-blue-600 rounded-3xl p-8 sm:p-12 md:p-16 overflow-hidden text-center"
          >
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${10 + i * 25}%`,
                  top: i % 2 === 0 ? "15%" : "75%",
                }}
                animate={{ y: [0, -15, 0], opacity: [0.2, 0.5, 0.2] }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.4,
                }}
              >
                <Zap className="w-6 h-6 text-white/30" />
              </motion.div>
            ))}
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6"
              >
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Layanan 24/7 Tersedia
              </motion.div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 max-w-3xl mx-auto leading-tight">
                Siap Merasakan{" "}
                <span className="text-sky-200">Kesejukan Sempurna</span>?
              </h2>
              <p className="text-sky-100 text-lg mb-10 max-w-2xl mx-auto">
                Hubungi tim HDB Airconds sekarang untuk konsultasi gratis,
                survei lokasi, dan penawaran harga terbaik yang sesuai dengan
                kebutuhan Anda.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <motion.button
                  onClick={() => setCurrentPage("kontak")}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto bg-white text-sky-600 hover:bg-sky-50 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl transition-all text-sm sm:text-base"
                >
                  <Phone className="w-5 h-5" /> Hubungi Kami{" "}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
                <motion.a
                  href="https://wa.me/6281515729739"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl transition-all text-sm sm:text-base"
                >
                  <MessageCircle className="w-5 h-5" /> Chat via WhatsApp
                </motion.a>
              </div>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-10 sm:mt-12 text-sm">
                {[
                  "✓ Gratis Konsultasi",
                  "✓ Teknisi Bersertifikat",
                  "✓ Bergaransi Resmi",
                  "✓ Harga Transparan",
                ].map((item) => (
                  <span key={item} className="text-sky-200 font-medium">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
