// Uji alur UI lewat server action Next.js, seperti form sungguhan.
// Jalankan: node --env-file=.env.local scripts/smoke-ui.mjs <email> <password> <baseUrl>
import assert from "node:assert/strict";
import { createServerClient } from "@supabase/ssr";

const [, , email, password, base = "http://localhost:3210"] = process.argv;
assert.ok(email && password, "butuh email dan password");

const jar = new Map();
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const { name, value } of cookies) jar.set(name, value);
      },
    },
  },
);

const { error } = await supabase.auth.signInWithPassword({ email, password });
assert.equal(error, null, `login gagal: ${error?.message}`);
const cookie = [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");

const { data: wallet } = await supabase.from("wallets").select("id").limit(1).single();
const { data: category } = await supabase
  .from("categories")
  .select("id")
  .eq("type", "expense")
  .limit(1)
  .single();

const formPage = await fetch(`${base}/transaksi/baru`, { headers: { cookie } });
const html = await formPage.text();

// Ambil form yang berisi input jumlah, lalu semua input tersembunyinya.
const formHtml = html
  .split("<form")
  .find((chunk) => chunk.includes('name="amount"'));
assert.ok(formHtml, "form transaksi tidak ditemukan");
const hidden = [...formHtml.matchAll(/<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?\/>/g)];

const form = new FormData();
for (const [, name, value] of hidden) {
  form.set(name.replaceAll("&quot;", '"'), (value ?? "").replaceAll("&quot;", '"'));
}
assert.ok(hidden.length > 0, "form transaksi tidak punya field aksi");

const note = `Uji UI ${Date.now()}`;
const today = new Date().toISOString().slice(0, 10);
form.set("type", "expense");
form.set("amount", "17500");
form.set("transaction_date", today);
form.set("wallet_id", wallet.id);
form.set("category_id", category.id);
form.set("note", note);

const response = await fetch(`${base}/transaksi/baru`, {
  method: "POST",
  headers: { cookie, accept: "text/x-component" },
  body: form,
  redirect: "manual",
});
const responseText = await response.text();

let saved = null;
for (let attempt = 0; attempt < 10; attempt++) {
  const { data } = await supabase
    .from("transactions")
    .select("id, amount, note")
    .eq("is_deleted", false)
    .eq("note", note);
  if (data.length > 0) {
    saved = data[0];
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 400));
}

assert.ok(
  saved,
  `transaksi tidak tersimpan (HTTP ${response.status}: ${responseText.slice(0, 300)})`,
);
assert.equal(saved.amount, 17500);

await supabase.from("transactions").update({ is_deleted: true }).eq("id", saved.id);
console.log("UJI UI LULUS: form menyimpan transaksi lewat server action");
