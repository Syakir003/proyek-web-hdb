import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Briefcase, MapPin, Clock, Users, Heart, Zap, Shield,
  ChevronDown, ChevronUp, MessageCircle, ArrowRight,
} from "lucide-react";

const values = [
  { icon: Heart, title: "Peduli Pelanggan", desc: "Kepuasan pelanggan adalah yang utama. Setiap pekerjaan kami lakukan dengan hati.", color: "bg-sky-500" },
  { icon: Zap, title: "Kerja Cepat & Tepat", desc: "Kami menghargai waktu pelanggan. Setiap tugas diselesaikan profesional dan efisien.", color: "bg-sky-500" },
  { icon: Shield, title: "Integritas Tinggi", desc: "Kejujuran dan transparansi dalam setiap tindakan adalah fondasi tim kami.", color: "bg-sky-500" },
  { icon: Users, title: "Tim yang Solid", desc: "Kami tumbuh bersama. Setiap anggota tim adalah keluarga HDB Airconds.", color: "bg-sky-500" },
];

const jobs = [
  {
    title: "Teknisi AC",
    type: "Full-time",
    location: "Mojokerto, Jawa Timur",
    desc: "Kami mencari teknisi AC berpengalaman untuk bergabung dengan tim lapangan kami. Bertanggung jawab atas instalasi, perawatan, dan perbaikan unit AC di lokasi pelanggan.",
    requirements: [
      "Pengalaman minimal 2 tahun di bidang AC/refrigerasi",
      "Memiliki sertifikat teknisi AC (diutamakan)",
      "Bisa bekerja secara mandiri maupun tim",
      "Memiliki SIM C",
      "Jujur, disiplin, dan berorientasi pada kualitas",
    ],
  },
  {
    title: "Teknisi Junior / Magang",
    type: "Part-time / Magang",
    location: "Mojokerto, Jawa Timur",
    desc: "Terbuka untuk lulusan SMK Teknik Pendingin atau yang ingin belajar langsung di lapangan. Kami siap membimbing dan memberikan sertifikasi.",
    requirements: [
      "Lulusan SMK Teknik Pendingin / Listrik (diutamakan)",
      "Mau belajar dan berkembang",
      "Fisik sehat dan siap kerja lapangan",
      "Berdomisili atau bersedia ditempatkan di Mojokerto",
    ],
  },
  {
    title: "Customer Service / Admin",
    type: "Full-time",
    location: "Mojokerto, Jawa Timur",
    desc: "Menangani komunikasi pelanggan via WhatsApp, telepon, dan sosial media. Membantu penjadwalan teknisi, administrasi, dan laporan harian.",
    requirements: [
      "Komunikatif, ramah, dan sabar",
      "Familiar dengan WhatsApp Business & Google Sheets",
      "Kemampuan multitasking yang baik",
      "Pengalaman admin/CS diutamakan",
      "Bisa bekerja dari kantor",
    ],
  },
];

export default function Karir({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const [openJob, setOpenJob] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white min-h-screen"
    >
      {/* Hero */}
      <div className="bg-gradient-to-br from-sky-700 via-sky-600 to-sky-400 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
              <Briefcase className="w-4 h-4" /> Bergabung Bersama Kami
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Karir di <span className="text-sky-200">HDB Airconds</span>
            </h1>
            <p className="text-sky-100 text-lg max-w-2xl mx-auto">
              Jadilah bagian dari tim profesional kami. Bersama-sama kami menghadirkan kesejukan dan kepuasan bagi ribuan pelanggan di seluruh Jawa Timur.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Nilai Perusahaan */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Nilai-Nilai <span className="text-sky-500">Kami</span>
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">Budaya kerja yang kami junjung setiap hari.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm text-center hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${v.color} flex items-center justify-center mx-auto mb-4`}>
                  <v.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{v.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Lowongan */}
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Posisi yang <span className="text-sky-500">Tersedia</span>
            </h2>
            <p className="text-slate-500">Klik posisi untuk melihat detail dan persyaratan.</p>
          </div>
          <div className="space-y-4">
            {jobs.map((job, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="border border-slate-200 rounded-2xl overflow-hidden hover:border-sky-200 transition-colors"
              >
                <button
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setOpenJob(openJob === i ? null : i)}
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg mb-1">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-sky-500" />{job.type}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-sky-500" />{job.location}</span>
                    </div>
                  </div>
                  {openJob === i
                    ? <ChevronUp className="w-5 h-5 text-sky-500 flex-shrink-0 ml-4" />
                    : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />}
                </button>
                {openJob === i && (
                  <div className="px-6 pb-6 border-t border-slate-100 pt-5">
                    <p className="text-slate-600 text-sm leading-relaxed mb-5">{job.desc}</p>
                    <h4 className="font-semibold text-slate-800 text-sm mb-3">Persyaratan:</h4>
                    <ul className="space-y-2 mb-6">
                      {job.requirements.map((req) => (
                        <li key={req} className="flex items-start gap-2 text-sm text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={`https://wa.me/6281515729739?text=Halo%2C%20saya%20tertarik%20melamar%20posisi%20${encodeURIComponent(job.title)}%20di%20HDB%20Airconds`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" /> Lamar via WhatsApp
                    </a>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Tidak ada posisi cocok */}
          <div className="mt-10 bg-sky-50 border border-sky-100 rounded-2xl p-8 text-center">
            <Clock className="w-10 h-10 text-sky-400 mx-auto mb-4" />
            <h3 className="font-bold text-slate-800 mb-2">Tidak ada posisi yang cocok?</h3>
            <p className="text-slate-500 text-sm mb-5">
              Kirimkan CV dan portofolio Anda. Kami selalu terbuka untuk kandidat berbakat yang ingin bergabung dengan tim kami.
            </p>
            <a
              href="https://wa.me/6281515729739?text=Halo%2C%20saya%20ingin%20mengirimkan%20CV%20untuk%20bergabung%20dengan%20HDB%20Airconds"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <ArrowRight className="w-4 h-4" /> Kirim CV Sekarang
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
