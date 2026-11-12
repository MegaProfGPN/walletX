// Uji logika rentang periode. Jalankan: node scripts/check-periods.mjs
import assert from "node:assert/strict";
import { periodRange, shiftPeriod, formatPeriodLabel } from "../src/lib/date.ts";

// Harian
assert.deepEqual(periodRange("harian", "2026-11-12"), { start: "2026-11-12", end: "2026-11-13" });
assert.equal(shiftPeriod("harian", "2026-11-30", 1), "2026-12-01");

// Mingguan: Senin–Minggu, lintas bulan dan tahun
assert.deepEqual(periodRange("mingguan", "2026-11-12"), { start: "2026-11-09", end: "2026-11-16" });
assert.deepEqual(periodRange("mingguan", "2026-11-09"), { start: "2026-11-09", end: "2026-11-16" });
assert.deepEqual(periodRange("mingguan", "2026-11-15"), { start: "2026-11-09", end: "2026-11-16" });
assert.deepEqual(periodRange("mingguan", "2027-01-01"), { start: "2026-12-28", end: "2027-01-04" });
assert.equal(shiftPeriod("mingguan", "2026-12-28", 1), "2027-01-04");

// Bulanan: Desember harus lanjut ke Januari tahun berikutnya
assert.deepEqual(periodRange("bulanan", "2026-11-12"), { start: "2026-11-01", end: "2026-12-01" });
assert.deepEqual(periodRange("bulanan", "2026-12-15"), { start: "2026-12-01", end: "2027-01-01" });
assert.equal(shiftPeriod("bulanan", "2026-12-01", 1), "2027-01-01");
assert.equal(shiftPeriod("bulanan", "2026-01-01", -1), "2025-12-01");

// Tahunan
assert.deepEqual(periodRange("tahunan", "2026-11-12"), { start: "2026-01-01", end: "2027-01-01" });
assert.equal(shiftPeriod("tahunan", "2026-05-05", 1), "2027-01-01");

// Label
assert.equal(formatPeriodLabel("bulanan", "2026-11-01"), "November 2026");
assert.equal(formatPeriodLabel("tahunan", "2026-11-12"), "2026");
assert.equal(formatPeriodLabel("harian", "2026-11-12"), "12 November 2026");
assert.equal(formatPeriodLabel("mingguan", "2026-11-12"), "9 November 2026 – 15 November 2026");

console.log("UJI PERIODE LULUS");
