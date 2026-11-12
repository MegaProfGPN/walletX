import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import { formatMonthLabel } from "@/lib/date";

export function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "income" | "expense" | "neutral";
}) {
  const color =
    tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "text-ink";
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${color}`}>{formatRupiah(value)}</p>
    </div>
  );
}

export function MonthPicker({ month, basePath }: { month: string; basePath: string }) {
  const [year, monthNumber] = month.split("-").map(Number);
  const previous = new Date(Date.UTC(year, monthNumber - 2, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 7);

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface p-1">
      <Link
        href={`${basePath}?bulan=${previous}`}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-ink hover:bg-canvas"
        aria-label="Bulan sebelumnya"
      >
        ‹
      </Link>
      <span className="text-sm font-medium text-ink">{formatMonthLabel(month)}</span>
      <Link
        href={`${basePath}?bulan=${next}`}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-ink hover:bg-canvas"
        aria-label="Bulan berikutnya"
      >
        ›
      </Link>
    </div>
  );
}
