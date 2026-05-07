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

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const PORT = Number(process.env.PORT) || 5000;
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

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
// DB TEST
// =========================
async function testDB() {
  await pool.query("SELECT 1");
  console.log(" Database connected");
}

const upload = multer({ storage: multer.memoryStorage() });

// =========================
// AUTH MIDDLEWARE
// =========================
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "No token" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid token" });
    }

    req.user = user;
    next();
  });
};

// =========================
// START SERVER
// =========================
async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static(UPLOADS_DIR));

  await testDB();

  // =========================
  // AUTH REGISTER
  // =========================
  app.post("/api/auth/register", async (req, res) => {
    const { username, password, name } = req.body;

    const [exists]: any = await pool.query(
      "SELECT id FROM users WHERE username=?",
      [username],
    );

    if (exists.length) {
      return res
        .status(400)
        .json({ success: false, error: "Username sudah dipakai" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (username,password,name,role) VALUES (?,?,?,?)",
      [username, hashedPassword, name, "user"],
    );

    const token = jwt.sign({ username, role: "user" }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({ success: true, token, role: "user" });
  });

  // =========================
  // AUTH LOGIN
  // =========================
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      console.log("🔐 Login attempt:", { username });

      const [rows]: any = await pool.query(
        "SELECT * FROM users WHERE username=?",
        [username],
      );

      const user = rows[0];

      // Cek apakah user ditemukan
      if (!user) {
        console.log("❌ User not found:", username);
        return res
          .status(401)
          .json({ success: false, error: "Username atau password salah" });
      }

      console.log("✅ User found:", {
        username: user.username,
        hashedPasswordLength: user.password.length,
      });

      // Cek password dengan bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log("🔑 Password validation:", {
        isValidPassword,
        inputPasswordLength: password.length,
      });

      if (!isValidPassword) {
        console.log("❌ Invalid password for user:", username);
        return res
          .status(401)
          .json({ success: false, error: "Username atau password salah" });
      }

      console.log("✅ Login successful:", username);

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      res.json({ success: true, token, role: user.role });
    } catch (error) {
      console.error("❌ Login error:", error);
      res
        .status(500)
        .json({ success: false, error: "Gagal login, silakan coba lagi" });
    }
  });

  // =========================
  // PRODUCTS
  // =========================

  app.get("/api/services", authenticateToken, async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM services");

    res.json({
      success: true,
      data: rows,
    });
  });
  app.get("/api/products", async (req, res) => {
    const [rows] = await pool.query(
      `SELECT id, name, brand, type, capacity, price, stock, description, features, created_at, updated_at, 
              IF(image IS NOT NULL, CONCAT("data:image/jpeg;base64,", TO_BASE64(image)), NULL) as image 
       FROM products ORDER BY created_at DESC`,
    );

    // MySQL DECIMAL returns as string; convert price to Number for frontend
    const formattedRows = (rows as any[]).map((row) => ({
      ...row,
      price: Number(row.price) || 0,
      stock: Number(row.stock) || 0,
    }));

    res.json({ success: true, data: formattedRows });
  });

  // =========================
  // ADMIN PRODUCTS
  // =========================
  app.get("/api/admin/products", authenticateToken, async (req, res) => {
    const [rows] = await pool.query(
      'SELECT id, name, brand, type, capacity, price, stock, description, features, created_at, updated_at, IF(image IS NOT NULL, CONCAT("data:image/jpeg;base64,", TO_BASE64(image)), NULL) as image FROM products ORDER BY created_at DESC',
    );

    res.json({ success: true, data: rows });
  });

  app.post(
    "/api/admin/products",
    authenticateToken,
    upload.single("image"),
    async (req, res) => {
      const { name, brand, type, capacity, price, description } = req.body;
      const image = req.file ? req.file.buffer : null;

      await pool.query(
        "INSERT INTO products (id, name, brand, type, capacity, price, description, image) VALUES (UUID(),?,?,?,?,?,?,?)",
        [name, brand, type, capacity, price, description, image],
      );

      res.json({ success: true });
    },
  );

  app.put(
    "/api/admin/products/:id",
    authenticateToken,
    upload.single("image"),
    async (req, res) => {
      const { id } = req.params;
      const { name, brand, type, capacity, price, description } = req.body;
      const image = req.file ? req.file.buffer : null;

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
    },
  );

  app.delete("/api/admin/products/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;

    await pool.query("DELETE FROM products WHERE id=?", [id]);

    res.json({ success: true });
  });

  // =========================
  // ADMIN SERVICES
  // =========================
  app.get("/api/admin/services", authenticateToken, async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM services");

    res.json({ success: true, data: rows });
  });

  app.post("/api/admin/services", authenticateToken, async (req, res) => {
    const { name, price, description, icon } = req.body;

    await pool.query(
      "INSERT INTO services (name, price, description, icon) VALUES (?,?,?,?)",
      [name, price, description, icon],
    );

    res.json({ success: true });
  });

  app.put("/api/admin/services/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, price, description, icon } = req.body;

    await pool.query(
      "UPDATE services SET name=?, price=?, description=?, icon=? WHERE id=?",
      [name, price, description, icon, id],
    );

    res.json({ success: true });
  });

  app.delete("/api/admin/services/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;

    await pool.query("DELETE FROM services WHERE id=?", [id]);

    res.json({ success: true });
  });

  // =========================
  // MIDTRANS - CREATE SNAP TOKEN
  // =========================
  app.post(
    "/api/midtrans/snap-token",
    authenticateToken,
    async (req: any, res) => {
      const startTime = Date.now();
      try {
        const {
          price,
          quantity,
          productId,
          productName,
          items,
          customerName,
          phone,
          address,
        } = req.body;

        const user = req.user;
        const orderId = `ORD-${Date.now()}`;
        // price dari client sudah total keseluruhan (sum semua item.price * item.quantity)
        const totalPrice = Number(price);

        // Build item_details properly for Midtrans
        // If client sends `items` array, use it; otherwise fallback to single item
        let itemDetails: any[] = [];
        if (items && Array.isArray(items) && items.length > 0) {
          itemDetails = items.map((item: any) => ({
            id: String(item.id).substring(0, 50),
            price: Math.round(Number(item.price) || 0),
            quantity: Number(item.quantity) || 1,
            name: String(item.name).substring(0, 50),
          }));
        } else {
          // Fallback for backward compatibility
          itemDetails = [
            {
              id: String(productId).substring(0, 50),
              price: Math.round(totalPrice),
              quantity: 1,
              name: String(productName).substring(0, 50),
            },
          ];
        }

        // Validate that item_details sum matches gross_amount
        const calculatedTotal = itemDetails.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );

        if (calculatedTotal !== totalPrice) {
          console.warn("⚠️ Price mismatch:", {
            totalPrice,
            calculatedTotal,
            itemDetails,
          });
        }

        // Siapkan parameter untuk Midtrans
        const parameter: any = {
          transaction_details: {
            order_id: orderId,
            gross_amount: totalPrice,
          },
          customer_details: {
            first_name: customerName,
            phone: phone,
            email: user?.email || "customer@example.com",
          },
          item_details: itemDetails,
          // Enable specific payment methods (QRIS + Bank Transfer only - minimal for faster loading)
          enabled_payments: ["qris", "bank_transfer", "gopay"],
          // Set UI language to Indonesian
          ui_locales: "id",
        };

        // Generate Snap Token
        const tokenStartTime = Date.now();
        const transaction = await snap.createTransaction(parameter);
        const tokenDuration = Date.now() - tokenStartTime;
        const snapToken = transaction.token;

        console.log(`⏱️ Snap token creation took ${tokenDuration}ms`);

        // Save order ke database dengan status pending
        const dbStartTime = Date.now();
        await pool.query(
          `INSERT INTO orders
        (id, user_id, customer_name, phone, address, payment_method, total_price, order_status, midtrans_snap_token, midtrans_transaction_id, payment_status)
        VALUES (?,?,?,?,?,?,?, 'pending', ?, ?, 'pending')`,
          [
            orderId,
            user?.id || null,
            customerName,
            phone,
            address,
            "midtrans",
            totalPrice,
            snapToken,
            transaction.transaction_id,
          ],
        );
        const dbDuration = Date.now() - dbStartTime;

        // Save order items (insert each item from cart)
        if (items && Array.isArray(items) && items.length > 0) {
          for (const item of items) {
            await pool.query(
              `INSERT INTO order_items
            (order_id, item_type, item_id, item_name, quantity, price)
            VALUES (?,?,?,?,?,?)`,
              [
                orderId,
                "product",
                item.id,
                item.name,
                item.quantity || 1,
                item.price,
              ],
            );
          }
        } else {
          await pool.query(
            `INSERT INTO order_items
          (order_id, item_type, item_id, item_name, quantity, price)
          VALUES (?,?,?,?,?,?)`,
            [orderId, "product", productId, productName, quantity || 1, price],
          );
        }

        console.log(`⏱️ Database save took ${dbDuration}ms`);
        const totalDuration = Date.now() - startTime;

        console.log("✅ Snap Token created:", {
          orderId,
          totalPrice,
          totalDuration: `${totalDuration}ms`,
          breakdown: {
            tokenDuration: `${tokenDuration}ms`,
            dbDuration: `${dbDuration}ms`,
          },
        });

        res.json({
          success: true,
          orderId,
          snapToken,
          clientKey: process.env.MIDTRANS_CLIENT_KEY,
        });
      } catch (err: any) {
        const totalDuration = Date.now() - startTime;
        console.error(
          "❌ Error creating snap token after",
          totalDuration,
          "ms:",
          err,
        );
        res.status(500).json({
          success: false,
          error: "Gagal membuat token pembayaran",
          details: err.message,
        });
      }
    },
  );

  // =========================
  // HELPER: Update order status from Midtrans notification
  // =========================
  async function updateOrderFromMidtrans(
    orderId: string,
    transactionStatus: string,
    transactionId?: string,
  ) {
    // Map Midtrans status to database enum values
    let paymentStatus = "pending";
    let orderStatus = "pending";

    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      paymentStatus = "settlement";
      orderStatus = "processing";
    } else if (transactionStatus === "pending") {
      paymentStatus = "pending";
      orderStatus = "pending";
    } else if (transactionStatus === "deny") {
      paymentStatus = "deny";
      orderStatus = "cancelled";
    } else if (transactionStatus === "expire") {
      paymentStatus = "expire";
      orderStatus = "cancelled";
    } else if (transactionStatus === "cancel") {
      paymentStatus = "cancel";
      orderStatus = "cancelled";
    }

    await pool.query(
      `UPDATE orders
       SET payment_status = ?, order_status = ?, status = ?, midtrans_transaction_id = COALESCE(?, midtrans_transaction_id)
       WHERE id = ?`,
      [paymentStatus, orderStatus, orderStatus, transactionId, orderId],
    );

    console.log("✅ Order updated:", {
      orderId,
      paymentStatus,
      orderStatus,
      transactionId,
    });
    return { paymentStatus, orderStatus };
  }

  // =========================
  // MIDTRANS - WEBHOOK
  // =========================
  app.post("/api/midtrans/webhook", async (req, res) => {
    try {
      const notification = req.body;

      // Verify signature
      const orderId = notification.order_id;
      const statusCode = notification.status_code;
      const grossAmount = notification.gross_amount;
      const serverKey = process.env.MIDTRANS_SERVER_KEY;

      const signatureKey = notification.signature_key;
      const data = orderId + statusCode + grossAmount + serverKey;
      const hash = crypto.createHash("sha512").update(data).digest("hex");

      if (hash !== signatureKey) {
        console.log("❌ Invalid signature");
        return res
          .status(403)
          .json({ success: false, error: "Invalid signature" });
      }

      const transactionStatus = notification.transaction_status;

      console.log("📦 Webhook received:", {
        orderId,
        transactionStatus,
        paymentType: notification.payment_type,
      });

      await updateOrderFromMidtrans(
        orderId,
        transactionStatus,
        notification.transaction_id,
      );

      res.json({ success: true });
    } catch (err) {
      console.error("❌ Webhook error:", err);
      res.status(500).json({ success: false, error: "Webhook error" });
    }
  });

  // =========================
  app.post(
    "/api/midtrans/payment-callback",
    authenticateToken,
    async (req: any, res) => {
      try {
        const { orderId, transactionStatus, transactionId } = req.body;

        if (!orderId || !transactionStatus) {
          return res.status(400).json({
            success: false,
            error: "orderId dan transactionStatus diperlukan",
          });
        }

        console.log("📱 Frontend payment callback:", {
          orderId,
          transactionStatus,
          transactionId,
        });

        // Update order status (sama logic dengan webhook)
        const result = await updateOrderFromMidtrans(
          orderId,
          transactionStatus,
          transactionId,
        );

        res.json({ success: true, data: result });
      } catch (err: any) {
        console.error("❌ Payment callback error:", err);
        res
          .status(500)
          .json({ success: false, error: "Gagal update status pembayaran" });
      }
    },
  );

  // =========================
  // MIDTRANS - CHECK STATUS (Manual sync ke Midtrans API)
  // =========================
  app.post(
    "/api/midtrans/check-status",
    authenticateToken,
    async (req: any, res) => {
      try {
        const { orderId } = req.body;

        if (!orderId) {
          return res
            .status(400)
            .json({ success: false, error: "orderId diperlukan" });
        }

        console.log("🔍 Checking Midtrans status for:", orderId);

        // Get order from DB to find midtrans_transaction_id
        const [orderRows]: any = await pool.query(
          "SELECT midtrans_transaction_id, payment_status FROM orders WHERE id = ?",
          [orderId],
        );

        if (!orderRows.length) {
          return res
            .status(404)
            .json({ success: false, error: "Order tidak ditemukan" });
        }

        const order = orderRows[0];

        // If already paid, no need to check
        if (order.payment_status === "settlement") {
          return res.json({
            success: true,
            data: { status: "settlement", source: "database" },
          });
        }

        // If no transaction_id stored, order might be in pending snap token state (not yet transacted)
        if (!order.midtrans_transaction_id) {
          console.log(
            "⚠️ No transaction_id for order yet (still in snap token state)",
          );
          return res.json({
            success: true,
            data: {
              status: "pending",
              source: "database",
              message: "Order created but payment not yet initiated",
            },
          });
        }

        // Query Midtrans directly using Core API with TRANSACTION_ID (not order_id)
        const core = new midtransClient.CoreApi({
          isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
          serverKey: process.env.MIDTRANS_SERVER_KEY,
          clientKey: process.env.MIDTRANS_CLIENT_KEY,
        });

        let midtransStatus;
        try {
          // Use transaction_id for querying, not order_id
          midtransStatus = await core.transaction.status(
            order.midtrans_transaction_id,
          );
        } catch (midtransErr: any) {
          console.log("⚠️ Midtrans API error:", midtransErr.message);
          return res.status(500).json({
            success: false,
            error: "Gagal cek status ke Midtrans",
            details: midtransErr.message,
          });
        }

        console.log("📊 Midtrans status response:", midtransStatus);

        const transactionStatus = midtransStatus.transaction_status;
        const transactionId = midtransStatus.transaction_id;

        // Update database
        const result = await updateOrderFromMidtrans(
          orderId,
          transactionStatus,
          transactionId,
        );

        res.json({
          success: true,
          data: {
            midtransStatus: transactionStatus,
            updatedStatus: result,
            source: "midtrans_api",
          },
        });
      } catch (err: any) {
        console.error("❌ Check status error:", err);
        res
          .status(500)
          .json({ success: false, error: "Gagal cek status pembayaran" });
      }
    },
  );

  // =========================
  // CREATE ORDER (Legacy - tetap untuk backward compatibility)
  // =========================
  app.post("/api/orders", authenticateToken, async (req: any, res) => {
    const {
      price,
      quantity,
      productId,
      customerName,
      phone,
      address,
      paymentMethod,
    } = req.body;

    const user = req.user;
    const qty = Number(quantity || 1);
    const totalPrice = Number(price) * qty;

    try {
      const [productRows]: any = await pool.query(
        "SELECT name FROM products WHERE id=?",
        [productId],
      );

      if (!productRows.length) {
        return res.status(404).json({
          success: false,
          error: "Produk tidak ditemukan",
        });
      }

      const productName = productRows[0].name;
      const orderId = `ORD-${Date.now()}`;

      await pool.query(
        `INSERT INTO orders 
        (id, user_id, customer_name, phone, address, payment_method, total_price, order_status)
        VALUES (?,?,?,?,?,?,?, 'pending')`,
        [
          orderId,
          user?.id || null,
          customerName,
          phone,
          address,
          paymentMethod,
          totalPrice,
        ],
      );

      await pool.query(
        `INSERT INTO order_items 
        (order_id, item_type, item_id, item_name, quantity, price)
        VALUES (?,?,?,?,?,?)`,
        [orderId, "product", productId, productName, qty, price],
      );

      res.json({ success: true, orderId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: "Gagal membuat order" });
    }
  });

  // =========================
  // USER ORDERS
  // =========================
  app.get("/api/user/orders", authenticateToken, async (req: any, res) => {
    try {
      const user = req.user;

      if (!user?.id) {
        return res
          .status(401)
          .json({ success: false, error: "User tidak teridentifikasi" });
      }

      const [rows]: any = await pool.query(
        `SELECT o.id, o.customer_name, o.phone, o.address, o.payment_method, 
                o.order_status as status, COALESCE(o.payment_status, 'pending') as payment_status, o.total_price as price, o.created_at,
                GROUP_CONCAT(oi.item_name SEPARATOR ', ') as product_name,
                SUM(oi.quantity) as quantity,
                u.name as assigned_teknisi
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN users u ON o.teknisi_id = u.id
         WHERE o.user_id = ?
         GROUP BY o.id
         ORDER BY o.created_at DESC`,
        [user.id],
      );

      const formattedData = rows.map((order: any) => ({
        id: order.id,
        customer_name: order.customer_name,
        phone: order.phone,
        address: order.address,
        payment_method: order.payment_method,
        status: order.status,
        payment_status: order.payment_status,
        product_name: order.product_name || "N/A",
        quantity: Number(order.quantity) || 0,
        price: Number(order.price) || 0,
        created_at: order.created_at,
        assigned_teknisi: order.assigned_teknisi || null,
      }));

      console.log("✅ User Orders fetched:", {
        userId: user.id,
        count: formattedData.length,
      });

      res.json({ success: true, data: formattedData });
    } catch (err) {
      console.error("❌ Error fetching user orders:", err);
      res
        .status(500)
        .json({ success: false, error: "Gagal mengambil pesanan" });
    }
  });

  // =========================
  // ADMIN STATS (FIXED)
  // =========================
  app.get("/api/admin/stats", authenticateToken, async (req, res) => {
    try {
      // Total orders (semua order tanpa filter)
      const [orders]: any = await pool.query(
        "SELECT COUNT(*) as total FROM orders",
      );

      const [users]: any = await pool.query(
        "SELECT COUNT(*) as total FROM users",
      );

      // Pending orders
      const [pending]: any = await pool.query(
        "SELECT COUNT(*) as total FROM orders WHERE order_status='pending'",
      );

      const [products]: any = await pool.query(
        "SELECT COUNT(*) as total FROM products",
      );

      // Total revenue dari semua order (bukan hanya settlement)
      const [revenue]: any = await pool.query(
        "SELECT COALESCE(SUM(total_price),0) as total FROM orders",
      );

      const statsData = {
        totalOrders: Number(orders[0]?.total || 0),
        totalUsers: Number(users[0]?.total || 0),
        pendingOrders: Number(pending[0]?.total || 0),
        totalProducts: Number(products[0]?.total || 0),
        totalRevenue: Number(revenue[0]?.total || 0),
      };

      console.log("✅ Admin Stats:", statsData);

      res.json({
        success: true,
        data: statsData,
      });
    } catch (err) {
      console.error("❌ Error fetching admin stats:", err);
      res
        .status(500)
        .json({ success: false, error: "Gagal mengambil statistik" });
    }
  });

  // =========================
  // ADMIN DETAILED REPORTS
  // =========================
  app.get(
    "/api/admin/reports/detailed",
    authenticateToken,
    async (req, res) => {
      try {
        // Monthly revenue (last 12 months)
        const [monthlyRevenue]: any = await pool.query(
          `SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          DATE_FORMAT(created_at, '%b %Y') as monthLabel,
          COALESCE(SUM(total_price), 0) as revenue,
          COUNT(*) as order_count
         FROM orders
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
         GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y')
         ORDER BY month ASC`,
        );

        // Top products
        const [topProducts]: any = await pool.query(
          `SELECT 
          p.id, p.name, p.brand, p.capacity,
          COUNT(oi.id) as total_quantity,
          SUM(oi.price * oi.quantity) as total_revenue
         FROM products p
         LEFT JOIN order_items oi ON p.id = oi.item_id AND oi.item_type = 'product'
         GROUP BY p.id
         ORDER BY total_quantity DESC
         LIMIT 10`,
        );

        // Top teknisi (most assigned)
        const [topTeknisi]: any = await pool.query(
          `SELECT 
          u.id, u.name,
          COUNT(o.id) as total_assigned,
          SUM(CASE WHEN o.order_status = 'completed' THEN 1 ELSE 0 END) as completed_orders
         FROM users u
         LEFT JOIN orders o ON u.id = o.teknisi_id
         WHERE u.role = 'teknisi'
         GROUP BY u.id
         ORDER BY total_assigned DESC
         LIMIT 10`,
        );

        // Financial breakdown
        const [financialBreakdown]: any = await pool.query(
          `SELECT 
          COALESCE(payment_status, 'unknown') as status,
          COUNT(*) as order_count,
          COALESCE(SUM(total_price), 0) as total_amount
         FROM orders
         GROUP BY payment_status`,
        );

        // Order status breakdown
        const [orderStatusBreakdown]: any = await pool.query(
          `SELECT 
          order_status,
          COUNT(*) as count
         FROM orders
         GROUP BY order_status`,
        );

        res.json({
          success: true,
          data: {
            monthlyRevenue: monthlyRevenue.map((row: any) => ({
              month: row.month,
              monthLabel: row.monthLabel,
              revenue: Number(row.revenue) || 0,
              orderCount: Number(row.order_count) || 0,
            })),
            topProducts: topProducts.map((row: any) => ({
              id: row.id,
              name: row.name,
              brand: row.brand,
              capacity: row.capacity,
              quantity: Number(row.total_quantity) || 0,
              revenue: Number(row.total_revenue) || 0,
            })),
            topTeknisi: topTeknisi.map((row: any) => ({
              id: row.id,
              name: row.name,
              assigned: Number(row.total_assigned) || 0,
              completed: Number(row.completed_orders) || 0,
            })),
            financialBreakdown: financialBreakdown.map((row: any) => ({
              status: row.status,
              orderCount: Number(row.order_count) || 0,
              totalAmount: Number(row.total_amount) || 0,
            })),
            orderStatusBreakdown: orderStatusBreakdown.map((row: any) => ({
              status: row.order_status,
              count: Number(row.count) || 0,
            })),
          },
        });
      } catch (err) {
        console.error("❌ Error fetching detailed reports:", err);
        res
          .status(500)
          .json({ success: false, error: "Gagal mengambil laporan detail" });
      }
    },
  );

  // =========================
  // ADMIN USERS
  // =========================
  app.get("/api/admin/users", authenticateToken, async (req, res) => {
    const [rows] = await pool.query(
      "SELECT id, username, name, role FROM users ORDER BY id DESC",
    );

    res.json({ success: true, data: rows });
  });

  app.post("/api/admin/users", authenticateToken, async (req, res) => {
    const { username, password, name, role } = req.body;

    const [exists]: any = await pool.query(
      "SELECT id FROM users WHERE username=?",
      [username],
    );

    if (exists.length) {
      return res
        .status(400)
        .json({ success: false, error: "Username sudah dipakai" });
    }

    // Hash password sebelum insert
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (username,password,name,role) VALUES (?,?,?,?)",
      [username, hashedPassword, name, role],
    );

    res.json({ success: true });
  });

  app.put("/api/admin/users/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { username, password, name, role } = req.body;

    try {
      let query = "UPDATE users SET username=?, name=?, role=? WHERE id=?";
      let params = [username, name, role, id];

      if (password) {
        // Hash password sebelum update
        const hashedPassword = await bcrypt.hash(password, 10);
        query =
          "UPDATE users SET username=?, password=?, name=?, role=? WHERE id=?";
        params = [username, hashedPassword, name, role, id];
      }

      await pool.query(query, params);

      res.json({ success: true });
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ success: false, error: "Gagal mengupdate user" });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;

    await pool.query("DELETE FROM users WHERE id=?", [id]);

    res.json({ success: true });
  });

  // =========================
  // ADMIN TEKNISI
  // =========================
  app.get("/api/admin/teknisi", authenticateToken, async (req, res) => {
    const [rows] = await pool.query(
      "SELECT id, username, name FROM users WHERE role='teknisi' ORDER BY id DESC",
    );

    res.json({ success: true, data: rows });
  });

  // =========================
  // ADMIN ORDERS
  // =========================
  app.get("/api/admin/orders", authenticateToken, async (req, res) => {
    try {
      const [rows]: any = await pool.query(
        `SELECT o.id, o.customer_name, o.phone, o.address, o.payment_method, 
                o.order_status as status, COALESCE(o.payment_status, 'pending') as payment_status, o.total_price, o.created_at, o.teknisi_id,
                GROUP_CONCAT(oi.item_name SEPARATOR ', ') as product_name,
                SUM(oi.quantity) as total_quantity
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         GROUP BY o.id
         ORDER BY o.created_at DESC`,
      );

      const formattedData = rows.map((order: any) => ({
        id: order.id,
        customer_name: order.customer_name,
        phone: order.phone,
        address: order.address,
        payment_method: order.payment_method,
        status: order.status,
        payment_status: order.payment_status,
        total_price: Number(order.total_price) || 0,
        price: Number(order.total_price) || 0,
        product_name: order.product_name || "N/A",
        total_quantity: Number(order.total_quantity) || 0,
        created_at: order.created_at,
        teknisi_id: order.teknisi_id || null,
      }));

      console.log("Admin Orders:", formattedData);

      res.json({ success: true, data: formattedData });
    } catch (err) {
      console.error("Error fetching admin orders:", err);
      res
        .status(500)
        .json({ success: false, error: "Gagal mengambil pesanan" });
    }
  });

  // =========================
  // UPDATE STATUS
  // =========================
  app.put(
    "/api/admin/orders/:id/status",
    authenticateToken,
    async (req, res) => {
      try {
        const { status } = req.body;
        const { id } = req.params;

        const allowed = ["pending", "processing", "completed", "cancelled"];

        if (!allowed.includes(status)) {
          return res
            .status(400)
            .json({ success: false, error: "Status tidak valid" });
        }

        await pool.query("UPDATE orders SET order_status=? WHERE id=?", [
          status,
          id,
        ]);

        console.log("Order status updated:", { id, status });

        res.json({ success: true });
      } catch (err) {
        console.error("Error updating order status:", err);
        res
          .status(500)
          .json({ success: false, error: "Gagal mengupdate status" });
      }
    },
  );

  // =========================
  // DELETE ORDER
  // =========================
  app.delete("/api/admin/orders/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      await pool.query("DELETE FROM orders WHERE id=?", [id]);

      console.log("Order deleted:", id);

      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting order:", err);
      res
        .status(500)
        .json({ success: false, error: "Gagal menghapus pesanan" });
    }
  });

  // =========================
  // TEKNISI
  // =========================
  app.get("/api/teknisi/jadwal", authenticateToken, async (req, res) => {
    try {
      const [rows]: any = await pool.query(
        `SELECT o.id, o.customer_name, o.phone, o.address, o.order_status as status, o.created_at,
                GROUP_CONCAT(oi.item_name SEPARATOR ', ') as product_name
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.order_status NOT IN ('completed', 'cancelled')
         GROUP BY o.id
         ORDER BY o.created_at DESC`,
      );

      const formattedData = rows.map((row: any) => ({
        id: row.id,
        customer_name: row.customer_name,
        phone: row.phone,
        address: row.address,
        status: row.status,
        product_name: row.product_name || "N/A",
        created_at: row.created_at,
      }));

      res.json({ success: true, data: formattedData });
    } catch (err) {
      console.error("❌ Error fetching jadwal:", err);
      res.status(500).json({ success: false, error: "Gagal memuat jadwal" });
    }
  });

  // Endpoint untuk teknisi update status order
  app.put(
    "/api/teknisi/orders/:id/status",
    authenticateToken,
    async (req, res) => {
      try {
        const { status } = req.body;
        const { id } = req.params;

        const allowed = ["pending", "processing", "completed", "cancelled"];

        if (!allowed.includes(status)) {
          console.warn("❌ Invalid status:", status);
          return res
            .status(400)
            .json({ success: false, error: "Status tidak valid" });
        }

        console.log("🔄 Updating order status:", { id, status });

        const [result]: any = await pool.query(
          "UPDATE orders SET order_status=? WHERE id=?",
          [status, id],
        );

        console.log("📊 Update result:", { affectedRows: result.affectedRows });

        if (result.affectedRows === 0) {
          console.warn("❌ Order not found:", id);
          return res
            .status(404)
            .json({ success: false, error: "Order tidak ditemukan" });
        }

        console.log("✅ Teknisi updated order status:", { id, status });

        res.json({ success: true, message: "Status berhasil diperbarui" });
      } catch (err) {
        console.error("❌ Error updating teknisi order status:", err);
        res
          .status(500)
          .json({ success: false, error: "Gagal mengupdate status" });
      }
    },
  );

  app.put(
    "/api/admin/orders/:id/assign",
    authenticateToken,
    async (req, res) => {
      try {
        const { teknisi_id } = req.body;
        const { id } = req.params;

        if (!teknisi_id) {
          return res
            .status(400)
            .json({ success: false, error: "Teknisi ID diperlukan" });
        }

        await pool.query("UPDATE orders SET teknisi_id=? WHERE id=?", [
          teknisi_id,
          id,
        ]);

        console.log("Teknisi assigned:", { id, teknisi_id });

        res.json({ success: true });
      } catch (err) {
        console.error("Error assigning teknisi:", err);
        res
          .status(500)
          .json({ success: false, error: "Gagal menugaskan teknisi" });
      }
    },
  );

  // =========================
  // START
  // =========================
  // Get local IP address
  const getLocalIp = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
    return "localhost";
  };

  const localIp = getLocalIp();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on:`);
    console.log(`   Local: http://localhost:${PORT}`);
    console.log(`   Network: http://${localIp}:${PORT}`);
  });
}

startServer();
