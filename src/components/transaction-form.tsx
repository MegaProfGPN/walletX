"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { Category, Transaction, TransactionType, Wallet } from "@/lib/types";
import type { TransactionState } from "@/lib/transactions/actions";

type Action = (state: TransactionState, formData: FormData) => Promise<TransactionState>;

const initial: TransactionState = {};

const typeLabels: Record<TransactionType, string> = {
  expense: "Pengeluaran",
  income: "Pemasukan",
  transfer: "Transfer",
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-expense">{message}</p>;
}

export function TransactionForm({
  action,
  wallets,
  categories,
  today,
  transaction,
}: {
  action: Action;
  wallets: Wallet[];
  categories: Category[];
  today: string;
  transaction?: Transaction;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");

  const filteredCategories = categories.filter((category) => category.type === type);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {transaction ? <input type="hidden" name="id" value={transaction.id} /> : null}

      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-expense">
          {state.error}
        </p>
      ) : null}

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Jenis</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["expense", "income"] as const).map((value) => (
            <label
              key={value}
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium ${
                type === value
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-line bg-surface text-ink"
              }`}
            >
              <input
                type="radio"
                name="type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
                className="sr-only"
              />
              {typeLabels[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink">Jumlah (Rp)</span>
        <input
          name="amount"
          inputMode="numeric"
          required
          defaultValue={transaction?.amount}
          placeholder="0"
          className="min-h-11 rounded-lg border border-line bg-surface px-3 text-base text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <FieldError message={state.fieldErrors?.amount} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink">Tanggal</span>
        <input
          name="transaction_date"
          type="date"
          required
          defaultValue={transaction?.transaction_date ?? today}
          className="min-h-11 rounded-lg border border-line bg-surface px-3 text-base text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <FieldError message={state.fieldErrors?.transaction_date} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink">Dompet</span>
        <select
          name="wallet_id"
          required
          defaultValue={transaction?.wallet_id ?? wallets[0]?.id}
          className="min-h-11 rounded-lg border border-line bg-surface px-3 text-base text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.wallet_id} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink">Kategori</span>
        <select
          name="category_id"
          required
          defaultValue={transaction?.category_id ?? filteredCategories[0]?.id}
          key={type}
          className="min-h-11 rounded-lg border border-line bg-surface px-3 text-base text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.category_id} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink">Catatan (opsional)</span>
        <textarea
          name="note"
          maxLength={500}
          rows={2}
          defaultValue={transaction?.note ?? ""}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <FieldError message={state.fieldErrors?.note} />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 flex-1 rounded-lg bg-brand-600 px-4 text-base font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
        <Link
          href="/transaksi"
          className="flex min-h-11 items-center justify-center rounded-lg border border-line px-4 text-base text-ink"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
