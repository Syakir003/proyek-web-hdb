import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Droplets, Wrench, ArrowLeftRight, Zap,
  CheckCircle, Phone, MessageCircle, ArrowRight, ChevronDown, ChevronUp, X, Loader2,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  droplets: Droplets,
  wrench: Wrench,
  zap: Zap,
  gauge: Droplets,
};

const colorList = ["sky", "sky", "sky", "sky"];
const colorMap: Record<string, { bg: string; text: string; light: string; badge: string }> = {
  sky:    { bg: "bg-sky-500",    text: "text-sky-600",    light: "bg-sky-50",    badge: "bg-sky-100 text-sky-700" },
  blue:   { bg: "bg-blue-500",   text: "text-blue-600",   light: "bg-blue-50",   badge: "bg-blue-100 text-blue-700" },
  indigo: { bg: "bg-indigo-500", text: "text-indigo-600", light: "bg-indigo-50", badge: "bg-indigo-100 text-indigo-700" },
  violet: { bg: "bg-violet-500", text: "text-violet-600", light: "bg-violet-50", badge: "bg-violet-100 text-violet-700" },
};

const serviceDetails: Record<string, { tagline: string; features: string[] }> = {
  droplets: {
    tagline: "Pembersihan menyeluruh untuk AC optimal",
    features: ["Cuci unit indoor & outdoor", "Pembersihan filter & evaporator", "Pengecekan kondisi umum AC", "Pengerjaan rapi & cepat"],
  },
  gauge: {
    tagline: "Pengisian refrigerant untuk pendinginan maksimal",
    features: ["Freon R32 / R410A / R22 asli", "Cek kebocoran sebelum isi", "Pengisian sesuai takaran standar", "Garansi tidak bocor 30 hari"],
  },
  wrench: {
    tagline: "Relokasi & pemasangan unit baru bergaransi",
    features: ["Pembongkaran aman tanpa merusak unit", "Re-instalasi presisi di lokasi baru", "Uji coba ulang setelah pemasangan", "Garansi fungsi unit setelah pasang"],
  },
  zap: {
    tagline: "Perbaikan modul PCB & sistem kelistrikan",
    features: ["Diagnosa gratis sebelum perbaikan", "Spare part original bergaransi", "Garansi perbaikan 30 hari", "Semua merek & tipe ditangani"],
  },
};

// Cocokkan detail & ikon dari NAMA layanan (stabil), bukan dari kolom `icon`.
// Form admin mengirim ulang `icon` tiap kali Simpan, jadi `icon` rawan ketimpa
// walau yang diubah cuma harga — kalau dipakai sebagai kunci, detail bisa hilang.
const nameToIconKey: { keywords: string[]; icon: string }[] = [
  { keywords: ["cuci"], icon: "droplets" },
  { keywords: ["freon"], icon: "gauge" },
  { keywords: ["bongkar", "pasang", "instalasi"], icon: "wrench" },
  { keywords: ["perbaikan", "kelistrikan", "maintenance"], icon: "zap" },
];

function resolveIconKey(service: { name: string; icon: string }): string {
  const name = (service.name || "").toLowerCase();
  const match = nameToIconKey.find((m) => m.keywords.some((k) => name.includes(k)));
  return match?.icon ?? service.icon;
}

const staticServices = [
  { id: "s1", name: "Cuci AC (Cleaning)", price: 90000, description: "Pembersihan menyeluruh unit indoor dan outdoor.", icon: "droplets" },
  { id: "s2", name: "Tambah / Isi Freon", price: 150000, description: "Pengecekan tekanan dan pengisian freon.", icon: "gauge" },
  { id: "s3", name: "Bongkar Pasang AC", price: 350000, description: "Jasa pemindahan AC atau pemasangan unit baru.", icon: "wrench" },
  { id: "s4", name: "Perbaikan Kelistrikan", price: 250000, description: "Perbaikan masalah kelistrikan atau modul PCB.", icon: "zap" },
];

