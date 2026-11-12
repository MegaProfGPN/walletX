// Diagnosa: tampilkan semua transaksi tersimpan + total per bulan.
// Jalankan: node --env-file=.env.local scripts/check-dates.mjs <email> <password>
import { createServerClient } from "@supabase/ssr";

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error("Pakai: node --env-file=.env.local scripts/check-dates.mjs <email> <password>");
  process.exit(1);
}

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
if (error) {
  console.error("login gagal:", error.message);
  process.exit(1);
}

const { data, error: readError } = await supabase
  .from("transactions")
  .select("type, amount, transaction_date, is_deleted")
  .order("transaction_date", { ascending: false });
if (readError) {
  console.error(readError.message);
  process.exit(1);
}

const active = data.filter((row) => !row.is_deleted);
console.log(`Total baris: ${data.length}, aktif: ${active.length}`);
for (const row of active) {
  console.log(`  ${row.transaction_date}  ${row.type.padEnd(7)}  ${row.amount}`);
}

const perMonth = {};
for (const row of active) {
  const key = row.transaction_date.slice(0, 7);
  perMonth[key] ??= { income: 0, expense: 0 };
  if (row.type === "income") perMonth[key].income += row.amount;
  if (row.type === "expense") perMonth[key].expense += row.amount;
}
console.log("Per bulan:", perMonth);
