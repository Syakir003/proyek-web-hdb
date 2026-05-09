import React from "react";
import { Wind, Phone, Mail, MapPin, Facebook, Instagram, ArrowRight, Clock } from "lucide-react";
import { motion } from "motion/react";

const footerLinks = {
  company: ["Tentang Kami", "Tim Kami", "Karir", "Blog & Tips"],
  services: ["Instalasi AC", "Perawatan AC", "Perbaikan AC", "Isi Freon", "Bongkar Pasang"],
  products: ["AC Residential", "AC Commercial", "AC Industrial", "AC Portable", "Spare Parts"],
};

export default function Footer({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-600 to-sky-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-white">
              <Clock className="w-5 h-5 text-sky-200" />
              <span className="text-sm font-medium">Layanan Darurat 24/7 — Kami siap melayani kapanpun Anda butuhkan</span>
            </div>
            <button onClick={() => setCurrentPage("kontak")} className="flex items-center gap-2 bg-white text-sky-600 hover:bg-sky-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap">
              Hubungi Sekarang <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <button onClick={() => setCurrentPage("beranda")} className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-xl bg-sky-500"><Wind className="w-5 h-5 text-white" /></div>
              <div className="text-left">
                <div className="text-xl font-bold text-white">HDB<span className="text-sky-400">Airconds</span></div>
                <div className="text-[10px] font-medium text-sky-400 tracking-widest uppercase">Cooling Solutions</div>
              </div>
            </button>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
              Solusi AC terlengkap dan terpercaya. Kami menyediakan penjualan, instalasi, dan perawatan AC dengan standar kualitas tertinggi sejak 2014.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <Phone className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <a href="tel:+6281515729739" className="hover:text-sky-400 transition-colors">(+62) 815-1572-9739</a>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <Mail className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>hasildayabersama@gmail.com</span>
              </div>
              <div className="flex items-start gap-3 text-slate-400 text-sm">
                <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <span>Jl. Gajah Mada No.19, Mojosari, Kabupaten Mojokerto, Jawa Timur 61382</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              {[
                { Icon: Facebook, href: "https://www.facebook.com/share/1DRTW2ZtPG/?mibextid=wwXIfr", label: "Facebook" },
                { Icon: Instagram, href: "https://www.instagram.com/kusnadijozz22?igsh=ZTVwbjdtODlxMzA2", label: "Instagram" },
                { Icon: Phone, href: "https://wa.me/6281515729739", label: "WhatsApp" },
              ].map(({ Icon, href, label }) => (
                <motion.a key={label} href={href} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.1 }} className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-sky-500 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-200" aria-label={label}>
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Perusahaan */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Perusahaan</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link}>
                  <button onClick={() => setCurrentPage("tentang")} className="text-slate-400 hover:text-sky-400 text-sm transition-colors">{link}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Layanan */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Layanan</h4>
            <ul className="space-y-2.5">
              {footerLinks.services.map((link) => (
                <li key={link}>
                  <button onClick={() => setCurrentPage("kontak")} className="text-slate-400 hover:text-sky-400 text-sm transition-colors">{link}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Produk + Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Produk</h4>
            <ul className="space-y-2.5">
              {footerLinks.products.map((link) => (
                <li key={link}>
                  <button onClick={() => setCurrentPage("katalog")} className="text-slate-400 hover:text-sky-400 text-sm transition-colors">{link}</button>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Newsletter</h4>
              <p className="text-slate-400 text-xs mb-3">Dapatkan tips & promo terbaru</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Email kamu" className="flex-1 bg-slate-800 border border-slate-700 focus:border-sky-400 text-white placeholder-slate-500 text-xs px-3 py-2 rounded-lg outline-none transition-colors" />
                <button className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 rounded-lg transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-xs">
            <span>© {currentYear} HDB Airconds. Semua hak dilindungi.</span>
            <div className="flex items-center gap-4">
              <button className="hover:text-sky-400 transition-colors">Kebijakan Privasi</button>
              <button className="hover:text-sky-400 transition-colors">Syarat & Ketentuan</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
