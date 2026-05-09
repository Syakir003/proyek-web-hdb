# 🌬️ HDB AC Shop - E-Commerce & Service Management Platform

Full-stack web application untuk mengelola penjualan AC dan layanan servis. Platform ini menggabungkan customer portal, admin dashboard, dan technician interface dalam satu sistem terintegrasi.

> **📄 [Lihat README untuk Client/Public](./README_CLIENT.md)** - Versi presentasi untuk client dan stakeholder

## 🎯 Project Overview

HDB AC Shop adalah aplikasi web modern yang dibangun dengan React + TypeScript di frontend dan Node.js/Express di backend.

**Fitur Utama:**

- E-Commerce Platform dengan payment gateway (Midtrans)
- Admin Dashboard dengan advanced analytics
- Technician management system
- Real-time order tracking
- Multi-user authentication (customer, admin, technician)

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool (fast, modern)
- **Tailwind CSS** - Utility-first CSS
- **Motion/Framer Motion** - Animations
- **Lucide React** - Icons

### Backend

- **Node.js + Express** - Server framework
- **TypeScript** - Type safety
- **MySQL 8.0** - Relational database
- **JWT** - Authentication
- **Midtrans SDK** - Payment gateway

## 🎨 Key Features

### Customer Portal

- 🛒 Product catalog dengan filter & search
- 🛍️ Shopping cart
- 💳 Checkout dengan multiple payment options
- 📦 Order tracking
- 📋 Service booking
- 👤 Account management

### Admin Dashboard

- 📊 Advanced analytics dengan monthly revenue graphs
- 📈 Financial breakdown & order statistics
- 🏆 Top products & technician ranking
- 👥 User management
- 📦 Product & service management
- 📋 Order management
- 💰 Payment tracking

### Technician Interface

- 📱 Mobile-friendly dashboard
- 📝 Order assignment & tracking
- ✅ Job status updates
- 📊 Performance metrics

## � Project Structure

```
src/
├── components/           # Reusable components
├── pages/               # Page components
│   ├── admin/          # Admin pages
│   ├── teknisi/        # Technician pages
│   └── [user pages]
├── utils/              # Utilities & helpers
├── App.tsx
├── main.tsx
└── index.css

server.ts               # Express backend
database_migrations.sql # Database schema
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- Git

### Installation

1. **Clone & install**

   ```bash
   git clone https://github.com/Syakir003/proyek-web-hdb.git
   cd proyek-web-hdb
   npm install
   ```

2. **Setup environment**

   ```bash
   cp .env.example .env
   # Edit .env dengan database & Midtrans credentials
   ```

3. **Database**

   ```bash
   mysql -u root -p < database_migrations.sql
   ```

4. **Run development**
   ```bash
   npm run dev
   ```

Frontend: http://localhost:5174  
Backend: http://localhost:5000

### Production

```bash
npm run build
npm start
```

## 🔑 Environment Variables

Required variables (see `.env.example`):

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`
- `MIDTRANS_IS_PRODUCTION`

## 💳 Payment Integration

Platform uses **Midtrans** for payment processing. Supported methods:

- QRIS
- Bank Transfer
- E-Wallet (GoPay, OVO, Dana)

See [MIDTRANS_SETUP.md](./MIDTRANS_SETUP.md) for configuration details.

## 📚 Documentation

- [MIDTRANS_SETUP.md](./MIDTRANS_SETUP.md) - Payment setup
- [TODO.md](./TODO.md) - Backlog & improvements
- [README_CLIENT.md](./README_CLIENT.md) - Client-facing docs

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m 'Add YourFeature'`
4. Push: `git push origin feature/YourFeature`
5. Open Pull Request

## 📝 Git Workflow

- **main** - Production-ready code
- **feature/** - New features
- **bugfix/** - Bug fixes
- **hotfix/** - Critical fixes

## 📄 License

MIT License - see LICENSE file for details

## 👥 Author

**Syakir003** - https://github.com/Syakir003

## 📞 Support

- 📧 Issues: https://github.com/Syakir003/proyek-web-hdb/issues
- 📖 Wiki: [Project Documentation]

---

**Built with ❤️ for HDB AC Shop**
