// Uji aset PWA tersaji benar. Jalankan: node scripts/check-pwa.mjs [baseUrl]
import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://localhost:3000";

const manifest = await fetch(`${base}/manifest.json`).then((res) => {
  assert.equal(res.status, 200, "manifest.json tidak ada");
  return res.json();
});
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "/");
const sizes = manifest.icons.map((icon) => icon.sizes);
assert.ok(sizes.includes("192x192") && sizes.includes("512x512"), "ikon 192/512 harus ada");
assert.ok(
  manifest.icons.some((icon) => icon.purpose === "maskable"),
  "ikon maskable harus ada",
);

const assets = [
  "/sw.js",
  "/offline.html",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];
for (const asset of assets) {
  const res = await fetch(`${base}${asset}`);
  assert.equal(res.status, 200, `${asset} tidak tersedia`);
}
assert.match(
  await fetch(`${base}/sw.js`).then((res) => res.text()),
  /addEventListener\("fetch"/,
  "service worker harus punya handler fetch",
);

const html = await fetch(`${base}/login`).then((res) => res.text());
for (const tag of [
  'rel="manifest"',
  'rel="apple-touch-icon"',
  'name="apple-mobile-web-app-capable" content="yes"',
  'name="theme-color"',
]) {
  assert.ok(html.includes(tag), `head tidak memuat ${tag}`);
}

console.log("UJI PWA LULUS");
