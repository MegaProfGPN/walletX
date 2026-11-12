import { createClient } from "@/lib/supabase/server";
import type { Category, Transaction, Wallet } from "@/lib/types";
import {
  transactionSchema,
  walletSchema,
  categorySchema,
  type TransactionInput,
} from "@/lib/validation";

// Semua baca-tulis data lewat folder ini (PRD Bagian 5).
// Fase 2 akan mengganti isi file ini ke Dexie tanpa mengubah komponen UI.

export const PAGE_SIZE = 50;

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sesi tidak ditemukan. Silakan masuk ulang.");
  return data.user.id;
}

function monthRange(month: string): { start: string; end: string } {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10);
  return { start, end };
}

export async function getWallets(): Promise<Wallet[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getCategories(
  type?: "income" | "expense",
  options?: { includeArchived?: boolean },
): Promise<Category[]> {
  const supabase = await createClient();
  let query = supabase.from("categories").select("*").eq("is_deleted", false);
  if (!options?.includeArchived) query = query.eq("is_archived", false);
  if (type) query = query.eq("type", type);
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getTransactions(options?: {
  month?: string;
  start?: string;
  end?: string;
  page?: number;
}): Promise<{ rows: Transaction[]; total: number }> {
  const supabase = await createClient();
  const page = Math.max(1, options?.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("is_deleted", false)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  const range = options?.month ? monthRange(options.month) : null;
  const start = options?.start ?? range?.start;
  const end = options?.end ?? range?.end;
  if (start) query = query.gte("transaction_date", start);
  if (end) query = query.lt("transaction_date", end);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data, total: count ?? data.length };
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("is_deleted", false)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function addTransaction(input: TransactionInput): Promise<Transaction> {
  const payload = transactionSchema.parse(input);
  const userId = await requireUserId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      ...payload,
      id: crypto.randomUUID(),
      user_id: userId,
      client_updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTransaction(
  id: string,
  input: TransactionInput,
): Promise<Transaction> {
  const payload = transactionSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .update({ ...payload, client_updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ is_deleted: true, client_updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function getMonthlyTotals(
  month: string,
): Promise<{ income: number; expense: number }> {
  const supabase = await createClient();
  const { start, end } = monthRange(month);

  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount")
    .eq("is_deleted", false)
    .neq("type", "transfer")
    .gte("transaction_date", start)
    .lt("transaction_date", end);
  if (error) throw error;

  let income = 0;
  let expense = 0;
  for (const row of data) {
    if (row.type === "income") income += row.amount;
    if (row.type === "expense") expense += row.amount;
  }
  return { income, expense };
}

export async function getTotalBalance(): Promise<number> {
  const supabase = await createClient();
  const [{ data: wallets, error: walletError }, { data: transactions, error: txError }] =
    await Promise.all([
      supabase.from("wallets").select("initial_balance").eq("is_deleted", false).eq("is_archived", false),
      supabase
        .from("transactions")
        .select("type, amount, wallet_id, to_wallet_id")
        .eq("is_deleted", false),
    ]);
  if (walletError) throw walletError;
  if (txError) throw txError;

  let balance = wallets.reduce((sum, wallet) => sum + wallet.initial_balance, 0);
  for (const tx of transactions) {
    if (tx.type === "income") balance += tx.amount;
    if (tx.type === "expense") balance -= tx.amount;
    // Transfer tidak mengubah total saldo semua dompet.
  }
  return balance;
}

export async function addWallet(input: { name: string; initial_balance?: number }): Promise<Wallet> {
  const payload = walletSchema.parse(input);
  const userId = await requireUserId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("wallets")
    .insert({
      ...payload,
      id: crypto.randomUUID(),
      user_id: userId,
      client_updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addCategory(input: {
  name: string;
  type: "income" | "expense";
  icon?: string | null;
}): Promise<Category> {
  const payload = categorySchema.parse(input);
  const userId = await requireUserId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      ...payload,
      id: crypto.randomUUID(),
      user_id: userId,
      client_updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
