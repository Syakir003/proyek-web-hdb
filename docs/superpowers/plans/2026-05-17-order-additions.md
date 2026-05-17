# Order Additions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a system allowing technicians/customers to request additional materials or services after an order is paid, with admin review, customer approval via token link, flexible payment, and professional A4 invoice generation.

**Architecture:** Three new DB tables added via server.ts migrations. All API routes added inside `startServer()` in server.ts following existing patterns. Four new React pages/components. Existing admin, teknisi, and customer pages extended minimally.

**Tech Stack:** Express + MySQL (server.ts), React 19 + TypeScript + Tailwind CSS 4, Midtrans (payment), wa.me links (WA notifications), HTML print dialog (invoice PDF)

**Spec:** `docs/superpowers/specs/2026-05-17-order-additions-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `server.ts` | Modify | DB migrations + all API routes |
| `src/types/additions.ts` | Create | Shared TypeScript interfaces |
| `src/pages/admin/AdminMaterialCatalog.tsx` | Create | Admin CRUD for material catalog |
| `src/pages/admin/AdminAdditions.tsx` | Create | Admin review + invoice send panel |
| `src/pages/admin/AdminLayout.tsx` | Modify | Register 2 new admin tabs |
| `src/pages/admin/AdminSidebar.tsx` | Modify | Add 2 new menu items |
| `src/components/OrderAdditionForm.tsx` | Create | Form for teknisi to submit additions |
| `src/pages/teknisi/TeknisiDashboard.tsx` | Modify | Add "Tambah Material/Jasa" button |
| `src/pages/CustomerAdditionApproval.tsx` | Create | Public approval page (no login) |
| `src/pages/InvoiceView.tsx` | Create | Printable A4 invoice (no login) |
| `src/pages/UserOrders.tsx` | Modify | Addition notification badge |
| `src/App.tsx` | Modify | Routes for /tambahan/:token, /invoice/:token |

---

### Task 1: Shared TypeScript Types

**Files:**
- Create: `src/types/additions.ts`

- [ ] **Step 1: Create types file**

```typescript
// src/types/additions.ts
export type OrderAdditionStatus =
  | 'pending_admin'
  | 'admin_approved'
  | 'admin_rejected'
  | 'pending_customer'
  | 'customer_approved'
  | 'customer_rejected'
  | 'paid'
  | 'cancelled';

export interface MaterialCatalogItem {
  id: number;
  name: string;
  unit: string;
  price: number;
  category: string;
  is_active: boolean;
}

export interface AdditionItemInput {
  item_type: 'material' | 'service';
  ref_id: string;
  quantity: number;
}

export interface OrderAdditionItem {
  id: number;
  item_type: 'material' | 'service';
  ref_id: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface OrderAddition {
  id: number;
  order_id: string;
  initiated_by: 'teknisi' | 'customer';
  initiated_by_id: number;
  status: OrderAdditionStatus;
  admin_notes: string | null;
  payment_method: 'cash' | 'online' | null;
  payment_status: 'pending' | 'paid' | null;
  customer_token: string | null;
  invoice_number: string | null;
  invoice_sent_at: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderAdditionItem[];
  total?: number;
  // joined from orders/users
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  teknisi_name?: string;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/types/additions.ts
git commit -m "feat: add shared TypeScript types for order additions"
```

---

### Task 2: Database Migrations

**Files:**
- Modify: `server.ts` (inside `testDB()` function, after existing migrations)

- [ ] **Step 1: Add migrations inside `testDB()` in server.ts**

Find the closing `}` of `testDB()` (currently ends around the `team` table migration). Add before it:

```typescript
  // ── ORDER ADDITIONS ─────────────────────────────────────────────────
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
```

- [ ] **Step 2: Restart server and verify tables created**

Run: `npm run server`
Expected: server starts, no SQL errors in console

- [ ] **Step 3: Commit**

```bash
git add server.ts
git commit -m "feat: add DB migrations for material_catalog, order_additions, order_addition_items"
```

---

### Task 3: Material Catalog API

**Files:**
- Modify: `server.ts` (add routes inside `startServer()`, after existing routes)

- [ ] **Step 1: Add material catalog routes to server.ts**

Add inside `startServer()`, before `app.listen(...)`:

```typescript
  // ── MATERIAL CATALOG ────────────────────────────────────────────────

  // GET /api/material-catalog — semua item aktif (admin & teknisi)
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

  // POST /api/material-catalog — tambah item (admin)
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

  // PUT /api/material-catalog/:id — edit item (admin)
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

