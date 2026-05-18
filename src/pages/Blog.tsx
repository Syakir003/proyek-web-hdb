import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Tag, ArrowRight, Search, X } from "lucide-react";

const posts = [
  {
    id: 1,
    title: "Kenapa AC Kamu Tidak Dingin? Ini 7 Penyebab Utamanya",
    excerpt: "AC berputar tapi ruangan tetap panas? Pelajari penyebab paling umum dan cara mengatasinya sebelum memanggil teknisi.",
    category: "Tips & Trik",
    date: "10 Mei 2025",
    readTime: "5 menit",
    image: "https://images.unsplash.com/photo-1660330589827-da8ab7dd3c02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80",
    content: [
      { h: "1. Freon Habis atau Bocor", p: "Freon adalah zat pendingin yang mengalir dalam sistem AC. Jika freon berkurang karena kebocoran, AC tidak akan bisa mendinginkan ruangan secara optimal. Solusinya: panggil teknisi untuk cek kebocoran dan isi freon." },
      { h: "2. Filter Kotor Tersumbat", p: "Filter yang kotor menghambat sirkulasi udara sehingga evaporator tidak bisa menyerap panas dengan efisien. Bersihkan filter setiap 2–4 minggu sekali." },
      { h: "3. Evaporator Membeku", p: "Jika freon terlalu sedikit atau sirkulasi udara buruk, evaporator bisa membeku dan justru menghentikan pendinginan. Matikan AC beberapa jam agar es mencair." },
      { h: "4. Kompresor Bermasalah", p: "Kompresor adalah 'jantung' AC. Kerusakan kompresor menyebabkan AC tidak bisa mendinginkan sama sekali. Butuh penanganan teknisi profesional." },
      { h: "5. Kapasitas AC Terlalu Kecil", p: "AC 1 PK untuk ruang 30 m² jelas tidak akan cukup dingin. Pastikan kapasitas AC sesuai dengan luas ruangan." },
      { h: "6. Kebocoran pada Instalasi Pipa", p: "Pipa yang bocor atau sambungan tidak rapat membuat freon keluar sebelum sampai ke evaporator. Perlu pengecekan oleh teknisi." },
      { h: "7. Kondensor Kotor", p: "Unit outdoor yang kotor menyulitkan pembuangan panas, sehingga AC bekerja lebih keras tapi hasilnya tidak optimal. Bersihkan unit outdoor secara berkala." },
    ],
  },
  {
    id: 2,
    title: "Cara Merawat AC Agar Awet dan Hemat Listrik",
    excerpt: "AC yang terawat bisa bertahan 10–15 tahun dan hemat listrik hingga 30%. Simak tips perawatan mudah yang bisa kamu lakukan sendiri.",
    category: "Perawatan",
    date: "2 Mei 2025",
    readTime: "4 menit",
    image: "https://images.unsplash.com/photo-1773101883566-0827c4fd907c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80",
    content: [
      { h: "Bersihkan Filter Secara Rutin", p: "Filter kotor adalah penyebab utama AC boros listrik dan tidak dingin. Cuci filter setiap 2–4 minggu dengan air mengalir dan sikat lembut." },
      { h: "Atur Suhu yang Wajar", p: "Suhu ideal AC adalah 24–26°C. Suhu terlalu rendah (18°C) membuat kompresor bekerja keras dan boros listrik hingga 8% per derajat." },
      { h: "Gunakan Mode Auto atau Sleep", p: "Mode auto menyesuaikan kecepatan blower secara otomatis. Mode sleep menurunkan suhu secara bertahap saat tidur sehingga lebih hemat." },
      { h: "Service Minimal 6 Bulan Sekali", p: "Perawatan profesional setiap 6 bulan mencakup pembersihan evaporator, kondensor, pengecekan freon, dan kelistrikan untuk menjaga performa optimal." },
      { h: "Pastikan Ruangan Tidak Bocor Udara", p: "Tutup jendela dan pintu saat AC menyala. Insulasi yang buruk membuat AC bekerja lebih keras dan boros energi." },
    ],
  },
  {
    id: 3,
    title: "Perbedaan AC Inverter vs Non-Inverter: Mana yang Lebih Hemat?",
    excerpt: "Banyak orang bingung memilih antara AC inverter dan non-inverter. Artikel ini membahas perbedaan, kelebihan, dan mana yang cocok untuk kebutuhanmu.",
    category: "Panduan Beli",
    date: "25 April 2025",
    readTime: "6 menit",
    image: "https://images.unsplash.com/photo-1760002208185-c1200df053e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80",
    content: [
      { h: "Cara Kerja AC Non-Inverter", p: "Kompresor AC non-inverter bekerja dengan sistem ON/OFF. Saat suhu belum tercapai, kompresor jalan penuh. Saat suhu tercapai, kompresor mati total. Siklus ini berulang terus dan boros listrik." },
      { h: "Cara Kerja AC Inverter", p: "Kompresor inverter bisa mengatur kecepatannya. Saat mendekati suhu target, kompresor melambat (tidak mati). Ini jauh lebih efisien dan tidak menimbulkan lonjakan listrik." },
      { h: "Perbandingan Konsumsi Listrik", p: "AC inverter bisa hemat listrik 30–60% dibanding non-inverter untuk penggunaan jangka panjang (8+ jam/hari). Untuk penggunaan < 4 jam/hari, perbedaannya tidak signifikan." },
      { h: "Harga dan Investasi", p: "AC inverter memang lebih mahal 20–40% di awal. Namun dengan penghematan listrik, biasanya akan balik modal dalam 1–2 tahun." },
      { h: "Rekomendasi", p: "Pilih inverter jika AC digunakan > 6 jam/hari. Pilih non-inverter jika anggaran terbatas dan penggunaan < 4 jam/hari." },
    ],
  },
  {
    id: 4,
    title: "Berapa PK AC yang Cocok untuk Ruangan Anda?",
    excerpt: "Salah memilih kapasitas AC bisa membuat ruangan tidak sejuk atau tagihan listrik membengkak. Gunakan panduan ini untuk menentukan PK yang tepat.",
    category: "Panduan Beli",
    date: "15 April 2025",
    readTime: "3 menit",
    image: "https://images.unsplash.com/photo-1708705261211-b2a244a811dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80",
    content: [
      { h: "Rumus Dasar Perhitungan PK", p: "Patokan umum: 1 PK untuk 10–14 m², 1,5 PK untuk 14–20 m², 2 PK untuk 20–28 m². Ini berlaku untuk ketinggian plafon standar (2,8–3 m)." },
      { h: "Faktor yang Mempengaruhi", p: "Selain luas ruangan, pertimbangkan: jumlah orang di ruangan, banyaknya jendela & paparan sinar matahari, peralatan elektronik yang menghasilkan panas, dan ketinggian plafon." },
      { h: "Ruangan dengan Paparan Panas Tinggi", p: "Ruangan di lantai atas, banyak jendela menghadap barat/selatan, atau ruangan server sebaiknya menambah 20–30% dari perhitungan dasar." },
      { h: "Jangan Terlalu Besar", p: "AC terlalu besar pun tidak baik — ruangan cepat dingin tapi lembab tinggi karena kompresor jarang bekerja cukup lama untuk mengurangi kelembaban." },
    ],
  },
  {
    id: 5,
    title: "Tanda-Tanda AC Anda Perlu Segera Diservis",
    excerpt: "Jangan tunggu AC rusak parah. Kenali tanda-tanda awal ini agar masalah bisa diatasi lebih cepat dan murah.",
    category: "Tips & Trik",
    date: "5 April 2025",
    readTime: "4 menit",
    image: "https://images.unsplash.com/photo-1711696488222-3a5af2a3dd72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80",
    content: [
      { h: "1. AC Mengeluarkan Bau Tak Sedap", p: "Bau apek menandakan jamur tumbuh di filter atau evaporator. Bau terbakar bisa menandakan masalah kelistrikan yang berbahaya. Segera panggil teknisi." },
      { h: "2. Tetesan Air dari Unit Indoor", p: "Sedikit embun wajar, tapi tetesan air yang deras menandakan drainase tersumbat atau evaporator terlalu kotor sehingga salju menumpuk." },
      { h: "3. AC Berbunyi Aneh", p: "Suara berisik (gemericik, benturan, atau dengung keras) bisa menandakan kipas kotor, bearing aus, atau ada benda asing di blower." },
      { h: "4. Tagihan Listrik Naik Tiba-tiba", p: "Jika tagihan listrik naik signifikan tanpa penambahan alat, AC mungkin bekerja lebih keras akibat freon kurang atau komponen kotor." },
      { h: "5. Sudah Lebih dari 1 Tahun Tidak Diservis", p: "Meski AC terasa normal, perawatan rutin tetap penting. Debu dan kotoran menumpuk secara perlahan dan menurunkan efisiensi secara bertahap." },
    ],
  },
  {
    id: 6,
    title: "Tips Menghemat Listrik AC Tanpa Mengorbankan Kenyamanan",
    excerpt: "Tagihan listrik AC menguras kantong? Ikuti tips praktis ini untuk menikmati kesejukan tanpa khawatir tagihan membengkak.",
    category: "Hemat Energi",
    date: "28 Maret 2025",
    readTime: "4 menit",
    image: "https://images.unsplash.com/photo-1622044810759-45089766ee26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80",
    content: [
      { h: "Atur Timer Otomatis", p: "Gunakan fitur timer untuk mematikan AC 30–60 menit setelah Anda tidur. Selimut tebal bisa menjaga kehangatan setelah AC mati." },
      { h: "Gunakan Kipas Angin Bersamaan", p: "AC + kipas angin bisa lebih hemat dari AC saja. Kipas membantu distribusi udara dingin ke seluruh ruangan sehingga AC tidak perlu bekerja terlalu keras." },
      { h: "Jaga Insulasi Ruangan", p: "Tirai tebal dan kaca film pada jendela bisa mengurangi panas dari luar hingga 30%, sehingga AC tidak perlu bekerja sekeras biasanya." },
      { h: "Hindari Menyalakan Sumber Panas", p: "Komputer, lampu pijar, dan elektronik lain menghasilkan panas yang harus 'dilawan' oleh AC. Matikan yang tidak perlu saat AC menyala." },
      { h: "Bersihkan Filter Secara Rutin", p: "Filter bersih memungkinkan aliran udara optimal sehingga AC tidak perlu berputar lebih kencang. Ini bisa hemat listrik 5–15%." },
    ],
  },
];

