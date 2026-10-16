// Hover tooltip: text content and positioning.
import { TEMPERATURE_SCALE, TOOLTIP_OFFSET, TOOLTIP_EDGE_MARGIN } from './config.js';

const UNIT = TEMPERATURE_SCALE.unit;

/** Tooltip text for a month. */
export function describeMonth(summary) {
  const lines = [`Max: ${summary.maximum} ${UNIT}   Min: ${summary.minimum} ${UNIT}`];
  if (!summary.isComplete) {
    lines.push(`Only ${summary.days.length} of ${summary.daysInMonth} days recorded`);
  }
  return { title: `Date: ${summary.key}`, lines };
}

/** Tooltip text for one day, with its month for comparison. */
export function describeDay(summary, dayRecord) {
  return {
    title: `Date: ${dayRecord.date}`,
    lines: [
      `Day — max: ${dayRecord.maximum} ${UNIT}   min: ${dayRecord.minimum} ${UNIT}`,
      `Month — max: ${summary.maximum} ${UNIT}   min: ${summary.minimum} ${UNIT}`,
    ],
  };
}

/** Wrap the #tooltip element with show() / hide(). */
export function createTooltip(element) {
  // Place next to the pointer, kept inside the window.
  function moveTo(pointerX, pointerY) {
    const maxLeft = window.innerWidth - element.offsetWidth - TOOLTIP_EDGE_MARGIN;
    const maxTop = window.innerHeight - element.offsetHeight - TOOLTIP_EDGE_MARGIN;
    const left = Math.max(TOOLTIP_EDGE_MARGIN, Math.min(pointerX + TOOLTIP_OFFSET, maxLeft));
    const top = Math.max(TOOLTIP_EDGE_MARGIN, Math.min(pointerY + TOOLTIP_OFFSET, maxTop));
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  }

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
