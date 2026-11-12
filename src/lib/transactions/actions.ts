"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { transactionSchema } from "@/lib/validation";
import {
  addTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/lib/data";

export type TransactionState = { error?: string; fieldErrors?: Record<string, string> };

function parse(formData: FormData) {
  const raw = {
    type: String(formData.get("type") ?? ""),
    amount: Number(String(formData.get("amount") ?? "").replace(/\D/g, "")),
    wallet_id: String(formData.get("wallet_id") ?? ""),
    to_wallet_id: formData.get("to_wallet_id") ? String(formData.get("to_wallet_id")) : null,
    category_id: formData.get("category_id") ? String(formData.get("category_id")) : null,
    note: formData.get("note") ? String(formData.get("note")) : null,
    transaction_date: String(formData.get("transaction_date") ?? ""),
  };
  return transactionSchema.safeParse(raw);
}

export async function saveTransaction(
  _state: TransactionState,
  formData: FormData,
): Promise<TransactionState> {
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const parsed = parse(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { error: parsed.error.issues[0].message, fieldErrors };
  }

  try {
    if (id) {
      await updateTransaction(id, parsed.data);
    } else {
      await addTransaction(parsed.data);
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal menyimpan transaksi." };
  }

  revalidatePath("/");
  revalidatePath("/transaksi");
  redirect("/transaksi?pesan=tersimpan");
}

export async function removeTransaction(id: string): Promise<void> {
  await deleteTransaction(id);
  revalidatePath("/");
  revalidatePath("/transaksi");
  redirect("/transaksi?pesan=dihapus");
}
