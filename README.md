# 🌬️ HDB AC Shop - Platform E-Commerce & Manajemen Servis AC

Platform e-commerce dan manajemen servis AC yang komprehensif dengan integrasi pembayaran Midtrans, dashboard admin lengkap, dan sistem tracking untuk teknisi.

## ✨ Fitur Utama

### 👥 **Customer Features**

- 🛒 **Katalog Produk** - Browse dan filter AC dengan berbagai merk dan spesifikasi
- 🛍️ **Shopping Cart** - Tambah/hapus produk dengan manajemen kuantitas
- 💳 **Payment Gateway** - Integrasi Midtrans (QRIS, Transfer Bank, GoPay)
- 📦 **Order History** - Riwayat pesanan dengan status real-time
- 📋 **Layanan** - Pesan layanan AC (cleaning, freon, instalasi, perbaikan)
- 👤 **User Account** - Login dan manajemen profil

### 🔧 **Teknisi Features**

- 📱 **Dashboard** - Monitoring pesanan yang ditugaskan
- ✅ **Order Status** - Update status pekerjaan real-time
- 📊 **Performance** - Tracking completion rate

### 👨‍💼 **Admin Features**

- 📊 **Advanced Reports** - Dashboard dengan grafik pendapatan bulanan (12 bulan terakhir)
- 📈 **Analytics** - Revenue breakdown dan order status statistics
- 🏆 **Top Products** - Ranking produk paling banyak dibeli
- 👥 **User Management** - CRUD operasi untuk users dan teknisi
- 📦 **Product Management** - Kelola katalog AC dan layanan
- 📋 **Order Management** - Review dan kelola semua pesanan
- 💰 **Financial Tracking** - Status pembayaran dan laporan finansial

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Motion/Framer Motion** - Animations
- **Lucide React** - Icons

### Backend

- **Node.js + Express** - Server framework
- **TypeScript** - Type safety
- **MySQL 8** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Midtrans SDK** - Payment gateway

### Additional

- **Midtrans Snap** - Payment UI
- **mysql2/promise** - Database driver

## 📋 Prerequisites

Sebelum memulai, pastikan Anda memiliki:

