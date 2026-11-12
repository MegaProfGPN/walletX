import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import { formatMonthLabel, formatPeriodLabel, periodeOptions, shiftPeriod, type Periode } from "@/lib/date";

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

export function PeriodPicker({
  periode,
  anchor,
  basePath,
}: {
  periode: Periode;
  anchor: string;
  basePath: string;
}) {
  const previous = shiftPeriod(periode, anchor, -1);
  const next = shiftPeriod(periode, anchor, 1);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-1 rounded-xl border border-line bg-surface p-1">
        {periodeOptions.map((option) => {
          const active = option.value === periode;
          return (
            <Link
              key={option.value}
              href={`${basePath}?periode=${option.value}&tanggal=${anchor}`}
              aria-current={active ? "true" : undefined}
              className={`flex min-h-11 items-center justify-center rounded-lg text-sm ${
                active ? "bg-brand-50 font-medium text-brand-700" : "text-ink hover:bg-canvas"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface p-1">
        <Link
          href={`${basePath}?periode=${periode}&tanggal=${previous}`}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-ink hover:bg-canvas"
          aria-label="Periode sebelumnya"
        >
          ‹
        </Link>
        <span className="text-center text-sm font-medium text-ink">
          {formatPeriodLabel(periode, anchor)}
        </span>
        <Link
          href={`${basePath}?periode=${periode}&tanggal=${next}`}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-ink hover:bg-canvas"
          aria-label="Periode berikutnya"
        >
          ›
        </Link>
      </div>
    </div>
  );
}
