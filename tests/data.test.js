// Unit tests. Run: npm test
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

test('loads all records', () => {
  assert.equal(records.length, 7532);
  assert.equal(records[0].date, '1997-01-01');
  assert.equal(records.at(-1).date, '2017-10-28');
  assert.equal(months.size, 250);
  assert.deepEqual(getYearRange(records).slice(0, 2), [1997, 1998]);
  assert.equal(getYearRange(records).at(-1), 2017);
});

test('matches reference tooltip', () => {
  assert.equal(months.get('2002-03').maximum, 28);
  assert.equal(months.get('2002-03').minimum, 14);
});

test('monthly max/min are correct', () => {
  for (const month of months.values()) {
    assert.equal(month.maximum, Math.max(...month.days.map(day => day.maximum)));
    assert.equal(month.minimum, Math.min(...month.days.map(day => day.minimum)));
  }
});

test('handles leap year and partial month', () => {
  assert.equal(months.get('2016-02').daysInMonth, 29);
  assert.equal(months.get('2016-02').isComplete, true);
  assert.equal(months.get('2017-10').days.length, 28);
  assert.equal(months.get('2017-10').isComplete, false);
  assert.equal(months.has('2017-11'), false);
});

test('rejects bad rows', () => {
  const badRows = [
    '2000-02-30,20,10',
    '2000-01-01,10,20',
    '2000-01-01,,10',
    '2000-01-01,x,10',
    '2000-01-01,20,10\n2000-01-01,21,11',
  ];
  for (const row of badRows) {
    assert.throws(() => parseTemperatureCsv(`${CSV_HEADER}\n${row}`));
  }
});

test('colors match reference', () => {
  const expected = [[18, '#ffffbf'], [24, '#fee08b'], [25, '#fdae61'], [28, '#fdae61'],
  [29, '#f46d43'], [32, '#d53e4f'], [36, '#9e0142']];
  for (const [temperature, color] of expected) {
    assert.equal(temperatureToColor(temperature), color, `${temperature} °C`);
  }
});

test('colors clamp out of range', () => {
  const { colors } = TEMPERATURE_SCALE;
  assert.equal(temperatureToColor(-1), colors[0]);
  assert.equal(temperatureToColor(40), colors.at(-1));
  assert.equal(temperatureToColor(45), colors.at(-1));
});

test('lines break at missing days', () => {
  const summary = {
    daysInMonth: 5,
    days: [1, 2, 4, 5].map(day => ({ day, maximum: 20, minimum: 10 })),
  };
  const commands = buildDailyLinePath(summary, 'maximum', 100, 50).split(' ').map(part => part[0]);
  assert.deepEqual(commands, ['M', 'L', 'M', 'L']);
});

test('pointer finds the right day', () => {
  const october2017 = months.get('2017-10');
  const width = 100;
  assert.equal(findDayAtPosition(october2017, 0, width).day, 1);
  assert.equal(findDayAtPosition(october2017, 50, width).day, 16);
  assert.equal(findDayAtPosition(october2017, width, width), undefined);
});
