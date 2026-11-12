import Link from "next/link";
import { Suspense } from "react";
import { getCategories, getMonthlyTotals, getTotalBalance, getTransactions, getWallets, PAGE_SIZE } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { currentMonthJakarta, formatMonthLabel, isValidMonth } from "@/lib/date";
import { MonthPicker, SummaryCard } from "@/components/summary-card";
import { TransactionList } from "@/components/transaction-list";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>;
}) {
  const { bulan } = await searchParams;
  const month = isValidMonth(bulan) ? bulan : currentMonthJakarta();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold text-ink">Ringkasan</h1>
        <MonthPicker month={month} basePath="/" />
      </div>

      <Suspense key={month} fallback={<DashboardSkeleton />}>
        <DashboardContent month={month} />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl bg-line" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-xl bg-line" />
    </div>
  );
}

async function DashboardContent({ month }: { month: string }) {
  const [{ income, expense }, balance, transactions, wallets, categories] = await Promise.all([
    getMonthlyTotals(month),
    getTotalBalance(),
    getTransactions({ month, page: 1 }),
    getWallets(),
    getCategories(undefined, { includeArchived: true }),
  ]);

  return (
    <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryCard label="Pemasukan bulan ini" value={income} tone="income" />
        <SummaryCard label="Pengeluaran bulan ini" value={expense} tone="expense" />
        <SummaryCard
          label={`Saldo ${formatMonthLabel(month)}`}
          value={income - expense}
          tone="neutral"
        />
      </section>

      <section className="rounded-xl border border-line bg-surface px-4 py-3">
        <p className="text-xs text-muted">Total saldo semua dompet</p>
        <p className="text-xl font-semibold text-ink">{formatRupiah(balance)}</p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Transaksi terbaru</h2>
          <Link href={`/transaksi?bulan=${month}`} className="text-sm text-brand-600 underline">
            Lihat semua
          </Link>
        </div>
        <TransactionList transactions={transactions.rows} wallets={wallets} categories={categories} />
        {transactions.total > PAGE_SIZE ? (
          <p className="text-center text-xs text-muted">
            Menampilkan {PAGE_SIZE} dari {transactions.total} transaksi.{" "}
            <Link href={`/transaksi?bulan=${month}`} className="underline">
              Lihat daftar lengkap
            </Link>
          </p>
        ) : null}
      </section>
    </>
  );
}
