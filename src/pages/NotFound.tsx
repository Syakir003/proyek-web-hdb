import React from "react";
import { motion } from "motion/react";
import {
  Home,
  Snowflake,
  Search,
  Wrench,
  Phone,
  ArrowRight,
} from "lucide-react";

const suggestions = [
  {
    page: "katalog",
    label: "Katalog Produk",
    desc: "Daikin, Panasonic, LG & 50+ merek",
    icon: Search,
  },
  {
    page: "layanan",
    label: "Layanan AC",
    desc: "Cuci, isi freon, bongkar pasang",
    icon: Wrench,
  },
  {
    page: "kontak",
    label: "Hubungi Kami",
    desc: "Konsultasi & survei lokasi gratis",
    icon: Phone,
  },
];

export default function NotFound({
  setCurrentPage,
}: {
  setCurrentPage: (page: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white"
    >
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50">
        {/* Butiran salju dekoratif — konsisten dengan aksen hero Beranda */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-sky-200"
              style={{ left: `${8 + i * 16}%`, top: `${15 + (i % 3) * 25}%` }}
              animate={{ y: [0, -18, 0], opacity: [0.35, 0.8, 0.35] }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.4,
              }}
            >
              <Snowflake className="w-6 h-6" />
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Snowflake className="w-4 h-4" />
              Error 404
            </div>

            <p className="text-7xl sm:text-9xl font-bold text-sky-500/90 leading-none mb-4">
              404
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Halaman Tidak Ditemukan
            </h1>

            <p className="text-lg text-slate-600 max-w-xl mx-auto mb-10">
              Halaman yang kamu cari sudah dipindahkan atau tidak pernah ada.
              Tapi tenang, layanan AC kami tetap dingin seperti biasa.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
              <button
                onClick={() => setCurrentPage("beranda")}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Kembali ke Beranda
              </button>
              <a
                href="https://wa.me/6281515729739?text=Halo%20saya%20ingin%20bertanya"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Chat via WhatsApp
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <p className="text-sm font-semibold tracking-widest uppercase text-slate-400 mb-5">
              Mungkin kamu mencari
            </p>
            <div className="grid sm:grid-cols-3 gap-4 text-left">
              {suggestions.map((s) => (
                <button
                  key={s.page}
                  onClick={() => setCurrentPage(s.page)}
                  className="card group hover:border-sky-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    {s.label}
                    <ArrowRight className="w-4 h-4 text-sky-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="text-sm text-slate-500 mt-1">{s.desc}</div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
