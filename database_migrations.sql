-- ================================================
-- MIDTRANS INTEGRATION DATABASE MIGRATIONS
-- ================================================
-- IMPORTANT: Your database already has Midtrans columns!
-- You may NOT need to run these migrations.
-- Check if your 'orders' table already has these columns first.

-- Check current table structure:
-- DESCRIBE orders;

-- ONLY run these if columns are missing:

-- Add Midtrans columns if missing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS midtrans_transaction_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS midtrans_snap_token VARCHAR(255);
ALTER TABLE orders MODIFY COLUMN payment_status ENUM('pending','settlement','expire','cancel','deny','refund') DEFAULT 'pending';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_midtrans_transaction_id ON orders(midtrans_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON orders(payment_status);

-- Optional: Add webhook log table for debugging
CREATE TABLE IF NOT EXISTS midtrans_webhook_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(100),
  transaction_id VARCHAR(255),
  transaction_status VARCHAR(50),
  payment_type VARCHAR(50),
  gross_amount DECIMAL(12, 2),
  webhook_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_id (order_id),
  INDEX idx_transaction_id (transaction_id)
);

-- ================================================
-- COLUMN NAMING REFERENCE
-- ================================================
-- Your database uses:
-- - midtrans_snap_token (NOT midtrans_token)
-- - payment_status ENUM: pending, settlement, expire, cancel, deny, refund
-- - order_status ENUM: pending, processing, completed, cancelled
-- ================================================

-- Midtrans Status Mapping:
-- Transaction Status          → payment_status value
-- ========================     =================
-- capture/settlement           → settlement (Paid)
-- pending                       → pending (Waiting)
-- deny                          → deny (Denied)
-- expire                        → expire (Expired)
-- cancel                        → cancel (Cancelled)
-- refund                        → refund (Refunded)

