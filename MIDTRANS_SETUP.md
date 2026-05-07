# Midtrans Integration Setup Guide

## 📋 Prerequisites
- Node.js installed
- Database (MySQL) already set up ✅
- Midtrans account (Sandbox mode for development)

## ✅ Your Database is Already Midtrans-Ready!

Your `orders` table **already has** all required Midtrans columns:
- ✅ `midtrans_transaction_id` - Transaction ID from Midtrans
- ✅ `midtrans_snap_token` - Snap token for payment UI
- ✅ `payment_status` (ENUM) - Payment status

**No database migration needed!** 🎉

---

## 🚀 Step 1: Get Midtrans API Keys

1. Go to [Midtrans Dashboard](https://dashboard.midtrans.com)
2. Register or login to your account
3. Navigate to **Settings → API Keys**
4. Copy your **Server Key** and **Client Key** from Sandbox mode
5. Keep these keys safe - never share them

## 🔧 Step 2: Configure Environment Variables

Update your `.env` file with Midtrans credentials:

```env
MIDTRANS_SERVER_KEY=your_midtrans_server_key_here
MIDTRANS_CLIENT_KEY=your_midtrans_client_key_here
MIDTRANS_IS_PRODUCTION=false  # Use 'true' for production
```

## 📦 Step 3: Install Dependencies

Dependencies should already be installed, but if needed:
```bash
npm install midtrans-client
```

## ✅ Step 4: Verify Installation

1. Start the server:
   ```bash
   npm run dev
   ```

2. Test payment flow:
   - Go to **Checkout page**
   - Fill in customer details
   - Click "Lanjut ke Pembayaran"
   - You should see Midtrans payment popup

## 🧪 Testing Payments

In Midtrans Sandbox mode, use these test cards:

### Success Payment
- **Card Number**: 4111111111111111
- **Expiry**: Any future date
- **CVV**: 123
- **OTP**: 123456

### Pending Payment
- **Card Number**: 4111111111111112
- **Same expiry & CVV**

### Declined Payment
- **Card Number**: 4111111111111113
- **Same expiry & CVV**

## 🔔 Webhook Configuration

1. Go to Midtrans Dashboard → Settings → Configuration
2. Set **Notification URL** (Webhook):
   ```
   http://yourdomain.com/api/midtrans/webhook
   ```
3. For local testing with ngrok:
   ```bash
   ngrok http 5000
   # Then use: https://your-ngrok-url.ngrok.io/api/midtrans/webhook
   ```

## 📡 API Endpoints

### Generate Snap Token
```
POST /api/midtrans/snap-token
Headers: Authorization: Bearer <token>
Body: {
  productId: string
  productName: string
  price: number
  quantity: number
  customerName: string
  phone: string
  address: string
}
```

### Webhook Receiver
```
POST /api/midtrans/webhook
Body: Midtrans notification payload (auto-verified)
```

## 🔍 Verify Payment Status

1. In Admin Dashboard → Orders
2. Check **Status Bayar** column:
   - `settlement` ✅ Payment successful
   - `pending` ⏳ Waiting for payment
   - `expire` ⏱️ Payment expired
   - `cancel` ❌ Payment cancelled
   - `deny` 🚫 Payment denied
   - `refund` 💰 Refund issued

## 📊 Database Schema Updates

Your database already has all necessary columns:
```
payment_status ENUM('pending','settlement','expire','cancel','deny','refund')
midtrans_transaction_id VARCHAR(100)
midtrans_snap_token VARCHAR(255)
```

### Payment Status Values (Your Database)
| Status | Meaning | When |
|--------|---------|------|
| `pending` | ⏳ Waiting for payment | Initial state |
| `settlement` | ✅ Payment successful | Transaction captured/settled |
| `expire` | ⏱️ Payment expired | User didn't complete payment |
| `cancel` | ❌ Payment cancelled | User cancelled payment |
| `deny` | 🚫 Payment denied | Bank/gateway rejected |
| `refund` | 💰 Refund processed | Refund issued to customer |

## ❓ Troubleshooting

### Snap Payment popup not showing
- Ensure Midtrans Snap script is loaded (check browser console)
- Check if API keys are correct in .env
- Verify MIDTRANS_CLIENT_KEY is being passed correctly

### Webhook not receiving updates
- Check if notification URL is correct in Midtrans Dashboard
- For local testing, use ngrok to expose your server
- Verify signature verification in webhook handler

### Payment status not updating
- Check server logs for webhook errors
- Ensure database tables have new columns
- Verify server has write permissions to database

## 🚀 Going to Production

1. Update `.env`:
   ```env
   MIDTRANS_IS_PRODUCTION=true
   MIDTRANS_SERVER_KEY=your_production_server_key
   MIDTRANS_CLIENT_KEY=your_production_client_key
   ```

2. Get Production API keys from Midtrans Dashboard

3. Update webhook URL to production domain

4. Test thoroughly before going live

## 📚 More Information

- [Midtrans Snap Documentation](https://snap-docs.midtrans.com)
- [Midtrans Node.js SDK](https://github.com/Midtrans/midtrans-nodejs-client)
- [Transaction Status Explanation](https://docs.midtrans.com/reference/transaction-status)
