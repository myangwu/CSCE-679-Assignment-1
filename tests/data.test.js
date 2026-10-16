/**
 * Unit tests for the data and geometry modules (no browser needed).
 * Run with: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseTemperatureCsv, summarizeByMonth, getYearRange } from '../src/data.js';
import { temperatureToColor } from '../src/scales.js';
import { buildDailyLinePath, findDayAtPosition } from '../src/daily-lines.js';
import { TEMPERATURE_SCALE, CSV_HEADER } from '../src/config.js';

const csvText = readFileSync(new URL('../temperature_daily.csv', import.meta.url), 'utf8');
const records = parseTemperatureCsv(csvText);
const months = summarizeByMonth(records);

test('all records load in date order', () => {
  assert.equal(records.length, 7532);
  assert.equal(records[0].date, '1997-01-01');
  assert.equal(records.at(-1).date, '2017-10-28');
  assert.equal(months.size, 250);
  assert.deepEqual(getYearRange(records).slice(0, 2), [1997, 1998]);
  assert.equal(getYearRange(records).at(-1), 2017);
});

test('monthly values are extremes and match the reference tooltip (2002-03: 28 / 14)', () => {
  assert.equal(months.get('2002-03').maximum, 28);
  assert.equal(months.get('2002-03').minimum, 14);
});

test('every monthly extreme agrees with its daily records', () => {
  for (const month of months.values()) {
    assert.equal(month.maximum, Math.max(...month.days.map(day => day.maximum)));
    assert.equal(month.minimum, Math.min(...month.days.map(day => day.minimum)));
  }
});

test('leap years and the incomplete last month are handled', () => {
  assert.equal(months.get('2016-02').daysInMonth, 29);
  assert.equal(months.get('2016-02').isComplete, true);
  assert.equal(months.get('2017-10').days.length, 28);
  assert.equal(months.get('2017-10').isComplete, false);
  assert.equal(months.has('2017-11'), false);
});

test('invalid, reversed, blank, and duplicate rows are rejected', () => {
  const badRows = [
    '2000-02-30,20,10',                    // impossible date
    '2000-01-01,10,20',                    // min > max
    '2000-01-01,,10',                      // blank value
    '2000-01-01,x,10',                     // not a number
    '2000-01-01,20,10\n2000-01-01,21,11',  // duplicate date
  ];
  for (const row of badRows) {
    assert.throws(() => parseTemperatureCsv(`${CSV_HEADER}\n${row}`));
  }
});

test('cell colors match the reference image at bin boundaries', () => {
  const expected = [[18, '#ffffbf'], [24, '#fee08b'], [25, '#fdae61'], [28, '#fdae61'],
    [29, '#f46d43'], [32, '#d53e4f'], [36, '#9e0142']];
  for (const [temperature, color] of expected) {
    assert.equal(temperatureToColor(temperature), color, `${temperature} °C`);
  }
});

test('color scale clamps values outside 0–40 °C', () => {
  const { colors } = TEMPERATURE_SCALE;
  assert.equal(temperatureToColor(-1), colors[0]);
  assert.equal(temperatureToColor(40), colors.at(-1));
  assert.equal(temperatureToColor(45), colors.at(-1));
});

test('daily lines break at missing days instead of joining across them', () => {
  const summary = {
    daysInMonth: 5,
    days: [1, 2, 4, 5].map(day => ({ day, maximum: 20, minimum: 10 })),
  };
  const commands = buildDailyLinePath(summary, 'maximum', 100, 50).split(' ').map(part => part[0]);
  assert.deepEqual(commands, ['M', 'L', 'M', 'L']);
});

test('pointer position maps to the nearest calendar day', () => {
  const october2017 = months.get('2017-10');
  const width = 100;
  assert.equal(findDayAtPosition(october2017, 0, width).day, 1);
  assert.equal(findDayAtPosition(october2017, 50, width).day, 16);
  // Days 29–31 have no data, so the far right edge returns nothing.
  assert.equal(findDayAtPosition(october2017, width, width), undefined);
});
