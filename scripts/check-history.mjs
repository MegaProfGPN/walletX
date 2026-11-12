// Uji halaman riwayat per periode terhadap server dev sungguhan.
// Jalankan: node --env-file=.env.local scripts/check-history.mjs <email> <password> [baseUrl]
import assert from "node:assert/strict";
import { createServerClient } from "@supabase/ssr";

const [, , email, password, base = "http://localhost:3000"] = process.argv;
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

const { data: all } = await supabase
  .from("transactions")
  .select("id, transaction_date, note")
  .eq("is_deleted", false);
assert.ok(all.length > 0, "butuh minimal 1 transaksi untuk uji");

const sample = all[0];
const date = sample.transaction_date;
const cases = [
  ["harian", date, (row) => row.transaction_date === date],
  [
    "mingguan",
    date,
    (row) => {
      const start = new Date(`${date}T00:00:00Z`);
      start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 7);
      const value = row.transaction_date;
      return value >= start.toISOString().slice(0, 10) && value < end.toISOString().slice(0, 10);
    },
  ],
  ["bulanan", date, (row) => row.transaction_date.slice(0, 7) === date.slice(0, 7)],
  ["tahunan", date, (row) => row.transaction_date.slice(0, 4) === date.slice(0, 4)],
];

for (const [periode, anchor, matches] of cases) {
  const expected = all.filter(matches);
  const response = await fetch(`${base}/transaksi?periode=${periode}&tanggal=${anchor}`, {
    headers: { cookie },
  });
  assert.equal(response.status, 200, `${periode}: HTTP ${response.status}`);
  const html = await response.text();

  const rendered = expected.filter((row) => html.includes(`/transaksi/${row.id}`)).length;
  assert.equal(
    rendered,
    Math.min(expected.length, 50),
    `${periode}: harap ${expected.length} transaksi, tampil ${rendered}`,
  );

  const outside = all.filter((row) => !matches(row));
  for (const row of outside.slice(0, 3)) {
    assert.ok(!html.includes(`/transaksi/${row.id}`), `${periode}: transaksi luar periode ikut tampil`);
  }
  console.log(`${periode}: ${expected.length} transaksi sesuai`);
}

const empty = await fetch(`${base}/transaksi?periode=harian&tanggal=2001-01-01`, { headers: { cookie } });
const emptyHtml = await empty.text();
assert.ok(emptyHtml.includes("Belum ada transaksi"), "keadaan kosong tidak tampil");

console.log("UJI RIWAYAT LULUS");
