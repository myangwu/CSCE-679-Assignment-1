/**
 * daily-lines.js — geometry for the mini line charts inside Level 2 cells.
 *
 * Inside a cell, x = day of the month and y = temperature. Every cell uses
 * the same 0–40 °C vertical scale so lines can be compared across cells.
 */
import { TEMPERATURE_SCALE, DAILY_LINE_STYLE } from './config.js';
import { createLinearScale } from './scales.js';

/**
 * Creates the x (day) and y (temperature) scales for one cell.
 * Day 1 sits at the left edge and the last calendar day at the right edge.
 */
function createCellScales(summary, cellWidth, cellHeight) {
  const { padding } = DAILY_LINE_STYLE;
  const xScale = createLinearScale([1, summary.daysInMonth], [padding, cellWidth - padding]);
  // SVG y grows downward, so the highest temperature maps to the top edge.
  const yScale = createLinearScale(TEMPERATURE_SCALE.domain, [cellHeight - padding, padding]);
  return { xScale, yScale };
}

/**
 * Builds the SVG path "d" string for one daily series.
 * The line is broken (a new "M" command) wherever a day is missing, so the
 * chart never implies data that was not recorded.
 *
 * @param {import('./data.js').MonthSummary} summary
 * @param {'maximum'|'minimum'} field  Which daily value to plot.
 */
export function buildDailyLinePath(summary, field, cellWidth, cellHeight) {
  const { xScale, yScale } = createCellScales(summary, cellWidth, cellHeight);
  let previousDay = null;

  return summary.days.map(record => {
    const isContinuation = previousDay === record.day - 1;
    previousDay = record.day;
    const x = xScale(record.day).toFixed(2);
    const y = yScale(record[field]).toFixed(2);
    return `${isContinuation ? 'L' : 'M'}${x},${y}`;
  }).join(' ');
}

/**
 * Finds the record for the day under a horizontal position in the cell.
 * Returns undefined when that calendar day has no record.
 *
 * @param {number} cellX  Pointer x position inside the cell (SVG units).
 */
export function findDayAtPosition(summary, cellX, cellWidth) {
  const { padding } = DAILY_LINE_STYLE;
  const positionToDay = createLinearScale([padding, cellWidth - padding], [1, summary.daysInMonth]);
  const dayNumber = Math.round(positionToDay(cellX));
  const clampedDay = Math.max(1, Math.min(summary.daysInMonth, dayNumber));
  return summary.days.find(record => record.day === clampedDay);
}
