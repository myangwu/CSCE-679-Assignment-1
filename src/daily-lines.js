// Mini line charts in Level 2 cells: x = day, y = temperature (fixed 0–40 °C).
import { TEMPERATURE_SCALE, DAILY_LINE_STYLE } from './config.js';
import { createLinearScale } from './scales.js';

/** x (day) and y (temperature) scales for one cell. */
function createCellScales(summary, cellWidth, cellHeight) {
  const { padding } = DAILY_LINE_STYLE;
  const xScale = createLinearScale([1, summary.daysInMonth], [padding, cellWidth - padding]);
  // SVG y grows downward, so hot is at the top.
  const yScale = createLinearScale(TEMPERATURE_SCALE.domain, [cellHeight - padding, padding]);
  return { xScale, yScale };
}

/** SVG path for 'maximum' or 'minimum'. Breaks the line at missing days. */
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

/** Day record at an x position in the cell, or undefined if that day is missing. */
export function findDayAtPosition(summary, cellX, cellWidth) {
  const { padding } = DAILY_LINE_STYLE;
  const positionToDay = createLinearScale([padding, cellWidth - padding], [1, summary.daysInMonth]);
  const dayNumber = Math.round(positionToDay(cellX));
  const clampedDay = Math.max(1, Math.min(summary.daysInMonth, dayNumber));
  return summary.days.find(record => record.day === clampedDay);
}
