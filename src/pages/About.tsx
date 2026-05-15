import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Target,
  Award,
  Wrench,
  Snowflake,
  Zap,
  CheckCircle,
  Phone,
  MessageCircle,
  Star,
  BadgeCheck,
  ThumbsUp,
  Wind,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";

const stats = [
  { value: "18+", label: "Tahun Pengalaman", sub: "Berdiri sejak 2014" },
  { value: "5000+", label: "Pelanggan Puas", sub: "Di seluruh Mojokerto" },
  { value: "15+", label: "Teknisi Profesional", sub: "Bersertifikat resmi" },
  { value: "100%", label: "Garansi Pelayanan", sub: "Kepuasan terjamin" },
];

const services = [
  {
    icon: Snowflake,
    title: "Instalasi AC",
    desc: "Pemasangan unit AC baru untuk rumah, kantor, dan industri dengan standar tertinggi dan pengerjaan rapi.",
    color: "from-sky-400 to-sky-600",
  },
  {
    icon: Wrench,
    title: "Servis & Cuci",
    desc: "Perawatan rutin dan pembersihan menyeluruh untuk menjaga performa AC optimal sepanjang tahun.",
    color: "from-blue-400 to-blue-600",
  },
  {
    icon: Zap,
    title: "Perbaikan AC",
    desc: "Diagnosa dan perbaikan segala masalah AC, dari yang ringan hingga kompleks, cepat dan tepat.",
    color: "from-amber-400 to-orange-500",
  },
  {
    icon: CheckCircle,
    title: "Penjualan Unit",
    desc: "Tersedia berbagai merk AC berkualitas dengan harga kompetitif, garansi resmi, dan konsultasi gratis.",
    color: "from-emerald-400 to-teal-500",
  },
];

const values = [
  {
    icon: Shield,
    title: "Integritas",
    desc: "Transparan dalam harga dan jujur dalam mendiagnosa kerusakan, tanpa biaya tersembunyi.",
  },
  {
    icon: Award,
    title: "Kualitas",
    desc: "Hanya menggunakan sparepart original dan standar kerja tertinggi di setiap pekerjaan.",
  },
  {
    icon: Users,
    title: "Pelayanan",
    desc: "Mengutamakan kepuasan dan kenyamanan pelanggan di atas segalanya.",
  },
  {
    icon: Target,
    title: "Efisiensi",
    desc: "Bekerja dengan cepat, tepat, dan rapi tanpa membuang waktu Anda.",
  },
];

const SHOW_POSITIONS = ["founder", "admin", "kepala_teknisi"];

const staticTeam = [
  {
    id: 1,
    name: "Kusnadi",
    position: "founder",
    role_label: "Founder & Owner",
    image: "/images/Ayah.jpeg",
  },
];

