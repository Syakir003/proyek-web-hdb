import React from "react";
import {
  Shield,
  Users,
  Target,
  Award,
  Wrench,
  Snowflake,
  Zap,
  Clock,
  CheckCircle,
  Phone,
} from "lucide-react";
import { motion } from "motion/react";

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white min-h-screen"
    >
      {/* Hero */}
      <div className="bg-blue-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Tentang HDB Airconds
            </h1>
            <p className="text-lg text-blue-200 leading-relaxed">
              Selama lebih dari 19 tahun, kami berkomitmen untuk memberikan
              solusi tata udara terbaik dengan pendekatan profesional, efisien,
              andal.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Story */}
      <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-blue-600 font-medium mb-2 uppercase tracking-wider text-sm">
              Sejarah Kami
            </p>
            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">
              Dedikasi Terhadap Kualitas
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
                aspek layanan kami—mulai dari pemilihan produk yang efisien,
                proses instalasi yang rapi, hingga layanan purna jual yang
                transparan.
              </p>
              <p>
                Dengan pengalaman lebih dari 19 tahun, HDB Airconds telah
                melayani ribuan pelanggan di Mojokerto dan sekitarnya. Dari
                perbaikan AC sederhana hingga instalasi sistem pendingin untuk
                proyek besar, kami selalu memberikan yang terbaik.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="aspect-square md:aspect-4/3 bg-blue-50 rounded-2xl overflow-hidden border border-blue-100 group"
          >
            <img
              src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=1000"
              alt="Teknisi Bekerja"
              className="w-full h-full object-cover grayscale-10% group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-blue-50 py-20 border-t border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "19+", label: "Tahun Pengalaman" },
              { number: "5000+", label: "Pelanggan Puas" },
              { number: "15+", label: "Teknisi Profesional" },
              { number: "100%", label: "Garansi Pelayanan" },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Services Detail */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-blue-600 font-medium mb-2 uppercase tracking-wider text-sm">
            Layanan Lengkap
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Solusi Pendingin Udara Terpadu
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: <Snowflake className="w-6 h-6" />,
              title: "Instalasi AC",
              desc: "Pemasangan unit AC baru untuk rumah, kantor, dan industri dengan standar tertinggi.",
            },
            {
              icon: <Wrench className="w-6 h-6" />,
              title: "Servis & Cuci",
              desc: "Perawatan rutin dan pembersihan menyeluruh untuk menjaga performa AC optimal.",
            },
            {
              icon: <Zap className="w-6 h-6" />,
              title: "Perbaikan",
              desc: "Diagnosa dan perbaikan segala masalah AC, dari yang ringan hingga kompleks.",
            },
            {
              icon: <CheckCircle className="w-6 h-6" />,
              title: "Penjualan Unit",
              desc: "Tersedia berbagai merk AC berkualitas dengan harga kompetitif dan garansi resmi.",
            },
          ].map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -10 }}
              className="bg-white p-8 rounded-xl border border-blue-100 text-center shadow-sm hover:shadow-xl transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                {service.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                {service.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {service.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="bg-blue-50 py-24 border-t border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-blue-600 font-medium mb-2 uppercase tracking-wider text-sm">
              Filosofi Kami
            </p>
            <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
              Nilai Inti Kami
            </h2>
            <p className="text-slate-500">
              Prinsip yang membimbing setiap tindakan dan layanan yang kami
              berikan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Integritas",
                desc: "Transparan dalam harga dan jujur dalam mendiagnosa kerusakan.",
              },
              {
                icon: <Award className="w-6 h-6" />,
                title: "Kualitas",
                desc: "Hanya menggunakan sparepart original dan standar kerja tinggi.",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Pelayanan",
                desc: "Mengutamakan kepuasan dan kenyamanan pelanggan di atas segalanya.",
              },
              {
                icon: <Target className="w-6 h-6" />,
                title: "Efisien",
                desc: "Bekerja dengan cepat, tepat, dan rapi tanpa membuang waktu.",
              },
            ].map((val, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="bg-white p-8 rounded-xl border border-blue-100 text-center shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  {val.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">
                  {val.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {val.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-24 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Siap Melayani Kebutuhan AC Anda?
          </h2>
          <p className="text-blue-100 mb-10 text-lg">
            Jangan ragu untuk menghubungi kami. Konsultasi gratis dan tim kami
            siap membantu Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/6281515729739?text=Halo%20saya%20ingin%20bertanya"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold hover:bg-blue-50 transition-colors shadow-lg inline-flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" /> Hubungi via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
