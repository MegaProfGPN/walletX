import { createClient } from "@/lib/supabase/server";
import type { Category, Transaction, Wallet } from "@/lib/types";
import { transactionSchema, walletSchema, categorySchema, type TransactionInput } from "@/lib/validation";

// Semua baca-tulis data lewat folder ini (PRD Bagian 5).
// Fase 2 akan mengganti isi file ini ke Dexie tanpa mengubah komponen UI.

export const PAGE_SIZE = 50;

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

export async function getCategories(type?: "income" | "expense"): Promise<Category[]> {
  const supabase = await createClient();
  let query = supabase.from("categories").select("*").eq("is_deleted", false);
  if (type) query = query.eq("type", type);
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getTransactions(options?: {
  month?: string;
  page?: number;
}): Promise<Transaction[]> {
  const supabase = await createClient();
  const page = Math.max(1, options?.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("transactions")
    .select("*")
    .eq("is_deleted", false)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options?.month) {
    const start = `${options.month}-01`;
    const [year, month] = options.month.split("-").map(Number);
    const end = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
    query = query.gte("transaction_date", start).lt("transaction_date", end);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function addTransaction(input: TransactionInput): Promise<Transaction> {
  const payload = transactionSchema.parse(input);
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Sesi tidak ditemukan. Silakan masuk ulang.");

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      ...payload,
      id: crypto.randomUUID(),
      user_id: userData.user.id,
      client_updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTransaction(
  id: string,
  input: Partial<TransactionInput>,
): Promise<Transaction> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .update({ ...input, client_updated_at: new Date().toISOString() })
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
  const [year, monthNumber] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10);

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

export async function addWallet(input: { name: string; initial_balance?: number }): Promise<Wallet> {
  const payload = walletSchema.parse(input);
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Sesi tidak ditemukan. Silakan masuk ulang.");

  const { data, error } = await supabase
    .from("wallets")
    .insert({
      ...payload,
      id: crypto.randomUUID(),
      user_id: userData.user.id,
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
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Sesi tidak ditemukan. Silakan masuk ulang.");

  const { data, error } = await supabase
    .from("categories")
    .insert({
      ...payload,
      id: crypto.randomUUID(),
      user_id: userData.user.id,
      client_updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