- Node.js v18+ ([Download](https://nodejs.org/))
- MySQL 8.0+ ([Download](https://www.mysql.com/downloads/))
- Git ([Download](https://git-scm.com/))
- Midtrans Account (Sandbox) - https://dashboard.sandbox.midtrans.com

## 🚀 Instalasi & Setup

### 1. Clone Repository

```bash
git clone https://github.com/Syakir003/proyek-web-hdb.git
cd proyek-web-hdb
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

#### Option A: Menggunakan SQL Dump

```bash
# Import database_migrations.sql ke MySQL
mysql -u root -p hdb_airconds < database_migrations.sql
```

#### Option B: Manual Setup

```sql
-- Buat database
CREATE DATABASE nama_DB_anda CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nama_DB_anda;

-- Jalankan query dari database_migrations.sql
```

### 4. Setup Environment Variables

Salin `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi lokal Anda:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hdb_airconds

# JWT Secret (generate dengan random string)
JWT_SECRET=your_jwt_secret_key_here_min_32_chars

# Midtrans Configuration (Sandbox)
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxx
```

### 5. Dapatkan Midtrans Keys

1. Buka https://dashboard.sandbox.midtrans.com
2. Login dengan akun Anda
3. Ke Settings → Access Keys
4. Copy `Server Key` dan `Client Key`
5. Paste ke file `.env`

Lihat detail setup di [MIDTRANS_SETUP.md](./MIDTRANS_SETUP.md)

## 🏃 Menjalankan Project

### Development Mode

```bash
npm run dev
```

Server akan berjalan di:

- **Frontend**: http://localhost:5174 (atau 5175)
- **Backend**: http://localhost:5000

### Production Build

```bash
npm run build
npm start
```

## 📁 Struktur Project

```
proyek-web-hdb/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Footer.tsx
│   │   └── Navbar.tsx
│   ├── pages/              # Page components
│   │   ├── Home.tsx
│   │   ├── Catalog.tsx
│   │   ├── Cart.tsx
│   │   ├── Checkout.tsx    # Payment integration
│   │   ├── Contact.tsx
│   │   ├── Login.tsx
│   │   ├── UserOrders.tsx
│   │   ├── admin/          # Admin dashboard
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminOrders.tsx
│   │   │   ├── AdminProducts.tsx
│   │   │   ├── AdminReports.tsx    # Advanced analytics
│   │   │   ├── AdminServices.tsx
│   │   │   ├── AdminUsers.tsx
│   │   │   └── AdminSidebar.tsx
│   │   └── teknisi/        # Teknisi dashboard
│   │       └── TeknisiDashboard.tsx
│   ├── utils/
│   │   └── midtrans.ts     # Midtrans utilities
│   ├── data.ts             # Static data
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── server.ts               # Express backend
├── database_migrations.sql # Database schema
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── vite.config.ts        # Vite config
└── README.md            # Documentation
```

## 🔐 Authentication

### Login Credentials (Demo)

**Admin:**

- Username: `admin2`
- Password: `admin123` (lihat database untuk credentials asli)

**Teknisi:**

- Username: `Putra86`
- Password: Sesuai di database

**User:**

- Buat akun baru atau gunakan existing

### JWT Flow

1. User login → Backend verify credentials
2. Backend return JWT token
3. Frontend store token di localStorage
4. Token digunakan untuk authorized requests

## 💳 Payment Integration

### Payment Methods (Enabled)

- 🔷 **QRIS** - Quick Response Code Indonesia Standard
- 🏦 **Transfer Bank** - Bank transfer manual
- 🚀 **GoPay** - Digital wallet

### Payment Flow

1. Customer add items to cart
2. Proceed to checkout
3. Click "Bayar Sekarang"
4. Midtrans Snap modal opens
5. Choose payment method
6. Complete payment
7. Order status updated to "processing"
8. Admin assigns teknisi

## 📊 Database Schema

### Main Tables

- **users** - Customer, admin, teknisi accounts
- **products** - AC products catalog
- **services** - Layanan AC (cleaning, freon, dll)
- **orders** - Customer orders
- **order_items** - Items dalam setiap order
- **carts** - Shopping cart items

### Views

- **v_dashboard_stats** - Dashboard statistics
- **v_orders_admin** - Order list untuk admin
- **v_orders_teknisi** - Assigned orders untuk teknisi

## 🚀 Deployment

### Heroku Deployment

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set DB_HOST=your_db_host
heroku config:set DB_USER=your_db_user
# ... set semua variables

# Push ke Heroku
git push heroku main
```

### Vercel (Frontend Only)

```bash
npm install -g vercel
vercel
```

## 📝 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register      - Register user baru
POST   /api/auth/login         - Login user
POST   /api/auth/logout        - Logout user
```

### Products Endpoints

```
GET    /api/products           - Get semua produk
GET    /api/products/:id       - Get detail produk
```

### Orders Endpoints

```
POST   /api/orders             - Create order
GET    /api/orders             - Get user orders
GET    /api/orders/:id         - Get order detail
```

### Payment Endpoints

```
POST   /api/midtrans/snap-token      - Create payment token
GET    /api/midtrans/check-status/:orderId - Check payment status
POST   /api/midtrans/notification    - Midtrans webhook
```

### Admin Endpoints

```
GET    /api/admin/stats               - Dashboard stats
GET    /api/admin/reports/detailed    - Advanced analytics
GET    /api/admin/orders              - Semua orders
POST   /api/admin/products            - Create product
```

Lihat `server.ts` untuk dokumentasi lengkap endpoint.

## 🧪 Testing

### Manual Testing Midtrans

1. Go to Checkout page
2. Fill customer details
3. Click "Bayar Sekarang"
4. Use Midtrans test card:
   - Card Number: `4811 1111 1111 1114`
   - Expiry: Any future date
   - CVV: `123`

## 🐛 Troubleshooting

### Port 5000/5173 Already in Use

```bash
# Find process using port
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Database Connection Error

- Check DB credentials di `.env`
- Ensure MySQL service running
- Verify database `hdb_airconds` exists

### Midtrans Error: "snap is not defined"

- Clear browser cache
- Reload page
- Check Midtrans keys di `.env`

## 📚 Additional Resources

- [Midtrans Documentation](https://docs.midtrans.com/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📄 File Penting

- [MIDTRANS_SETUP.md](./MIDTRANS_SETUP.md) - Setup detail Midtrans
- [TODO.md](./TODO.md) - Feature backlog dan improvement ideas
- [database_migrations.sql](./database_migrations.sql) - Database schema

## 👥 Author

- **Syakir003** - https://github.com/Syakir003

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Kontribusi sangat diterima! Untuk kontribusi besar, silakan buka issue terlebih dahulu untuk diskusi.

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support & Contact

Untuk pertanyaan atau issues, silakan buka GitHub Issue: https://github.com/Syakir003/proyek-web-hdb/issues

---

**Built with ❤️ for HDB AC Shop**
