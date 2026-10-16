/**
 * heatmap.js — draws the year × month matrix used by both levels.
 *
 *   Level 1 ("monthly"): each cell is filled with the month's max/min color.
 *   Level 2 ("daily"):   same cells, plus daily max/min lines inside them.
 *
 * Columns are years, rows are months. The drawing is split into small steps
 * (geometry → axes → cells → legend) so each part can be changed on its own.
 */
import { MONTH_NAMES, LAYOUT, DAILY_LINE_STYLE, METRICS } from './config.js';
import { toMonthKey } from './data.js';
import { temperatureToColor } from './scales.js';
import { createSvgElement } from './svg.js';
import { buildDailyLinePath, findDayAtPosition } from './daily-lines.js';
import { drawLegend } from './legend.js';
import { describeMonth, describeDay } from './tooltip.js';

/**
 * Renders a complete heatmap into a container, replacing any previous chart.
 *
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {Map<string, import('./data.js').MonthSummary>} options.summaries
 * @param {number[]} options.years       Years to show, one column each.
 * @param {'maximum'|'minimum'} options.metric  Value that sets cell color.
 * @param {boolean} options.showDailyLines      true for Level 2.
 * @param {ReturnType<import('./tooltip.js').createTooltip>} options.tooltip
 */
export function renderHeatmap(container, { summaries, years, metric, showDailyLines, tooltip }) {
  const geometry = computeGeometry(years, showDailyLines ? LAYOUT.daily : LAYOUT.monthly);
  const svg = createSvgElement('svg', {
    viewBox: `0 0 ${geometry.width} ${geometry.height}`,
    role: 'group',
    'aria-label': showDailyLines
      ? 'Daily high and low temperatures by month and year'
      : `Monthly ${METRICS[metric].label.toLowerCase()} temperature by month and year`,
  });

  drawAxes(svg, years, geometry);

  MONTH_NAMES.forEach((_, rowIndex) => {
    years.forEach((year, columnIndex) => {
      const summary = summaries.get(toMonthKey(year, rowIndex + 1));
      // Months without any records (Nov/Dec 2017) are left blank, as in the reference.
      if (!summary) return;
      const cell = drawCell(summary, metric, showDailyLines, geometry, { rowIndex, columnIndex });
      attachCellInteractions(cell, summary, showDailyLines, geometry, tooltip);
      svg.append(cell);
    });
  });

  drawLegend(svg, {
    x: geometry.plotRight + LAYOUT.legend.offsetX,
    y: geometry.plotTop,
    metric,
    showLineKey: showDailyLines,
  });

  container.replaceChildren(svg);
}

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

/**
 * Works out where everything goes: plot edges, column/row sizes, cell size.
 * All later drawing steps read positions from this one object.
 */
function computeGeometry(years, chartLayout) {
  const { margin } = LAYOUT;
  const { width, rowHeight, cellGapX, cellGapY } = chartLayout;
  const plotLeft = margin.left;
  const plotTop = margin.top;
  const plotRight = width - margin.right;
  const plotBottom = plotTop + MONTH_NAMES.length * rowHeight;
  const columnWidth = (plotRight - plotLeft) / years.length;

  return {
    width,
    height: plotBottom + margin.bottom,
    plotLeft, plotTop, plotRight, plotBottom,
    columnWidth,
    rowHeight,
    cellGapX,
    cellWidth: columnWidth - cellGapX,
    cellHeight: rowHeight - cellGapY,
  };
}

/** Top-left corner of the cell in a given row and column. */
function cellPosition(geometry, rowIndex, columnIndex) {
  return {
    x: geometry.plotLeft + columnIndex * geometry.columnWidth + geometry.cellGapX / 2,
    y: geometry.plotTop + rowIndex * geometry.rowHeight,
  };
}

/* ------------------------------------------------------------------ */
/* Axes                                                                */
/* ------------------------------------------------------------------ */

