import React from "react";
import {
  Facebook,
  Instagram,
  Globe,
  Wind,
  Phone,
  MapPin,
  Mail,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";

export default function Footer({
  setCurrentPage,
}: {
  setCurrentPage: (page: string) => void;
}) {
  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300 pt-24 pb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-600/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 flex items-center gap-3"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-3 bg-blue-600/20 rounded-lg"
          >
            <Wind className="w-8 h-8 text-blue-400" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              HDB <span className="text-blue-400">Airconds</span>
            </h2>
            <p className="text-xs text-slate-400">
              Solusi Pendingin Udara Terpercaya
            </p>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
          >
            <h4 className="text-white font-bold mb-6 text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              Hubungi Kami
            </h4>
            <ul className="space-y-4 text-sm">
              <motion.li
                whileHover={{ x: 5 }}
                className="flex items-start gap-3"
              >
                <Mail className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span className="hover:text-white transition-colors cursor-pointer">
                  hasildayabersama@gmail.com
                </span>
              </motion.li>
              <motion.li
                whileHover={{ x: 5 }}
                className="flex items-start gap-3"
              >
                <Phone className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <a
                  href="tel:+6281515729739"
                  className="hover:text-white transition-colors"
                >
                  (+62) 815-1572-9739
                </a>
              </motion.li>
              <motion.li
                whileHover={{ x: 5 }}
                className="flex items-start gap-3"
              >
                <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Jl. Gajah Mada No.19, Rw. III, Seduri, Kec. Mojosari,
                  Kabupaten Mojokerto, Jawa Timur 61382
                </span>
              </motion.li>
            </ul>
            <div className="flex space-x-3 mt-6">
              {[
                {
                  icon: Facebook,
                  href: "https://www.facebook.com/share/1DRTW2ZtPG/?mibextid=wwXIfr",
                  label: "Facebook",
                },
                {
                  icon: Instagram,
                  href: "https://www.instagram.com/kusnadijozz22?igsh=ZTVwbjdtODlxMzA2",
                  label: "Instagram",
                },
                {
                  icon: Phone,
                  href: "https://wa.me/6281515729739",
                  label: "WhatsApp",
                },
              ].map(({ icon: Icon, href, label }, idx) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, y: -3 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 bg-slate-800 hover:bg-blue-600 rounded-lg transition-all"
                  title={label}
                >
                  <Icon className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Products & Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="text-white font-bold mb-6 text-lg">
              Produk & Layanan
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                "AC Split",
                "AC Inverter",
                "Instalasi AC",
                "Servis & Cuci AC",
                "Perbaikan AC",
              ].map((item, idx) => (
                <motion.li
                  key={item}
                  whileHover={{ x: 5 }}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <button
                    onClick={() => setCurrentPage("katalog")}
                    className="hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item}
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* About */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-white font-bold mb-6 text-lg">Tentang</h4>
            <ul className="space-y-3 text-sm">
              {["Tentang Kami", "Layanan Kami", "Galeri", "Hubungi Kami"].map(
                (item, idx) => (
                  <motion.li
                    key={item}
                    whileHover={{ x: 5 }}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <button
                      onClick={() =>
                        setCurrentPage(
                          item === "Hubungi Kami" ? "kontak" : "tentang",
                        )
                      }
                      className="hover:text-blue-400 transition-colors flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item}
                    </button>
                  </motion.li>
                ),
              )}
            </ul>
          </motion.div>

          {/* Operating Hours & CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="text-white font-bold mb-6 text-lg">
              Jam Operasional
            </h4>
            <div className="space-y-2 text-sm mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Senin - Sabtu</span>
                <span className="text-white font-bold">08:00 - 17:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Minggu</span>
                <span className="text-blue-400 font-bold">Tutup (Darurat)</span>
              </div>
            </div>
            <motion.a
              href="https://wa.me/6281515729739?text=Halo%20saya%20ingin%20bertanya"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="block p-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg border border-green-500 text-center font-bold text-white transition-all shadow-lg hover:shadow-xl"
            >
              <Phone className="w-4 h-4 inline mr-2" />
              Chat WhatsApp Sekarang
            </motion.a>
          </motion.div>
        </div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          className="border-t border-slate-800 origin-left mb-8"
        ></motion.div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 gap-4"
        >
          <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
            <Globe className="w-4 h-4" />
            <span>Indonesia</span>
          </div>
          <p className="text-center md:text-right">
            &copy; 2025 HDB Airconds. All Rights Reserved. | Dibuat dengan ❤️
            untuk kenyamanan Anda
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
