import Link from "next/link";
import { getCategories, getTransactions, getWallets, PAGE_SIZE } from "@/lib/data";
import {
  currentMonthJakarta,
  formatPeriodLabel,
  isPeriode,
  isValidDate,
  isValidMonth,
  periodRange,
  type Periode,
} from "@/lib/date";
import { PeriodPicker } from "@/components/summary-card";
import { TransactionList } from "@/components/transaction-list";

const notices: Record<string, string> = {
  tersimpan: "Transaksi berhasil disimpan.",
  dihapus: "Transaksi berhasil dihapus.",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    periode?: string;
    tanggal?: string;
    bulan?: string;
    halaman?: string;
    pesan?: string;
  }>;
}) {
  const query = await searchParams;
  const periode: Periode = isPeriode(query.periode) ? query.periode : "bulanan";
  const anchor = isValidDate(query.tanggal)
    ? query.tanggal
    : isValidMonth(query.bulan)
      ? `${query.bulan}-01`
      : `${currentMonthJakarta()}-01`;
  const page = Math.max(1, Number(query.halaman) || 1);
  const notice = query.pesan ? notices[query.pesan] : undefined;
  const { start, end } = periodRange(periode, anchor);
  const rangeQuery = `periode=${periode}&tanggal=${anchor}`;

  const [transactions, wallets, categories] = await Promise.all([
    getTransactions({ start, end, page }),
    getWallets(),
    getCategories(undefined, { includeArchived: true }),
  ]);

  const totalPages = Math.max(1, Math.ceil(transactions.total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-ink">Transaksi</h1>
          <Link
            href="/transaksi/baru"
            className="flex min-h-11 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white"
          >
            + Catat
          </Link>
        </div>
        <PeriodPicker periode={periode} anchor={anchor} basePath="/transaksi" />
      </div>

      {notice ? (
        <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          {notice}
        </p>
      ) : null}

      <TransactionList
        transactions={transactions.rows}
        wallets={wallets}
        categories={categories}
        groupByDate
      />

      {transactions.total > 0 ? (
        <div className="flex items-center justify-between gap-2 text-sm">
          <Link
            href={`/transaksi?${rangeQuery}&halaman=${Math.max(1, page - 1)}`}
            aria-disabled={page <= 1}
            className={`flex min-h-11 items-center rounded-lg border border-line px-3 ${
              page <= 1 ? "pointer-events-none opacity-40" : "bg-surface text-ink"
            }`}
          >
            Sebelumnya
          </Link>
          <span className="text-center text-muted">
            Halaman {Math.min(page, totalPages)} dari {totalPages} ·{" "}
            {formatPeriodLabel(periode, anchor)}
          </span>
          <Link
            href={`/transaksi?${rangeQuery}&halaman=${Math.min(totalPages, page + 1)}`}
            aria-disabled={page >= totalPages}
            className={`flex min-h-11 items-center rounded-lg border border-line px-3 ${
              page >= totalPages ? "pointer-events-none opacity-40" : "bg-surface text-ink"
            }`}
          >
            Berikutnya
          </Link>
        </div>
      ) : null}
    </div>
  );
}
