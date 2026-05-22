#!/usr/bin/env node
/**
 * Switch Midtrans mode di .env antara sandbox dan production.
 *
 * Cara pakai:
 *   node scripts/switch-midtrans.cjs sandbox
 *   node scripts/switch-midtrans.cjs production
 *
 * Atau via npm script:
 *   npm run midtrans:sandbox
 *   npm run midtrans:production
 *
 * Script ini akan:
 * 1. Backup .env saat ini ke .env.backup
 * 2. Update 4 baris: MIDTRANS_*, VITE_MIDTRANS_*, IS_PRODUCTION flag
 * 3. Validasi prefix key benar sebelum write
 * 4. Print warning jika ada inkonsistensi
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const MODE = (process.argv[2] || "").toLowerCase();
const ENV_PATH = path.join(__dirname, "..", ".env");

if (!["sandbox", "production"].includes(MODE)) {
  console.error("❌ Usage: node scripts/switch-midtrans.cjs [sandbox|production]");
  process.exit(1);
}

if (!fs.existsSync(ENV_PATH)) {
  console.error("❌ File .env tidak ditemukan di:", ENV_PATH);
  console.error("   Copy .env.example menjadi .env dulu: cp .env.example .env");
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

async function main() {
  const env = fs.readFileSync(ENV_PATH, "utf8");

  console.log(`\n🔄 Switching to ${MODE.toUpperCase()} mode\n`);

  // Konfirmasi extra untuk production (mencegah accidental)
  if (MODE === "production") {
    console.log("⚠️  PERHATIAN: Mode PRODUCTION = uang REAL akan diproses!");
    console.log("    Pastikan kamu sudah:");
    console.log("    1. Aktivasi akun production di dashboard.midtrans.com");
    console.log("    2. Punya production server key (Mid-server-...) dan client key (Mid-client-...)");
    console.log("    3. Sudah daftarkan webhook URL di Midtrans dashboard\n");
    const ans = await ask("Lanjutkan ke production? (yes/no): ");
    if (ans.trim().toLowerCase() !== "yes") {
      console.log("Dibatalkan.");
      process.exit(0);
    }
  }

  // Prompt input keys baru
  const expectedServerPrefix = MODE === "production" ? "Mid-server-" : "SB-Mid-server-";
  const expectedClientPrefix = MODE === "production" ? "Mid-client-" : "SB-Mid-client-";

  const serverKey = (await ask(`Paste ${MODE} SERVER KEY (diawali "${expectedServerPrefix}"): `)).trim();
  const clientKey = (await ask(`Paste ${MODE} CLIENT KEY (diawali "${expectedClientPrefix}"): `)).trim();

  rl.close();

  // Validasi prefix
  if (!serverKey.startsWith(expectedServerPrefix)) {
    console.error(`\n❌ Server key salah! Harus diawali "${expectedServerPrefix}"`);
    console.error(`   Kamu input: "${serverKey.substring(0, 25)}..."`);
    process.exit(1);
  }
  if (!clientKey.startsWith(expectedClientPrefix)) {
    console.error(`\n❌ Client key salah! Harus diawali "${expectedClientPrefix}"`);
    console.error(`   Kamu input: "${clientKey.substring(0, 25)}..."`);
    process.exit(1);
  }

  // Backup .env current
  const backupPath = ENV_PATH + ".backup";
  fs.writeFileSync(backupPath, env);
  console.log(`\n📁 Backup .env disimpan ke .env.backup`);

  // Replace baris yang sesuai
  let newEnv = env;
  const isProduction = MODE === "production";

  const replacements = [
    [/^MIDTRANS_SERVER_KEY=.*/m, `MIDTRANS_SERVER_KEY=${serverKey}`],
    [/^MIDTRANS_CLIENT_KEY=.*/m, `MIDTRANS_CLIENT_KEY=${clientKey}`],
    [/^MIDTRANS_IS_PRODUCTION=.*/m, `MIDTRANS_IS_PRODUCTION=${isProduction}`],
    [/^VITE_MIDTRANS_CLIENT_KEY=.*/m, `VITE_MIDTRANS_CLIENT_KEY=${clientKey}`],
    [/^VITE_MIDTRANS_IS_PRODUCTION=.*/m, `VITE_MIDTRANS_IS_PRODUCTION=${isProduction}`],
  ];

  let replacedCount = 0;
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(newEnv)) {
      newEnv = newEnv.replace(pattern, replacement);
      replacedCount++;
    } else {
      // Kalau baris tidak ada, append di akhir
      newEnv += "\n" + replacement;
      console.warn(`⚠️  Baris ${replacement.split("=")[0]} tidak ditemukan, ditambahkan di akhir`);
    }
  }

  fs.writeFileSync(ENV_PATH, newEnv);
  console.log(`✅ ${replacedCount} baris .env berhasil di-update\n`);

  console.log("📋 Konfigurasi baru:");
  console.log(`   MIDTRANS_IS_PRODUCTION = ${isProduction}`);
  console.log(`   MIDTRANS_SERVER_KEY = ${serverKey.substring(0, 25)}...`);
  console.log(`   MIDTRANS_CLIENT_KEY = ${clientKey.substring(0, 25)}...\n`);

  console.log("🔄 Langkah selanjutnya:");
  console.log("   1. Rebuild frontend (karena VITE_* berubah):");
  console.log("      npm run build");
  console.log("   2. Restart server:");
  console.log(`      ${process.env.NODE_ENV === "production" ? "pm2 restart hdbaircons" : "Ctrl+C lalu npm run dev"}`);

  if (isProduction) {
    console.log("\n   3. Pastikan webhook URL sudah didaftarkan di Midtrans Dashboard:");
    console.log("      Payment Notification URL: https://www.hdbaircons.com/api/midtrans/webhook");
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
