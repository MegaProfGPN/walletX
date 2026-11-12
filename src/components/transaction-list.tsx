import Link from "next/link";
import { Fragment } from "react";
import { formatRupiah } from "@/lib/format";
import { formatDateLabel } from "@/lib/date";
import type { Category, Transaction, Wallet } from "@/lib/types";

const typeLabels: Record<Transaction["type"], string> = {
  income: "Pemasukan",
  expense: "Pengeluaran",
  transfer: "Transfer",
};

export function TransactionList({
  transactions,
  wallets,
  categories,
  groupByDate = false,
}: {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  groupByDate?: boolean;
}) {
  const walletName = new Map(wallets.map((wallet) => [wallet.id, wallet.name]));
  const categoryName = new Map(categories.map((category) => [category.id, category.name]));

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface px-4 py-10 text-center">
        <p className="text-sm text-muted">
          Belum ada transaksi pada periode ini. Mulai catat pemasukan atau pengeluaran Anda.
        </p>
        <Link
          href="/transaksi/baru"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white"
        >
          Catat transaksi
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {transactions.map((transaction, index) => {
        const isIncome = transaction.type === "income";
        const sign = isIncome ? "+" : "-";
        const color = isIncome ? "text-income" : "text-expense";
        const showDate =
          groupByDate && transaction.transaction_date !== transactions[index - 1]?.transaction_date;
        return (
            <Fragment key={transaction.id}>
              {showDate ? (
                <li className="bg-canvas px-4 py-2 text-xs font-medium text-muted">
                  {formatDateLabel(transaction.transaction_date)}
                </li>
              ) : null}
              <li>
                <Link
                  href={`/transaksi/${transaction.id}`}
                  className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 hover:bg-canvas"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {transaction.type === "transfer"
                        ? `Transfer ${walletName.get(transaction.wallet_id) ?? ""} → ${walletName.get(transaction.to_wallet_id ?? "") ?? ""}`
                        : categoryName.get(transaction.category_id ?? "") ?? "Tanpa kategori"}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {groupByDate ? null : `${formatDateLabel(transaction.transaction_date)} · `}
                      {walletName.get(transaction.wallet_id) ?? "Dompet"}
                      {transaction.note ? ` · ${transaction.note}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold ${color}`}>
                    {sign}
                    {formatRupiah(transaction.amount)}
                  </span>
                </Link>
              </li>
            </Fragment>
          );
      })}
    </ul>
  );
}

export function TransactionTypeBadge({ type }: { type: Transaction["type"] }) {
  return <span className="text-xs text-muted">{typeLabels[type]}</span>;
}