  // PATCH /api/material-catalog/:id/toggle — aktif/nonaktif (admin)
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
```

- [ ] **Step 2: Test endpoints with curl**

```bash
# Harus 401 (no token)
curl http://localhost:5000/api/material-catalog

# Login dulu untuk dapatkan token admin, lalu:
curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/material-catalog
# Expected: { success: true, data: [] }

curl -X POST http://localhost:5000/api/material-catalog \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Pipa AC 1/4\"","unit":"meter","price":50000,"category":"Pipa"}'
# Expected: { success: true, data: { id: 1 } }
```

- [ ] **Step 3: Verify lint**

Run: `npm run lint`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add server.ts
git commit -m "feat: add material catalog CRUD API endpoints"
```

---

### Task 4: Order Additions API — Create

**Files:**
- Modify: `server.ts`

- [ ] **Step 1: Add helper function for computing addition total**

Add before `startServer()` in server.ts:

```typescript
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
```

- [ ] **Step 2: Add create endpoint inside `startServer()`**

```typescript
  // ── ORDER ADDITIONS ──────────────────────────────────────────────────

  // POST /api/orders/:orderId/additions — buat pengajuan (teknisi atau customer)
  app.post('/api/orders/:orderId/additions', authenticateToken, async (req: any, res) => {
    const { orderId } = req.params;
    const { items } = req.body as { items: Array<{ item_type: 'material'|'service'; ref_id: string; quantity: number }> };
    if (!items?.length) {
      return res.status(400).json({ success: false, message: 'items tidak boleh kosong' });
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Pastikan order ada
      const [orderRows]: any = await conn.query('SELECT id FROM orders WHERE id=?', [orderId]);
      if (!orderRows.length) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
      }

      // Resolve setiap item — ambil nama & harga dari katalog/services
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
```

- [ ] **Step 3: Verify lint and commit**

Run: `npm run lint`
Expected: no errors

```bash
git add server.ts
git commit -m "feat: add order addition create endpoint"
```

---

### Task 5: Order Additions API — Admin Review

**Files:**
- Modify: `server.ts`

- [ ] **Step 1: Add admin list + review endpoints**

```typescript
  // GET /api/order-additions — list semua (admin)
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
      // attach items + total for each
      const result = await Promise.all(rows.map(async (row: any) => {
        const [items]: any = await pool.query(
          'SELECT * FROM order_addition_items WHERE order_addition_id=?', [row.id]
        );
        const total = items.reduce((s: number, i: any) => s + Number(i.subtotal), 0);
        return { ...row, items, total };
      }));
      res.json({ success: true, data: result });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal mengambil data' });
    }
  });

  // PATCH /api/order-additions/:id/admin-review — admin approve/reject
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
        const approvalUrl = `${process.env.BASE_URL || 'http://localhost:5173'}/tambahan/${token}`;
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
```

- [ ] **Step 2: Verify lint and commit**

Run: `npm run lint`

```bash
git add server.ts
git commit -m "feat: add admin review endpoints for order additions"
```

---

### Task 6: Order Additions API — Customer Approval

**Files:**
- Modify: `server.ts`

- [ ] **Step 1: Add customer token endpoints**

```typescript
  // GET /api/order-additions/token/:token — lihat via link publik (tanpa auth)
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

  // PATCH /api/order-additions/:id/customer-response — customer approve/reject
  app.patch('/api/order-additions/:id/customer-response', async (req, res) => {
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
        return res.json({ success: true, status: 'customer_approved', payment_method: 'cash' });
      }
      // Online payment — buat Midtrans snap token
      res.json({ success: true, status: 'customer_approved', payment_method: 'online', needsPayment: true });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal memproses respon' });
    }
  });
```

- [ ] **Step 2: Verify lint and commit**

Run: `npm run lint`

```bash
git add server.ts
git commit -m "feat: add customer token approval endpoints"
```

---

### Task 7: Order Additions API — Midtrans Payment

**Files:**
- Modify: `server.ts`

- [ ] **Step 1: Add payment endpoint + extend Midtrans webhook**

```typescript
  // POST /api/order-additions/:id/payment — inisiasi bayar online
  app.post('/api/order-additions/:id/payment', async (req, res) => {
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
      const transaction = await snap.createTransaction({
        transaction_details: { order_id: midtransOrderId, gross_amount: Math.round(total) },
        customer_details: { first_name: add.customer_name, phone: add.phone },
        item_details: items.map((i: any) => ({
          id: `${i.item_type}-${i.ref_id}`,
          price: Math.round(Number(i.unit_price)),
          quantity: Math.round(Number(i.quantity)),
          name: i.name,
        })),
      });

      await pool.query(
        `UPDATE order_additions SET status='customer_approved', payment_method='online',
         payment_status='pending', updated_at=NOW() WHERE id=?`,
        [add.id]
      );

      res.json({ success: true, snapToken: transaction.token, redirectUrl: transaction.redirect_url });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal membuat transaksi' });
    }
  });
```

- [ ] **Step 2: Extend existing Midtrans webhook to handle ADD- prefix**

Find the existing `app.post('/api/midtrans/webhook', ...)` handler. Inside it, after the existing `orderId` parsing, add:

```typescript
      // Tangani payment untuk order additions (prefix ADD-)
      if (orderId.startsWith('ADD-')) {
        const additionId = orderId.split('-')[1];
        if (['capture','settlement'].includes(notification.transaction_status)) {
          await pool.query(
            `UPDATE order_additions SET payment_status='paid', status='paid', updated_at=NOW() WHERE id=?`,
            [additionId]
          );
        }
        return res.json({ success: true });
      }
      // ... lanjut ke handler order biasa yang sudah ada
```

- [ ] **Step 3: Verify lint and commit**

Run: `npm run lint`

```bash
git add server.ts
git commit -m "feat: add Midtrans payment for order additions"
```

---

### Task 8: Order Additions API — Teknisi Actions + Invoice

**Files:**
- Modify: `server.ts`

- [ ] **Step 1: Add teknisi action endpoints**

```typescript
  // GET /api/order-additions/my — milik teknisi yg login
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

  // PATCH /api/order-additions/:id/revise — revisi item
  app.patch('/api/order-additions/:id/revise', authenticateToken, requireTeknisi, async (req: any, res) => {
    const { items } = req.body as { items: Array<{ item_type: 'material'|'service'; ref_id: string; quantity: number }> };
    if (!items?.length) return res.status(400).json({ success: false, message: 'items kosong' });
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
        const table = item.item_type === 'material' ? 'material_catalog' : 'services';
        const col = item.item_type === 'material' ? 'price' : 'price';
        const [iRows]: any = await conn.query(`SELECT name, unit, ${col} as price FROM ${table} WHERE id=?`, [item.ref_id]);
        if (!iRows.length) { await conn.rollback(); return res.status(400).json({ success: false, message: `Item ${item.ref_id} tidak ditemukan` }); }
        const i = iRows[0];
        await conn.query(
          `INSERT INTO order_addition_items (order_addition_id, item_type, ref_id, name, unit, quantity, unit_price, subtotal)
           VALUES (?,?,?,?,?,?,?,?)`,
          [req.params.id, item.item_type, item.ref_id, i.name, i.unit || 'unit', item.quantity, Number(i.price), Number(i.price)*item.quantity]
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

  // PATCH /api/order-additions/:id/escalate — eskalasi ke admin
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

  // PATCH /api/order-additions/:id/cancel — batalkan
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
```

- [ ] **Step 2: Add invoice endpoints**

```typescript
  // GET /api/order-additions/token/:token/invoice-data — data invoice publik
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
         WHERE oa.customer_token=? AND oa.status='paid'
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

  // POST /api/order-additions/:id/send-invoice — admin generate + kirim invoice
  app.post('/api/order-additions/:id/send-invoice', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const [rows]: any = await pool.query(
        `SELECT oa.*, o.customer_name, o.phone, SUM(oai.subtotal) as total
         FROM order_additions oa JOIN orders o ON oa.order_id = o.id
         JOIN order_addition_items oai ON oai.order_addition_id = oa.id
         WHERE oa.id=? AND oa.status='paid'
         GROUP BY oa.id`,
        [req.params.id]
      );
      if (!rows.length) return res.status(404).json({ success: false, message: 'Data tidak ditemukan atau belum paid' });
      const add = rows[0];

      // Generate nomor invoice jika belum ada
      let invoiceNumber = add.invoice_number;
      if (!invoiceNumber) {
        const now = new Date();
        const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
        const [cntRows]: any = await pool.query(
          `SELECT COUNT(*) as cnt FROM order_additions WHERE invoice_number IS NOT NULL AND DATE_FORMAT(invoice_sent_at,'%Y-%m')=?`,
          [ym]
        );
        const seq = Number(cntRows[0].cnt) + 1;
        invoiceNumber = `INV-${ym}-${String(seq).padStart(4,'0')}`;
      }

      await pool.query(
        `UPDATE order_additions SET invoice_number=?, invoice_sent_at=NOW(), updated_at=NOW() WHERE id=?`,
        [invoiceNumber, req.params.id]
      );

      const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
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
```

- [ ] **Step 3: Verify lint and commit**

Run: `npm run lint`

```bash
git add server.ts
git commit -m "feat: add teknisi actions and invoice generation API"
```

---

### Task 9: AdminMaterialCatalog.tsx

**Files:**
- Create: `src/pages/admin/AdminMaterialCatalog.tsx`

- [ ] **Step 1: Create component**

```tsx
// src/pages/admin/AdminMaterialCatalog.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight, X, Check } from 'lucide-react';

interface Item {
  id: number; name: string; unit: string;
  price: number; category: string; is_active: boolean;
}
const EMPTY: Omit<Item,'id'|'is_active'> = { name:'', unit:'pcs', price:0, category:'' };

export default function AdminMaterialCatalog({ token }: { token: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [modal, setModal] = useState<{ open: boolean; editing: Item | null }>({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchItems = async () => {
    setLoading(true);
    const r = await fetch('/api/material-catalog', { headers });
    const d = await r.json();
    if (d.success) setItems(d.data);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, editing: null }); };
  const openEdit = (item: Item) => {
    setForm({ name: item.name, unit: item.unit, price: item.price, category: item.category });
    setModal({ open: true, editing: item });
  };

  const save = async () => {
    if (!form.name || !form.unit || !form.price) return alert('Nama, satuan, dan harga wajib diisi');
    const method = modal.editing ? 'PUT' : 'POST';
    const url = modal.editing ? `/api/material-catalog/${modal.editing.id}` : '/api/material-catalog';
    await fetch(url, { method, headers, body: JSON.stringify(form) });
    setModal({ open: false, editing: null });
    fetchItems();
  };

  const toggle = async (id: number) => {
    await fetch(`/api/material-catalog/${id}/toggle`, { method: 'PATCH', headers });
    fetchItems();
  };

  const formatRp = (n: number) => new Intl.NumberFormat('id-ID',{ style:'currency', currency:'IDR', maximumFractionDigits:0 }).format(n);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Katalog Material & Sparepart</h2>
        <button onClick={openAdd} className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-sky-600 transition-colors">
          <Plus className="w-4 h-4" /> Tambah Item
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Memuat...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Nama', 'Kategori', 'Satuan', 'Harga', 'Status', 'Aksi'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                  <td className="px-4 py-3 text-slate-500">{item.category || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                  <td className="px-4 py-3 font-semibold text-sky-600">{formatRp(item.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${item.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggle(item.id)} className={`p-1.5 rounded-lg transition-colors ${item.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}>
                        {item.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && <div className="text-center py-12 text-slate-400">Belum ada item</div>}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">{modal.editing ? 'Edit Item' : 'Tambah Item'}</h3>
              <button onClick={() => setModal({ open: false, editing: null })} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Nama Material', key: 'name', type: 'text', placeholder: 'Pipa AC 1/4"' },
                { label: 'Kategori', key: 'category', type: 'text', placeholder: 'Pipa, Freon, Bracket...' },
                { label: 'Satuan', key: 'unit', type: 'text', placeholder: 'meter, pcs, roll' },
                { label: 'Harga Satuan (Rp)', key: 'price', type: 'number', placeholder: '50000' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-400"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal({ open: false, editing: null })} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl font-medium hover:bg-slate-50">Batal</button>
              <button onClick={save} className="flex-1 bg-sky-500 text-white py-2.5 rounded-xl font-medium hover:bg-sky-600 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify lint and commit**

Run: `npm run lint`

```bash
git add src/pages/admin/AdminMaterialCatalog.tsx
git commit -m "feat: add AdminMaterialCatalog component"
```

---

### Task 10: AdminAdditions.tsx

**Files:**
- Create: `src/pages/admin/AdminAdditions.tsx`

- [ ] **Step 1: Create component**

```tsx
// src/pages/admin/AdminAdditions.tsx
import React, { useState, useEffect } from 'react';
import { Check, X, Send, ExternalLink, RefreshCw } from 'lucide-react';
import { OrderAddition } from '../../types/additions';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending_admin:      { label: 'Menunggu Review', color: 'bg-amber-50 text-amber-600' },
  admin_approved:     { label: 'Disetujui Admin', color: 'bg-sky-50 text-sky-600' },
  admin_rejected:     { label: 'Ditolak Admin', color: 'bg-red-50 text-red-600' },
  pending_customer:   { label: 'Menunggu Customer', color: 'bg-blue-50 text-blue-600' },
  customer_approved:  { label: 'Disetujui Customer', color: 'bg-teal-50 text-teal-600' },
  customer_rejected:  { label: 'Ditolak Customer', color: 'bg-orange-50 text-orange-600' },
  paid:               { label: 'Lunas', color: 'bg-emerald-50 text-emerald-600' },
  cancelled:          { label: 'Dibatalkan', color: 'bg-slate-100 text-slate-400' },
};

export default function AdminAdditions({ token }: { token: string }) {
  const [additions, setAdditions] = useState<OrderAddition[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [reviewModal, setReviewModal] = useState<{ open: boolean; id: number | null; action: 'approve'|'reject' }>({ open: false, id: null, action: 'approve' });
  const [adminNotes, setAdminNotes] = useState('');
  const [waLink, setWaLink] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const fmt = (n: number) => new Intl.NumberFormat('id-ID',{ style:'currency',currency:'IDR',maximumFractionDigits:0 }).format(n);

  const fetchAdditions = async () => {
    setLoading(true);
    const r = await fetch('/api/order-additions', { headers });
    const d = await r.json();
    if (d.success) setAdditions(d.data);
    setLoading(false);
  };

  useEffect(() => { fetchAdditions(); }, []);

  const submitReview = async () => {
    if (!reviewModal.id) return;
    const r = await fetch(`/api/order-additions/${reviewModal.id}/admin-review`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ action: reviewModal.action, admin_notes: adminNotes }),
    });
    const d = await r.json();
    if (d.success && d.waLink) setWaLink(d.waLink);
    setReviewModal({ open: false, id: null, action: 'approve' });
    setAdminNotes('');
    fetchAdditions();
  };

  const sendInvoice = async (id: number) => {
    const r = await fetch(`/api/order-additions/${id}/send-invoice`, { method: 'POST', headers });
    const d = await r.json();
    if (d.success) {
      setWaLink(d.waLink);
      fetchAdditions();
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Penambahan Material & Jasa</h2>
        <button onClick={fetchAdditions} className="flex items-center gap-2 text-slate-500 hover:text-sky-600 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* WA Link Banner */}
      {waLink && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-emerald-700 text-sm font-medium">Link WA siap dikirim ke customer</span>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-600">
            <ExternalLink className="w-3.5 h-3.5" /> Buka WA
          </a>
        </div>
      )}

      {loading ? <div className="text-center py-16 text-slate-400">Memuat...</div> : (
        <div className="space-y-4">
          {!additions.length && <div className="text-center py-16 text-slate-400">Belum ada penambahan</div>}
          {additions.map(add => {
            const st = STATUS_LABEL[add.status] || { label: add.status, color: 'bg-slate-100 text-slate-500' };
            const isExpanded = expanded === add.id;
            return (
              <div key={add.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(isExpanded ? null : add.id)}>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${st.color}`}>{st.label}</span>
                    <span className="font-semibold text-slate-800">{add.customer_name}</span>
                    <span className="text-slate-400 text-sm">Order #{add.order_id}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sky-600">{fmt(add.total ?? 0)}</span>
                    <span className="text-slate-400 text-xs">{new Date(add.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4">
                    <table className="w-full text-sm mb-4">
                      <thead><tr className="text-slate-500 text-left">{['Item','Tipe','Qty','Satuan','Harga','Subtotal'].map(h=><th key={h} className="pb-2 pr-4">{h}</th>)}</tr></thead>
                      <tbody>
                        {(add.items||[]).map((it,i) => (
                          <tr key={i} className="border-t border-slate-50">
                            <td className="py-1.5 pr-4 font-medium">{it.name}</td>
                            <td className="pr-4"><span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{it.item_type}</span></td>
                            <td className="pr-4">{it.quantity}</td>
                            <td className="pr-4 text-slate-500">{it.unit}</td>
                            <td className="pr-4">{fmt(it.unit_price)}</td>
                            <td className="font-semibold text-sky-600">{fmt(it.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {add.admin_notes && <p className="text-sm text-slate-500 mb-3">Catatan: {add.admin_notes}</p>}
                    <div className="flex gap-2 flex-wrap">
                      {add.status === 'pending_admin' && (<>
                        <button onClick={() => { setReviewModal({ open:true, id:add.id, action:'approve' }); setAdminNotes(''); }} className="flex items-center gap-1.5 bg-sky-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-sky-600">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => { setReviewModal({ open:true, id:add.id, action:'reject' }); setAdminNotes(''); }} className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100">
                          <X className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </>)}
                      {add.status === 'pending_customer' && add.customer_token && (
                        <a href={`https://wa.me/?text=${encodeURIComponent(`Link persetujuan: ${window.location.origin}/tambahan/${add.customer_token}`)}`}
                           target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-100">
                          <Send className="w-3.5 h-3.5" /> Kirim Ulang Link
                        </a>
                      )}
                      {add.status === 'paid' && !add.invoice_sent_at && (
                        <button onClick={() => sendInvoice(add.id)} className="flex items-center gap-1.5 bg-sky-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-sky-600">
                          <Send className="w-3.5 h-3.5" /> Kirim Invoice
                        </button>
                      )}
                      {add.invoice_number && (
                        <a href={`/invoice/${add.customer_token}`} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1.5 text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50">
                          <ExternalLink className="w-3.5 h-3.5" /> Lihat Invoice {add.invoice_number}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4">
              {reviewModal.action === 'approve' ? 'Approve Penambahan' : 'Tolak Penambahan'}
            </h3>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan (opsional)</label>
            <textarea value={adminNotes} onChange={e=>setAdminNotes(e.target.value)} rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-sky-400 mb-4"
              placeholder="Catatan untuk teknisi/customer..." />
            <div className="flex gap-3">
              <button onClick={() => setReviewModal({ open:false, id:null, action:'approve' })} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
              <button onClick={submitReview} className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white ${reviewModal.action==='approve' ? 'bg-sky-500 hover:bg-sky-600' : 'bg-red-500 hover:bg-red-600'}`}>
                {reviewModal.action === 'approve' ? 'Ya, Approve' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify lint and commit**

Run: `npm run lint`

```bash
git add src/pages/admin/AdminAdditions.tsx
git commit -m "feat: add AdminAdditions component"
```

---

### Task 11: Register Admin Tabs (AdminLayout + AdminSidebar)

**Files:**
- Modify: `src/pages/admin/AdminLayout.tsx`
- Modify: `src/pages/admin/AdminSidebar.tsx`

- [ ] **Step 1: Update AdminLayout.tsx**

Add import at top:
```typescript
import AdminMaterialCatalog from "./AdminMaterialCatalog";
import AdminAdditions from "./AdminAdditions";
```

Add to `menuItems` array (after `reports`):
```typescript
  { id: "material-catalog", label: "Katalog Material",   emoji: "🔩" },
  { id: "additions",        label: "Penambahan Order",   emoji: "➕" },
```

Add to `renderContent()` switch (after `reports` case):
```typescript
      case "material-catalog":
        return <AdminMaterialCatalog token={token} />;
      case "additions":
        return <AdminAdditions token={token} />;
```

- [ ] **Step 2: Update AdminSidebar.tsx**

Add to `menuItems` array (after existing items):
```typescript
  { id: "material-catalog", label: "Katalog Material", icon: <Package className="w-5 h-5" /> },
  { id: "additions",        label: "Penambahan Order", icon: <Plus className="w-5 h-5" /> },
```

Add `Plus` to the existing lucide-react import line at top of AdminSidebar.tsx:
```typescript
import { ..., Plus } from "lucide-react";
```

- [ ] **Step 3: Verify lint and commit**

Run: `npm run lint`

```bash
git add src/pages/admin/AdminLayout.tsx src/pages/admin/AdminSidebar.tsx
git commit -m "feat: register material catalog and additions tabs in admin panel"
```

---

### Task 12: OrderAdditionForm Component

**Files:**
- Create: `src/components/OrderAdditionForm.tsx`

- [ ] **Step 1: Create component**

```tsx
// src/components/OrderAdditionForm.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Send } from 'lucide-react';
import { MaterialCatalogItem, AdditionItemInput } from '../types/additions';

interface Props {
  orderId: string;
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function OrderAdditionForm({ orderId, token, onSuccess, onCancel }: Props) {
  const [catalog, setCatalog] = useState<MaterialCatalogItem[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [items, setItems] = useState<AdditionItemInput[]>([{ item_type: 'material', ref_id: '', quantity: 1 }]);
  const [submitting, setSubmitting] = useState(false);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch('/api/material-catalog', { headers }).then(r=>r.json()).then(d=>{ if(d.success) setCatalog(d.data); });
    fetch('/api/services').then(r=>r.json()).then(d=>{ if(d.success) setServices(d.data); });
  }, []);

  const addRow = () => setItems(prev => [...prev, { item_type: 'material', ref_id: '', quantity: 1 }]);
  const removeRow = (i: number) => setItems(prev => prev.filter((_,idx)=>idx!==i));
  const updateRow = (i: number, patch: Partial<AdditionItemInput>) =>
    setItems(prev => prev.map((r,idx) => idx===i ? { ...r, ...patch, ref_id: patch.item_type ? '' : r.ref_id } : r));

  const getOptions = (type: 'material'|'service') =>
    type === 'material' ? catalog : services;

  const getPrice = (type: 'material'|'service', refId: string): number => {
    const list = getOptions(type) as any[];
    return Number(list.find(i => String(i.id) === refId)?.price ?? 0);
  };

  const total = items.reduce((s, item) => s + getPrice(item.item_type, item.ref_id) * item.quantity, 0);
  const fmt = (n: number) => new Intl.NumberFormat('id-ID',{ style:'currency',currency:'IDR',maximumFractionDigits:0 }).format(n);

  const submit = async () => {
    if (items.some(i => !i.ref_id || i.quantity <= 0)) return alert('Semua item harus diisi');
    setSubmitting(true);
    const r = await fetch(`/api/orders/${orderId}/additions`, {
      method: 'POST', headers,
      body: JSON.stringify({ items }),
    });
    const d = await r.json();
    setSubmitting(false);
    if (d.success) onSuccess();
    else alert(d.message || 'Gagal mengirim pengajuan');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="font-bold text-slate-800 mb-4">Tambah Material / Jasa</h3>
      <div className="space-y-3 mb-4">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <select value={item.item_type} onChange={e=>updateRow(i,{item_type:e.target.value as any})}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-400">
              <option value="material">Material</option>
              <option value="service">Jasa</option>
            </select>
            <select value={item.ref_id} onChange={e=>updateRow(i,{ref_id:e.target.value})}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-400">
              <option value="">— Pilih {item.item_type === 'material' ? 'Material' : 'Jasa'} —</option>
              {getOptions(item.item_type).map((opt:any) => (
                <option key={opt.id} value={String(opt.id)}>
                  {opt.name} — {fmt(Number(opt.price))}{item.item_type==='material' ? `/${opt.unit}` : ''}
                </option>
              ))}
            </select>
            <input type="number" min={1} value={item.quantity} onChange={e=>updateRow(i,{quantity:Number(e.target.value)})}
              className="w-20 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-400" />
            <span className="py-2 text-sm font-semibold text-sky-600 w-28 text-right">
              {item.ref_id ? fmt(getPrice(item.item_type,item.ref_id)*item.quantity) : '—'}
            </span>
            {items.length > 1 && (
              <button onClick={()=>removeRow(i)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button onClick={addRow} className="flex items-center gap-1.5 text-sky-600 text-sm mb-5 hover:text-sky-700">
        <Plus className="w-4 h-4" /> Tambah baris
      </button>
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          <span className="text-slate-500 text-sm">Total: </span>
          <span className="font-bold text-sky-600 text-lg">{fmt(total)}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
          <button onClick={submit} disabled={submitting} className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-600 disabled:opacity-50">
            <Send className="w-4 h-4" /> {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify lint and commit**

Run: `npm run lint`

```bash
git add src/components/OrderAdditionForm.tsx
git commit -m "feat: add OrderAdditionForm component"
```

---

### Task 13: TeknisiDashboard — Tambah Material/Jasa

**Files:**
- Modify: `src/pages/teknisi/TeknisiDashboard.tsx`

- [ ] **Step 1: Add import and state**

Add import at top of file:
```typescript
import OrderAdditionForm from '../../components/OrderAdditionForm';
```

Add to the component's state declarations:
```typescript
  const [showAddForm, setShowAddForm] = useState<string | null>(null); // orderId
  const [myAdditions, setMyAdditions] = useState<any[]>([]);
```

- [ ] **Step 2: Add fetch for additions**

Inside the `useEffect` (or alongside existing fetch calls), add:
```typescript
  const fetchMyAdditions = useCallback(async () => {
    try {
      const r = await fetch('/api/order-additions/my', { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setMyAdditions(d.data);
    } catch {}
  }, [token]);
```

Call `fetchMyAdditions()` inside the existing `useEffect`.

- [ ] **Step 3: Add "Tambah Material/Jasa" button in order card**

Inside each order card render (find the action buttons area), add after existing buttons:

```tsx
{schedule.status === 'processing' && (
  <button
    onClick={() => setShowAddForm(prev => prev === schedule.id ? null : schedule.id)}
    className="flex items-center gap-1.5 text-sm font-medium text-sky-600 border border-sky-200 px-3 py-1.5 rounded-xl hover:bg-sky-50 transition-colors"
  >
    <Plus className="w-4 h-4" />
    {showAddForm === schedule.id ? 'Tutup' : 'Tambah Material/Jasa'}
  </button>
)}
{showAddForm === schedule.id && (
  <div className="mt-3">
    <OrderAdditionForm
      orderId={schedule.id}
      token={token}
      onSuccess={() => { setShowAddForm(null); fetchMyAdditions(); }}
      onCancel={() => setShowAddForm(null)}
    />
  </div>
)}
```

Add `Plus` to existing lucide-react imports.

- [ ] **Step 4: Verify lint and commit**

Run: `npm run lint`

```bash
git add src/pages/teknisi/TeknisiDashboard.tsx
git commit -m "feat: add Tambah Material/Jasa to TeknisiDashboard"
```

---

### Task 14: CustomerAdditionApproval.tsx

**Files:**
- Create: `src/pages/CustomerAdditionApproval.tsx`

- [ ] **Step 1: Create component**

```tsx
// src/pages/CustomerAdditionApproval.tsx
import React, { useState, useEffect } from 'react';
import { Check, X, ShoppingCart, Loader2 } from 'lucide-react';

interface Props { token: string; }

export default function CustomerAdditionApproval({ token }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'view'|'choose-payment'|'done'>('view');
  const [submitting, setSubmitting] = useState(false);

  const fmt = (n: number) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);

  useEffect(() => {
    fetch(`/api/order-additions/token/${token}`)
      .then(r=>r.json())
      .then(d=>{ if(d.success) setData(d.data); })
      .finally(()=>setLoading(false));
  }, [token]);

  const handleApprove = async (payment_method: 'cash'|'online') => {
    setSubmitting(true);
    const r = await fetch(`/api/order-additions/${data.id}/customer-response`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'approve', payment_method }),
    });
    const d = await r.json();
    if (d.success && payment_method === 'online') {
      // Buat Midtrans transaction
      const pr = await fetch(`/api/order-additions/${data.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const pd = await pr.json();
      if (pd.success && pd.redirectUrl) {
        window.location.href = pd.redirectUrl;
        return;
      }
    }
    setStep('done');
    setSubmitting(false);
  };

  const handleReject = async () => {
    setSubmitting(true);
    await fetch(`/api/order-additions/${data.id}/customer-response`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'reject' }),
    });
    setStep('done');
    setSubmitting(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-slate-500">Link tidak valid atau sudah kadaluarsa.</p>
      </div>
    </div>
  );

  if (step === 'done') return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-sm border border-slate-100">
        <Check className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Terima kasih!</h2>
        <p className="text-slate-500 text-sm">Respons Anda telah diterima. Tim kami akan segera menindaklanjuti.</p>
      </div>
    </div>
  );

  const alreadyActed = !['pending_customer'].includes(data.status);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-full font-bold mb-3">
            ❄ HDB Airconds
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Persetujuan Penambahan</h1>
          <p className="text-slate-500 text-sm mt-1">Order #{data.order_id} — {data.customer_name}</p>
        </div>

        {alreadyActed && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-700 text-center">
            Anda sudah memberikan respons untuk pengajuan ini.
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
          <h3 className="font-semibold text-slate-700 mb-3">Rincian Penambahan</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-slate-400 text-left border-b border-slate-100">
              <th className="pb-2">Item</th><th className="pb-2 text-right">Qty</th><th className="pb-2 text-right">Total</th>
            </tr></thead>
            <tbody>
              {(data.items||[]).map((it: any, i: number) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2 font-medium text-slate-800">{it.name}</td>
                  <td className="py-2 text-right text-slate-500">{it.quantity} {it.unit}</td>
                  <td className="py-2 text-right font-semibold text-sky-600">{fmt(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-100">
            <span className="font-semibold text-slate-700">Total Tambahan</span>
            <span className="text-xl font-bold text-sky-600">{fmt(data.total)}</span>
          </div>
        </div>

        {!alreadyActed && step === 'view' && (
          <div className="flex gap-3">
            <button onClick={handleReject} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-red-200 text-red-600 py-3.5 rounded-xl font-semibold hover:bg-red-50 transition-colors disabled:opacity-50">
              <X className="w-5 h-5" /> Tolak
            </button>
            <button onClick={() => setStep('choose-payment')} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-sky-500 text-white py-3.5 rounded-xl font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50">
              <Check className="w-5 h-5" /> Setuju
            </button>
          </div>
        )}

        {!alreadyActed && step === 'choose-payment' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Pilih Metode Pembayaran</h3>
            <div className="space-y-3">
              <button onClick={() => handleApprove('cash')} disabled={submitting}
                className="w-full flex items-center gap-3 border-2 border-slate-200 rounded-xl p-4 hover:border-sky-400 hover:bg-sky-50 transition-colors text-left disabled:opacity-50">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">💵</div>
                <div><p className="font-semibold text-slate-800">Tunai (Cash)</p><p className="text-slate-500 text-sm">Bayar langsung ke teknisi di lokasi</p></div>
              </button>
              <button onClick={() => handleApprove('online')} disabled={submitting}
                className="w-full flex items-center gap-3 border-2 border-slate-200 rounded-xl p-4 hover:border-sky-400 hover:bg-sky-50 transition-colors text-left disabled:opacity-50">
                <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center text-xl">💳</div>
                <div><p className="font-semibold text-slate-800">Transfer / Online</p><p className="text-slate-500 text-sm">Bayar via Midtrans (transfer, e-wallet, dll)</p></div>
              </button>
            </div>
            <button onClick={() => setStep('view')} className="mt-3 w-full text-slate-400 text-sm hover:text-slate-600">← Kembali</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify lint and commit**

Run: `npm run lint`

```bash
git add src/pages/CustomerAdditionApproval.tsx
git commit -m "feat: add CustomerAdditionApproval page"
```

---

### Task 15: InvoiceView.tsx

**Files:**
- Create: `src/pages/InvoiceView.tsx`

- [ ] **Step 1: Create component with A4 print styles**

```tsx
// src/pages/InvoiceView.tsx
import React, { useState, useEffect } from 'react';
import { Loader2, Printer } from 'lucide-react';

interface Props { token: string; }

export default function InvoiceView({ token }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fmt = (n: number) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});

  useEffect(() => {
    fetch(`/api/order-additions/token/${token}/invoice-data`)
      .then(r=>r.json())
      .then(d=>{ if(d.success) setData(d.data); })
      .finally(()=>setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
    </div>
  );
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <p className="text-slate-500">Invoice tidak ditemukan.</p>
    </div>
  );

  return (
    <>
      {/* Print CSS injected via style tag */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .invoice-page {
            width: 210mm; min-height: 297mm;
            margin: 0; padding: 15mm 20mm;
            box-shadow: none !important;
          }
        }
        @page { size: A4 portrait; margin: 0; }
      `}</style>

      {/* Print Button */}
      <div className="no-print bg-slate-100 py-4 px-6 flex justify-between items-center">
        <span className="text-slate-500 text-sm">Invoice {data.invoice_number}</span>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-sky-600 text-sm">
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* Invoice Page */}
      <div className="invoice-page bg-white mx-auto my-6 p-10 shadow-lg" style={{ width:'210mm', minHeight:'297mm' }}>

        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-sky-500">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-black text-sky-600">❄ HDB AIRCONDS</span>
            </div>
            <p className="text-slate-500 text-sm">Jasa & Penjualan AC Mojokerto</p>
            <p className="text-slate-500 text-xs mt-2">Jl. Gajah Mada No.19, Rw. III, Seduri</p>
            <p className="text-slate-500 text-xs">Kec. Mojosari, Kab. Mojokerto, Jawa Timur 61382</p>
            <p className="text-slate-500 text-xs">📱 0815-1572-9739 &nbsp;✉ hasildayabersama@gmail.com</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-slate-800 mb-2">INVOICE</p>
            <table className="text-sm text-right ml-auto">
              <tbody>
                {[
                  ['No. Invoice', data.invoice_number],
                  ['Tanggal', fmtDate(data.invoice_date)],
                  ['No. Order', data.order_id],
                  ['Tgl Order', fmtDate(data.order_date)],
                ].map(([k,v])=>(
                  <tr key={k}>
                    <td className="text-slate-500 pr-3 py-0.5">{k}</td>
                    <td className="font-semibold text-slate-800">: {v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Billing + Teknisi */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tagihan Kepada</p>
            <p className="font-bold text-slate-800">{data.customer_name}</p>
            <p className="text-slate-500 text-sm">📱 {data.customer_phone}</p>
            <p className="text-slate-500 text-sm">{data.customer_address}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dikerjakan Oleh</p>
            <p className="font-bold text-slate-800">{data.teknisi_name || '—'}</p>
            <p className="text-slate-500 text-sm">Tanggal: {fmtDate(data.invoice_date)}</p>
          </div>
        </div>

        {/* Original Items */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rincian Pesanan Awal</p>
          <table className="w-full text-sm">
            <thead className="bg-sky-50">
              <tr>{['No','Deskripsi','Qty','Harga Sat','Total'].map(h=><th key={h} className="text-left px-3 py-2 font-semibold text-slate-700">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.orig_items||[]).map((it:any, i:number) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-slate-400">{i+1}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{it.item_name}</td>
                  <td className="px-3 py-2 text-slate-500">{it.quantity}</td>
                  <td className="px-3 py-2">{fmt(Number(it.price))}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{fmt(Number(it.price)*Number(it.quantity))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Addition Items */}
        <div className="mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Penambahan Material & Jasa</p>
          <table className="w-full text-sm">
            <thead className="bg-amber-50">
              <tr>{['No','Deskripsi','Qty','Satuan','Harga Sat','Total'].map(h=><th key={h} className="text-left px-3 py-2 font-semibold text-slate-700">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.add_items||[]).map((it:any, i:number) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-slate-400">{i+1}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{it.name}</td>
                  <td className="px-3 py-2 text-slate-500">{it.quantity}</td>
                  <td className="px-3 py-2 text-slate-400">{it.unit}</td>
                  <td className="px-3 py-2">{fmt(it.unit_price)}</td>
                  <td className="px-3 py-2 font-semibold text-sky-600">{fmt(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <table className="text-sm w-64">
            <tbody>
              <tr><td className="py-1 text-slate-500">Subtotal Pesanan Awal</td><td className="py-1 text-right font-medium">{fmt(data.orig_total)}</td></tr>
              <tr><td className="py-1 text-slate-500">Subtotal Penambahan</td><td className="py-1 text-right font-medium">{fmt(data.add_total)}</td></tr>
              <tr className="border-t-2 border-slate-800">
                <td className="pt-2 font-bold text-slate-800 text-base">TOTAL</td>
                <td className="pt-2 text-right font-black text-sky-600 text-lg">{fmt(data.grand_total)}</td>
              </tr>
              <tr><td className="pt-1 text-slate-500 text-xs">Metode Bayar</td><td className="pt-1 text-right text-xs font-medium capitalize">{data.payment_method === 'cash' ? 'Tunai' : 'Transfer / Online'}</td></tr>
              <tr><td className="text-slate-500 text-xs">Status</td><td className="text-right text-xs font-bold text-emerald-600">✅ LUNAS</td></tr>
            </tbody>
          </table>
        </div>

        {/* Notes */}
        <div className="bg-sky-50 rounded-xl p-4 mb-10 text-xs text-slate-500">
          <p>• Garansi layanan berlaku <strong>30 hari</strong> sejak tanggal pengerjaan.</p>
          <p>• Hubungi kami jika ada pertanyaan: <strong>0815-1572-9739</strong> atau <strong>hasildayabersama@gmail.com</strong></p>
        </div>

        {/* Signatures */}
        <div className="mt-auto">
          <p className="text-sm text-slate-500 mb-6">Mojosari, {fmtDate(data.invoice_date)}</p>
          <div className="grid grid-cols-2 gap-8">
            {[
              { label: 'Penerima / Pelanggan', name: data.customer_name },
              { label: 'Hormat Kami,\nHDB Airconds', name: data.teknisi_name || 'Admin' },
            ].map((col, i) => (
              <div key={i} className="text-center">
                <p className="text-xs text-slate-500 whitespace-pre-line mb-16">{col.label}</p>
                <div className="border-b border-slate-400 mb-1" />
                <p className="text-xs text-slate-600 font-medium">{col.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          Dokumen ini dibuat otomatis oleh sistem HDB Airconds &nbsp;·&nbsp; Dicetak: {new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}
        </div>

      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify lint and commit**

Run: `npm run lint`

```bash
git add src/pages/InvoiceView.tsx
git commit -m "feat: add printable A4 InvoiceView component"
```

---

### Task 16: UserOrders.tsx — Addition Notification

**Files:**
- Modify: `src/pages/UserOrders.tsx`

- [ ] **Step 1: Add additions fetch and notification badge**

Add state at top of `UserOrders`:
```typescript
  const [pendingAdditions, setPendingAdditions] = useState<any[]>([]);
```

Add fetch inside the `useEffect`:
```typescript
    const fetchPendingAdditions = async () => {
      try {
        const r = await fetch('/api/user/orders', { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (d.success) {
          // Check each order for pending_customer additions via token stored in localStorage
          // Simpler approach: show banner if any order has pending addition token
        }
      } catch {}
    };
```

Actually, since pending additions use a token (customer doesn't need to be logged in), the notification should come from the order list. Add a separate endpoint or fetch pending additions for the user's orders.

Add after the orders fetch inside `useEffect`:
```typescript
      // Check for pending additions linked to user's orders
      const orderIds = data.data?.map((o: any) => o.id) || [];
      // Store any pending addition tokens in the order response if available
```

Add a notification banner at the top of the return JSX, before the orders list:
```tsx
{orders.some((o: any) => o.pending_addition_token) && (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
    <div>
      <p className="font-semibold text-amber-800 text-sm">Ada penambahan menunggu persetujuan Anda</p>
      <p className="text-amber-600 text-xs mt-0.5">Cek email/WA Anda untuk link persetujuan</p>
    </div>
  </div>
)}
```

> **Note:** To surface the pending addition token in the order response, extend `GET /api/user/orders` in server.ts to JOIN with `order_additions` and include `pending_addition_token` when `status = 'pending_customer'`:
>
> ```sql
> LEFT JOIN order_additions oa ON oa.order_id = o.id AND oa.status = 'pending_customer'
> ```
>
> Add `oa.customer_token as pending_addition_token` to the SELECT.

- [ ] **Step 2: Extend GET /api/user/orders in server.ts**

Find `app.get('/api/user/orders', ...)` in server.ts. Update the SELECT to include:
```sql
, (SELECT customer_token FROM order_additions WHERE order_id = o.id AND status = 'pending_customer' LIMIT 1) as pending_addition_token
```

- [ ] **Step 3: Verify lint and commit**

Run: `npm run lint`

```bash
git add src/pages/UserOrders.tsx server.ts
git commit -m "feat: add pending addition notification to UserOrders"
```

---

### Task 17: App.tsx — Routing

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add imports**

```typescript
import CustomerAdditionApproval from "./pages/CustomerAdditionApproval";
import InvoiceView from "./pages/InvoiceView";
```

- [ ] **Step 2: Add state for dynamic tokens**

```typescript
  const [additionToken, setAdditionToken] = useState<string | null>(null);
  const [invoiceToken, setInvoiceToken] = useState<string | null>(null);
```

- [ ] **Step 3: Update URL reading useEffect**

Find the `useEffect` that reads `window.location.pathname`. Add BEFORE the existing `PATH_TO_PAGE` lookup:

```typescript
    const path = window.location.pathname;
    if (path.startsWith('/tambahan/')) {
      const t = path.replace('/tambahan/', '');
      setAdditionToken(t);
      setCurrentPage('tambahan');
      return;
    }
    if (path.startsWith('/invoice/')) {
      const t = path.replace('/invoice/', '');
      setInvoiceToken(t);
      setCurrentPage('invoice');
      return;
    }
```

- [ ] **Step 4: Add cases to renderPage()**

```typescript
      case "tambahan":
        if (!additionToken) return <Home setCurrentPage={setCurrentPage} />;
        return <CustomerAdditionApproval token={additionToken} />;
      case "invoice":
        if (!invoiceToken) return <Home setCurrentPage={setCurrentPage} />;
        return <InvoiceView token={invoiceToken} />;
```

- [ ] **Step 5: Update `pushState` useEffect to handle dynamic pages**

Find the `useEffect` that calls `window.history.pushState`. Wrap it so it doesn't overwrite dynamic URLs:

```typescript
  useEffect(() => {
    if (currentPage === 'tambahan' || currentPage === 'invoice') return; // token URLs managed separately
    const path = PAGE_TO_PATH[currentPage] ?? "/";
    if (window.location.pathname !== path) {
      window.history.pushState({ page: currentPage }, "", path);
    }
  }, [currentPage]);
```

- [ ] **Step 6: Verify lint and commit**

Run: `npm run lint`

```bash
git add src/App.tsx
git commit -m "feat: add routing for /tambahan/:token and /invoice/:token"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|-------------|------|
| DB: material_catalog, order_additions, order_addition_items | Task 2 |
| Material catalog CRUD (admin) | Tasks 3, 9 |
| Create addition (teknisi/customer) | Tasks 4, 12, 13 |
| Admin review (approve/reject) | Tasks 5, 10 |
| Customer approval via token link | Tasks 6, 14 |
| Cash + online payment | Tasks 7, 14 |
| Midtrans online payment | Task 7 |
| Teknisi: revise/escalate/cancel | Task 8 |
| Invoice generation + send | Task 8 |
| InvoiceView A4 printable | Task 15 |
| Admin navigation | Task 11 |
| TeknisiDashboard integration | Task 13 |
| UserOrders notification | Task 16 |
| App routing /tambahan + /invoice | Task 17 |
| Signature blocks on invoice | Task 15 |
| WA notification links | Tasks 5, 8 |

All spec requirements covered. ✅

**ENV variable needed:** Add `BASE_URL=https://yourdomain.com` to `.env` (used for WA links). Without it, falls back to `http://localhost:5173`.
