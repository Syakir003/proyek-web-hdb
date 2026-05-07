import React from "react";
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from "lucide-react";
import { motion } from "motion/react";

export default function Contact() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-blue-50 min-h-screen py-12 md:py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Hubungi Kami
          </h1>
          <p className="text-lg text-slate-500">
            Kami siap membantu menjawab pertanyaan atau menjadwalkan kunjungan
            teknisi ke tempat Anda.
          </p>
        </div>

        {/* WhatsApp CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-green-500 text-white p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                Respon Tercepat via WhatsApp
              </h3>
              <p className="text-green-100 text-sm">
                Chat langsung dengan tim kami untuk respon dalam hitungan menit.
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/6281515729739?text=Halo%20saya%20ingin%20bertanya"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-green-600 px-6 py-3 rounded-full font-bold hover:bg-green-50 transition-colors shadow-md inline-flex items-center gap-2 shrink-0"
          >
            <MessageCircle className="w-5 h-5" /> Chat Sekarang
          </a>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6">
                Informasi Kontak
              </h3>
              <ul className="space-y-6">
                <li className="flex items-start group">
                  <div className="bg-blue-50 p-3 rounded-lg mr-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Alamat</p>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Jl. Gajah Mada No.19, Rw. III, Seduri
                      <br />
                      Kec. Mojosari, Kabupaten Mojokerto
                      <br />
                      Jawa Timur 61382
                    </p>
                  </div>
                </li>
                <li className="flex items-start group">
                  <div className="bg-blue-50 p-3 rounded-lg mr-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">
                      Telepon / WhatsApp
                    </p>
                    <p className="text-slate-500 text-sm">
                      (+62) 815-1572-9739
                    </p>
                  </div>
                </li>
                <li className="flex items-start group">
                  <div className="bg-blue-50 p-3 rounded-lg mr-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Email</p>
                    <p className="text-slate-500 text-sm">
                      hasildayabersama@gmail.com
                    </p>
                  </div>
                </li>
                <li className="flex items-start group">
                  <div className="bg-blue-50 p-3 rounded-lg mr-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">
                      Jam Operasional
                    </p>
                    <p className="text-slate-500 text-sm">
                      Senin - Sabtu: 08:00 - 17:00
                      <br />
                      Minggu: Tutup (Kecuali Darurat)
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Social Media */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Ikuti Kami
              </h3>
              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com/share/1DRTW2ZtPG/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/kusnadijozz22?igsh=ZTVwbjdtODlxMzA2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a
                  href="https://wa.me/6281515729739"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-600 hover:text-white transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-blue-100">
              <h3 className="text-2xl font-bold text-slate-900 mb-8 tracking-tight">
                Kirim Pesan
              </h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-blue-100 shadow-sm rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Masukkan nama Anda"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Nomor Telepon / WA
                    </label>
                    <input
                      type="tel"
                      className="w-full bg-white border border-blue-100 shadow-sm rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="0812xxxx"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Subjek / Layanan
                  </label>
                  <select className="w-full bg-white border border-blue-100 shadow-sm rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                    <option value="">Pilih layanan...</option>
                    <option value="beli">Pembelian AC Baru</option>
                    <option value="service">Service / Cuci AC</option>
                    <option value="pasang">Bongkar Pasang</option>
                    <option value="perbaikan">Perbaikan AC</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Pesan / Detail Keluhan
                  </label>
                  <textarea
                    rows={5}
                    className="w-full bg-white border border-blue-100 shadow-sm rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    placeholder="Tuliskan detail pesan atau keluhan AC Anda di sini..."
                  ></textarea>
                </div>
                <button
                  type="button"
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors flex justify-center items-center shadow-md"
                >
                  <Send className="w-5 h-5 mr-2" /> Kirim Pesan
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