const faqs = [
  { q: "Berapa lama proses instalasi AC?", a: "Instalasi AC split standar membutuhkan waktu 2–4 jam tergantung kondisi lokasi. Untuk multiple unit bisa lebih lama, biasanya diselesaikan dalam 1 hari kerja." },
  { q: "Apakah ada garansi untuk setiap layanan?", a: "Ya, semua layanan kami dilengkapi garansi. Instalasi bergaransi 1 tahun, perbaikan bergaransi 30 hari, dan pengisian freon bergaransi tidak bocor 30 hari." },
  { q: "Apakah melayani panggilan darurat malam hari?", a: "Ya, kami melayani 24/7 termasuk malam hari dan hari libur. Hubungi kami via WhatsApp atau telepon untuk layanan darurat." },
  { q: "Apakah survei lokasi dikenakan biaya?", a: "Survei lokasi sebelum instalasi dan konsultasi sepenuhnya GRATIS tanpa ada kewajiban apapun dari Anda." },
  { q: "Merek AC apa saja yang ditangani?", a: "Kami menangani semua merek AC populer: Daikin, Panasonic, Samsung, LG, Sharp, Mitsubishi, Gree, Midea, Haier, Toshiba, dan merek lainnya." },
];

function formatRupiah(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price);
}

interface LayananProps {
  setCurrentPage: (page: string) => void;
  onAddServiceToCart?: (service: { id: string; name: string; price: number; description: string; icon: string }) => void;
}