export default function About() {
  const [team, setTeam] = useState<any[]>(staticTeam);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setTeam(
            data.data.filter((m: any) => SHOW_POSITIONS.includes(m.position)),
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white min-h-screen"
    >
      {/* Hero */}
      <div className="relative bg-slate-900 text-white py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/KerjaSama.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-sky-900/90 via-sky-800/75 to-sky-700/60" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <BadgeCheck className="w-4 h-4" />
              Dipercaya Sejak 2014
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Tentang <span className="text-sky-200">HDB Airconds</span>
            </h1>
            <p className="text-lg text-sky-100 leading-relaxed max-w-2xl">
              Selama lebih dari 12 tahun, kami berkomitmen memberikan solusi
              tata udara terbaik dengan pendekatan profesional, efisien, dan
              andal untuk setiap pelanggan kami.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-sky-600 to-sky-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-8 text-center text-white">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1">
                  {s.value}
                </div>
                <div className="font-semibold text-sky-100 mb-0.5">
                  {s.label}
                </div>
                <div className="text-sky-200 text-xs">{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Story */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-sky-600 font-semibold text-sm uppercase tracking-wider mb-3">
              Sejarah Kami
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Dedikasi Terhadap <span className="text-sky-600">Kualitas</span>
            </h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                HDB Airconds berawal dari sebuah bengkel service kecil yang
                berfokus pada perbaikan AC rumah tangga di Mojosari, Mojokerto.
                Seiring berjalannya waktu, dedikasi kami terhadap kualitas kerja
                dan kepuasan pelanggan membawa kami berkembang menjadi penyedia
                solusi tata udara terpadu.
              </p>
              <p>
                Kami percaya bahwa kenyamanan ruangan tidak harus rumit. Oleh
                karena itu, kami mengusung filosofi profesional dalam setiap
                aspek layanan kami — mulai dari pemilihan produk yang efisien,
                proses instalasi yang rapi, hingga layanan purna jual yang
                transparan.
              </p>
              <p>
                Dengan pengalaman lebih dari 12 tahun, HDB Airconds telah
                melayani ribuan pelanggan di Mojokerto dan sekitarnya. Dari
                perbaikan AC sederhana hingga instalasi sistem pendingin untuk
                proyek besar, kami selalu memberikan yang terbaik.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                "Bergaransi Resmi",
                "Teknisi Bersertifikat",
                "Layanan 24/7",
                "Harga Transparan",
              ].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 text-sm font-medium px-3 py-1.5 rounded-full border border-sky-100"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> {tag}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative pt-6 pb-8 px-4 sm:pt-8 sm:pb-10 sm:px-6 lg:pt-0 lg:pb-0 lg:px-0"
          >
            <div className="aspect-[4/3] bg-sky-50 rounded-3xl overflow-hidden border border-sky-100 group shadow-xl shadow-sky-100/50">
              <img
                src="/images/Servis-5.jpg"
                alt="Teknisi Bekerja"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-sky-100 flex items-center gap-3">
              <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600">
                <ThumbsUp className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-lg">98%</div>
                <div className="text-slate-500 text-xs">Kepuasan Pelanggan</div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
              <Star className="w-5 h-5 fill-white" />
              <div>
                <div className="font-bold text-lg leading-none">4.9/5</div>
                <div className="text-sky-100 text-xs">Rating Pelanggan</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-slate-50 py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-sky-600 font-semibold text-sm uppercase tracking-wider mb-3">
              Layanan Lengkap
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Solusi Pendingin Udara{" "}
              <span className="text-sky-600">Terpadu</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm hover:shadow-xl hover:border-sky-100 transition-all duration-300 group"
              >
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${s.color} text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                >
                  <s.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">
                  {s.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-sky-600 font-semibold text-sm uppercase tracking-wider mb-3">
            Filosofi Kami
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Nilai Inti <span className="text-sky-600">Kami</span>
          </h2>
          <p className="text-slate-500 text-lg">
            Prinsip yang membimbing setiap tindakan dan layanan yang kami
            berikan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm hover:shadow-xl hover:border-sky-100 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                <v.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                {v.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="bg-slate-50 py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-sky-600 font-semibold text-sm uppercase tracking-wider mb-3">
              Tim Kami
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Para <span className="text-sky-600">Profesional</span> Kami
            </h2>
          </div>

          {team.length === 0 ? (
            <p className="text-center text-slate-400 text-sm">
              Data tim belum tersedia.
            </p>
          ) : (
            <div
              className={`grid grid-cols-1 gap-8 max-w-4xl mx-auto ${team.length === 1 ? "max-w-xs" : team.length === 2 ? "sm:grid-cols-2 max-w-2xl" : "sm:grid-cols-3"}`}
            >
              {team.map((member, i) => {
                const initials = member.name
                  .split(" ")
                  .map((w: string) => w[0])
                  .slice(0, 2)
                  .join("");
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.12 }}
                    className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:shadow-sky-100/60 border border-slate-100 transition-all duration-300 group"
                  >
                    {/* Foto area */}
                    <div className="relative h-80 bg-gradient-to-br from-sky-400 to-sky-600 overflow-hidden">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white font-bold text-6xl opacity-60">
                            {initials}
                          </span>
                        </div>
                      )}
                      {/* Gradient overlay bawah */}
                      <div className="absolute inset-0 bg-gradient-to-t from-sky-900/40 via-transparent to-transparent" />
                    </div>

                    {/* Info area */}
                    <div className="p-6 text-center">
                      <h3 className="font-bold text-slate-900 text-xl mb-1">
                        {member.name}
                      </h3>
                      <span className="inline-block bg-sky-50 text-sky-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                        {member.role_label}
                      </span>
                      {member.bio && (
                        <p className="text-slate-500 text-sm leading-relaxed">
                          {member.bio}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-sky-600 to-sky-400 rounded-3xl p-10 md:p-14 text-center text-white overflow-hidden relative"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-8 w-32 h-32 border-2 border-white rounded-full" />
              <div className="absolute bottom-4 right-8 w-20 h-20 border-2 border-white rounded-full" />
            </div>
            <Wind className="w-10 h-10 mx-auto mb-5 text-sky-100" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Siap Melayani Kebutuhan AC Anda?
            </h2>
            <p className="text-sky-100 mb-10 text-lg max-w-xl mx-auto">
              Jangan ragu untuk menghubungi kami. Konsultasi gratis dan tim kami
              siap membantu Anda kapanpun.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/6281515729739?text=Halo%20saya%20ingin%20bertanya"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-sky-600 px-8 py-4 rounded-2xl font-bold hover:bg-sky-50 transition-colors shadow-lg"
              >
                <MessageCircle className="w-5 h-5" /> Chat WhatsApp
              </a>
              <a
                href="tel:+6281515729739"
                className="inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur-sm text-white border border-white/30 px-8 py-4 rounded-2xl font-bold hover:bg-white/25 transition-colors"
              >
                <Phone className="w-5 h-5" /> Telepon Sekarang
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
