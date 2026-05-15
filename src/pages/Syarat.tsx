import React from "react";
import { motion } from "motion/react";
import { FileText } from "lucide-react";

const sections = [
  {
    title: "1. Penerimaan Syarat",
    content: `Dengan menggunakan layanan HDB Airconds, Anda menyatakan telah membaca, memahami, dan menyetujui Syarat & Ketentuan ini. Jika Anda tidak menyetujui syarat-syarat ini, mohon untuk tidak menggunakan layanan kami.`,
  },
  {
    title: "2. Layanan yang Disediakan",
    content: `HDB Airconds menyediakan layanan yang mencakup:
• Penjualan unit AC dari berbagai merek terpercaya
• Instalasi dan pemasangan AC di lokasi pelanggan
• Perawatan dan servis rutin unit AC
• Perbaikan dan penggantian komponen AC
• Pengisian freon dan pengecekan sistem
• Bongkar pasang dan relokasi unit AC
• Konsultasi teknis terkait sistem pendingin udara`,
  },
  {
    title: "3. Pemesanan dan Pembayaran",
    content: `3.1 Pemesanan layanan dapat dilakukan melalui website, WhatsApp, atau kunjungan langsung ke toko kami.

3.2 Harga yang tercantum adalah harga estimasi dan dapat berubah setelah survei lokasi oleh teknisi kami.

3.3 Untuk pembelian unit AC, pembayaran penuh diperlukan sebelum pengiriman atau pemasangan, kecuali ada perjanjian kredit tertulis.

3.4 Untuk layanan, pembayaran dilakukan setelah pekerjaan selesai dan pelanggan menyatakan kepuasan, kecuali disepakati lain.

3.5 Kami menerima pembayaran melalui transfer bank, dompet digital, dan tunai.`,
  },
  {
    title: "4. Garansi",
    content: `4.1 Garansi Produk: Unit AC yang dijual dilengkapi garansi resmi dari pabrikan sesuai ketentuan merek masing-masing.

4.2 Garansi Instalasi: Pekerjaan instalasi bergaransi 1 tahun sejak tanggal pemasangan. Garansi mencakup kesalahan pemasangan, kebocoran pipa akibat instalasi, dan masalah kelistrikan terkait instalasi.

4.3 Garansi Perbaikan: Perbaikan yang kami lakukan bergaransi 30 hari sejak tanggal servis untuk kerusakan yang sama.

4.4 Garansi tidak berlaku untuk kerusakan akibat: penggunaan tidak wajar, modifikasi tanpa izin, bencana alam, atau kerusakan akibat kelalaian pengguna.`,
  },
  {
    title: "5. Pembatalan dan Pengembalian",
    content: `5.1 Pembatalan pesanan layanan dapat dilakukan minimal 24 jam sebelum jadwal yang disepakati tanpa dikenakan biaya.

5.2 Pembatalan kurang dari 24 jam dapat dikenakan biaya transportasi jika teknisi telah diberangkatkan.

5.3 Produk yang telah dibeli dapat dikembalikan dalam 7 hari jika terdapat cacat produksi dengan menunjukkan bukti pembelian. Produk harus dalam kondisi asli dan belum dipasang.

5.4 Pengembalian uang diproses dalam 3–7 hari kerja setelah verifikasi.`,
  },
  {
    title: "6. Tanggung Jawab Pelanggan",
    content: `Pelanggan bertanggung jawab untuk:
• Memastikan akses yang aman dan memadai ke lokasi instalasi/servis
• Memberikan informasi yang akurat mengenai kondisi unit dan permasalahan
• Mempersiapkan lokasi pemasangan sesuai instruksi teknisi kami
• Menjaga dan merawat produk sesuai panduan penggunaan
• Segera melaporkan masalah dalam masa garansi`,
  },
  {
    title: "7. Batasan Tanggung Jawab",
    content: `HDB Airconds tidak bertanggung jawab atas:
• Kerusakan tidak langsung atau kerugian konsekuensial yang timbul dari penggunaan produk atau layanan kami
• Kerusakan akibat penggunaan di luar spesifikasi atau petunjuk penggunaan
• Gangguan layanan akibat kondisi di luar kendali kami (force majeure)
• Kerusakan yang disebabkan oleh pihak ketiga setelah pekerjaan kami selesai

Total tanggung jawab kami tidak akan melebihi nilai transaksi yang bersangkutan.`,
  },
  {
    title: "8. Privasi",
    content: `Penggunaan informasi pribadi Anda diatur oleh Kebijakan Privasi kami yang merupakan bagian tidak terpisahkan dari Syarat & Ketentuan ini. Dengan menggunakan layanan kami, Anda juga menyetujui Kebijakan Privasi kami.`,
  },
  {
    title: "9. Perubahan Syarat",
    content: `Kami berhak mengubah Syarat & Ketentuan ini sewaktu-waktu. Perubahan akan diberitahukan melalui website kami. Penggunaan layanan setelah perubahan dianggap sebagai penerimaan syarat yang diperbarui.`,
  },
  {
    title: "10. Hukum yang Berlaku",
    content: `Syarat & Ketentuan ini diatur oleh hukum Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan secara musyawarah. Jika tidak tercapai kesepakatan, sengketa akan diselesaikan melalui Pengadilan Negeri Mojokerto.`,
  },
  {
    title: "11. Kontak",
    content: `Untuk pertanyaan mengenai Syarat & Ketentuan ini, hubungi kami di:\n\nHDB Airconds\nJl. Gajah Mada No.19, Mojosari, Kabupaten Mojokerto, Jawa Timur 61382\nEmail: hasildayabersama@gmail.com\nTelepon: (+62) 815-1572-9739`,
  },
];

export default function Syarat() {
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
              <FileText className="w-4 h-4" /> Legal
            </div>
            <h1 className="text-4xl font-bold mb-3">Syarat & Ketentuan</h1>
            <p className="text-sky-100">Terakhir diperbarui: 1 Januari 2025</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-slate-600 leading-relaxed mb-10 bg-sky-50 border border-sky-100 rounded-2xl p-6 text-sm">
          Syarat dan Ketentuan ini mengatur penggunaan layanan HDB Airconds. Harap baca dengan seksama sebelum menggunakan layanan kami.
        </p>
        <div className="space-y-8">
          {sections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
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
