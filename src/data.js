/**
 * data.js — turns the raw CSV text into the monthly summaries both charts use.
 *
 * Dates are kept as "YYYY-MM-DD" strings (never JavaScript Date objects in
 * local time) so that no record can shift to a neighbouring day because of
 * the viewer's timezone.
 */
import { CSV_HEADER } from './config.js';

/**
 * @typedef {Object} DailyRecord
 * @property {string} date     Calendar date, "YYYY-MM-DD".
 * @property {number} year
 * @property {number} month    1–12.
 * @property {number} day      1–31.
 * @property {number} maximum  Highest temperature of the day (°C).
 * @property {number} minimum  Lowest temperature of the day (°C).
 */

/**
 * @typedef {Object} MonthSummary
 * @property {string} key           "YYYY-MM", used to look the month up.
 * @property {number} year
 * @property {number} month         1–12.
 * @property {number} maximum       Highest daily maximum in the month (°C).
 * @property {number} minimum       Lowest daily minimum in the month (°C).
 * @property {DailyRecord[]} days   Recorded days, sorted by day of month.
 * @property {number} daysInMonth   Calendar length (28–31).
 * @property {boolean} isComplete   True when every calendar day has a record.
 */

/** Builds the "YYYY-MM" key that identifies one month of one year. */
export function toMonthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Number of calendar days in a month (handles leap years). */
export function getDaysInMonth(year, month) {
  // Day 0 of the *next* month is the last day of this month.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** True when the text is a real calendar date written as "YYYY-MM-DD". */
function isValidDateString(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const parsed = new Date(`${text}T00:00:00Z`);
  // Rejects impossible dates such as 2000-02-30, which Date would roll over.
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().startsWith(text);
}

/** Converts a CSV cell to a number, returning NaN for blank cells. */
function parseTemperature(text) {
  return text === undefined || text.trim() === '' ? NaN : Number(text);
}

/**
 * Parses and validates the daily temperature CSV.
 * Throws a descriptive error on the first malformed or duplicate row, so bad
 * data is never silently drawn.
 *
 * @param {string} csvText  Full contents of temperature_daily.csv.
 * @returns {DailyRecord[]} Records sorted from oldest to newest.
 */
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
 * Groups daily records by month and computes each month's extremes.
 * Monthly maximum = max of daily highs; monthly minimum = min of daily lows
 * (these are extremes, not averages — matching the reference tooltip).
 *
 * @param {DailyRecord[]} records
 * @returns {Map<string, MonthSummary>} Keyed by "YYYY-MM".
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

/**
 * Lists every year covered by the records, oldest first.
 * @param {DailyRecord[]} records  Sorted records (see parseTemperatureCsv).
 * @returns {number[]}
 */
export function getYearRange(records) {
  const firstYear = records[0].year;
  const lastYear = records.at(-1).year;
  return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
}
