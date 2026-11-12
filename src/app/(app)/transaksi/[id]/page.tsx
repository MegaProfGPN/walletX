import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getTransaction, getWallets } from "@/lib/data";
import { todayJakarta } from "@/lib/date";
import { removeTransaction, saveTransaction } from "@/lib/transactions/actions";
import { TransactionForm } from "@/components/transaction-form";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [transaction, wallets, categories] = await Promise.all([
    getTransaction(id),
    getWallets(),
    getCategories(),
  ]);

  if (!transaction) notFound();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Ubah transaksi</h1>
        <Link href="/transaksi" className="text-sm text-muted underline">
          Kembali
        </Link>
      </div>

      <TransactionForm
        action={saveTransaction}
        wallets={wallets}
        categories={categories}
        today={todayJakarta()}
        transaction={transaction}
      />

      <form action={removeTransaction.bind(null, transaction.id)}>
        <button
          type="submit"
          className="min-h-11 w-full rounded-lg border border-expense px-4 text-sm font-medium text-expense"
        >
          Hapus transaksi
        </button>
      </form>
    </div>
  );
}
