export function todayJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function currentMonthJakarta(): string {
  return todayJakarta().slice(0, 7);
}

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${monthNames[monthNumber - 1]} ${year}`;
}

export function formatDateLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${day} ${monthNames[month - 1]} ${year}`;
}

export function isValidMonth(value: string | undefined): value is string {
  return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function isValidDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export type Periode = "harian" | "mingguan" | "bulanan" | "tahunan";

export const periodeOptions: { value: Periode; label: string }[] = [
  { value: "harian", label: "Harian" },
  { value: "mingguan", label: "Mingguan" },
  { value: "bulanan", label: "Bulanan" },
  { value: "tahunan", label: "Tahunan" },
];

export function isPeriode(value: string | undefined): value is Periode {
  return periodeOptions.some((option) => option.value === value);
}

function utc(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  const date = utc(value);
  date.setUTCDate(date.getUTCDate() + days);
  return iso(date);
}

function firstOfMonth(value: string): string {
  return `${value.slice(0, 7)}-01`;
}

// Minggu mulai Senin (kebiasaan Indonesia).
function startOfWeek(value: string): string {
  const day = utc(value).getUTCDay();
  return addDays(value, -((day + 6) % 7));
}

// Rentang setengah terbuka: start <= tanggal < end.
export function periodRange(
  periode: Periode,
  anchor: string,
): { start: string; end: string } {
  if (periode === "harian") return { start: anchor, end: addDays(anchor, 1) };
  if (periode === "mingguan") {
    const start = startOfWeek(anchor);
    return { start, end: addDays(start, 7) };
  }
  if (periode === "bulanan") {
    const start = firstOfMonth(anchor);
    const [year, monthNumber] = start.split("-").map(Number);
    return { start, end: iso(new Date(Date.UTC(year, monthNumber, 1))) };
  }
  const year = Number(anchor.slice(0, 4));
  return { start: `${year}-01-01`, end: `${year + 1}-01-01` };
}

export function shiftPeriod(periode: Periode, anchor: string, delta: number): string {
  if (periode === "harian") return addDays(anchor, delta);
  if (periode === "mingguan") return addDays(anchor, delta * 7);
  if (periode === "bulanan") {
    const [year, monthNumber] = anchor.split("-").map(Number);
    return iso(new Date(Date.UTC(year, monthNumber - 1 + delta, 1)));
  }
  return `${Number(anchor.slice(0, 4)) + delta}-01-01`;
}

export function formatPeriodLabel(periode: Periode, anchor: string): string {
  if (periode === "harian") return formatDateLabel(anchor);
  if (periode === "mingguan") {
    const { start } = periodRange(periode, anchor);
    return `${formatDateLabel(start)} – ${formatDateLabel(addDays(start, 6))}`;
  }
  if (periode === "bulanan") return formatMonthLabel(anchor.slice(0, 7));
  return anchor.slice(0, 4);
}
