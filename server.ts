import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import multer from "multer";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import os from "os";
import midtransClient from "midtrans-client";
import crypto from "crypto";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import sharp from "sharp";
import { fileURLToPath } from "url";

dotenv.config();

// ESM tidak punya __dirname bawaan â€” buat manual dari import.meta.url
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// =========================
// IMAGE PIPELINE â€” auto-WebP + resize + compress
// =========================
/**
 * Convert any uploaded image buffer to optimized WebP.
 * - Resize: max 1920px width (preserve aspect)
 * - Quality: 82 (sweet spot)
 * - Strip metadata (EXIF, GPS, etc) â€” privacy + smaller size
 * - Output: image/webp buffer
 */
async function optimizeImage(buffer: Buffer | undefined | null): Promise<Buffer | null> {
  if (!buffer) return null;
  try {
    return await sharp(buffer, { failOn: "none" })
      .rotate() // auto-rotate sesuai EXIF
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
  } catch (err) {
    console.error("[optimizeImage] gagal convert:", err);
    return buffer; // fallback: simpan raw bila sharp gagal
  }
}

/**
 * Generate slug-friendly alt text dari nama produk.
 * Cth: "Daikin 1PK Inverter FTKQ25" â†’ "AC Daikin 1PK Inverter FTKQ25 - jual AC Mojokerto HDB Airconds"
 */
function generateProductAlt(name: string, brand?: string, type?: string, capacity?: string): string {
  const parts = [name, brand, type, capacity].filter(Boolean).join(" ");
  return `${parts} - jual & jasa pasang AC Mojokerto HDB Airconds`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

// Validasi daftar item penambahan order (dipakai saat create & revise).
// Mengembalikan pesan error, atau null bila valid.
function validateAdditionItems(items: any): string | null {
  if (!Array.isArray(items) || items.length === 0) return 'items tidak boleh kosong';
  for (const item of items) {
    if (!item || (item.item_type !== 'material' && item.item_type !== 'service')) {
      return 'item_type harus "material" atau "service"';
    }
    if (item.ref_id === undefined || item.ref_id === null || String(item.ref_id).trim() === '') {
      return 'ref_id wajib diisi';
    }
    const qty = Number(item.quantity);
    if (!Number.isFinite(qty) || qty <= 0 || qty > 10000) {
      return 'quantity harus berupa angka antara 1 dan 10000';
    }
  }
  return null;
}

// =========================
// FAIL FAST â€” env wajib ada
// =========================
const REQUIRED_ENV = ["JWT_SECRET", "DB_HOST", "DB_USER", "DB_NAME"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[ERR] Missing required env variable: ${key}`);
    process.exit(1);
  }
}

const JWT_SECRET = process.env.JWT_SECRET!;
const PORT = Number(process.env.PORT) || 5000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Guard tambahan untuk production: tolak startup bila konfigurasi rawan
if (IS_PRODUCTION) {
  if (!process.env.DB_PASSWORD) {
    console.error("[ERR] DB_PASSWORD wajib diisi di environment production");
    process.exit(1);
  }
  if (JWT_SECRET.length < 32) {
    console.error("[ERR] JWT_SECRET terlalu lemah untuk production (min. 32 karakter acak). " +
      "Generate dengan: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"");
    process.exit(1);
  }
}

// =========================
// PUBLIC BASE URL
// =========================
// Dipakai untuk semua link yang dikirim ke customer (WA approval tambahan,
// link invoice) dan callback "finish" Midtrans. Default ke domain produksi
// supaya link TIDAK pernah jadi localhost walau BASE_URL belum di-set di
// environment (mis. di Railway). Untuk testing lokal, set BASE_URL=http://localhost:5173 di .env.
const PUBLIC_BASE_URL = (process.env.BASE_URL || process.env.SITE_URL || "https://www.hdbairconds.id").replace(/\/+$/, "");

// =========================
// MIDTRANS SETUP + VALIDATION
// =========================
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || "";
// Hindari mencetak detail diagnostik key di production (membantu attacker memvalidasi key curian)
if (!IS_PRODUCTION) {
  console.log("[KEY] SERVER KEY len:", MIDTRANS_SERVER_KEY.length, "| last char code:", MIDTRANS_SERVER_KEY.charCodeAt(MIDTRANS_SERVER_KEY.length - 1));
  console.log("[KEY] CLIENT KEY len:", MIDTRANS_CLIENT_KEY.length, "| last char code:", MIDTRANS_CLIENT_KEY.charCodeAt(MIDTRANS_CLIENT_KEY.length - 1));
}

// Validation: cek konfigurasi Midtrans (warning only, tidak crash)
(function validateMidtransConfig() {
  if (!MIDTRANS_SERVER_KEY || !MIDTRANS_CLIENT_KEY) {
    console.warn("[WARN] MIDTRANS_SERVER_KEY atau MIDTRANS_CLIENT_KEY belum diisi di .env");
    console.warn("    Pembayaran TIDAK akan berfungsi sampai key diisi.");
    return;
  }

  const serverIsSandbox = MIDTRANS_SERVER_KEY.startsWith("SB-Mid-server-");
  const serverIsProduction = MIDTRANS_SERVER_KEY.startsWith("Mid-server-");
  const clientIsSandbox = MIDTRANS_CLIENT_KEY.startsWith("SB-Mid-client-");
  const clientIsProduction = MIDTRANS_CLIENT_KEY.startsWith("Mid-client-");

  // Beberapa akun sandbox Midtrans tidak menggunakan prefix SB-
  // sehingga prefix check hanya sebagai informasi, bukan blocking
  const serverEnv = serverIsSandbox ? "sandbox" : serverIsProduction ? "production" : "unknown";
  const clientEnv = clientIsSandbox ? "sandbox" : clientIsProduction ? "production" : "unknown";

  if (serverEnv !== "unknown" && clientEnv !== "unknown" && serverEnv !== clientEnv) {
    console.warn("[WARN] Server key dan Client key terdeteksi beda environment!");
    console.warn(`    Server key: ${serverEnv} (${MIDTRANS_SERVER_KEY.substring(0, 20)}...)`);
    console.warn(`    Client key: ${clientEnv} (${MIDTRANS_CLIENT_KEY.substring(0, 20)}...)`);
  }

  // Hanya warn jika prefix SB- jelas menandakan sandbox tapi flag production=true, atau sebaliknya
  if (MIDTRANS_IS_PRODUCTION && serverIsSandbox) {
    console.warn("[WARN] MIDTRANS_IS_PRODUCTION=true tapi key berawalan SB- (sandbox).");
  }
  if (!MIDTRANS_IS_PRODUCTION && serverIsProduction) {
    console.warn(`[WARN] MIDTRANS_IS_PRODUCTION=false dengan key berawalan Mid-server- (production-style).`);
    console.warn("    Jika ini akun sandbox tanpa prefix SB-, abaikan pesan ini.");
  }

  console.log(`[OK] Midtrans configured: ${MIDTRANS_IS_PRODUCTION ? "PRODUCTION (real money!)" : "SANDBOX (test mode)"}`);
})();

const snap = new midtransClient.Snap({
  isProduction: MIDTRANS_IS_PRODUCTION,
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY,
});

// =========================
// DB POOL
// =========================
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// =========================
// DB MIGRATION
// =========================
async function testDB() {
  await pool.query("SELECT 1");
  console.log("[OK] Database connected");

  // Migration: tambah image_alt + image_mime ke products (jika belum ada)
  const [productCols]: any = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'`,
  );
  const productColSet = new Set((productCols as any[]).map(r => r.COLUMN_NAME));
  if (!productColSet.has("image_alt")) {
    await pool.query("ALTER TABLE products ADD COLUMN image_alt VARCHAR(255) DEFAULT NULL");
    console.log("  -> migrated: products.image_alt added");
  }
  if (!productColSet.has("image_mime")) {
    await pool.query("ALTER TABLE products ADD COLUMN image_mime VARCHAR(50) DEFAULT 'image/webp'");
    console.log("  -> migrated: products.image_mime added");
  }
  if (!productColSet.has("slug")) {
    await pool.query("ALTER TABLE products ADD COLUMN slug VARCHAR(200) DEFAULT NULL, ADD INDEX idx_slug (slug)");
    console.log("  -> migrated: products.slug added");
  }

  // Migration: tambah image_mime ke team
  const [teamCols]: any = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team'`,
  );
  const teamColSet = new Set((teamCols as any[]).map(r => r.COLUMN_NAME));
  if (teamColSet.size > 0 && !teamColSet.has("image_mime")) {
    await pool.query("ALTER TABLE team ADD COLUMN image_mime VARCHAR(50) DEFAULT 'image/webp'");
    console.log("  -> migrated: team.image_mime added");
  }

  const [cols]: any = await pool.query(
    `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'notes'`,
  );
  if (Number(cols[0].cnt) === 0) {
    await pool.query("ALTER TABLE orders ADD COLUMN notes TEXT DEFAULT NULL");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_photos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(100) NOT NULL,
      photo_type ENUM('before','after') NOT NULL,
      image MEDIUMBLOB NOT NULL,
      mime_type VARCHAR(50) DEFAULT 'image/jpeg',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_order_id (order_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id         VARCHAR(50) NOT NULL PRIMARY KEY,
      name       VARCHAR(200) NOT NULL,
      price      DECIMAL(12,2) NOT NULL DEFAULT 0,
      description TEXT,
      icon       VARCHAR(50) NOT NULL DEFAULT 'wrench',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_tiers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service_id VARCHAR(50) NOT NULL,
      label VARCHAR(100) NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      sort_order INT DEFAULT 0,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS team (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      position ENUM('founder','admin','kepala_teknisi','teknisi','lainnya') NOT NULL DEFAULT 'lainnya',
      role_label VARCHAR(100) NOT NULL,
      bio TEXT,
      phone VARCHAR(20),
      image MEDIUMBLOB,
      sort_order INT NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // â”€â”€ ORDER ADDITIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await pool.query(`
    CREATE TABLE IF NOT EXISTS material_catalog (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(200) NOT NULL,
      unit       VARCHAR(50) NOT NULL DEFAULT 'pcs',
      price      DECIMAL(12,2) NOT NULL,
      category   VARCHAR(100),
      is_active  TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_additions (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      order_id         VARCHAR(50) NOT NULL,
      initiated_by     ENUM('teknisi','customer') NOT NULL,
      initiated_by_id  INT NOT NULL,
      status           ENUM(
                         'pending_admin','admin_approved','admin_rejected',
                         'pending_customer','customer_approved','customer_rejected',
                         'paid','cancelled'
                       ) NOT NULL DEFAULT 'pending_admin',
      admin_notes      TEXT,
      payment_method   ENUM('cash','online') DEFAULT NULL,
      payment_status   ENUM('pending','paid') DEFAULT NULL,
      customer_token   VARCHAR(64) UNIQUE,
      invoice_number   VARCHAR(20) DEFAULT NULL,
      invoice_sent_at  TIMESTAMP DEFAULT NULL,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      INDEX idx_oa_order_id (order_id),
      INDEX idx_oa_token (customer_token)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_addition_items (
      id                  INT AUTO_INCREMENT PRIMARY KEY,
      order_addition_id   INT NOT NULL,
      item_type           ENUM('material','service') NOT NULL,
      ref_id              VARCHAR(50) NOT NULL,
      name                VARCHAR(200) NOT NULL,
      unit                VARCHAR(50) NOT NULL DEFAULT 'pcs',
      quantity            DECIMAL(10,2) NOT NULL DEFAULT 1,
      unit_price          DECIMAL(12,2) NOT NULL,
      subtotal            DECIMAL(12,2) NOT NULL,
      FOREIGN KEY (order_addition_id) REFERENCES order_additions(id) ON DELETE CASCADE
    )
  `);

  // Migration: tambah kolom invoice ke orders
  const [ordInvCols]: any = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'`
  );
  const ordInvColSet = new Set((ordInvCols as any[]).map((r: any) => r.COLUMN_NAME));
  if (!ordInvColSet.has('invoice_number')) {
    await pool.query("ALTER TABLE orders ADD COLUMN invoice_number VARCHAR(30) DEFAULT NULL");
    console.log("  -> migrated: orders.invoice_number added");
  }
  if (!ordInvColSet.has('invoice_token')) {
    await pool.query("ALTER TABLE orders ADD COLUMN invoice_token VARCHAR(64) DEFAULT NULL");
    console.log("  -> migrated: orders.invoice_token added");
  }
  if (!ordInvColSet.has('invoice_sent_at')) {
    await pool.query("ALTER TABLE orders ADD COLUMN invoice_sent_at TIMESTAMP NULL DEFAULT NULL");
    console.log("  -> migrated: orders.invoice_sent_at added");
  }

  // Migration: simpan midtrans_order_id pada order_additions agar webhook
  // bisa mencocokkan transaksi secara eksak (bukan parsing string yang rapuh)
  const [oaCols]: any = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_additions'`
  );
  const oaColSet = new Set((oaCols as any[]).map((r: any) => r.COLUMN_NAME));
  if (!oaColSet.has('midtrans_order_id')) {
    await pool.query("ALTER TABLE order_additions ADD COLUMN midtrans_order_id VARCHAR(100) DEFAULT NULL");
    await pool.query("ALTER TABLE order_additions ADD INDEX idx_oa_midtrans (midtrans_order_id)");
    console.log("  -> migrated: order_additions.midtrans_order_id added");
  }
}

// =========================
// MULTER â€” batas 5 MB, hanya gambar
// =========================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Hanya file gambar yang diizinkan"));
    }
    cb(null, true);
  },
});