export default function Layanan({ setCurrentPage, onAddServiceToCart }: LayananProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [services, setServices] = useState(staticServices);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setServices(data.data.map((s: any) => ({
            id: s.id.toString(),
            name: s.name,
            price: Number(s.price),
            description: s.description,
            icon: s.icon,
          })));
        }
      })
      .catch(() => {});
  }, []);

  // Modal tier harga Cuci AC
  const [tierModal, setTierModal] = useState<{ open: boolean; service: any; tiers: any[]; loading: boolean; selected: any | null }>({
    open: false, service: null, tiers: [], loading: false, selected: null,
  });

  const openTierModal = async (service: any) => {
    setTierModal({ open: true, service, tiers: [], loading: true, selected: null });
    try {
      const res = await fetch(`/api/service-tiers/${service.id}`);
      const data = await res.json();
      setTierModal(prev => ({ ...prev, tiers: data.success ? data.data : [], loading: false }));
    } catch {
      setTierModal(prev => ({ ...prev, loading: false }));
    }
  };

  const confirmTierOrder = () => {
    if (!tierModal.selected || !onAddServiceToCart) return;
    onAddServiceToCart({
      id: `${tierModal.service.id}-tier-${tierModal.selected.id}`,
      name: `${tierModal.service.name} (${tierModal.selected.label})`,
      price: Number(tierModal.selected.price),
      description: tierModal.service.description,
      icon: tierModal.service.icon,
    });
    setTierModal({ open: false, service: null, tiers: [], loading: false, selected: null });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white min-h-screen"
    >
      {/* Hero */}
      <div className="relative bg-slate-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pasang-ac-split-mojokerto.webp')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-sky-900/90 via-sky-800/75 to-sky-700/60" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Layanan Profesional
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Jasa Service AC Mojokerto &amp; Sekitarnya{" "}
              <span className="text-sky-200">– Profesional &amp; Bergaransi</span>
            </h1>
            <p className="text-sky-100 text-lg max-w-2xl mx-auto mb-8">
              Jasa cuci AC, isi freon, bongkar pasang, dan perbaikan AC di Mojokerto, Mojosari, dan sekitarnya. Teknisi bersertifikat, harga transparan, garansi resmi.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/6281515729739?text=Halo%20saya%20ingin%20pesan%20layanan"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-sky-600 hover:bg-sky-50 px-6 py-3.5 rounded-xl font-semibold shadow-lg transition-all"
              >
                <MessageCircle className="w-5 h-5" /> Pesan via WhatsApp
              </a>
              <button
                onClick={() => setCurrentPage("kontak")}
                className="inline-flex items-center gap-2 bg-white/15 border border-white/30 hover:bg-white/25 text-white px-6 py-3.5 rounded-xl font-semibold transition-all"
              >
                <Phone className="w-5 h-5" /> Hubungi Kami
              </button>
            </div>
          </motion.div>
        </div>
      </div>


      {/* Services Grid */}
      <div className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Pilih <span className="text-sky-500">Layanan AC</span> Anda
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">Jasa cuci AC, service AC terdekat di Mojokerto dan Mojosari. Klik layanan untuk detail harga dan pemesanan.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {services.map((service, i) => {
              const colorKey = colorList[i % colorList.length];
              const c = colorMap[colorKey];
              const iconKey = resolveIconKey(service);
              const Icon = iconMap[iconKey] ?? Wrench;
              const detail = serviceDetails[iconKey] ?? { tagline: "", features: [] };
              const isPerbaikan = service.name.toLowerCase().includes("perbaikan");
              const isCuciAC = service.name.toLowerCase().includes("cuci");
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300 flex flex-col"
                >
                  <div className={`w-12 h-12 rounded-xl ${c.light} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${c.text}`} />
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-slate-800 font-bold text-lg">{service.name}</h3>
                    {isPerbaikan ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap bg-slate-100 text-slate-600">
                        Harga Konsultasi
                      </span>
                    ) : (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap ${c.badge}`}>{formatRupiah(service.price)}</span>
                    )}
                  </div>
                  {detail.tagline && <p className={`text-xs font-medium mb-3 ${c.text}`}>{detail.tagline}</p>}
                  <p className="text-slate-500 text-sm leading-relaxed mb-5">{service.description}</p>
                  {detail.features.length > 0 && (
                    <ul className="space-y-2 mb-6 flex-1">
                      {detail.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${c.text}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  {isPerbaikan ? (
                    <a
                      href={`https://wa.me/6281515729739?text=Halo%2C%20saya%20ingin%20konsultasi%20harga%20untuk%20layanan%20${encodeURIComponent(service.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all mt-auto"
                    >
                      <MessageCircle className="w-4 h-4" /> Konsultasi via WhatsApp
                    </a>
                  ) : isCuciAC ? (
                    <button
                      onClick={() => openTierModal(service)}
                      className={`w-full inline-flex items-center justify-center gap-2 ${c.bg} hover:opacity-90 text-white py-2.5 rounded-xl text-sm font-semibold transition-all mt-auto`}
                    >
                      <MessageCircle className="w-4 h-4" /> Pilih Tipe & Pesan
                    </button>
                  ) : (
                    <button
                      onClick={() => onAddServiceToCart?.(service)}
                      className={`w-full inline-flex items-center justify-center gap-2 ${c.bg} hover:opacity-90 text-white py-2.5 rounded-xl text-sm font-semibold transition-all mt-auto`}
                    >
                      <MessageCircle className="w-4 h-4" /> Pesan Sekarang
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              FAQ Jasa <span className="text-sky-500">Service AC Mojokerto</span>
            </h2>
            <p className="text-slate-500">Pertanyaan umum seputar layanan cuci AC, service AC, dan instalasi AC di Mojokerto & Mojosari.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-slate-800 text-sm pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-sky-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-slate-500 text-sm leading-relaxed border-t border-slate-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 bg-gradient-to-br from-sky-600 to-sky-400 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Siap Memesan Layanan?</h2>
          <p className="text-sky-100 mb-8">Hubungi kami sekarang untuk konsultasi gratis dan penawaran terbaik.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/6281515729739?text=Halo%20saya%20ingin%20bertanya%20tentang%20layanan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-sky-600 hover:bg-sky-50 px-7 py-3.5 rounded-xl font-bold shadow-lg transition-all"
            >
              <MessageCircle className="w-5 h-5" /> Chat WhatsApp
            </a>
            <button
              onClick={() => setCurrentPage("kontak")}
              className="inline-flex items-center gap-2 bg-white/15 border border-white/30 hover:bg-white/25 px-7 py-3.5 rounded-xl font-bold transition-all"
            >
              <ArrowRight className="w-5 h-5" /> Form Kontak
            </button>
          </div>
        </div>
      </div>

      {/* Modal Pilih Tipe AC — Cuci AC */}
      <AnimatePresence>
        {tierModal.open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4"
            onClick={() => setTierModal(prev => ({ ...prev, open: false }))}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">{tierModal.service?.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Pilih tipe/ukuran AC Anda</p>
                </div>
                <button onClick={() => setTierModal(prev => ({ ...prev, open: false }))} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5">
                {tierModal.loading ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" /> Memuat pilihan...
                  </div>
                ) : tierModal.tiers.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">Tier harga belum tersedia. Hubungi admin.</p>
                ) : (
                  <div className="space-y-2">
                    {tierModal.tiers.map(tier => (
                      <button
                        key={tier.id}
                        onClick={() => setTierModal(prev => ({ ...prev, selected: tier }))}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                          tierModal.selected?.id === tier.id
                            ? 'border-sky-500 bg-sky-50'
                            : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50/50'
                        }`}
                      >
                        <span className="font-semibold text-slate-800 text-sm">{tier.label}</span>
                        <span className="text-sky-600 font-bold text-sm">{formatRupiah(Number(tier.price))}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!tierModal.loading && tierModal.tiers.length > 0 && (
                <div className="px-5 pb-5">
                  <button
                    onClick={confirmTierOrder}
                    disabled={!tierModal.selected}
                    className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {tierModal.selected ? `Pesan — ${formatRupiah(Number(tierModal.selected.price))}` : 'Pilih tipe AC dulu'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
