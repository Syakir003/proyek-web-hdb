import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, BadgeCheck, ArrowRight, Wind } from "lucide-react";
import { motion } from "motion/react";

const contactItems = [
  {
    icon: MapPin,
    label: "Alamat",
    lines: ["Jl. Gajah Mada No.19, Rw. III, Seduri", "Kec. Mojosari, Kabupaten Mojokerto", "Jawa Timur 61382"],
    color: "from-sky-400 to-sky-600",
  },
  {
    icon: Phone,
    label: "Telepon / WhatsApp",
    lines: ["(+62) 815-1572-9739"],
    color: "from-emerald-400 to-teal-500",
    href: "tel:+6281515729739",
  },
  {
    icon: Mail,
    label: "Email",
    lines: ["hasildayabersama@gmail.com"],
    color: "from-blue-400 to-blue-600",
    href: "mailto:hasildayabersama@gmail.com",
  },
  {
    icon: Clock,
    label: "Jam Operasional",
    lines: ["Senin – Sabtu: 08:00 – 17:00", "Minggu: Tutup (Kecuali Darurat)"],
    color: "from-amber-400 to-orange-500",
  },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = encodeURIComponent(
      `Halo, saya ingin menghubungi HDB Airconds.\n\nNama: ${form.name}\nNo. HP: ${form.phone}\nLayanan: ${form.subject}\nPesan: ${form.message}`
    );
    window.open(`https://wa.me/6281515729739?text=${text}`, "_blank");
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white min-h-screen"
    >
      {/* Hero */}
      <div className="relative bg-slate-900 text-white py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/TOKO.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-sky-900/90 via-sky-800/75 to-sky-700/60" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <BadgeCheck className="w-4 h-4" />
              Respon Cepat &lt; 1 Jam
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
              Hubungi <span className="text-sky-200">Kami</span>
            </h1>
            <p className="text-lg text-sky-100 max-w-2xl mx-auto leading-relaxed">
              Kami siap membantu menjawab pertanyaan atau menjadwalkan kunjungan teknisi ke tempat Anda.
              Konsultasi pertama gratis!
            </p>
          </motion.div>
        </div>
      </div>

      {/* WhatsApp CTA Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-green-500 text-white px-6 py-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Respon Tercepat via WhatsApp</h3>
              <p className="text-green-100 text-sm">Chat langsung dengan tim kami untuk respon dalam hitungan menit.</p>
            </div>
          </div>
          <a
            href="https://wa.me/6281515729739?text=Halo%20saya%20ingin%20bertanya"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-xl font-bold hover:bg-green-50 transition-colors shadow-md shrink-0"
          >
            <MessageCircle className="w-5 h-5" /> Chat Sekarang
          </a>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">

          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <span className="text-sky-600 font-semibold text-sm uppercase tracking-wider">Informasi Kontak</span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">Temukan Kami</h2>
            </div>

            <div className="space-y-4">
              {contactItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 hover:border-sky-200 hover:shadow-md transition-all group"
                >
                  <div className={`w-11 h-11 bg-gradient-to-br ${item.color} text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm mb-1">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-slate-500 text-sm hover:text-sky-600 transition-colors">
                        {item.lines[0]}
                      </a>
                    ) : (
                      item.lines.map((line, j) => (
                        <p key={j} className="text-slate-500 text-sm leading-relaxed">{line}</p>
                      ))
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Social Media */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="font-semibold text-slate-900 text-sm mb-4">Ikuti Kami</p>
              <div className="flex gap-3">
                <a
                  href="https://www.facebook.com/share/1DRTW2ZtPG/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/kusnadijozz22?igsh=ZTVwbjdtODlxMzA2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center hover:bg-pink-500 hover:text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a
                  href="https://wa.me/6281515729739"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center hover:bg-green-500 hover:text-white transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-sm"
            >
              <div className="mb-8">
                <span className="text-sky-600 font-semibold text-sm uppercase tracking-wider">Formulir Kontak</span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">Kirim Pesan</h2>
                <p className="text-slate-500 text-sm mt-1">Pesan Anda akan diteruskan via WhatsApp untuk respon lebih cepat.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all text-sm"
                      placeholder="Masukkan nama Anda"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nomor Telepon / WA</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all text-sm"
                      placeholder="0812xxxx"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Subjek / Layanan</label>
                  <select
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all appearance-none text-sm"
                  >
                    <option value="">Pilih layanan...</option>
                    <option value="Pembelian AC Baru">Pembelian AC Baru</option>
                    <option value="Service / Cuci AC">Service / Cuci AC</option>
                    <option value="Bongkar Pasang AC">Bongkar Pasang AC</option>
                    <option value="Perbaikan AC">Perbaikan AC</option>
                    <option value="Konsultasi">Konsultasi</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Pesan / Detail Keluhan</label>
                  <textarea
                    rows={5}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all resize-none text-sm"
                    placeholder="Tuliskan detail pesan atau keluhan AC Anda di sini..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 flex justify-center items-center gap-2 group"
                >
                  <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  {sent ? "Pesan Terkirim!" : "Kirim via WhatsApp"}
                </button>

                <p className="text-center text-slate-400 text-xs">
                  Dengan mengirim pesan ini, Anda setuju untuk dihubungi oleh tim kami.
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-slate-50 border-t border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-sky-600 font-semibold text-sm uppercase tracking-wider">Lokasi Kami</span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Kunjungi Toko Kami</h2>
          </div>
          <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-md h-72">
            <iframe
              src="https://maps.google.com/maps?q=Jl+Gajah+Mada+No.19+Seduri+Mojosari+Kabupaten+Mojokerto+Jawa+Timur+61382&output=embed&hl=id&z=17"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokasi HDB Airconds"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <MapPin className="w-4 h-4 text-sky-500 flex-shrink-0" />
              Jl. Gajah Mada No.19, Rw. III, Seduri, Kec. Mojosari, Kabupaten Mojokerto, Jawa Timur 61382
            </div>
            <a
              href="https://maps.app.goo.gl/CG261pF6UoRMrgNJ9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 text-sm font-semibold flex-shrink-0 hover:underline"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Buka di Google Maps
            </a>
          </div>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Butuh Bantuan Segera?</h2>
            <p className="text-sky-100 mb-10 text-lg max-w-xl mx-auto">
              Tim teknisi kami siap datang ke lokasi Anda. Layanan darurat tersedia 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/6281515729739?text=Halo%20saya%20butuh%20bantuan%20darurat%20AC"
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
