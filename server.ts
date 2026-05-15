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

dotenv.config();

// =========================
// FAIL FAST — env wajib ada
// =========================
const REQUIRED_ENV = ["JWT_SECRET", "DB_HOST", "DB_USER", "DB_NAME"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env variable: ${key}`);
    process.exit(1);
  }
}

const JWT_SECRET = process.env.JWT_SECRET!;
const PORT = Number(process.env.PORT) || 5000;

// =========================
// MIDTRANS SETUP
// =========================
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// =========================
// DB POOL
// =========================
const pool = mysql.createPool({
  host: process.env.DB_HOST,
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
  console.log("✅ Database connected");

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
}

// =========================
// MULTER — batas 5 MB, hanya gambar
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

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
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
// START SERVER
// =========================
async function startServer() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS — izinkan origin dari env, fallback localhost dev
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:4173")
    .split(",")
    .map(o => o.trim());

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
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }));

  // Body size limit — cegah payload serangan besar
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
      return res.status(400).json({ success: false, error: "Username harus 3–50 karakter" });
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
      await pool.query(
        "INSERT INTO users (username,password,name,role) VALUES (?,?,?,?)",
        [username, hashedPassword, name, "user"],
      );

      const token = jwt.sign({ username, role: "user" }, JWT_SECRET, { expiresIn: "24h" });
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
  // PUBLIC — PRODUCTS & SERVICES
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
        `SELECT id, name, brand, type, capacity, price, stock, description, features, created_at, updated_at,
                IF(image IS NOT NULL, CONCAT("data:image/jpeg;base64,", TO_BASE64(image)), NULL) as image
         FROM products ORDER BY created_at DESC`,
      );
      res.json({
        success: true,
        data: (rows as any[]).map(row => ({
          ...row,
          price: Number(row.price) || 0,
          stock: Number(row.stock) || 0,
        })),
      });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengambil produk" });
    }
  });

  // =========================
  // PUBLIC — TEAM
  // =========================
  app.get("/api/team", async (_req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, name, position, role_label, bio, phone, sort_order,
                IF(image IS NOT NULL, CONCAT('data:image/jpeg;base64,', TO_BASE64(image)), NULL) as image
         FROM team WHERE is_active = 1 ORDER BY sort_order ASC, id ASC`,
      );
      res.json({ success: true, data: rows });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengambil data tim" });
    }
  });

  // =========================
  // ADMIN PRODUCTS
  // =========================
  app.get("/api/admin/products", authenticateToken, requireAdmin, async (_req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, name, brand, type, capacity, price, stock, description, features, created_at, updated_at,
                IF(image IS NOT NULL, CONCAT("data:image/jpeg;base64,", TO_BASE64(image)), NULL) as image
         FROM products ORDER BY created_at DESC`,
      );
      res.json({ success: true, data: rows });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengambil produk" });
    }
  });

  app.post("/api/admin/products", authenticateToken, requireAdmin, upload.single("image"), async (req, res) => {
    const { name, brand, type, capacity, price, description } = req.body;
    const image = req.file ? req.file.buffer : null;
    try {
      await pool.query(
        "INSERT INTO products (id, name, brand, type, capacity, price, description, image) VALUES (UUID(),?,?,?,?,?,?,?)",
        [name, brand, type, capacity, price, description, image],
      );
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal menambah produk" });
    }
  });

  app.put("/api/admin/products/:id", authenticateToken, requireAdmin, upload.single("image"), async (req, res) => {
    const { id } = req.params;
    const { name, brand, type, capacity, price, description } = req.body;
    const image = req.file ? req.file.buffer : null;
    try {
      if (image) {
        await pool.query(
          "UPDATE products SET name=?, brand=?, type=?, capacity=?, price=?, description=?, image=? WHERE id=?",
          [name, brand, type, capacity, price, description, image, id],
        );
      } else {
        await pool.query(
          "UPDATE products SET name=?, brand=?, type=?, capacity=?, price=?, description=? WHERE id=?",
          [name, brand, type, capacity, price, description, id],
        );
      }
      res.json({ success: true });
    } catch {
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
    try {
      await pool.query(
        "INSERT INTO services (name, price, description, icon) VALUES (?,?,?,?)",
        [name, price, description, icon],
      );
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal menambah layanan" });
    }
  });

  app.put("/api/admin/services/:id", authenticateToken, requireAdmin, async (req, res) => {
    const { name, price, description, icon } = req.body;
    try {
      await pool.query(
        "UPDATE services SET name=?, price=?, description=?, icon=? WHERE id=?",
        [name, price, description, icon, req.params.id],
      );
      res.json({ success: true });
    } catch {
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
                IF(image IS NOT NULL, CONCAT('data:image/jpeg;base64,', TO_BASE64(image)), NULL) as image
         FROM team ORDER BY sort_order ASC, id ASC`,
      );
      res.json({ success: true, data: rows });
    } catch {
      res.status(500).json({ success: false, error: "Gagal mengambil data tim" });
    }
  });

  app.post("/api/admin/team", authenticateToken, requireAdmin, upload.single("image"), async (req: any, res) => {
    const { name, position, role_label, bio, phone, sort_order } = req.body;
    const image = req.file ? req.file.buffer : null;
    try {
      await pool.query(
        "INSERT INTO team (name, position, role_label, bio, phone, sort_order, image) VALUES (?,?,?,?,?,?,?)",
        [name, position, role_label, bio || null, phone || null, sort_order || 0, image],
      );
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal menambah anggota tim" });
    }
  });

  app.put("/api/admin/team/:id", authenticateToken, requireAdmin, upload.single("image"), async (req: any, res) => {
    const { id } = req.params;
    const { name, position, role_label, bio, phone, sort_order, is_active } = req.body;
    const image = req.file ? req.file.buffer : null;
    try {
      if (image) {
        await pool.query(
          "UPDATE team SET name=?, position=?, role_label=?, bio=?, phone=?, sort_order=?, is_active=?, image=?, updated_at=NOW() WHERE id=?",
          [name, position, role_label, bio || null, phone || null, sort_order || 0, is_active ?? 1, image, id],
        );
      } else {
        await pool.query(
          "UPDATE team SET name=?, position=?, role_label=?, bio=?, phone=?, sort_order=?, is_active=?, updated_at=NOW() WHERE id=?",
          [name, position, role_label, bio || null, phone || null, sort_order || 0, is_active ?? 1, id],
        );
      }
      res.json({ success: true });
    } catch {
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
  // MIDTRANS — SNAP TOKEN
  // =========================
  app.post("/api/midtrans/snap-token", authenticateToken, async (req: any, res) => {
    try {
      const { price, quantity, productId, productName, items, customerName, phone, address, notes } = req.body;
      const user = req.user;
      const orderId = `ORD-${Date.now()}`;
      const totalPrice = Number(price);

      if (!totalPrice || totalPrice <= 0) {
        return res.status(400).json({ success: false, error: "Total harga tidak valid" });
      }

      let itemDetails: any[] = [];
      if (items && Array.isArray(items) && items.length > 0) {
        itemDetails = items.map((item: any) => ({
          id: String(item.id).substring(0, 50),
          price: Math.round(Number(item.price) || 0),
          quantity: Number(item.quantity) || 1,
          name: String(item.name).substring(0, 50),
        }));
      } else {
        itemDetails = [{
          id: String(productId).substring(0, 50),
          price: Math.round(totalPrice),
          quantity: 1,
          name: String(productName).substring(0, 50),
        }];
      }

      // Validasi total item harus cocok dengan gross_amount
      const calculatedTotal = itemDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);
      if (calculatedTotal !== totalPrice) {
        return res.status(400).json({ success: false, error: "Total harga tidak sesuai dengan item" });
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

      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await pool.query(
            `INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, price) VALUES (?,?,?,?,?,?)`,
            [orderId, item.itemType || "product", item.id, item.name, item.quantity || 1, item.price],
          );
        }
      } else {
        await pool.query(
          `INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, price) VALUES (?,?,?,?,?,?)`,
          [orderId, "product", productId, productName, quantity || 1, price],
        );
      }

      res.json({ success: true, orderId, snapToken });
    } catch (err: any) {
      console.error("❌ Error creating snap token:", err?.message);
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
      `UPDATE orders SET payment_status = ?, order_status = ?, status = ?, midtrans_transaction_id = COALESCE(?, midtrans_transaction_id) WHERE id = ?`,
      [paymentStatus, orderStatus, orderStatus, transactionId, orderId],
    );
    return { paymentStatus, orderStatus };
  }

  // =========================
  // MIDTRANS — WEBHOOK
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

      await updateOrderFromMidtrans(orderId, notification.transaction_status, notification.transaction_id);
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Webhook error" });
    }
  });

  // =========================
  // MIDTRANS — PAYMENT CALLBACK
  // =========================
  app.post("/api/midtrans/payment-callback", authenticateToken, async (req: any, res) => {
    try {
      const { orderId, transactionStatus, transactionId } = req.body;
      if (!orderId || !transactionStatus) {
        return res.status(400).json({ success: false, error: "orderId dan transactionStatus diperlukan" });
      }
      const result = await updateOrderFromMidtrans(orderId, transactionStatus, transactionId);
      res.json({ success: true, data: result });
    } catch {
      res.status(500).json({ success: false, error: "Gagal update status pembayaran" });
    }
  });

  // =========================
  // MIDTRANS — CEK STATUS
  // =========================
  app.post("/api/midtrans/check-status", authenticateToken, async (req: any, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ success: false, error: "orderId diperlukan" });

      const [orderRows]: any = await pool.query(
        "SELECT midtrans_transaction_id, payment_status FROM orders WHERE id = ?",
        [orderId],
      );
      if (!orderRows.length) return res.status(404).json({ success: false, error: "Order tidak ditemukan" });

      const order = orderRows[0];
      if (order.payment_status === "settlement") {
        return res.json({ success: true, data: { status: "settlement", source: "database" } });
      }
      if (!order.midtrans_transaction_id) {
        return res.json({ success: true, data: { status: "pending", source: "database" } });
      }

      const core = new midtransClient.CoreApi({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
        serverKey: process.env.MIDTRANS_SERVER_KEY,
        clientKey: process.env.MIDTRANS_CLIENT_KEY,
      });

      const midtransStatus = await core.transaction.status(order.midtrans_transaction_id);
      const result = await updateOrderFromMidtrans(orderId, midtransStatus.transaction_status, midtransStatus.transaction_id);
      res.json({ success: true, data: { midtransStatus: midtransStatus.transaction_status, updatedStatus: result, source: "midtrans_api" } });
    } catch {
      res.status(500).json({ success: false, error: "Gagal cek status pembayaran" });
    }
  });

  // =========================
  // ORDERS — CREATE (legacy)
  // =========================
  app.post("/api/orders", authenticateToken, async (req: any, res) => {
    const { price, quantity, productId, customerName, phone, address, paymentMethod } = req.body;
    const user = req.user;
    const qty = Number(quantity || 1);
    const totalPrice = Number(price) * qty;

    try {
      const [productRows]: any = await pool.query("SELECT name FROM products WHERE id=?", [productId]);
      if (!productRows.length) return res.status(404).json({ success: false, error: "Produk tidak ditemukan" });

      const orderId = `ORD-${Date.now()}`;
      await pool.query(
        `INSERT INTO orders (id, user_id, customer_name, phone, address, payment_method, total_price, order_status) VALUES (?,?,?,?,?,?,?, 'pending')`,
        [orderId, user?.id || null, customerName, phone, address, paymentMethod, totalPrice],
      );
      await pool.query(
        `INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, price) VALUES (?,?,?,?,?,?)`,
        [orderId, "product", productId, productRows[0].name, qty, price],
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
                o.total_price as price, o.created_at,
                GROUP_CONCAT(oi.item_name SEPARATOR ', ') as product_name,
                SUM(oi.quantity) as quantity,
                u.name as assigned_teknisi
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
          assigned_teknisi: o.assigned_teknisi || null,
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
      const [monthlyRevenue]: any = await pool.query(
        `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, DATE_FORMAT(created_at, '%b %Y') as monthLabel,
                COALESCE(SUM(total_price), 0) as revenue, COUNT(*) as order_count
         FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
         GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y')
         ORDER BY month ASC`,
      );
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
          monthlyRevenue: monthlyRevenue.map((r: any) => ({ month: r.month, monthLabel: r.monthLabel, revenue: Number(r.revenue) || 0, orderCount: Number(r.order_count) || 0 })),
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
                GROUP_CONCAT(oi.item_name SEPARATOR ', ') as product_name,
                SUM(oi.quantity) as total_quantity
         FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id
         GROUP BY o.id ORDER BY o.created_at DESC`,
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
          total_price: Number(o.total_price) || 0,
          price: Number(o.total_price) || 0,
          product_name: o.product_name || "N/A",
          total_quantity: Number(o.total_quantity) || 0,
          created_at: o.created_at,
          teknisi_id: o.teknisi_id || null,
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
      await pool.query(
        "INSERT INTO order_photos (order_id, photo_type, image, mime_type) VALUES (?,?,?,?)",
        [req.params.id, type, file.buffer, file.mimetype],
      );
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: "Gagal upload foto" });
    }
  });

  app.get("/api/orders/:id/photos", authenticateToken, async (req, res) => {
    try {
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
    console.log(`🚀 Server running on:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://${getLocalIp()}:${PORT}`);
  });
}

startServer();
