// Load the CSV and group days into monthly summaries.
// Dates stay as "YYYY-MM-DD" strings to avoid timezone shifts.
import { CSV_HEADER } from './config.js';

/** "YYYY-MM" key for one month. */
export function toMonthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Days in a month, leap years included. */
export function getDaysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** True for a real date like "2000-02-29" (rejects "2000-02-30"). */
function isValidDateString(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const parsed = new Date(`${text}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().startsWith(text);
}

/** CSV cell → number; blank → NaN. */
function parseTemperature(text) {
  return text === undefined || text.trim() === '' ? NaN : Number(text);
}

/** Parse the CSV into sorted daily records. Throws on bad rows. */
export function parseTemperatureCsv(csvText) {
  const [header, ...rows] = csvText.trim().replace(/\r/g, '').split('\n');
  if (header !== CSV_HEADER) {
    throw new Error(`Unexpected CSV columns. Expected "${CSV_HEADER}".`);
  }

  const seenDates = new Set();
  const records = [];

  for (const row of rows) {
    if (!row.trim()) continue;
    const [date, maxText, minText] = row.split(',');
    const maximum = parseTemperature(maxText);
    const minimum = parseTemperature(minText);

    const isValid = isValidDateString(date)
      && Number.isFinite(maximum)
      && Number.isFinite(minimum)
      && minimum <= maximum
      && !seenDates.has(date);
    if (!isValid) throw new Error(`Invalid or duplicate record: "${row}"`);

    seenDates.add(date);
    records.push({
      date,
      year: Number(date.slice(0, 4)),
      month: Number(date.slice(5, 7)),
      day: Number(date.slice(8, 10)),
      maximum,
      minimum,
    });
  }

  return records.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Group records by month. Max = highest daily max, min = lowest daily min.
 * Returns Map<"YYYY-MM", { key, year, month, maximum, minimum, days, daysInMonth, isComplete }>.
 */
export function summarizeByMonth(records) {
  const summaries = new Map();

  for (const record of records) {
    const key = toMonthKey(record.year, record.month);
    if (!summaries.has(key)) {
      summaries.set(key, {
        key,
        year: record.year,
        month: record.month,
        maximum: -Infinity,
        minimum: Infinity,
        days: [],
      });
    }
    const summary = summaries.get(key);
    summary.maximum = Math.max(summary.maximum, record.maximum);
    summary.minimum = Math.min(summary.minimum, record.minimum);
    summary.days.push(record);
  }

  for (const summary of summaries.values()) {
    summary.days.sort((a, b) => a.day - b.day);
    summary.daysInMonth = getDaysInMonth(summary.year, summary.month);
    summary.isComplete = summary.days.length === summary.daysInMonth;
  }

  return summaries;
}

/** All years in the data, oldest first. */
export function getYearRange(records) {
  const firstYear = records[0].year;
  const lastYear = records.at(-1).year;
  return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
}
