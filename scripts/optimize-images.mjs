/**
 * Kompres ulang gambar di public/images ke ukuran yang benar-benar dipakai UI.
 * Idempoten — aman dijalankan berulang. Jalankan: npm run images
 */
import sharp from "sharp";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DIR = "public/images";

// Lebar maksimum per file. Default 1600 (hero full-bleed).
// Yang di sini dirender jauh lebih kecil dari ukuran aslinya.
const MAX_WIDTH = {
  "tim-teknisi-ac-mojokerto-hdb.webp": 900, // dirender 800x1000
  "service-ac-properti-mojokerto.webp": 1600,
};
const DEFAULT_MAX_WIDTH = 1600;
const QUALITY = 72;

const kb = (n) => Math.round(n / 1024) + "KB";

async function compress(file) {
  const src = path.join(DIR, file);
  // Baca ke buffer dulu: di Windows sharp menahan handle file sumber,
  // jadi menulis balik ke path yang sama akan kena EPERM.
  const input = await readFile(src);
  const max = MAX_WIDTH[file] ?? DEFAULT_MAX_WIDTH;

  const img = sharp(input).resize({ width: max, withoutEnlargement: true });
  const out = file.endsWith(".png")
    ? await img.png({ compressionLevel: 9, palette: true }).toBuffer()
    : /\.jpe?g$/.test(file)
      ? await img.jpeg({ quality: 80, mozjpeg: true }).toBuffer()
      : await img.webp({ quality: QUALITY, effort: 6 }).toBuffer();

  // Hanya tukar kalau hematnya berarti (>15%). Tanpa ambang ini, menjalankan
  // skrip berulang kali terus meng-encode ulang file yang sudah optimal —
  // ukurannya turun beberapa persen tapi kualitasnya ikut turun tiap kali.
  // 15% cukup untuk membedakan "belum pernah dioptimalkan" dari "sudah".
  if (out.length > input.length * 0.85) {
    console.log(`  skip  ${file} (${kb(input.length)} sudah optimal)`);
    return 0;
  }
  await writeFile(src, out);
  console.log(`  ok    ${file}  ${kb(input.length)} -> ${kb(out.length)}`);
  return input.length - out.length;
}

const files = (await readdir(DIR)).filter((f) => /\.(webp|png|jpe?g)$/i.test(f));
let saved = 0;
for (const f of files) saved += await compress(f);

// Favicon & apple-touch-icon terpisah, supaya tidak menarik logo 500x500.
await sharp(path.join(DIR, "HDB-LOGO.png"))
  .resize(64)
  .png({ compressionLevel: 9, palette: true })
  .toFile(path.join(DIR, "favicon-64.png"));
await sharp(path.join(DIR, "HDB-LOGO.png"))
  .resize(180)
  .png({ compressionLevel: 9, palette: true })
  .toFile(path.join(DIR, "apple-touch-icon.png"));
// Logo navbar dirender 40px — cukup 80px untuk layar 2x.
await sharp(path.join(DIR, "HDB-LOGO.png"))
  .resize(80)
  .webp({ quality: 85 })
  .toFile(path.join(DIR, "logo-80.webp"));

// Varian lebar untuk srcset. Gambar hero full-bleed di HP 360px cuma butuh
// ~720px (layar 2x), bukan 1600px — ini penyumbang terbesar LCP di mobile.
const RESPONSIVE = [
  "instalasi-ac-mojokerto-hdb-airconds.webp",
  "proyek-instalasi-ac-mojokerto.webp",
  "service-ac-properti-mojokerto.webp",
];
const WIDTHS = [640, 960, 1280];
for (const file of RESPONSIVE) {
  const input = await readFile(path.join(DIR, file));
  for (const w of WIDTHS) {
    const out = await sharp(input)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 6 })
      .toBuffer();
    const name = file.replace(/\.webp$/, `-${w}.webp`);
    await writeFile(path.join(DIR, name), out);
    console.log(`  var   ${name}  ${kb(out.length)}`);
  }
}

console.log(`\nTotal hemat: ${kb(saved)}`);
