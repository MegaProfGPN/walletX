// Uji asap lapisan data terhadap Supabase sungguhan.
// Jalankan: node --env-file=.env.local scripts/smoke-data.mjs <email> <password>
// Dibutuhkan agar akun uji sudah terkonfirmasi. Tidak menulis data jika gagal.
import assert from "node:assert/strict";
import { createServerClient } from "@supabase/ssr";
import { randomUUID } from "node:crypto";

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error("Pakai: node --env-file=.env.local scripts/smoke-data.mjs <email> <password>");
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

const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
  email,
  password,
});
assert.equal(authError, null, `login gagal: ${authError?.message}`);
const userId = auth.user.id;

const { data: wallets, error: walletError } = await supabase
  .from("wallets")
  .select("*")
  .eq("is_deleted", false);
assert.equal(walletError, null);
assert.ok(wallets.length >= 1, "dompet bawaan tidak ada");

const { data: categories, error: categoryError } = await supabase
  .from("categories")
  .select("*")
  .eq("is_deleted", false);
assert.equal(categoryError, null);
assert.equal(categories.length, 7, `kategori bawaan harus 7, dapat ${categories.length}`);

const expenseCategory = categories.find((row) => row.type === "expense");
const incomeCategory = categories.find((row) => row.type === "income");
const wallet = wallets[0];
const today = new Date().toISOString().slice(0, 10);

async function insert(payload) {
  return supabase
    .from("transactions")
    .insert({ id: randomUUID(), user_id: userId, ...payload })
    .select()
    .single();
}

const created = [];
try {
  const expense = await insert({
    wallet_id: wallet.id,
    category_id: expenseCategory.id,
    type: "expense",
    amount: 12500,
    transaction_date: today,
  });
  assert.equal(expense.error, null, `insert expense gagal: ${expense.error?.message}`);
  created.push(expense.data.id);

  const income = await insert({
    wallet_id: wallet.id,
    category_id: incomeCategory.id,
    type: "income",
    amount: 50000,
    transaction_date: today,
  });
  assert.equal(income.error, null);
  created.push(income.data.id);

  const invalidAmount = await insert({
    wallet_id: wallet.id,
    category_id: expenseCategory.id,
    type: "expense",
    amount: 0,
    transaction_date: today,
  });
  assert.notEqual(invalidAmount.error, null, "amount 0 harus ditolak");
  assert.match(invalidAmount.error.message, /transactions_amount_positive/);

  const invalidTransfer = await insert({
    wallet_id: wallet.id,
    type: "transfer",
    amount: 1000,
    transaction_date: today,
  });
  assert.notEqual(invalidTransfer.error, null, "transfer tanpa tujuan harus ditolak");
  assert.match(invalidTransfer.error.message, /transactions_transfer_rules/);

  const before = await supabase
    .from("transactions")
    .select("server_updated_at")
    .eq("id", created[0])
    .single();
  await new Promise((resolve) => setTimeout(resolve, 1100));

  const softDeleted = await supabase
    .from("transactions")
    .update({ is_deleted: true })
    .eq("id", created[0])
    .select()
    .single();
  assert.equal(softDeleted.error, null);
  assert.equal(softDeleted.data.is_deleted, true);
  assert.notEqual(
    softDeleted.data.server_updated_at,
    before.data.server_updated_at,
    "trigger server_updated_at tidak berjalan",
  );

  const stillThere = await supabase
    .from("transactions")
    .select("id, is_deleted")
    .eq("id", created[0])
    .single();
  assert.equal(stillThere.error, null, "baris hilang setelah soft delete");

  const visible = await supabase
    .from("transactions")
    .select("id")
    .eq("is_deleted", false)
    .eq("id", created[0]);
  assert.equal(visible.data.length, 0, "transaksi terhapus masih tampil");

  console.log("UJI DATA LULUS:", {
    dompet: wallets.length,
    kategori: categories.length,
    dibuat: created.length,
  });
} finally {
  for (const id of created) {
    await supabase.from("transactions").update({ is_deleted: true }).eq("id", id);
  }
}
