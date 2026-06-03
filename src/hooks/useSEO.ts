import { useEffect } from "react";

interface SEOMeta {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  keywords?: string;
  breadcrumb?: { name: string; url: string }[];
}

const BASE_URL = "https://www.hdbairconds.id";
const DEFAULT_OG_IMAGE = `${BASE_URL}/images/og-image.jpg`;

const HOME_BREADCRUMB = [
  { name: "Beranda", url: `${BASE_URL}/` },
];

const pageSEO: Record<string, SEOMeta> = {
  beranda: {
    title: "Service AC Mojokerto Mulai Rp90rb Â· Garansi Resmi | HDB Airconds",
    description:
      "Jasa service & cuci AC Mojokertoâ€“Mojosari. Teknisi bersertifikat, respon <2 jam, bergaransi resmi. Cuci AC mulai Rp90rb. Hubungi WA 24/7.",
    canonical: `${BASE_URL}/`,
    breadcrumb: HOME_BREADCRUMB,
  },
  katalog: {
    title: "Jual AC Mojokerto: Daikin, Panasonic, LG & 50+ Merek | HDB Airconds",
    description:
      "Beli AC original di Mojokerto: Daikin, Panasonic, Samsung, LG, Sharp, Mitsubishi, Gree. Harga kompetitif, garansi resmi, sudah termasuk instalasi.",
    canonical: `${BASE_URL}/katalog`,
    breadcrumb: [...HOME_BREADCRUMB, { name: "Katalog Produk", url: `${BASE_URL}/katalog` }],
  },
  layanan: {
    title: "Jasa Cuci & Service AC Mojokerto-Mojosari Mulai Rp90rb | HDB Airconds",
    description:
      "Cuci AC Rp90rb, isi freon Rp150rb, bongkar pasang Rp350rb di Mojokerto & Mojosari. Teknisi bersertifikat, garansi, layanan darurat 24 jam.",
    canonical: `${BASE_URL}/layanan`,
    breadcrumb: [...HOME_BREADCRUMB, { name: "Layanan AC", url: `${BASE_URL}/layanan` }],
  },
  tentang: {
    title: "Tentang HDB Airconds â€” 10+ Tahun Service AC Mojokerto Sejak 2014",
    description:
      "HDB Airconds berdiri 2014, melayani 5.000+ pelanggan di Mojokerto. Tim 15+ teknisi bersertifikat, komitmen kualitas dan kepuasan pelanggan.",
    canonical: `${BASE_URL}/tentang`,
    breadcrumb: [...HOME_BREADCRUMB, { name: "Tentang Kami", url: `${BASE_URL}/tentang` }],
  },
  blog: {
    title: "Blog & Tips Perawatan AC â€” Panduan Lengkap | HDB Airconds",
    description:
      "Tips merawat AC agar awet & hemat listrik, cara mengatasi AC tidak dingin, jadwal cuci AC ideal. Artikel dari teknisi AC berpengalaman.",
    canonical: `${BASE_URL}/blog`,
    breadcrumb: [...HOME_BREADCRUMB, { name: "Blog", url: `${BASE_URL}/blog` }],
  },
  karir: {
    title: "Lowongan Kerja Teknisi AC Mojokerto | HDB Airconds",
    description:
      "Lowongan kerja teknisi AC, customer service, dan posisi lainnya di HDB Airconds Mojokerto. Gaji kompetitif, jenjang karir jelas, lingkungan suportif.",
    canonical: `${BASE_URL}/karir`,
    breadcrumb: [...HOME_BREADCRUMB, { name: "Karir", url: `${BASE_URL}/karir` }],
  },
  kontak: {
    title: "Kontak & Konsultasi Gratis Service AC | HDB Airconds Mojokerto",
    description:
      "Hubungi HDB Airconds untuk konsultasi gratis, survei lokasi, atau pemesanan layanan AC di Mojokerto. WhatsApp, telepon, kunjungan langsung 24/7.",
    canonical: `${BASE_URL}/kontak`,
    breadcrumb: [...HOME_BREADCRUMB, { name: "Kontak", url: `${BASE_URL}/kontak` }],
  },
  privasi: {
    title: "Kebijakan Privasi | HDB Airconds",
    description:
      "Kebijakan privasi HDB Airconds: pengumpulan, penggunaan, dan perlindungan data pengguna sesuai regulasi yang berlaku di Indonesia.",
    canonical: `${BASE_URL}/privasi`,
    breadcrumb: [...HOME_BREADCRUMB, { name: "Kebijakan Privasi", url: `${BASE_URL}/privasi` }],
  },
  syarat: {
    title: "Syarat & Ketentuan Layanan | HDB Airconds",
    description:
      "Syarat dan ketentuan penggunaan layanan, pembelian produk, garansi, dan kebijakan retur di HDB Airconds Mojokerto.",
    canonical: `${BASE_URL}/syarat`,
    breadcrumb: [...HOME_BREADCRUMB, { name: "Syarat & Ketentuan", url: `${BASE_URL}/syarat` }],
  },
};

function setMetaTag(name: string, content: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const BREADCRUMB_SCRIPT_ID = "ld-breadcrumb-dynamic";
const PRODUCT_SCHEMA_SCRIPT_ID = "ld-products-dynamic";

function setBreadcrumbSchema(items: { name: string; url: string }[]) {
  // Hapus breadcrumb dinamis sebelumnya
  document.getElementById(BREADCRUMB_SCRIPT_ID)?.remove();

  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = BREADCRUMB_SCRIPT_ID;
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function removeProductSchema() {
  document.getElementById(PRODUCT_SCHEMA_SCRIPT_ID)?.remove();
}

async function fetchAndInjectProductSchema() {
  try {
    const res = await fetch("/api/seo/products-schema");
    if (!res.ok) return;
    const data = await res.json();

    // Hapus yang lama, inject yang baru
    removeProductSchema();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = PRODUCT_SCHEMA_SCRIPT_ID;
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  } catch (err) {
    console.warn("[useSEO] gagal fetch product schema:", err);
  }
}

export function useSEO(page: string) {
  useEffect(() => {
    const meta = pageSEO[page] ?? pageSEO["beranda"];
    const ogImage = meta.ogImage ?? DEFAULT_OG_IMAGE;
    const canonical = meta.canonical ?? BASE_URL;

    // Title
    document.title = meta.title;

    // Primary meta
    setMetaTag("title", meta.title);
    setMetaTag("description", meta.description);

    // Canonical
    setCanonical(canonical);

    // Open Graph
    setMetaTag("og:title", meta.title, true);
    setMetaTag("og:description", meta.description, true);
    setMetaTag("og:url", canonical, true);
    setMetaTag("og:image", ogImage, true);
    setMetaTag("og:type", page === "blog" ? "article" : "website", true);

    // Twitter
    setMetaTag("twitter:title", meta.title);
    setMetaTag("twitter:description", meta.description);
    setMetaTag("twitter:url", canonical);
    setMetaTag("twitter:image", ogImage);

    // Breadcrumb schema (dinamis per halaman)
    if (meta.breadcrumb && meta.breadcrumb.length > 0) {
      setBreadcrumbSchema(meta.breadcrumb);
    }

    // Product schema dinamis: hanya inject di halaman katalog
    if (page === "katalog") {
      fetchAndInjectProductSchema();
    } else {
      removeProductSchema();
    }
  }, [page]);
}