/** Draws the year axis along the top and the month axis down the left side. */
function drawAxes(svg, years, geometry) {
  const { plotLeft, plotTop, plotRight, plotBottom, columnWidth, rowHeight, cellHeight } = geometry;
  const { axisLabelOffset, axisTickLength } = LAYOUT;
  const axisY = plotTop - axisLabelOffset / 2; // small gap between axis line and cells
  const axisX = plotLeft - axisLabelOffset / 2;
  const axes = createSvgElement('g', { class: 'axes' });

  // Axis lines: one along the top, one down the left side.
  axes.append(createSvgElement('path', {
    class: 'axis-line',
    d: `M${axisX},${plotBottom} V${axisY} H${plotRight}`,
  }));

  // Year ticks and labels, centered over each column.
  years.forEach((year, columnIndex) => {
    const x = plotLeft + (columnIndex + 0.5) * columnWidth;
    axes.append(
      createSvgElement('path', { class: 'axis-line', d: `M${x},${axisY} v${-axisTickLength}` }),
      createSvgElement('text', {
        class: 'axis-label', x, y: axisY - axisTickLength - 4, 'text-anchor': 'middle',
      }, year),
    );
  });

  // Month ticks and labels, centered beside each row of cells.
  MONTH_NAMES.forEach((monthName, rowIndex) => {
    const y = plotTop + rowIndex * rowHeight + cellHeight / 2;
    axes.append(
      createSvgElement('path', { class: 'axis-line', d: `M${axisX},${y} h${-axisTickLength}` }),
      createSvgElement('text', {
        class: 'axis-label', x: axisX - axisTickLength - 4, y, 'text-anchor': 'end',
        'dominant-baseline': 'middle',
      }, monthName),
    );
  });

  svg.append(axes);
}

/* ------------------------------------------------------------------ */
/* Cells                                                               */
/* ------------------------------------------------------------------ */

/**
 * Creates one month cell: a colored rectangle, plus the daily max/min
 * lines when showDailyLines is true.
 * @returns {SVGGElement}
 */
function drawCell(summary, metric, showDailyLines, geometry, { rowIndex, columnIndex }) {
  const { cellWidth, cellHeight } = geometry;
  const { x, y } = cellPosition(geometry, rowIndex, columnIndex);
  const cell = createSvgElement('g', {
    class: 'cell',
    transform: `translate(${x},${y})`,
    'data-month': summary.key,
  });

  cell.append(createSvgElement('rect', {
    class: 'cell-background',
    width: cellWidth,
    height: cellHeight,
    fill: temperatureToColor(summary[metric]),
  }));

  if (showDailyLines) {
    for (const field of ['maximum', 'minimum']) {
      cell.append(createSvgElement('path', {
        class: `daily-line daily-${field}`,
        d: buildDailyLinePath(summary, field, cellWidth, cellHeight),
        stroke: DAILY_LINE_STYLE[field].color,
      }));
    }
  }

  return cell;
}

/* ------------------------------------------------------------------ */
/* Interaction                                                         */
/* ------------------------------------------------------------------ */

/**
 * Adds hover and keyboard behaviour to a cell.
 *  - Level 1: the tooltip shows the month and its max/min.
 *  - Level 2: the tooltip follows the pointer and shows the day under it.
 *  - Tab focuses a cell (tooltip appears); Escape or blur hides it.
 */
function attachCellInteractions(cell, summary, showDailyLines, geometry, tooltip) {
  const background = cell.querySelector('.cell-background');
  const monthText = describeMonth(summary);

  cell.setAttribute('tabindex', '0');
  cell.setAttribute('aria-label', `${monthText.title}. ${monthText.lines.join('. ')}`);

  cell.addEventListener('pointermove', event => {
    let content = monthText;
    if (showDailyLines) {
      const dayRecord = findDayAtPointer(event, background, summary, geometry.cellWidth);
      // A missing day has no value to report, so fall back to the month summary.
      if (dayRecord) content = describeDay(summary, dayRecord);
    }
    tooltip.show(content, event.clientX, event.clientY);
  });

  cell.addEventListener('focus', () => {
    const bounds = background.getBoundingClientRect();
    tooltip.show(monthText, bounds.left + bounds.width / 2, bounds.top);
  });

  cell.addEventListener('pointerleave', tooltip.hide);
  cell.addEventListener('blur', tooltip.hide);
  cell.addEventListener('keydown', event => {
    if (event.key === 'Escape') tooltip.hide();
  });
}

/** Converts the pointer's screen position into the day record beneath it. */
function findDayAtPointer(event, background, summary, cellWidth) {
  // The SVG is scaled to fit the page, so convert screen px → cell units.
  const bounds = background.getBoundingClientRect();
  const cellX = (event.clientX - bounds.left) / bounds.width * cellWidth;
  return findDayAtPosition(summary, cellX, cellWidth);
}
