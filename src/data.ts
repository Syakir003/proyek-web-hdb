export interface Product {
  id: string;
  name: string;
  brand: string;
  type: string;
  capacity: string;
  price: number;
  image: string;
  description: string;
  features: string[];
}

export interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  itemType: "product" | "service";
  image?: string;
  brand?: string;
  capacity?: string;
  icon?: string;
  description?: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Daikin Flash Inverter FTKQ25",
    brand: "Daikin",
    type: "Inverter",
    capacity: "1 PK",
    price: 4850000,
    image:
      "https://images.unsplash.com/photo-1622044810759-45089766ee26?auto=format&fit=crop&q=80&w=800",
    description:
      "AC Daikin Flash Inverter menawarkan pendinginan yang cepat dan efisiensi energi yang tinggi. Cocok untuk ruang keluarga dan kamar tidur.",
    features: [
      "Hemat Listrik",
      "Pendinginan Cepat",
      "Filter Anti Bakteri",
      "Mode Senyap",
    ],
  },
  {
    id: "2",
    name: "Panasonic Standard CS/CU-LN5WKJ",
    brand: "Panasonic",
    type: "Standard",
    capacity: "1/2 PK",
    price: 3200000,
    image:
      "https://images.unsplash.com/photo-1585058178115-d9120f2b3806?auto=format&fit=crop&q=80&w=800",
    description:
      "AC Panasonic Standard dengan teknologi Blue Fin Evaporator yang tahan terhadap korosi dan Eco Tough.",
    features: [
      "Blue Fin Evaporator",
      "Eco Tough",
      "Low Voltage",
      "Garansi Kompresor 3 Tahun",
    ],
  },
  {
    id: "3",
    name: "Sharp Plasmacluster AH-AP5SSY",
    brand: "Sharp",
    type: "Standard",
    capacity: "1/2 PK",
    price: 3450000,
    image:
      "https://images.unsplash.com/photo-1527628217451-b2414a1ee733?auto=format&fit=crop&q=80&w=800",
    description:
      "Dilengkapi dengan teknologi Plasmacluster yang efektif melumpuhkan virus, bakteri, dan jamur di udara.",
    features: [
      "Plasmacluster Ion",
      "Baby Sleep Mode",
      "Coanda Airflow",
      "Auto Restart",
    ],
  },
  {
    id: "4",
    name: "Gree Low Watt GWC-05C3E",
    brand: "Gree",
    type: "Low Watt",
    capacity: "1/2 PK",
    price: 3100000,
    image:
      "https://images.unsplash.com/photo-1622044810759-45089766ee26?auto=format&fit=crop&q=80&w=800",
    description:
      "AC Gree Low Watt sangat hemat listrik, cocok untuk rumah dengan daya listrik terbatas.",
    features: [
      "Daya Rendah (330W)",
      "Triple Protection",
      "Smart Cleaner",
      "Garansi 10 Tahun",
    ],
  },
  {
    id: "5",
    name: "LG Dual Inverter T10EV4",
    brand: "LG",
    type: "Inverter",
    capacity: "1 PK",
    price: 4600000,
    image:
      "https://images.unsplash.com/photo-1585058178115-d9120f2b3806?auto=format&fit=crop&q=80&w=800",
    description:
      "Teknologi Dual Inverter Compressor dari LG membuat AC lebih cepat dingin, lebih awet, dan lebih tenang.",
    features: ["Dual Inverter", "Watt Control", "Auto Cleaning", "Gold Fin"],
  },
  {
    id: "6",
    name: "Samsung WindFree Inverter",
    brand: "Samsung",
    type: "Inverter",
    capacity: "1.5 PK",
    price: 6200000,
    image:
      "https://images.unsplash.com/photo-1527628217451-b2414a1ee733?auto=format&fit=crop&q=80&w=800",
    description:
      "Pendinginan tanpa hembusan angin langsung berkat teknologi WindFree. Sangat nyaman untuk tidur.",
    features: [
      "WindFree Cooling",
      "AI Auto Cooling",
      "Digital Inverter Boost",
      "Easy Filter Plus",
    ],
  },
];

export const services: Service[] = [
  {
    id: "s1",
    name: "Cuci AC (Cleaning)",
    price: 90000,
    description:
      "Pembersihan menyeluruh unit indoor dan outdoor untuk menjaga performa optimal dan mencegah kerusakan dini.",
    icon: "droplets",
  },
  {
    id: "s2",
    name: "Tambah / Isi Freon",
    price: 150000,
    description:
      "Pengecekan tekanan dan pengisian freon dengan refrigerant asli (R32/R410A/R22) untuk pendinginan maksimal.",
    icon: "gauge",
  },
  {
    id: "s3",
    name: "Bongkar Pasang AC",
    price: 350000,
    description:
      "Jasa pemindahan AC atau pemasangan unit baru oleh teknisi bersertifikat dengan pengerjaan rapi dan bergaransi.",
    icon: "wrench",
  },
  {
    id: "s4",
    name: "Perbaikan Kelistrikan",
    price: 250000,
    description:
      "Perbaikan masalah kelistrikan atau modul PCB AC dengan diagnosa transparan dan spare part original bergaransi.",
    icon: "zap",
  },
];
