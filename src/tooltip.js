/**
 * tooltip.js — the floating information box shown when hovering a cell.
 */
import { TEMPERATURE_SCALE, TOOLTIP_OFFSET, TOOLTIP_EDGE_MARGIN } from './config.js';

const UNIT = TEMPERATURE_SCALE.unit;

/**
 * Builds the text lines for a month cell (Level 1, or Level 2 when the
 * pointer is not over a recorded day).
 * @param {import('./data.js').MonthSummary} summary
 * @returns {{ title: string, lines: string[] }}
 */
export function describeMonth(summary) {
  const lines = [`Max: ${summary.maximum} ${UNIT}   Min: ${summary.minimum} ${UNIT}`];
  if (!summary.isComplete) {
    lines.push(`Only ${summary.days.length} of ${summary.daysInMonth} days recorded`);
  }
  return { title: `Date: ${summary.key}`, lines };
}

/**
 * Builds the text lines for one day inside a Level 2 cell. The month's
 * extremes are repeated so the reader can compare the day with its month.
 * @param {import('./data.js').MonthSummary} summary
 * @param {import('./data.js').DailyRecord} dayRecord
 */
export function describeDay(summary, dayRecord) {
  return {
    title: `Date: ${dayRecord.date}`,
    lines: [
      `Day — max: ${dayRecord.maximum} ${UNIT}   min: ${dayRecord.minimum} ${UNIT}`,
      `Month — max: ${summary.maximum} ${UNIT}   min: ${summary.minimum} ${UNIT}`,
    ],
  };
}

/**
 * Wraps the #tooltip element with show/hide helpers.
 * @param {HTMLElement} element  The (initially hidden) tooltip container.
 */
export function createTooltip(element) {
  /** Places the box next to the pointer while keeping it inside the window. */
  function moveTo(pointerX, pointerY) {
    const maxLeft = window.innerWidth - element.offsetWidth - TOOLTIP_EDGE_MARGIN;
    const maxTop = window.innerHeight - element.offsetHeight - TOOLTIP_EDGE_MARGIN;
    const left = Math.max(TOOLTIP_EDGE_MARGIN, Math.min(pointerX + TOOLTIP_OFFSET, maxLeft));
    const top = Math.max(TOOLTIP_EDGE_MARGIN, Math.min(pointerY + TOOLTIP_OFFSET, maxTop));
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  }

  /** Fills the box with a bold title plus one row per line, then shows it. */
  function show({ title, lines }, pointerX, pointerY) {
    const titleElement = document.createElement('strong');
    titleElement.textContent = title;
    const lineElements = lines.map(text => {
      const row = document.createElement('div');
      row.textContent = text;
      return row;
    });
    element.replaceChildren(titleElement, ...lineElements);
    element.hidden = false;
    moveTo(pointerX, pointerY);
  }

  function hide() {
    element.hidden = true;
  }

  return { show, hide };
}
