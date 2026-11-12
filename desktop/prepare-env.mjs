// Menyalin kunci Supabase (publishable, bukan rahasia) ke berkas yang ikut dipaketkan.
// Dijalankan otomatis oleh "build:win" sebelum electron-builder.
import { readFileSync, writeFileSync } from "node:fs";

const NEEDED = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

let source;
try {
  source = readFileSync(".env.local", "utf8");
} catch {
  console.error("Berkas .env.local tidak ditemukan. Buat dulu sesuai CONTEXT.md.");
  process.exit(1);
}

const values = {};
for (const line of source.split(/\r?\n/)) {
  const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (match) values[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

const missing = NEEDED.filter((key) => !values[key]);
if (missing.length > 0) {
  console.error(`.env.local belum berisi: ${missing.join(", ")}`);
  process.exit(1);
}

// NEXT_PUBLIC_APP_URL menunjuk ke server lokal desktop, bukan localhost:3000.
const output = [
  `NEXT_PUBLIC_SUPABASE_URL=${values.NEXT_PUBLIC_SUPABASE_URL}`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY=${values.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
  "",
].join("\n");

writeFileSync("desktop/app.env", output);
console.log("desktop/app.env dibuat.");
