import React from "react";
import { motion } from "motion/react";
import { Shield } from "lucide-react";

const sections = [
  {
    title: "1. Informasi yang Kami Kumpulkan",
    content: `Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami, termasuk:
• Nama lengkap dan informasi kontak (nomor telepon, alamat email, alamat pengiriman)
• Informasi pembayaran yang diproses melalui penyedia layanan pembayaran terverifikasi
• Detail pesanan produk dan layanan yang Anda pesan
• Pesan dan komunikasi yang Anda kirimkan melalui formulir kontak atau WhatsApp
• Informasi teknis terkait perangkat dan lokasi saat menggunakan layanan kami`,
  },
  {
    title: "2. Cara Kami Menggunakan Informasi Anda",
    content: `Informasi yang kami kumpulkan digunakan untuk:
• Memproses dan menyelesaikan pesanan produk dan layanan Anda
• Menghubungi Anda mengenai status pesanan, konfirmasi, dan jadwal kunjungan teknisi
• Memberikan layanan pelanggan dan merespons pertanyaan Anda
• Mengirimkan informasi promosi dan penawaran (hanya jika Anda menyetujuinya)
• Meningkatkan kualitas layanan dan pengalaman pengguna
• Memenuhi kewajiban hukum dan peraturan yang berlaku`,
  },
  {
    title: "3. Berbagi Informasi",
    content: `Kami tidak menjual, menyewakan, atau memperdagangkan informasi pribadi Anda kepada pihak ketiga. Kami hanya berbagi informasi dalam keadaan berikut:
• Dengan teknisi kami yang ditugaskan untuk menyelesaikan pesanan Anda (terbatas pada informasi yang diperlukan)
• Dengan penyedia layanan pembayaran untuk memproses transaksi
• Jika diwajibkan oleh hukum atau perintah pengadilan
• Untuk melindungi hak, properti, atau keselamatan HDB Airconds, pelanggan, atau publik`,
  },
  {
    title: "4. Keamanan Data",
    content: `Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi informasi pribadi Anda dari akses tidak sah, pengungkapan, perubahan, atau penghancuran. Namun, tidak ada metode transmisi data melalui internet yang 100% aman. Kami mendorong Anda untuk menggunakan kata sandi yang kuat dan tidak membagikan informasi sensitif secara tidak perlu.`,
  },
  {
    title: "5. Penyimpanan Data",
    content: `Kami menyimpan informasi pribadi Anda selama diperlukan untuk memenuhi tujuan yang dijelaskan dalam kebijakan ini, atau selama diwajibkan oleh hukum. Data pesanan disimpan minimal 3 tahun untuk keperluan garansi dan rekam jejak layanan.`,
  },
  {
    title: "6. Hak-Hak Anda",
    content: `Anda memiliki hak untuk:
• Mengakses informasi pribadi yang kami miliki tentang Anda
• Meminta koreksi data yang tidak akurat
• Meminta penghapusan data dalam kondisi tertentu
• Menolak penggunaan data untuk tujuan pemasaran langsung
• Mengajukan pengaduan kepada otoritas perlindungan data

Untuk menggunakan hak-hak ini, hubungi kami melalui kontak yang tersedia.`,
  },
  {
    title: "7. Cookie dan Teknologi Pelacakan",
    content: `Website kami dapat menggunakan cookie dan teknologi pelacakan serupa untuk meningkatkan pengalaman pengguna, menganalisis trafik, dan menyesuaikan konten. Anda dapat mengatur browser untuk menolak cookie, namun beberapa fitur website mungkin tidak berfungsi optimal.`,
  },
  {
    title: "8. Perubahan Kebijakan",
    content: `Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan signifikan akan diberitahukan melalui website atau email. Penggunaan layanan kami setelah pembaruan dianggap sebagai penerimaan kebijakan yang diperbarui.`,
  },
  {
    title: "9. Hubungi Kami",
    content: `Jika Anda memiliki pertanyaan atau kekhawatiran mengenai Kebijakan Privasi ini, silakan hubungi kami:\n\nHDB Airconds\nJl. Gajah Mada No.19, Mojosari, Kabupaten Mojokerto, Jawa Timur 61382\nEmail: hasildayabersama@gmail.com\nTelepon: (+62) 815-1572-9739`,
  },
];

export default function Privasi() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white min-h-screen"
    >
      {/* Hero */}
      <div className="bg-gradient-to-br from-sky-700 via-sky-600 to-sky-400 text-white py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
              <Shield className="w-4 h-4" /> Legal
            </div>
            <h1 className="text-4xl font-bold mb-3">Kebijakan Privasi</h1>
            <p className="text-sky-100">Terakhir diperbarui: 1 Januari 2025</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-slate-600 leading-relaxed mb-10 bg-sky-50 border border-sky-100 rounded-2xl p-6 text-sm">
          HDB Airconds ("kami", "kita") berkomitmen untuk melindungi privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda ketika Anda menggunakan layanan dan website kami.
        </p>
        <div className="space-y-8">
          {sections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <h2 className="text-lg font-bold text-slate-900 mb-3">{section.title}</h2>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
              {i < sections.length - 1 && <div className="border-b border-slate-100 mt-8" />}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