// =========================
// MIDDLEWARE AUTH
// =========================
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "No token" });

  // Kunci algoritma ke HS256 (cegah algorithm-confusion / token "alg:none")
  jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }, (err: any, user: any) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid token" });
    req.user = user;
    next();
  });
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }
  next();
};

const requireTeknisi = (req: any, res: any, next: any) => {
  if (!["admin", "teknisi"].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }
  next();
};

// =========================
// HELPER â€” ORDER ADDITIONS
// =========================
async function getAdditionWithItems(additionId: number) {
  const [rows]: any = await pool.query(
    `SELECT oa.*,
            o.customer_name, o.phone as customer_phone, o.address as customer_address,
            u.name as teknisi_name
     FROM order_additions oa
     JOIN orders o ON oa.order_id = o.id
     LEFT JOIN users u ON o.teknisi_id = u.id
     WHERE oa.id = ?`,
    [additionId]
  );
  if (!rows.length) return null;
  const addition = rows[0];
  const [items]: any = await pool.query(
    'SELECT * FROM order_addition_items WHERE order_addition_id = ?',
    [additionId]
  );
  const total = items.reduce((sum: number, i: any) => sum + Number(i.subtotal), 0);
  return { ...addition, items, total };
}

// =========================
// START SERVER
// =========================
async function startServer() {
  const app = express();

  // Di balik proxy Railway: percayai X-Forwarded-* agar IP klien benar
  // & express-rate-limit tidak error (ERR_ERL_UNEXPECTED_X_FORWARDED_FOR)
  app.set("trust proxy", 1);

  // Canonical host: redirect apex (hdbairconds.id) -> www.hdbairconds.id
  // supaya sinyal SEO terkonsolidasi ke satu domain (301 = permanen).
  // Hanya GET agar webhook/API POST (mis. Midtrans) tidak ikut di-redirect.
  app.use((req, res, next) => {
    if (req.method === "GET" && req.hostname === "hdbairconds.id") {
      return res.redirect(301, `https://www.hdbairconds.id${req.originalUrl}`);
    }
    next();
  });

  // Security headers â€” izinkan gambar dari https eksternal (avatar dll),
  // proteksi helmet lain tetap default (script tetap 'self')
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https:"],
        // Izinkan script Midtrans Snap (sandbox & production)
        "script-src": [
          "'self'",
          "https://app.sandbox.midtrans.com",
          "https://app.midtrans.com",
        ],
        // XHR Snap ke API Midtrans
        "connect-src": [
          "'self'",
          "https://api.sandbox.midtrans.com",
          "https://api.midtrans.com",
          "https://app.sandbox.midtrans.com",
          "https://app.midtrans.com",
        ],
        // Iframe: Google Maps (halaman Kontak) + popup pembayaran Midtrans Snap
        "frame-src": [
          "'self'",
          "https://maps.google.com",
          "https://www.google.com",
          "https://app.sandbox.midtrans.com",
          "https://app.midtrans.com",
        ],
      },
    },
  }));

  // CORS â€” izinkan origin dari env, fallback localhost dev
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:4173")
    .split(",")
    .map(o => o.trim());

  // Auto-izinkan domain publik Railway (same-origin di production)
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    allowedOrigins.push(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  }

  const isProduction = process.env.NODE_ENV === "production";

  app.use(cors({
    origin: (origin, callback) => {
      // Requests tanpa origin (server-to-server, curl, dll) selalu diizinkan
      if (!origin) return callback(null, true);
      // Origin ada di whitelist
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Di luar production, izinkan semua localhost / 127.0.0.1 / IP privat (192.168.x.x, 172.x.x.x, 10.x.x.x)
      if (!isProduction) {
        const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        const isPrivate = /^http:\/\/(192\.168\.|172\.(1[6-9]|2\d|3[01])\.|10\.)\d+\.\d+(:\d+)?$/.test(origin);
        if (isLocal || isPrivate) return callback(null, true);
      }
      // Origin tak dikenal: tolak TANPA melempar error (hindari 500).
      // Browser akan blokir baca lintas-origin; same-origin tetap jalan.
      callback(null, false);
    },
    credentials: true,
  }));

  // Body size limit â€” cegah payload serangan besar
  app.use(express.json({ limit: "1mb" }));

  // Rate limit untuk endpoint autentikasi (maks 20 percobaan / 15 menit per IP)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: "Terlalu banyak percobaan, coba lagi nanti" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Rate limit umum untuk semua API (maks 200 req / menit per IP)
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/", apiLimiter);

  // Rate limit ketat untuk endpoint pembayaran publik milik customer (tanpa auth).
  // Maks 15 percobaan / 15 menit per IP â€” cegah abuse & enumeration token.
  const customerPaymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { success: false, message: "Terlalu banyak percobaan, coba lagi nanti" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  await testDB();

  // =========================
  // AUTH REGISTER
  // =========================
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    const { username, password, name } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ success: false, error: "Semua field wajib diisi" });
    }
    if (typeof username !== "string" || username.length < 3 || username.length > 50) {
      return res.status(400).json({ success: false, error: "Username harus 3â€“50 karakter" });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ success: false, error: "Username hanya boleh huruf, angka, dan underscore" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ success: false, error: "Password minimal 8 karakter" });
    }

    try {
      const [exists]: any = await pool.query("SELECT id FROM users WHERE username=?", [username]);
      if (exists.length) {
        return res.status(400).json({ success: false, error: "Username sudah dipakai" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const [ins]: any = await pool.query(
        "INSERT INTO users (username,password,name,role) VALUES (?,?,?,?)",
        [username, hashedPassword, name, "user"],
      );

      // Sertakan id agar konsisten dengan token login (dipakai cek kepemilikan order)
      const token = jwt.sign({ id: ins.insertId, username, role: "user" }, JWT_SECRET, { expiresIn: "24h" });
      res.json({ success: true, token, role: "user" });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mendaftar, coba lagi" });
    }
  });

  // =========================
  // AUTH LOGIN
  // =========================
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Username dan password wajib diisi" });
    }

    try {
      const [rows]: any = await pool.query("SELECT * FROM users WHERE username=?", [username]);
      const user = rows[0];

      // Selalu bandingkan hash walau user tidak ada (cegah timing attack)
      const dummyHash = "$2b$12$invalidhashfortimingggggggggggggggggggggggggggggg";
      const isValid = user
        ? await bcrypt.compare(password, user.password)
        : await bcrypt.compare(password, dummyHash).then(() => false);

      if (!user || !isValid) {
        return res.status(401).json({ success: false, error: "Username atau password salah" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      res.json({ success: true, token, role: user.role });
    } catch {
      res.status(500).json({ success: false, error: "Gagal login, silakan coba lagi" });
    }
  });

  // =========================
  // PUBLIC â€” PRODUCTS & SERVICES
  // =========================
  app.get("/api/services", async (_req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM services ORDER BY id ASC");
      res.json({
        success: true,
        data: (rows as any[]).map(row => ({ ...row, price: Number(row.price) || 0 })),
      });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengambil layanan" });
    }
  });

  app.get("/api/products", async (_req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, name, slug, brand, type, capacity, price, stock, description, features, image_alt, created_at, updated_at,
                IF(image IS NOT NULL, CONCAT('/api/products/', id, '/image'), NULL) as image
         FROM products ORDER BY created_at DESC`,
      );
      res.json({
        success: true,
        data: (rows as any[]).map(row => ({
          ...row,
          price: Number(row.price) || 0,
          stock: Number(row.stock) || 0,
          image_alt: row.image_alt || generateProductAlt(row.name, row.brand, row.type, row.capacity),
        })),
      });
    } catch (err) {
      console.error("/api/products error:", err);
      res.status(500).json({ success: false, error: "Gagal mengambil produk" });
    }
  });

  // GET /api/materials â€” public, hanya item aktif
  app.get("/api/materials", async (_req, res) => {
    try {
      const [rows] = await pool.query(
        "SELECT id, name, unit, price, category FROM material_catalog WHERE is_active = 1 ORDER BY category, name"
      );
      res.json({
        success: true,
        data: (rows as any[]).map(row => ({ ...row, price: Number(row.price) || 0 })),
      });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengambil material" });
    }
  });

  // =========================
  // PUBLIC â€” TEAM
  // =========================
  app.get("/api/team", async (_req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, name, position, role_label, bio, phone, sort_order,
                IF(image IS NOT NULL, CONCAT('/api/team/', id, '/image'), NULL) as image
         FROM team WHERE is_active = 1 ORDER BY sort_order ASC, id ASC`,
      );
      res.json({ success: true, data: rows });
    } catch (err) {
      console.error("/api/team error:", err);
      res.status(500).json({ success: false, error: "Gagal mengambil data tim" });
    }
  });

  // =========================
  // ADMIN PRODUCTS
  // =========================
  app.get("/api/admin/products", authenticateToken, requireAdmin, async (_req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, name, slug, brand, type, capacity, price, stock, description, features, image_alt, created_at, updated_at,
                IF(image IS NOT NULL, CONCAT('/api/products/', id, '/image'), NULL) as image
         FROM products ORDER BY created_at DESC`,
      );
      res.json({ success: true, data: rows });
    } catch (err) {
      console.error("/api/admin/products GET error:", err);
      res.status(500).json({ success: false, error: "Gagal mengambil produk" });
    }
  });

  app.post("/api/admin/products", authenticateToken, requireAdmin, upload.single("image"), async (req, res) => {
    const { name, brand, type, capacity, price, description, image_alt } = req.body;
    try {
      // Auto-optimize gambar ke WebP
      const optimized = await optimizeImage(req.file?.buffer);
      const altText = image_alt?.trim() || generateProductAlt(name, brand, type, capacity);
      const slug = slugify(`${name} ${brand} ${capacity}`.trim()) || slugify(name);

      await pool.query(
        `INSERT INTO products (id, name, slug, brand, type, capacity, price, description, image, image_mime, image_alt)
         VALUES (UUID(),?,?,?,?,?,?,?,?,?,?)`,
        [name, slug, brand, type, capacity, price, description, optimized, optimized ? "image/webp" : null, altText],
      );
      res.json({ success: true, slug, image_alt: altText });
    } catch (err) {
      console.error("POST product error:", err);
      res.status(500).json({ success: false, error: "Gagal menambah produk" });
    }
  });

  app.put("/api/admin/products/:id", authenticateToken, requireAdmin, upload.single("image"), async (req, res) => {
    const { id } = req.params;
    const { name, brand, type, capacity, price, description, image_alt } = req.body;
    try {
      const altText = image_alt?.trim() || generateProductAlt(name, brand, type, capacity);
      const slug = slugify(`${name} ${brand} ${capacity}`.trim()) || slugify(name);

      if (req.file?.buffer) {
        // Update dengan gambar baru: auto-optimize
        const optimized = await optimizeImage(req.file.buffer);
        await pool.query(
          `UPDATE products SET name=?, slug=?, brand=?, type=?, capacity=?, price=?, description=?,
           image=?, image_mime=?, image_alt=? WHERE id=?`,
          [name, slug, brand, type, capacity, price, description, optimized, "image/webp", altText, id],
        );
      } else {
        // Update tanpa gambar baru
        await pool.query(
          `UPDATE products SET name=?, slug=?, brand=?, type=?, capacity=?, price=?, description=?, image_alt=? WHERE id=?`,
          [name, slug, brand, type, capacity, price, description, altText, id],
        );
      }
      res.json({ success: true, slug, image_alt: altText });
    } catch (err) {
      console.error("PUT product error:", err);
      res.status(500).json({ success: false, error: "Gagal mengupdate produk" });
    }
  });

  app.delete("/api/admin/products/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await pool.query("DELETE FROM products WHERE id=?", [req.params.id]);
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal menghapus produk" });
    }
  });

  // =========================
  // ADMIN SERVICES
  // =========================
  app.get("/api/admin/services", authenticateToken, requireAdmin, async (_req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM services");
      res.json({ success: true, data: rows });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengambil layanan" });
    }
  });

  app.post("/api/admin/services", authenticateToken, requireAdmin, async (req, res) => {
    const { name, price, description, icon } = req.body;
    if (!name || !price) return res.status(400).json({ success: false, error: "Nama dan harga wajib diisi" });
    try {
      const id = `svc-${crypto.randomUUID().slice(0, 8)}`;
      await pool.query(
        "INSERT INTO services (id, name, price, description, icon) VALUES (?,?,?,?,?)",
        [id, name, Number(price), description, icon || "wrench"],
      );
      res.json({ success: true, data: { id } });
    } catch (e) {
      console.error("POST /api/admin/services error:", e);
      res.status(500).json({ success: false, error: "Gagal menambah layanan" });
    }
  });

  app.put("/api/admin/services/:id", authenticateToken, requireAdmin, async (req, res) => {
    const { name, price, description, icon } = req.body;
    try {
      await pool.query(
        "UPDATE services SET name=?, price=?, description=?, icon=? WHERE id=?",
        [name, Number(price), description, icon, req.params.id],
      );
      res.json({ success: true });
    } catch (e) {
      console.error("PUT /api/admin/services error:", e);
      res.status(500).json({ success: false, error: "Gagal mengupdate layanan" });
    }
  });

  app.delete("/api/admin/services/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await pool.query("DELETE FROM services WHERE id=?", [req.params.id]);
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal menghapus layanan" });
    }
  });

  // Service Tiers (public)
  app.get("/api/service-tiers/:serviceId", async (req, res) => {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM service_tiers WHERE service_id = ? ORDER BY sort_order ASC, price ASC",
        [req.params.serviceId],
      );
      res.json({ success: true, data: rows });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengambil tier harga" });
    }
  });

  // Service Tiers (admin CRUD)
  app.get("/api/admin/service-tiers/:serviceId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM service_tiers WHERE service_id = ? ORDER BY sort_order ASC, price ASC",
        [req.params.serviceId],
      );
      res.json({ success: true, data: rows });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengambil tier" });
    }
  });

  app.post("/api/admin/service-tiers", authenticateToken, requireAdmin, async (req, res) => {
    const { service_id, label, price, sort_order } = req.body;
    try {
      await pool.query(
        "INSERT INTO service_tiers (service_id, label, price, sort_order) VALUES (?,?,?,?)",
        [service_id, label, price, sort_order ?? 0],
      );
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal menambah tier" });
    }
  });

  app.put("/api/admin/service-tiers/:id", authenticateToken, requireAdmin, async (req, res) => {
    const { label, price, sort_order } = req.body;
    try {
      await pool.query(
        "UPDATE service_tiers SET label=?, price=?, sort_order=? WHERE id=?",
        [label, price, sort_order ?? 0, req.params.id],
      );
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengupdate tier" });
    }
  });

  app.delete("/api/admin/service-tiers/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await pool.query("DELETE FROM service_tiers WHERE id=?", [req.params.id]);
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal menghapus tier" });
    }
  });

  // =========================
  // ADMIN TEAM
  // =========================
  app.get("/api/admin/team", authenticateToken, requireAdmin, async (_req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, name, position, role_label, bio, phone, sort_order, is_active,
                IF(image IS NOT NULL, CONCAT('/api/team/', id, '/image'), NULL) as image
         FROM team ORDER BY sort_order ASC, id ASC`,
      );
      res.json({ success: true, data: rows });
    } catch (err) {
      console.error("/api/admin/team GET error:", err);
      res.status(500).json({ success: false, error: "Gagal mengambil data tim" });
    }
  });

  app.post("/api/admin/team", authenticateToken, requireAdmin, upload.single("image"), async (req: any, res) => {
    const { name, position, role_label, bio, phone, sort_order } = req.body;
    try {
      const optimized = await optimizeImage(req.file?.buffer);
      await pool.query(
        "INSERT INTO team (name, position, role_label, bio, phone, sort_order, image, image_mime) VALUES (?,?,?,?,?,?,?,?)",
        [name, position, role_label, bio || null, phone || null, sort_order || 0, optimized, optimized ? "image/webp" : null],
      );
      res.json({ success: true });
    } catch (err) {
      console.error("POST team error:", err);
      res.status(500).json({ success: false, error: "Gagal menambah anggota tim" });
    }
  });

  app.put("/api/admin/team/:id", authenticateToken, requireAdmin, upload.single("image"), async (req: any, res) => {
    const { id } = req.params;
    const { name, position, role_label, bio, phone, sort_order, is_active } = req.body;
    try {
      if (req.file?.buffer) {
        const optimized = await optimizeImage(req.file.buffer);
        await pool.query(
          "UPDATE team SET name=?, position=?, role_label=?, bio=?, phone=?, sort_order=?, is_active=?, image=?, image_mime=?, updated_at=NOW() WHERE id=?",
          [name, position, role_label, bio || null, phone || null, sort_order || 0, is_active ?? 1, optimized, "image/webp", id],
        );
      } else {
        await pool.query(
          "UPDATE team SET name=?, position=?, role_label=?, bio=?, phone=?, sort_order=?, is_active=?, updated_at=NOW() WHERE id=?",
          [name, position, role_label, bio || null, phone || null, sort_order || 0, is_active ?? 1, id],
        );
      }
      res.json({ success: true });
    } catch (err) {
      console.error("PUT team error:", err);
      res.status(500).json({ success: false, error: "Gagal mengupdate anggota tim" });
    }
  });

  app.delete("/api/admin/team/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await pool.query("DELETE FROM team WHERE id=?", [req.params.id]);
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal menghapus anggota tim" });
    }
  });

  // =========================
  // MIDTRANS â€” SNAP TOKEN
  // =========================
  app.post("/api/midtrans/snap-token", authenticateToken, async (req: any, res) => {
    try {
      const { productId, productName, items, quantity, customerName, phone, address, notes } = req.body;
      const user = req.user;
      const orderId = `ORD-${Date.now()}`;

      // Daftar item dari client â€” HANYA id/qty/itemType yang dipakai.
      // HARGA tidak pernah dipercaya dari client; selalu di-resolve dari DB
      // (cegah price tampering: bayar produk mahal dengan harga rekayasa).
      const cartItems: any[] = (items && Array.isArray(items) && items.length > 0)
        ? items
        : [{ id: productId, name: productName, quantity: quantity || 1, itemType: "product" }];

      const itemDetails: any[] = [];
      const verifiedItems: any[] = [];
      for (const it of cartItems) {
        const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
        const itemType = it.itemType === "service" ? "service" : "product";
        let unitPrice: number;
        let name: string;

        if (itemType === "service") {
          const rawId = String(it.id ?? "");
          // Jasa ber-tier dikirim sebagai "<serviceId>-tier-<tierId>"
          const tier = rawId.match(/^(.+)-tier-(\d+)$/);
          if (tier) {
            const [, serviceId, tierId] = tier;
            const [t]: any = await pool.query(
              "SELECT label, price FROM service_tiers WHERE id=? AND service_id=?",
              [tierId, serviceId],
            );
            if (!t.length) return res.status(400).json({ success: false, error: "Tier jasa tidak ditemukan" });
            unitPrice = Number(t[0].price);
            name = String(it.name || t[0].label || "Jasa").substring(0, 50);
          } else {
            const [s]: any = await pool.query("SELECT name, price FROM services WHERE id=?", [rawId]);
            if (!s.length) return res.status(400).json({ success: false, error: "Jasa tidak ditemukan" });
            unitPrice = Number(s[0].price);
            name = String(s[0].name).substring(0, 50);
          }
        } else {
          const [p]: any = await pool.query("SELECT name, price FROM products WHERE id=?", [String(it.id ?? "")]);
          if (!p.length) return res.status(400).json({ success: false, error: "Produk tidak ditemukan" });
          unitPrice = Number(p[0].price);
          name = String(p[0].name).substring(0, 50);
        }

        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          return res.status(400).json({ success: false, error: "Harga item tidak valid" });
        }
        itemDetails.push({ id: String(it.id ?? "").substring(0, 50), price: Math.round(unitPrice), quantity: qty, name });
        verifiedItems.push({ id: it.id, itemType, name, quantity: qty, price: Math.round(unitPrice) });
      }

      // gross_amount dihitung di SERVER dari harga DB, bukan dari client
      const totalPrice = itemDetails.reduce((sum, i) => sum + i.price * i.quantity, 0);
      if (!totalPrice || totalPrice <= 0) {
        return res.status(400).json({ success: false, error: "Total harga tidak valid" });
      }

      const parameter: any = {
        transaction_details: { order_id: orderId, gross_amount: totalPrice },
        customer_details: {
          first_name: customerName,
          phone,
          email: user?.email || "customer@example.com",
        },
        item_details: itemDetails,
        enabled_payments: ["qris", "bank_transfer", "gopay"],
        ui_locales: "id",
      };

      const transaction = await snap.createTransaction(parameter);
      const snapToken = transaction.token;

      await pool.query(
        `INSERT INTO orders
         (id, user_id, customer_name, phone, address, notes, payment_method, total_price, order_status, midtrans_snap_token, midtrans_transaction_id, payment_status)
         VALUES (?,?,?,?,?,?,?,?, 'pending', ?, ?, 'pending')`,
        [orderId, user?.id || null, customerName, phone, address, notes || null, "midtrans", totalPrice, snapToken, transaction.transaction_id],
      );

      for (const vi of verifiedItems) {
        await pool.query(
          `INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, price) VALUES (?,?,?,?,?,?)`,
          [orderId, vi.itemType, vi.id, vi.name, vi.quantity, vi.price],
        );
      }

      res.json({ success: true, orderId, snapToken });
    } catch (err: any) {
      console.error("[ERR] Error creating snap token:", err?.message);
      res.status(500).json({ success: false, error: "Gagal membuat token pembayaran" });
    }
  });

  // =========================
  // HELPER: update order dari notif Midtrans
  // =========================
  async function updateOrderFromMidtrans(orderId: string, transactionStatus: string, transactionId?: string) {
    let paymentStatus = "pending";
    let orderStatus = "pending";

    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      paymentStatus = "settlement"; orderStatus = "pending";
    } else if (transactionStatus === "deny") {
      paymentStatus = "deny"; orderStatus = "cancelled";
    } else if (transactionStatus === "expire") {
      paymentStatus = "expire"; orderStatus = "cancelled";
    } else if (transactionStatus === "cancel") {
      paymentStatus = "cancel"; orderStatus = "cancelled";
    }

    await pool.query(
      `UPDATE orders SET payment_status = ?, order_status = ?, midtrans_transaction_id = COALESCE(?, midtrans_transaction_id) WHERE id = ?`,
      [paymentStatus, orderStatus, transactionId, orderId],
    );
    return { paymentStatus, orderStatus };
  }

  // =========================
  // HELPER: verifikasi status order ke Midtrans (SUMBER KEBENARAN)
  // =========================
  // Ambil status transaksi sebenarnya dari Midtrans Core API berdasarkan order_id
  // (ORD-...), lalu sinkronkan ke DB. TIDAK PERNAH mempercayai status dari client.
  // Mengembalikan null bila transaksi belum ada di Midtrans (mis. user belum bayar).
  async function syncOrderFromMidtrans(orderId: string) {
    const core = new midtransClient.CoreApi({
      isProduction: MIDTRANS_IS_PRODUCTION,
      serverKey: MIDTRANS_SERVER_KEY,
      clientKey: MIDTRANS_CLIENT_KEY,
    });
    try {
      const st: any = await core.transaction.status(orderId);
      const result = await updateOrderFromMidtrans(orderId, st.transaction_status, st.transaction_id);
      return { status: st.transaction_status, ...result };
    } catch {
      // 404 / transaksi belum ada → jangan ubah status DB
      return null;
    }
  }

  // =========================
  // HELPER: generate nomor invoice untuk order addition (idempotent)
  // =========================
  // Jalankan fn sambil memegang named-lock MySQL pada SATU koneksi khusus.
  // GET_LOCK bersifat per-koneksi, jadi semua query dalam blok terkunci HARUS
  // memakai conn yang sama agar lock benar-benar efektif (mencegah duplikat seq).
  async function withInvoiceLock<T>(fn: (conn: any) => Promise<T>): Promise<T> {
    const conn = await pool.getConnection();
    try {
      await conn.query("SELECT GET_LOCK('hdb_invoice_seq', 10)");
      try {
        return await fn(conn);
      } finally {
        await conn.query("SELECT RELEASE_LOCK('hdb_invoice_seq')");
      }
    } finally {
      conn.release();
    }
  }

  // Hitung nomor invoice berikutnya (gabungan orders + order_additions) untuk bulan ym.
  // Harus dipanggil di dalam withInvoiceLock agar tidak ada race.
  async function nextInvoiceNumber(conn: any, ym: string): Promise<string> {
    const [c1]: any = await conn.query(
      `SELECT COUNT(*) as cnt FROM orders WHERE invoice_number IS NOT NULL AND DATE_FORMAT(invoice_sent_at,'%Y-%m')=?`, [ym]
    );
    const [c2]: any = await conn.query(
      `SELECT COUNT(*) as cnt FROM order_additions WHERE invoice_number IS NOT NULL AND DATE_FORMAT(invoice_sent_at,'%Y-%m')=?`, [ym]
    );
    const seq = Number(c1[0].cnt) + Number(c2[0].cnt) + 1;
    return `INV-${ym}-${String(seq).padStart(4, '0')}`;
  }

  // =========================
  // HELPER: generate nomor invoice untuk order addition (idempotent + lock)
  // =========================
  async function ensureAdditionInvoice(additionId: number | string) {
    return withInvoiceLock(async (conn) => {
      const [rows]: any = await conn.query(
        'SELECT invoice_number FROM order_additions WHERE id=?', [additionId]
      );
      if (!rows.length) return null;
      if (rows[0].invoice_number) return rows[0].invoice_number;

      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const invoiceNumber = await nextInvoiceNumber(conn, ym);
      await conn.query(
        `UPDATE order_additions SET invoice_number=?, invoice_sent_at=COALESCE(invoice_sent_at, NOW()), updated_at=NOW() WHERE id=?`,
        [invoiceNumber, additionId]
      );
      return invoiceNumber;
    });
  }

  // =========================
  // MIDTRANS â€” WEBHOOK
  // =========================
  app.post("/api/midtrans/webhook", async (req, res) => {
    try {
      const notification = req.body;
      const { order_id: orderId, status_code: statusCode, gross_amount: grossAmount, signature_key: signatureKey } = notification;

      const hash = crypto.createHash("sha512")
        .update(orderId + statusCode + grossAmount + process.env.MIDTRANS_SERVER_KEY)
        .digest("hex");

      if (hash !== signatureKey) {
        return res.status(403).json({ success: false, error: "Invalid signature" });
      }

      // Tangani payment untuk order additions (prefix ADD-)
      if (orderId.startsWith('ADD-')) {
        // Cari addition berdasarkan midtrans_order_id yang tersimpan (eksak).
        // Fallback ke parsing prefix untuk transaksi lama yang belum punya kolom terisi.
        let additionId: string | number | null = null;
        const [byMid]: any = await pool.query(
          'SELECT id FROM order_additions WHERE midtrans_order_id=?', [orderId]
        );
        if (byMid.length) {
          additionId = byMid[0].id;
        } else {
          const parsed = orderId.split('-')[1];
          if (/^\d+$/.test(parsed)) additionId = parsed;
        }
        if (additionId === null) {
          return res.status(404).json({ success: false, error: "Addition tidak ditemukan" });
        }
        if (['capture','settlement'].includes(notification.transaction_status)) {
          await pool.query(
            `UPDATE order_additions SET payment_status='paid', status='paid', updated_at=NOW() WHERE id=?`,
            [additionId]
          );
          await ensureAdditionInvoice(additionId);
        }
        return res.json({ success: true });
      }
      // ... lanjut ke handler order biasa yang sudah ada

      await updateOrderFromMidtrans(orderId, notification.transaction_status, notification.transaction_id);
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Webhook error" });
    }
  });

  // =========================
  // MIDTRANS â€” PAYMENT CALLBACK
  // =========================
  // Sinkronisasi status setelah popup Snap ditutup. PENTING: status pembayaran
  // TIDAK diambil dari body client (cegah pemalsuan "settlement"); selalu
  // diverifikasi ulang ke Midtrans Core API. + cek kepemilikan (cegah IDOR).
  app.post("/api/midtrans/payment-callback", authenticateToken, async (req: any, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ success: false, error: "orderId diperlukan" });
      }

      const [orderRows]: any = await pool.query("SELECT user_id FROM orders WHERE id = ?", [orderId]);
      if (!orderRows.length) {
        return res.status(404).json({ success: false, error: "Order tidak ditemukan" });
      }
      // Hanya admin atau pemilik order (balas 404 agar tidak membocorkan keberadaan order)
      if (req.user.role !== "admin" && String(orderRows[0].user_id) !== String(req.user.id)) {
        return res.status(404).json({ success: false, error: "Order tidak ditemukan" });
      }

      const synced = await syncOrderFromMidtrans(orderId);
      res.json({ success: true, data: synced || { status: "pending", source: "database" } });
    } catch {
      res.status(500).json({ success: false, error: "Gagal update status pembayaran" });
    }
  });

  // =========================
  // MIDTRANS â€” CEK STATUS
  // =========================
  app.post("/api/midtrans/check-status", authenticateToken, async (req: any, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ success: false, error: "orderId diperlukan" });

      const [orderRows]: any = await pool.query(
        "SELECT user_id, payment_status FROM orders WHERE id = ?",
        [orderId],
      );
      if (!orderRows.length) return res.status(404).json({ success: false, error: "Order tidak ditemukan" });

      const order = orderRows[0];
      // Cegah IDOR: hanya admin atau pemilik order (balas 404 agar tidak membocorkan keberadaan order)
      if (req.user.role !== "admin" && String(order.user_id) !== String(req.user.id)) {
        return res.status(404).json({ success: false, error: "Order tidak ditemukan" });
      }

      if (order.payment_status === "settlement") {
        return res.json({ success: true, data: { status: "settlement", source: "database" } });
      }

      // Verifikasi status sebenarnya ke Midtrans (via order_id), lalu update DB.
      const synced = await syncOrderFromMidtrans(orderId);
      if (!synced) {
        return res.json({ success: true, data: { status: order.payment_status || "pending", source: "database" } });
      }
      res.json({ success: true, data: { midtransStatus: synced.status, updatedStatus: synced, source: "midtrans_api" } });
    } catch {
      res.status(500).json({ success: false, error: "Gagal cek status pembayaran" });
    }
  });

  // =========================
  // ORDERS â€” CREATE (legacy)
  // =========================
  app.post("/api/orders", authenticateToken, async (req: any, res) => {
    const { quantity, productId, customerName, phone, address, paymentMethod } = req.body;
    const user = req.user;
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));

    try {
      // Harga diambil dari DB (jangan percaya harga dari client)
      const [productRows]: any = await pool.query("SELECT name, price FROM products WHERE id=?", [productId]);
      if (!productRows.length) return res.status(404).json({ success: false, error: "Produk tidak ditemukan" });
      const unitPrice = Number(productRows[0].price) || 0;
      const totalPrice = unitPrice * qty;

      const orderId = `ORD-${Date.now()}`;
      await pool.query(
        `INSERT INTO orders (id, user_id, customer_name, phone, address, payment_method, total_price, order_status) VALUES (?,?,?,?,?,?,?, 'pending')`,
        [orderId, user?.id || null, customerName, phone, address, paymentMethod, totalPrice],
      );
      await pool.query(
        `INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, price) VALUES (?,?,?,?,?,?)`,
        [orderId, "product", productId, productRows[0].name, qty, unitPrice],
      );
      res.json({ success: true, orderId });
    } catch {
      res.status(500).json({ success: false, error: "Gagal membuat order" });
    }
  });

  // =========================
  // USER ORDERS
  // =========================
  app.get("/api/user/orders", authenticateToken, async (req: any, res) => {
    try {
      if (!req.user?.id) return res.status(401).json({ success: false, error: "User tidak teridentifikasi" });

      const [rows]: any = await pool.query(
        `SELECT o.id, o.customer_name, o.phone, o.address, o.payment_method,
                o.order_status as status, COALESCE(o.payment_status, 'pending') as payment_status,
                o.total_price as price, o.created_at, o.midtrans_snap_token,
                GROUP_CONCAT(oi.item_name SEPARATOR ', ') as product_name,
                SUM(oi.quantity) as quantity,
                u.name as assigned_teknisi,
                (SELECT customer_token FROM order_additions WHERE order_id = o.id AND status = 'pending_customer' LIMIT 1) as pending_addition_token
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN users u ON o.teknisi_id = u.id
         WHERE o.user_id = ?
         GROUP BY o.id
         ORDER BY o.created_at DESC`,
        [req.user.id],
      );

      res.json({
        success: true,
        data: rows.map((o: any) => ({
          id: o.id,
          customer_name: o.customer_name,
          phone: o.phone,
          address: o.address,
          payment_method: o.payment_method,
          status: o.status,
          payment_status: o.payment_status,
          product_name: o.product_name || "N/A",
          quantity: Number(o.quantity) || 0,
          price: Number(o.price) || 0,
          created_at: o.created_at,
          snap_token: o.midtrans_snap_token || null,
          assigned_teknisi: o.assigned_teknisi || null,
          pending_addition_token: o.pending_addition_token || null,
        })),
      });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengambil pesanan" });
    }
  });

  // =========================
  // ADMIN STATS
  // =========================
  app.get("/api/admin/stats", authenticateToken, requireAdmin, async (_req, res) => {
    try {
      const [[orders], [users], [pending], [completed], [products], [revenue]]: any[] = await Promise.all([
        pool.query("SELECT COUNT(*) as total FROM orders"),
        pool.query("SELECT COUNT(*) as total FROM users"),
        pool.query("SELECT COUNT(*) as total FROM orders WHERE order_status='pending'"),
        pool.query("SELECT COUNT(*) as total FROM orders WHERE order_status='completed'"),
        pool.query("SELECT COUNT(*) as total FROM products"),
        pool.query("SELECT COALESCE(SUM(total_price),0) as total FROM orders"),
      ]);

      res.json({
        success: true,
        data: {
          totalOrders: Number((orders as any)[0]?.total || 0),
          totalUsers: Number((users as any)[0]?.total || 0),
          pendingOrders: Number((pending as any)[0]?.total || 0),
          completedOrders: Number((completed as any)[0]?.total || 0),
          totalProducts: Number((products as any)[0]?.total || 0),
          totalRevenue: Number((revenue as any)[0]?.total || 0),
        },
      });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengambil statistik" });
    }
  });

  // =========================
  // ADMIN REPORTS
  // =========================
  app.get("/api/admin/reports/detailed", authenticateToken, requireAdmin, async (_req, res) => {
    try {
      const dayMs = 24 * 60 * 60 * 1000;
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const addDays = (date: Date, days: number) => {
        const copy = new Date(date);
        copy.setDate(copy.getDate() + days);
        return copy;
      };
      const isoDate = (date: Date) => date.toISOString().slice(0, 10);
      const formatShortDate = (date: Date) =>
        new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(date);
      const formatMonth = (date: Date) =>
        new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(date);
      const makePeriod = (month: string, monthLabel: string) => ({
        month,
        monthLabel,
        revenue: 0,
        orderCount: 0,
      });

      const yearlyStart = new Date(todayStart.getFullYear() - 4, 0, 1);
      const [periodOrders]: any = await pool.query(
        `SELECT created_at, total_price FROM orders WHERE created_at >= ?`,
        [yearlyStart],
      );

      const weeklyRevenue = Array.from({ length: 12 }, (_, i) => {
        const weeksAgo = 11 - i;
        const endDate = addDays(todayStart, -(weeksAgo * 7));
        const startDate = addDays(endDate, -6);
        return makePeriod(`${isoDate(startDate)}_${isoDate(endDate)}`, `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`);
      });

      const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(todayStart.getFullYear(), todayStart.getMonth() - 11 + i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        return makePeriod(key, formatMonth(date));
      });

      const yearlyRevenue = Array.from({ length: 5 }, (_, i) => {
        const year = todayStart.getFullYear() - 4 + i;
        return makePeriod(String(year), String(year));
      });

      const monthlyIndex = new Map(monthlyRevenue.map((item, index) => [item.month, index]));
      const yearlyIndex = new Map(yearlyRevenue.map((item, index) => [item.month, index]));

      for (const row of periodOrders as any[]) {
        const createdAt = new Date(row.created_at);
        const orderDay = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
        const revenue = Number(row.total_price) || 0;

        const diffDays = Math.floor((todayStart.getTime() - orderDay.getTime()) / dayMs);
        if (diffDays >= 0 && diffDays < 84) {
          const bucket = Math.floor(diffDays / 7);
          const index = 11 - bucket;
          weeklyRevenue[index].revenue += revenue;
          weeklyRevenue[index].orderCount += 1;
        }

        const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
        const monthIndex = monthlyIndex.get(monthKey);
        if (monthIndex !== undefined) {
          monthlyRevenue[monthIndex].revenue += revenue;
          monthlyRevenue[monthIndex].orderCount += 1;
        }

        const yearIndex = yearlyIndex.get(String(createdAt.getFullYear()));
        if (yearIndex !== undefined) {
          yearlyRevenue[yearIndex].revenue += revenue;
          yearlyRevenue[yearIndex].orderCount += 1;
        }
      }

      const [topProducts]: any = await pool.query(
        `SELECT p.id, p.name, p.brand, p.capacity,
                COUNT(oi.id) as total_quantity, SUM(oi.price * oi.quantity) as total_revenue
         FROM products p LEFT JOIN order_items oi ON p.id = oi.item_id AND oi.item_type = 'product'
         GROUP BY p.id ORDER BY total_quantity DESC LIMIT 10`,
      );
      const [topTeknisi]: any = await pool.query(
        `SELECT u.id, u.name, COUNT(o.id) as total_assigned,
                SUM(CASE WHEN o.order_status = 'completed' THEN 1 ELSE 0 END) as completed_orders
         FROM users u LEFT JOIN orders o ON u.id = o.teknisi_id
         WHERE u.role = 'teknisi' GROUP BY u.id ORDER BY total_assigned DESC LIMIT 10`,
      );
      const [financialBreakdown]: any = await pool.query(
        `SELECT COALESCE(payment_status, 'unknown') as status,
                COUNT(*) as order_count, COALESCE(SUM(total_price), 0) as total_amount
         FROM orders GROUP BY payment_status`,
      );
      const [orderStatusBreakdown]: any = await pool.query(
        `SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status`,
      );

      res.json({
        success: true,
        data: {
          monthlyRevenue,
          revenueByPeriod: {
            weekly: weeklyRevenue,
            monthly: monthlyRevenue,
            yearly: yearlyRevenue,
          },
          topProducts: topProducts.map((r: any) => ({ id: r.id, name: r.name, brand: r.brand, capacity: r.capacity, quantity: Number(r.total_quantity) || 0, revenue: Number(r.total_revenue) || 0 })),
          topTeknisi: topTeknisi.map((r: any) => ({ id: r.id, name: r.name, assigned: Number(r.total_assigned) || 0, completed: Number(r.completed_orders) || 0 })),
          financialBreakdown: financialBreakdown.map((r: any) => ({ status: r.status, orderCount: Number(r.order_count) || 0, totalAmount: Number(r.total_amount) || 0 })),
          orderStatusBreakdown: orderStatusBreakdown.map((r: any) => ({ status: r.order_status, count: Number(r.count) || 0 })),
        },
      });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengambil laporan" });
    }
  });

  // =========================
  // ADMIN USERS
  // =========================
  app.get("/api/admin/users", authenticateToken, requireAdmin, async (_req, res) => {
    try {
      const [rows] = await pool.query("SELECT id, username, name, role FROM users ORDER BY id DESC");
      res.json({ success: true, data: rows });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengambil users" });
    }
  });

  app.post("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
    const { username, password, name, role } = req.body;
    if (!username || !password || !name || !role) {
      return res.status(400).json({ success: false, error: "Semua field wajib diisi" });
    }
    try {
      const [exists]: any = await pool.query("SELECT id FROM users WHERE username=?", [username]);
      if (exists.length) return res.status(400).json({ success: false, error: "Username sudah dipakai" });

      const hashedPassword = await bcrypt.hash(password, 12);
      await pool.query("INSERT INTO users (username,password,name,role) VALUES (?,?,?,?)", [username, hashedPassword, name, role]);
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal menambah user" });
    }
  });

  app.put("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { username, password, name, role } = req.body;
    try {
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 12);
        await pool.query("UPDATE users SET username=?, password=?, name=?, role=? WHERE id=?", [username, hashedPassword, name, role, id]);
      } else {
        await pool.query("UPDATE users SET username=?, name=?, role=? WHERE id=?", [username, name, role, id]);
      }
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengupdate user" });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await pool.query("DELETE FROM users WHERE id=?", [req.params.id]);
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal menghapus user" });
    }
  });

  // =========================
  // ADMIN TEKNISI LIST
  // =========================
  app.get("/api/admin/teknisi", authenticateToken, requireAdmin, async (_req, res) => {
    try {
      const [rows] = await pool.query("SELECT id, username, name FROM users WHERE role='teknisi' ORDER BY id DESC");
      res.json({ success: true, data: rows });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengambil data teknisi" });
    }
  });

  // =========================
  // ADMIN ORDERS
  // =========================
  app.get("/api/admin/orders", authenticateToken, requireAdmin, async (_req, res) => {
    try {
      const [rows]: any = await pool.query(
        `SELECT o.id, o.customer_name, o.phone, o.address, o.notes, o.payment_method,
                o.order_status as status, COALESCE(o.payment_status, 'pending') as payment_status,
                o.total_price, o.created_at, o.teknisi_id,
                o.invoice_number, o.invoice_token, o.invoice_sent_at,
                GROUP_CONCAT(oi.item_name SEPARATOR ', ') as product_name,
                SUM(oi.quantity) as total_quantity
         FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id
         GROUP BY o.id ORDER BY o.created_at DESC`,
      );

      // Rincian item per order (unit & jasa) untuk ditampilkan detail di admin
      const [itemRows]: any = await pool.query(
        `SELECT order_id, item_type, item_id, item_name, quantity, price
         FROM order_items ORDER BY order_id, id`,
      );
      const itemsByOrder: Record<string, any[]> = {};
      for (const it of itemRows) {
        if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
        itemsByOrder[it.order_id].push({
          item_type: it.item_type,
          item_id: it.item_id,
          item_name: it.item_name,
          quantity: Number(it.quantity) || 0,
          price: Number(it.price) || 0,
        });
      }

      res.json({
        success: true,
        data: rows.map((o: any) => ({
          id: o.id,
          customer_name: o.customer_name,
          phone: o.phone,
          address: o.address,
          payment_method: o.payment_method,
          status: o.status,
          payment_status: o.payment_status,
          total_price: Number(o.total_price) || 0,
          price: Number(o.total_price) || 0,
          product_name: o.product_name || "N/A",
          total_quantity: Number(o.total_quantity) || 0,
          created_at: o.created_at,
          teknisi_id: o.teknisi_id || null,
          invoice_number: o.invoice_number || null,
          invoice_token: o.invoice_token || null,
          invoice_sent_at: o.invoice_sent_at || null,
          items: itemsByOrder[o.id] || [],
        })),
      });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengambil pesanan" });
    }
  });

  app.put("/api/admin/orders/:id/status", authenticateToken, requireAdmin, async (req, res) => {
    const { status } = req.body;
    const allowed = ["pending", "processing", "completed", "cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, error: "Status tidak valid" });
    try {
      await pool.query("UPDATE orders SET order_status=? WHERE id=?", [status, req.params.id]);
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengupdate status" });
    }
  });

  app.patch("/api/admin/orders/:id/verify-payment", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const [rows]: any = await pool.query(
        "SELECT id, order_status, payment_status FROM orders WHERE id=?",
        [req.params.id],
      );
      if (!rows.length) return res.status(404).json({ success: false, error: "Order tidak ditemukan" });

      const order = rows[0];
      const nextOrderStatus = order.order_status === "cancelled" ? "pending" : (order.order_status || "pending");
      await pool.query(
        "UPDATE orders SET payment_status='settlement', order_status=?, updated_at=NOW() WHERE id=?",
        [nextOrderStatus, req.params.id],
      );

      res.json({ success: true, data: { payment_status: "settlement", order_status: nextOrderStatus } });
    } catch (err) {
      console.error("Manual verify payment error:", err);
      res.status(500).json({ success: false, error: "Gagal verifikasi pembayaran" });
    }
  });

  app.delete("/api/admin/orders/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await pool.query("DELETE FROM orders WHERE id=?", [req.params.id]);
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal menghapus pesanan" });
    }
  });

  app.put("/api/admin/orders/:id/assign", authenticateToken, requireAdmin, async (req, res) => {
    const { teknisi_id } = req.body;
    if (!teknisi_id) return res.status(400).json({ success: false, error: "Teknisi ID diperlukan" });
    try {
      await pool.query("UPDATE orders SET teknisi_id=? WHERE id=?", [teknisi_id, req.params.id]);
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal menugaskan teknisi" });
    }
  });

  // =========================
  // TEKNISI ENDPOINTS
  // =========================
  app.get("/api/teknisi/jadwal", authenticateToken, requireTeknisi, async (req: any, res) => {
    try {
      const [rows]: any = await pool.query(
        `SELECT o.id, o.customer_name, o.phone, o.address, o.notes, o.order_status as status, o.created_at,
                GROUP_CONCAT(oi.item_name SEPARATOR ', ') as product_name
         FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.teknisi_id = ? AND o.order_status NOT IN ('completed', 'cancelled')
         GROUP BY o.id ORDER BY o.created_at DESC`,
        [req.user.id],
      );
      res.json({
        success: true,
        data: rows.map((r: any) => ({
          id: r.id, customer_name: r.customer_name, phone: r.phone,
          address: r.address, notes: r.notes || null,
          status: r.status, product_name: r.product_name || "N/A", created_at: r.created_at,
        })),
      });
    } catch {
      res.status(500).json({ success: false, error: "Gagal memuat jadwal" });
    }
  });

  app.put("/api/teknisi/orders/:id/status", authenticateToken, requireTeknisi, async (req: any, res) => {
    const { status } = req.body;
    const allowed = ["pending", "processing", "completed", "cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, error: "Status tidak valid" });
    try {
      const [result]: any = await pool.query(
        "UPDATE orders SET order_status=? WHERE id=? AND teknisi_id=?",
        [status, req.params.id, req.user.id],
      );
      if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Order tidak ditemukan atau bukan milik Anda" });
      res.json({ success: true, message: "Status berhasil diperbarui" });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengupdate status" });
    }
  });

  // =========================
  // ORDER PHOTOS
  // =========================
  app.post("/api/teknisi/orders/:id/photos", authenticateToken, requireTeknisi, upload.single("photo"), async (req: any, res) => {
    const { type } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, error: "Tidak ada foto yang diunggah" });
    if (!["before", "after"].includes(type)) return res.status(400).json({ success: false, error: "Tipe foto tidak valid" });
    try {
      // Cegah IDOR: teknisi hanya boleh upload ke order miliknya (admin bebas)
      const [ownRows]: any = await pool.query("SELECT teknisi_id FROM orders WHERE id=?", [req.params.id]);
      if (!ownRows.length) return res.status(404).json({ success: false, error: "Order tidak ditemukan" });
      if (req.user.role !== "admin" && String(ownRows[0].teknisi_id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, error: "Order ini bukan milik Anda" });
      }
      // Re-encode via sharp (strip metadata + buang payload berbahaya) sebelum simpan
      const optimized = await optimizeImage(file.buffer);
      await pool.query(
        "INSERT INTO order_photos (order_id, photo_type, image, mime_type) VALUES (?,?,?,?)",
        [req.params.id, type, optimized || file.buffer, optimized ? "image/webp" : file.mimetype],
      );
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal upload foto" });
    }
  });

  app.get("/api/orders/:id/photos", authenticateToken, async (req: any, res) => {
    try {
      // Cek kepemilikan: hanya admin, teknisi yang ditugaskan, atau pemilik order
      const [orderRows]: any = await pool.query(
        "SELECT user_id, teknisi_id FROM orders WHERE id = ?",
        [req.params.id],
      );
      if (!orderRows.length) {
        return res.status(404).json({ success: false, error: "Order tidak ditemukan" });
      }
      const o = orderRows[0];
      const u = req.user;
      const allowed =
        u.role === "admin" ||
        (u.role === "teknisi" && String(o.teknisi_id) === String(u.id)) ||
        String(o.user_id) === String(u.id);
      if (!allowed) {
        return res.status(403).json({ success: false, error: "Tidak diizinkan mengakses foto ini" });
      }

      const [rows]: any = await pool.query(
        `SELECT id, photo_type, mime_type, TO_BASE64(image) as image_b64, created_at
         FROM order_photos WHERE order_id = ? ORDER BY created_at ASC`,
        [req.params.id],
      );
      res.json({
        success: true,
        data: rows.map((r: any) => ({
          id: r.id,
          photo_type: r.photo_type,
          image: `data:${r.mime_type};base64,${(r.image_b64 || "").replace(/[\n\r]/g, "")}`,
          created_at: r.created_at,
        })),
      });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengambil foto" });
    }
  });

  // =========================
  // SERVE FRONTEND (Production SPA)
  // =========================
  if (isProduction) {
    const distPath = path.join(__dirname, "dist");
    // Serve static assets (JS, CSS, images, dll)
    app.use(express.static(distPath));
    // SPA fallback: semua route non-API dikembalikan ke index.html
    // agar URL seperti /layanan, /katalog tetap bisa diakses langsung
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // =========================
  // SEO â€” DYNAMIC SITEMAP & SCHEMA
  // =========================
  const SITE_URL = process.env.SITE_URL || "https://www.hdbairconds.id";

  // Dynamic sitemap.xml â€” auto-include semua produk + halaman statis
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Halaman statis utama
      const staticPages = [
        { loc: "/",         priority: "1.0", changefreq: "weekly" },
        { loc: "/layanan",  priority: "0.9", changefreq: "weekly" },
        { loc: "/katalog",  priority: "0.9", changefreq: "weekly" },
        { loc: "/kontak",   priority: "0.8", changefreq: "monthly" },
        { loc: "/tentang",  priority: "0.7", changefreq: "monthly" },
        { loc: "/blog",     priority: "0.7", changefreq: "weekly" },
        { loc: "/karir",    priority: "0.5", changefreq: "monthly" },
        { loc: "/privasi",  priority: "0.3", changefreq: "yearly" },
        { loc: "/syarat",   priority: "0.3", changefreq: "yearly" },
      ];

      // Ambil produk + tanggal update dari DB
      const [products]: any = await pool.query(
        `SELECT slug, id, COALESCE(updated_at, created_at) as last_mod, image IS NOT NULL as has_image, name, brand, type, capacity, image_alt, image_mime
         FROM products ORDER BY updated_at DESC LIMIT 5000`,
      );

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
      xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

      for (const p of staticPages) {
        xml += `  <url>\n`;
        xml += `    <loc>${SITE_URL}${p.loc}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
        xml += `    <priority>${p.priority}</priority>\n`;
        xml += `  </url>\n`;
      }

      // Setiap produk â†’ URL produk + image sitemap entry
      for (const p of products as any[]) {
        const productSlug = p.slug || p.id;
        const lastMod = p.last_mod ? new Date(p.last_mod).toISOString().split("T")[0] : today;
        xml += `  <url>\n`;
        xml += `    <loc>${SITE_URL}/katalog/${productSlug}</loc>\n`;
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        if (p.has_image) {
          const altText = p.image_alt || generateProductAlt(p.name, p.brand, p.type, p.capacity);
          const escapedAlt = altText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          xml += `    <image:image>\n`;
          xml += `      <image:loc>${SITE_URL}/api/products/${p.id}/image</image:loc>\n`;
          xml += `      <image:title>${escapedAlt}</image:title>\n`;
          xml += `      <image:caption>${escapedAlt}</image:caption>\n`;
          xml += `    </image:image>\n`;
        }
        xml += `  </url>\n`;
      }

      xml += `</urlset>\n`;
      res.type("application/xml").send(xml);
    } catch (err) {
      console.error("/sitemap.xml error:", err);
      res.status(500).send("<error>Gagal generate sitemap</error>");
    }
  });

  // Image endpoint by product ID â€” supaya bisa di-link langsung dari sitemap & dishare
  app.get("/api/products/:id/image", async (req, res) => {
    try {
      const [rows]: any = await pool.query(
        `SELECT image, COALESCE(image_mime, 'image/webp') as mime, image_alt
         FROM products WHERE id=? LIMIT 1`,
        [req.params.id],
      );
      if (!rows.length || !rows[0].image) {
        return res.status(404).send("Image not found");
      }
      const row = rows[0];
      res.set({
        "Content-Type": row.mime,
        "Cache-Control": "public, max-age=2592000, immutable", // 30 hari
        "Content-Disposition": `inline; filename="${slugify(row.image_alt || "product")}.webp"`,
      });
      res.send(row.image);
    } catch (err) {
      console.error("GET product image error:", err);
      res.status(500).send("Error");
    }
  });

  // Image endpoint by team member ID â€” listing tim memakai URL ini, bukan base64
  app.get("/api/team/:id/image", async (req, res) => {
    try {
      const [rows]: any = await pool.query(
        `SELECT image, COALESCE(image_mime, 'image/webp') as mime, name
         FROM team WHERE id=? LIMIT 1`,
        [req.params.id],
      );
      if (!rows.length || !rows[0].image) {
        return res.status(404).send("Image not found");
      }
      const row = rows[0];
      res.set({
        "Content-Type": row.mime,
        "Cache-Control": "public, max-age=2592000, immutable", // 30 hari
        "Content-Disposition": `inline; filename="${slugify(row.name || "team")}.webp"`,
      });
      res.send(row.image);
    } catch (err) {
      console.error("GET team image error:", err);
      res.status(500).send("Error");
    }
  });

  // Dynamic Product schema (ItemList of Products) untuk inject di Catalog page
  app.get("/api/seo/products-schema", async (_req, res) => {
    try {
      const [products]: any = await pool.query(
        `SELECT id, slug, name, brand, type, capacity, price, description, image_alt, image IS NOT NULL as has_image
         FROM products ORDER BY created_at DESC`,
      );

      const itemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Katalog AC HDB Airconds Mojokerto",
        "numberOfItems": (products as any[]).length,
        "itemListElement": (products as any[]).map((p, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "item": {
            "@type": "Product",
            "@id": `${SITE_URL}/katalog/${p.slug || p.id}`,
            "name": p.name,
            "brand": { "@type": "Brand", "name": p.brand || "Generic" },
            "category": p.type || "AC",
            "description": p.description || `${p.name} ${p.brand || ""} ${p.capacity || ""} - tersedia di HDB Airconds Mojokerto`.trim(),
            ...(p.has_image ? { "image": `${SITE_URL}/api/products/${p.id}/image` } : {}),
            "offers": {
              "@type": "Offer",
              "url": `${SITE_URL}/katalog/${p.slug || p.id}`,
              "priceCurrency": "IDR",
              "price": String(Math.round(Number(p.price) || 0)),
              "availability": "https://schema.org/InStock",
              "seller": {
                "@type": "Organization",
                "name": "HDB Airconds",
              },
            },
          },
        })),
      };

      res.set("Cache-Control", "public, max-age=3600"); // cache 1 jam
      res.json(itemList);
    } catch (err) {
      console.error("/api/seo/products-schema error:", err);
      res.status(500).json({ error: "Gagal generate product schema" });
    }
  });

  // â”€â”€ MATERIAL CATALOG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // GET /api/material-catalog â€” semua item aktif (admin & teknisi)
  app.get('/api/material-catalog', authenticateToken, async (req: any, res) => {
    try {
      const isAdmin = req.user.role === 'admin';
      const [rows] = await pool.query(
        isAdmin
          ? 'SELECT * FROM material_catalog ORDER BY category, name'
          : 'SELECT * FROM material_catalog WHERE is_active = 1 ORDER BY category, name'
      );
      res.json({ success: true, data: rows });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal mengambil katalog' });
    }
  });

  // POST /api/material-catalog â€” tambah item (admin)
  app.post('/api/material-catalog', authenticateToken, requireAdmin, async (req: any, res) => {
    const { name, unit, price, category } = req.body;
    if (!name || !unit || !price) {
      return res.status(400).json({ success: false, message: 'name, unit, price wajib diisi' });
    }
    try {
      const [result]: any = await pool.query(
        'INSERT INTO material_catalog (name, unit, price, category) VALUES (?,?,?,?)',
        [name, unit, Number(price), category || null]
      );
      res.json({ success: true, data: { id: result.insertId } });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal menambah item' });
    }
  });

  // PUT /api/material-catalog/:id â€” edit item (admin)
  app.put('/api/material-catalog/:id', authenticateToken, requireAdmin, async (req: any, res) => {
    const { name, unit, price, category } = req.body;
    try {
      await pool.query(
        'UPDATE material_catalog SET name=?, unit=?, price=?, category=? WHERE id=?',
        [name, unit, Number(price), category || null, req.params.id]
      );
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal mengubah item' });
    }
  });

  // PATCH /api/material-catalog/:id/toggle â€” aktif/nonaktif (admin)
  app.patch('/api/material-catalog/:id/toggle', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      await pool.query(
        'UPDATE material_catalog SET is_active = NOT is_active WHERE id=?',
        [req.params.id]
      );
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal mengubah status' });
    }
  });

  // â”€â”€ ORDER ADDITIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // POST /api/orders/:orderId/additions â€” buat pengajuan (teknisi atau customer)
  app.post('/api/orders/:orderId/additions', authenticateToken, async (req: any, res) => {
    const { orderId } = req.params;
    const { items } = req.body as { items: Array<{ item_type: 'material'|'service'; ref_id: string; quantity: number }> };
    const itemsError = validateAdditionItems(items);
    if (itemsError) {
      return res.status(400).json({ success: false, message: itemsError });
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Pastikan order ada
      const [orderRows]: any = await conn.query('SELECT id, user_id, teknisi_id FROM orders WHERE id=?', [orderId]);
      if (!orderRows.length) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
      }
      // Cegah IDOR: hanya admin, teknisi yang ditugaskan, atau pemilik order
      const ord = orderRows[0];
      const isOwner = ord.user_id != null && String(ord.user_id) === String(req.user.id);
      const isAssignedTeknisi = req.user.role === 'teknisi' && String(ord.teknisi_id) === String(req.user.id);
      if (req.user.role !== 'admin' && !isAssignedTeknisi && !isOwner) {
        await conn.rollback();
        return res.status(403).json({ success: false, message: 'Tidak diizinkan menambah item ke order ini' });
      }

      // Resolve setiap item â€” ambil nama & harga dari katalog/services
      const resolvedItems = [];
      for (const item of items) {
        if (item.item_type === 'material') {
          const [mRows]: any = await conn.query(
            'SELECT name, unit, price FROM material_catalog WHERE id=? AND is_active=1',
            [item.ref_id]
          );
          if (!mRows.length) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: `Material id ${item.ref_id} tidak ditemukan` });
          }
          const m = mRows[0];
          resolvedItems.push({
            item_type: 'material', ref_id: item.ref_id,
            name: m.name, unit: m.unit,
            quantity: item.quantity, unit_price: Number(m.price),
            subtotal: Number(m.price) * item.quantity,
          });
        } else {
          const [sRows]: any = await conn.query(
            'SELECT name, price FROM services WHERE id=?',
            [item.ref_id]
          );
          if (!sRows.length) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: `Service id ${item.ref_id} tidak ditemukan` });
          }
          const s = sRows[0];
          resolvedItems.push({
            item_type: 'service', ref_id: item.ref_id,
            name: s.name, unit: 'unit',
            quantity: item.quantity, unit_price: Number(s.price),
            subtotal: Number(s.price) * item.quantity,
          });
        }
      }

      const [addResult]: any = await conn.query(
        `INSERT INTO order_additions (order_id, initiated_by, initiated_by_id, status)
         VALUES (?, ?, ?, 'pending_admin')`,
        [orderId, req.user.role === 'teknisi' ? 'teknisi' : 'customer', req.user.id]
      );
      const additionId = addResult.insertId;

      for (const ri of resolvedItems) {
        await conn.query(
          `INSERT INTO order_addition_items
           (order_addition_id, item_type, ref_id, name, unit, quantity, unit_price, subtotal)
           VALUES (?,?,?,?,?,?,?,?)`,
          [additionId, ri.item_type, ri.ref_id, ri.name, ri.unit, ri.quantity, ri.unit_price, ri.subtotal]
        );
      }

      await conn.commit();
      const result = await getAdditionWithItems(additionId);
      res.json({ success: true, data: result });
    } catch (e) {
      await conn.rollback();
      res.status(500).json({ success: false, message: 'Gagal membuat pengajuan' });
    } finally {
      conn.release();
    }
  });

  // GET /api/order-additions â€” list semua (admin)
  app.get('/api/order-additions', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const [rows]: any = await pool.query(
        `SELECT oa.*, o.customer_name, o.phone as customer_phone,
                u.name as initiated_by_name
         FROM order_additions oa
         JOIN orders o ON oa.order_id = o.id
         LEFT JOIN users u ON oa.initiated_by_id = u.id
         ORDER BY oa.created_at DESC`
      );
      if (rows.length === 0) return res.json({ success: true, data: [] });

      // Ambil semua items dalam 1 query (hindari N+1), lalu kelompokkan per addition
      const additionIds = rows.map((r: any) => r.id);
      const [allItems]: any = await pool.query(
        'SELECT * FROM order_addition_items WHERE order_addition_id IN (?)', [additionIds]
      );
      const itemsByAddition = new Map<number, any[]>();
      for (const item of allItems) {
        const list = itemsByAddition.get(item.order_addition_id) ?? [];
        list.push(item);
        itemsByAddition.set(item.order_addition_id, list);
      }
      const result = rows.map((row: any) => {
        const items = itemsByAddition.get(row.id) ?? [];
        const total = items.reduce((s: number, i: any) => s + Number(i.subtotal), 0);
        return { ...row, items, total };
      });
      res.json({ success: true, data: result });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal mengambil data' });
    }
  });

  // PATCH /api/order-additions/:id/admin-review â€” admin approve/reject
  app.patch('/api/order-additions/:id/admin-review', authenticateToken, requireAdmin, async (req: any, res) => {
    const { action, admin_notes } = req.body as { action: 'approve'|'reject'; admin_notes?: string };
    if (!['approve','reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action harus approve atau reject' });
    }
    try {
      const [rows]: any = await pool.query(
        'SELECT * FROM order_additions WHERE id=?', [req.params.id]
      );
      if (!rows.length) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });
      if (rows[0].status !== 'pending_admin') {
        return res.status(400).json({ success: false, message: 'Status bukan pending_admin' });
      }

      if (action === 'reject') {
        await pool.query(
          `UPDATE order_additions SET status='admin_rejected', admin_notes=?, updated_at=NOW() WHERE id=?`,
          [admin_notes || null, req.params.id]
        );
        res.json({ success: true, status: 'admin_rejected' });
      } else {
        // Generate customer token
        const token = crypto.randomBytes(32).toString('hex');
        await pool.query(
          `UPDATE order_additions SET status='pending_customer', customer_token=?, admin_notes=?, updated_at=NOW() WHERE id=?`,
          [token, admin_notes || null, req.params.id]
        );
        // Ambil data customer untuk generate WA link
        const [addRows]: any = await pool.query(
          `SELECT oa.*, o.customer_name, o.phone, SUM(oai.subtotal) as total
           FROM order_additions oa
           JOIN orders o ON oa.order_id = o.id
           JOIN order_addition_items oai ON oai.order_addition_id = oa.id
           WHERE oa.id=?
           GROUP BY oa.id`,
          [req.params.id]
        );
        const add = addRows[0];
        const approvalUrl = `${PUBLIC_BASE_URL}/tambahan/${token}`;
        const waMsg = encodeURIComponent(
          `Halo ${add.customer_name}, ada penambahan material/jasa untuk order Anda senilai Rp${Number(add.total).toLocaleString('id-ID')}.\n\nSilakan cek dan setujui di:\n${approvalUrl}`
        );
        const waLink = `https://wa.me/62${String(add.phone).replace(/^0/, '')}?text=${waMsg}`;
        res.json({ success: true, status: 'pending_customer', token, waLink });
      }
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal memproses review' });
    }
  });

  // GET /api/order-additions/token/:token â€” lihat via link publik (tanpa auth)
  app.get('/api/order-additions/token/:token', async (req, res) => {
    try {
      const [rows]: any = await pool.query(
        `SELECT oa.*, o.customer_name, o.phone as customer_phone, o.address as customer_address,
                o.created_at as order_created_at, u.name as teknisi_name
         FROM order_additions oa
         JOIN orders o ON oa.order_id = o.id
         LEFT JOIN users u ON o.teknisi_id = u.id
         WHERE oa.customer_token=?`,
        [req.params.token]
      );
      if (!rows.length) return res.status(404).json({ success: false, message: 'Link tidak valid' });
      const addition = rows[0];
      const [items]: any = await pool.query(
        'SELECT * FROM order_addition_items WHERE order_addition_id=?', [addition.id]
      );
      const total = items.reduce((s: number, i: any) => s + Number(i.subtotal), 0);
      res.json({ success: true, data: { ...addition, items, total } });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal mengambil data' });
    }
  });

  // PATCH /api/order-additions/:id/customer-response â€” customer approve/reject
  app.patch('/api/order-additions/:id/customer-response', customerPaymentLimiter, async (req, res) => {
    const { token, action, payment_method } = req.body as {
      token: string; action: 'approve'|'reject'; payment_method?: 'cash'|'online'
    };
    if (!['approve','reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action harus approve atau reject' });
    }
    try {
      const [rows]: any = await pool.query(
        'SELECT * FROM order_additions WHERE id=? AND customer_token=?',
        [req.params.id, token]
      );
      if (!rows.length) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
      if (rows[0].status !== 'pending_customer') {
        return res.status(400).json({ success: false, message: 'Status tidak valid' });
      }
      if (action === 'reject') {
        await pool.query(
          `UPDATE order_additions SET status='customer_rejected', updated_at=NOW() WHERE id=?`,
          [req.params.id]
        );
        return res.json({ success: true, status: 'customer_rejected' });
      }
      if (!payment_method) {
        return res.status(400).json({ success: false, message: 'payment_method wajib diisi saat approve' });
      }
      if (payment_method === 'cash') {
        await pool.query(
          `UPDATE order_additions SET status='customer_approved', payment_method='cash',
           payment_status='pending', updated_at=NOW() WHERE id=?`,
          [req.params.id]
        );
        // Tunai langsung memenuhi syarat invoice â†’ generate nomor invoice sekarang
        const invoiceNumber = await ensureAdditionInvoice(req.params.id);
        return res.json({ success: true, status: 'customer_approved', payment_method: 'cash', invoiceToken: token, invoice_number: invoiceNumber });
      }
      // Online payment â€” buat Midtrans snap token
      res.json({ success: true, status: 'customer_approved', payment_method: 'online', needsPayment: true });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal memproses respon' });
    }
  });

  // POST /api/order-additions/:id/payment â€” inisiasi bayar online
  app.post('/api/order-additions/:id/payment', customerPaymentLimiter, async (req, res) => {
    const { token } = req.body as { token: string };
    try {
      const [rows]: any = await pool.query(
        `SELECT oa.*, o.customer_name, o.phone, o.user_id
         FROM order_additions oa JOIN orders o ON oa.order_id = o.id
         WHERE oa.id=? AND oa.customer_token=?`,
        [req.params.id, token]
      );
      if (!rows.length) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
      const add = rows[0];
      const [items]: any = await pool.query(
        'SELECT * FROM order_addition_items WHERE order_addition_id=?', [add.id]
      );
      const total = items.reduce((s: number, i: any) => s + Number(i.subtotal), 0);

      const midtransOrderId = `ADD-${add.id}-${Date.now()}`;
      const baseUrl = PUBLIC_BASE_URL;
      const transaction = await snap.createTransaction({
        transaction_details: { order_id: midtransOrderId, gross_amount: Math.round(total) },
        customer_details: { first_name: add.customer_name, phone: add.phone },
        item_details: items.map((i: any) => ({
          id: `${i.item_type}-${i.ref_id}`,
          price: Math.round(Number(i.unit_price)),
          quantity: Math.round(Number(i.quantity)),
          name: i.name,
        })),
        callbacks: { finish: `${baseUrl}/invoice/${add.customer_token}` },
      });

      await pool.query(
        `UPDATE order_additions SET status='customer_approved', payment_method='online',
         payment_status='pending', midtrans_order_id=?, updated_at=NOW() WHERE id=?`,
        [midtransOrderId, add.id]
      );

      res.json({ success: true, snapToken: transaction.token, redirectUrl: transaction.redirect_url, midtransOrderId });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal membuat transaksi' });
    }
  });

  // POST /api/order-additions/:id/confirm-payment â€” verifikasi status Midtrans & tandai paid
  app.post('/api/order-additions/:id/confirm-payment', customerPaymentLimiter, async (req, res) => {
    const { token, midtransOrderId } = req.body as { token: string; midtransOrderId?: string };
    try {
      const [rows]: any = await pool.query(
        'SELECT * FROM order_additions WHERE id=? AND customer_token=?',
        [req.params.id, token]
      );
      if (!rows.length) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
      const add = rows[0];

      // Sudah paid (mis. webhook lebih dulu masuk) â†’ cukup pastikan invoice ada
      if (add.status === 'paid') {
        const inv = await ensureAdditionInvoice(add.id);
        return res.json({ success: true, status: 'paid', invoiceToken: token, invoice_number: inv });
      }

      if (!midtransOrderId || !String(midtransOrderId).startsWith(`ADD-${add.id}-`)) {
        return res.status(400).json({ success: false, message: 'midtransOrderId tidak valid' });
      }

      const core = new midtransClient.CoreApi({
        isProduction: MIDTRANS_IS_PRODUCTION,
        serverKey: MIDTRANS_SERVER_KEY,
        clientKey: MIDTRANS_CLIENT_KEY,
      });
      const st = await core.transaction.status(midtransOrderId);

      if (['capture', 'settlement'].includes(st.transaction_status)) {
        await pool.query(
          `UPDATE order_additions SET payment_status='paid', status='paid', updated_at=NOW() WHERE id=?`,
          [add.id]
        );
        const inv = await ensureAdditionInvoice(add.id);
        return res.json({ success: true, status: 'paid', invoiceToken: token, invoice_number: inv });
      }

      return res.json({ success: true, status: 'pending', midtransStatus: st.transaction_status });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal verifikasi pembayaran' });
    }
  });

  // GET /api/order-additions/my â€” milik teknisi yg login
  app.get('/api/order-additions/my', authenticateToken, requireTeknisi, async (req: any, res) => {
    try {
      const [rows]: any = await pool.query(
        `SELECT oa.*, o.customer_name, SUM(oai.subtotal) as total
         FROM order_additions oa
         JOIN orders o ON oa.order_id = o.id
         JOIN order_addition_items oai ON oai.order_addition_id = oa.id
         WHERE oa.initiated_by_id=? OR o.teknisi_id=?
         GROUP BY oa.id
         ORDER BY oa.created_at DESC`,
        [req.user.id, req.user.id]
      );
      res.json({ success: true, data: rows });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal mengambil data' });
    }
  });

  // PATCH /api/order-additions/:id/revise â€” revisi item
  app.patch('/api/order-additions/:id/revise', authenticateToken, requireTeknisi, async (req: any, res) => {
    const { items } = req.body as { items: Array<{ item_type: 'material'|'service'; ref_id: string; quantity: number }> };
    const itemsError = validateAdditionItems(items);
    if (itemsError) return res.status(400).json({ success: false, message: itemsError });
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows]: any = await conn.query(
        'SELECT * FROM order_additions WHERE id=?', [req.params.id]
      );
      if (!rows.length) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Tidak ditemukan' }); }
      if (!['customer_rejected','admin_rejected'].includes(rows[0].status)) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'Hanya bisa revisi setelah ditolak' });
      }
      // Hapus items lama, insert baru
      await conn.query('DELETE FROM order_addition_items WHERE order_addition_id=?', [req.params.id]);
      for (const item of items) {
        let iName: string, iUnit: string, iPrice: number;
        if (item.item_type === 'material') {
          const [iRows]: any = await conn.query('SELECT name, unit, price FROM material_catalog WHERE id=? AND is_active=1', [item.ref_id]);
          if (!iRows.length) { await conn.rollback(); return res.status(400).json({ success: false, message: `Material ${item.ref_id} tidak ditemukan` }); }
          iName = iRows[0].name; iUnit = iRows[0].unit; iPrice = Number(iRows[0].price);
        } else {
          const [iRows]: any = await conn.query('SELECT name, price FROM services WHERE id=?', [item.ref_id]);
          if (!iRows.length) { await conn.rollback(); return res.status(400).json({ success: false, message: `Jasa ${item.ref_id} tidak ditemukan` }); }
          iName = iRows[0].name; iUnit = 'unit'; iPrice = Number(iRows[0].price);
        }
        await conn.query(
          `INSERT INTO order_addition_items (order_addition_id, item_type, ref_id, name, unit, quantity, unit_price, subtotal)
           VALUES (?,?,?,?,?,?,?,?)`,
          [req.params.id, item.item_type, item.ref_id, iName, iUnit, item.quantity, iPrice, iPrice * item.quantity]
        );
      }
      await conn.query(
        `UPDATE order_additions SET status='pending_admin', updated_at=NOW() WHERE id=?`, [req.params.id]
      );
      await conn.commit();
      const result = await getAdditionWithItems(Number(req.params.id));
      res.json({ success: true, data: result });
    } catch (e) {
      await conn.rollback();
      res.status(500).json({ success: false, message: 'Gagal merevisi' });
    } finally {
      conn.release();
    }
  });

  // PATCH /api/order-additions/:id/escalate â€” eskalasi ke admin
  app.patch('/api/order-additions/:id/escalate', authenticateToken, requireTeknisi, async (req: any, res) => {
    try {
      await pool.query(
        `UPDATE order_additions SET status='pending_admin', updated_at=NOW() WHERE id=? AND status='customer_rejected'`,
        [req.params.id]
      );
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal eskalasi' });
    }
  });

  // PATCH /api/order-additions/:id/cancel â€” batalkan
  app.patch('/api/order-additions/:id/cancel', authenticateToken, requireTeknisi, async (req: any, res) => {
    try {
      await pool.query(
        `UPDATE order_additions SET status='cancelled', updated_at=NOW() WHERE id=? AND status IN ('customer_rejected','admin_rejected')`,
        [req.params.id]
      );
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal membatalkan' });
    }
  });

  // GET /api/order-additions/token/:token/invoice-data â€” data invoice publik
  app.get('/api/order-additions/token/:token/invoice-data', async (req, res) => {
    try {
      const [rows]: any = await pool.query(
        `SELECT oa.*, o.customer_name, o.phone as customer_phone, o.address as customer_address,
                o.created_at as order_created_at, u.name as teknisi_name,
                oi.item_name as first_item
         FROM order_additions oa
         JOIN orders o ON oa.order_id = o.id
         LEFT JOIN users u ON o.teknisi_id = u.id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE oa.customer_token=? AND (oa.status='paid' OR (oa.status='customer_approved' AND oa.payment_method='cash'))
         LIMIT 1`,
        [req.params.token]
      );
      if (!rows.length) return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan' });
      const add = rows[0];
      // Ambil semua order_items dari order asal
      const [origItems]: any = await pool.query(
        'SELECT * FROM order_items WHERE order_id=?', [add.order_id]
      );
      // Ambil addition items
      const [addItems]: any = await pool.query(
        'SELECT * FROM order_addition_items WHERE order_addition_id=?', [add.id]
      );
      const origTotal = origItems.reduce((s: number, i: any) => s + Number(i.price)*Number(i.quantity), 0);
      const addTotal = addItems.reduce((s: number, i: any) => s + Number(i.subtotal), 0);
      res.json({
        success: true,
        data: {
          invoice_number: add.invoice_number,
          invoice_date: add.invoice_sent_at,
          order_id: add.order_id,
          order_date: add.order_created_at,
          customer_name: add.customer_name,
          customer_phone: add.customer_phone,
          customer_address: add.customer_address,
          teknisi_name: add.teknisi_name,
          payment_method: add.payment_method,
          orig_items: origItems,
          add_items: addItems,
          orig_total: origTotal,
          add_total: addTotal,
          grand_total: origTotal + addTotal,
        }
      });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal mengambil data invoice' });
    }
  });

  // POST /api/order-additions/:id/send-invoice â€” admin generate + kirim invoice
  app.post('/api/order-additions/:id/send-invoice', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const [rows]: any = await pool.query(
        `SELECT oa.*, o.customer_name, o.phone, SUM(oai.subtotal) as total
         FROM order_additions oa JOIN orders o ON oa.order_id = o.id
         JOIN order_addition_items oai ON oai.order_addition_id = oa.id
         WHERE oa.id=? AND (oa.status='paid' OR (oa.status='customer_approved' AND oa.payment_method='cash'))
         GROUP BY oa.id`,
        [req.params.id]
      );
      if (!rows.length) return res.status(404).json({ success: false, message: 'Data tidak ditemukan atau belum paid' });
      const add = rows[0];

      // Generate nomor invoice (idempotent + lock global, konsisten dgn jalur lain).
      // ensureAdditionInvoice menghitung gabungan orders + order_additions di bawah lock.
      const invoiceNumber = add.invoice_number || await ensureAdditionInvoice(req.params.id);
      if (!invoiceNumber) return res.status(500).json({ success: false, message: 'Gagal membuat nomor invoice' });

      const baseUrl = PUBLIC_BASE_URL;
      const invoiceUrl = `${baseUrl}/invoice/${add.customer_token}`;
      const waMsg = encodeURIComponent(
        `Halo ${add.customer_name}, invoice untuk tambahan order Anda (${invoiceNumber}) sudah tersedia.\n\nLihat invoice di:\n${invoiceUrl}`
      );
      const waLink = `https://wa.me/62${String(add.phone).replace(/^0/,'')}?text=${waMsg}`;

      res.json({ success: true, invoice_number: invoiceNumber, invoiceUrl, waLink });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal mengirim invoice' });
    }
  });

  // POST /api/orders/:orderId/send-invoice â€” admin: generate invoice untuk order
  app.post('/api/orders/:orderId/send-invoice', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const [rows]: any = await pool.query(
        `SELECT o.*, u.name as teknisi_name
         FROM orders o LEFT JOIN users u ON o.teknisi_id = u.id
         WHERE o.id=?`,
        [req.params.orderId]
      );
      if (!rows.length) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
      const order = rows[0];

      let invoiceToken = order.invoice_token;
      if (!invoiceToken) {
        invoiceToken = crypto.randomBytes(32).toString('hex');
      }

      // Alokasi nomor invoice + tulis di bawah lock global agar seq tidak duplikat
      // saat ada request bersamaan (mis. order biasa + addition pada saat yang sama).
      const invoiceNumber = await withInvoiceLock(async (conn) => {
        const [cur]: any = await conn.query(
          'SELECT invoice_number FROM orders WHERE id=?', [req.params.orderId]
        );
        if (cur.length && cur[0].invoice_number) {
          await conn.query(
            `UPDATE orders SET invoice_token=COALESCE(invoice_token, ?), invoice_sent_at=NOW() WHERE id=?`,
            [invoiceToken, req.params.orderId]
          );
          return cur[0].invoice_number;
        }
        const now = new Date();
        const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
        const num = await nextInvoiceNumber(conn, ym);
        await conn.query(
          `UPDATE orders SET invoice_number=?, invoice_token=?, invoice_sent_at=NOW() WHERE id=?`,
          [num, invoiceToken, req.params.orderId]
        );
        return num;
      });

      const baseUrl = PUBLIC_BASE_URL;
      const invoiceUrl = `${baseUrl}/order-invoice/${invoiceToken}`;
      const waMsg = encodeURIComponent(
        `Halo ${order.customer_name}, invoice untuk order Anda (${invoiceNumber}) sudah tersedia.\n\nLihat invoice di:\n${invoiceUrl}`
      );
      const waLink = `https://wa.me/62${String(order.phone).replace(/^0/,'')}?text=${waMsg}`;

      res.json({ success: true, invoice_number: invoiceNumber, invoice_token: invoiceToken, invoiceUrl, waLink });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal membuat invoice' });
    }
  });

  // GET /api/order-invoice/:token â€” publik: data invoice order lengkap
  app.get('/api/order-invoice/:token', async (req, res) => {
    try {
      const [rows]: any = await pool.query(
        `SELECT o.*, u.name as teknisi_name
         FROM orders o LEFT JOIN users u ON o.teknisi_id = u.id
         WHERE o.invoice_token=?`,
        [req.params.token]
      );
      if (!rows.length) return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan' });
      const order = rows[0];

      const [origItems]: any = await pool.query(
        'SELECT * FROM order_items WHERE order_id=?', [order.id]
      );
      const [addItems]: any = await pool.query(
        `SELECT oai.* FROM order_addition_items oai
         JOIN order_additions oa ON oai.order_addition_id = oa.id
         WHERE oa.order_id=? AND (oa.status='paid' OR (oa.status='customer_approved' AND oa.payment_method='cash'))`,
        [order.id]
      );

      const origTotal = origItems.reduce((s: number, i: any) => s + Number(i.price) * Number(i.quantity), 0);
      const addTotal = addItems.reduce((s: number, i: any) => s + Number(i.subtotal), 0);

      res.json({
        success: true,
        data: {
          invoice_number: order.invoice_number,
          invoice_date: order.invoice_sent_at,
          order_id: order.id,
          order_date: order.created_at,
          customer_name: order.customer_name,
          customer_phone: order.phone,
          customer_address: order.address,
          teknisi_name: order.teknisi_name,
          payment_method: order.payment_method,
          orig_items: origItems,
          add_items: addItems,
          orig_total: origTotal,
          add_total: addTotal,
          grand_total: origTotal + addTotal,
        }
      });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal mengambil data invoice' });
    }
  });

  // =========================
  // START
  // =========================
  const getLocalIp = () => {
    for (const ifaces of Object.values(os.networkInterfaces())) {
      for (const iface of ifaces ?? []) {
        if (iface.family === "IPv4" && !iface.internal) return iface.address;
      }
    }
    return "localhost";
  };

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[*] Server running on:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://${getLocalIp()}:${PORT}`);
  });
}

startServer();
