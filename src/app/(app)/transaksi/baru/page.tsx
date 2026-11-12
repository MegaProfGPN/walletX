import { getCategories, getWallets } from "@/lib/data";
import { todayJakarta } from "@/lib/date";
import { saveTransaction } from "@/lib/transactions/actions";
import { TransactionForm } from "@/components/transaction-form";

export default async function NewTransactionPage() {
  const [wallets, categories] = await Promise.all([getWallets(), getCategories()]);

  if (wallets.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-surface px-4 py-10 text-center text-sm text-muted">
        Belum ada dompet. Dompet seharusnya dibuat otomatis saat akun dibuat.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-ink">Catat transaksi</h1>
      <TransactionForm
        action={saveTransaction}
        wallets={wallets}
        categories={categories}
        today={todayJakarta()}
      />
    </div>
  );
}
