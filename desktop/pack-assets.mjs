// Menyusun folder server mandiri yang akan dibungkus Electron.
// Hasil akhir: desktop/dist/app/{server.js, .next, public, .env}
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");
const out = join(root, "desktop", "dist", "app");

if (!existsSync(join(standalone, "server.js"))) {
  console.error(".next/standalone tidak ada. Jalankan `npm run build` dulu.");
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

cpSync(standalone, out, { recursive: true });

// Aset statis tidak ikut ke standalone, harus disalin manual.
cpSync(join(root, ".next", "static"), join(out, ".next", "static"), { recursive: true });
cpSync(join(root, "public"), join(out, "public"), { recursive: true });

if (!existsSync(join(root, "desktop", "app.env"))) {
  console.error("desktop/app.env tidak ada. Jalankan `node desktop/prepare-env.mjs` dulu.");
  process.exit(1);
}
cpSync(join(root, "desktop", "app.env"), join(out, ".env"));

console.log("desktop/dist/app siap.");