const categories = ["Semua", "Tips & Trik", "Perawatan", "Panduan Beli", "Hemat Energi"];

export default function Blog({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [openPost, setOpenPost] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [openPost]);

  const filtered = posts.filter((p) => {
    const matchCat = activeCategory === "Semua" || p.category === activeCategory;
    const matchSearch = search === "" || p.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (openPost !== null) {
    const post = posts.find((p) => p.id === openPost)!;
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="bg-white min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <button
            onClick={() => setOpenPost(null)}
            className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium text-sm mb-8 group"
          >
            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" /> Kembali ke Blog
          </button>
          <div className="mb-4">
            <span className="bg-sky-100 text-sky-700 text-xs font-semibold px-3 py-1 rounded-full">{post.category}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-slate-400 text-sm mb-8">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{post.date}</span>
            <span className="flex items-center gap-1"><Tag className="w-4 h-4" />{post.readTime} baca</span>
          </div>
          <img src={post.image} alt={post.title} className="w-full h-64 object-cover rounded-2xl mb-10" />
          <div className="prose prose-slate max-w-none">
            {post.content.map((section, i) => (
              <div key={i} className="mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-2">{section.h}</h2>
                <p className="text-slate-600 leading-relaxed">{section.p}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 bg-sky-50 border border-sky-100 rounded-2xl p-8 text-center">
            <h3 className="font-bold text-slate-800 mb-2">Butuh Bantuan Teknisi?</h3>
            <p className="text-slate-500 text-sm mb-5">Hubungi tim HDB Airconds untuk konsultasi gratis dan penanganan profesional.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://wa.me/6281515729739"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Chat WhatsApp
              </a>
              <button
                onClick={() => { setOpenPost(null); setCurrentPage("kontak"); }}
                className="inline-flex items-center justify-center gap-2 border border-sky-200 text-sky-600 hover:bg-sky-50 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Form Kontak
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white min-h-screen">
      {/* Hero */}
      <div className="relative bg-slate-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/jasa-pasang-ac-mojosari.webp')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-sky-900/90 via-sky-800/75 to-sky-700/60" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
              <Tag className="w-4 h-4" /> Tips & Informasi AC
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Blog & <span className="text-sky-200">Tips AC</span>
            </h1>
            <p className="text-sky-100 text-lg max-w-xl mx-auto">
              Kumpulan artikel, tips perawatan, dan panduan memilih AC dari para ahli HDB Airconds.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex flex-wrap gap-2 flex-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${activeCategory === cat ? "bg-sky-500 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-600"}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari artikel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-400 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">Artikel tidak ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => setOpenPost(post.id)}
                >
                  <div className="h-44 overflow-hidden">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-sky-100 text-sky-700 text-xs font-semibold px-2.5 py-1 rounded-full">{post.category}</span>
                      <span className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 leading-snug mb-2 group-hover:text-sky-600 transition-colors">{post.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs">{post.date}</span>
                      <span className="inline-flex items-center gap-1 text-sky-600 text-xs font-semibold group-hover:gap-2 transition-all">
                        Baca <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
