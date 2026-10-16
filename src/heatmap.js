// Year × month heatmap used by both levels.
// Level 1: colored cells. Level 2: colored cells + daily lines.
import { MONTH_NAMES, LAYOUT, DAILY_LINE_STYLE, METRICS } from './config.js';
import { toMonthKey } from './data.js';
import { temperatureToColor } from './scales.js';
import { createSvgElement } from './svg.js';
import { buildDailyLinePath, findDayAtPosition } from './daily-lines.js';
import { drawLegend } from './legend.js';
import { describeMonth, describeDay } from './tooltip.js';

/** Draw a heatmap into the container, replacing the old one. */
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
      if (!summary) return; // no data: leave blank, as in the reference
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

// ---------- Geometry ----------

/** Plot edges and cell sizes. */
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

/** Top-left corner of a cell. */
function cellPosition(geometry, rowIndex, columnIndex) {
  return {
    x: geometry.plotLeft + columnIndex * geometry.columnWidth + geometry.cellGapX / 2,
    y: geometry.plotTop + rowIndex * geometry.rowHeight,
  };
}

// ---------- Axes ----------

/** Year axis on top, month axis on the left. */
function drawAxes(svg, years, geometry) {
  const { plotLeft, plotTop, plotRight, plotBottom, columnWidth, rowHeight, cellHeight } = geometry;
  const { axisLabelOffset, axisTickLength } = LAYOUT;
  const axisY = plotTop - axisLabelOffset / 2;
  const axisX = plotLeft - axisLabelOffset / 2;
  const axes = createSvgElement('g', { class: 'axes' });

  axes.append(createSvgElement('path', {
    class: 'axis-line',
    d: `M${axisX},${plotBottom} V${axisY} H${plotRight}`,
  }));

  years.forEach((year, columnIndex) => {
    const x = plotLeft + (columnIndex + 0.5) * columnWidth;
    axes.append(
      createSvgElement('path', { class: 'axis-line', d: `M${x},${axisY} v${-axisTickLength}` }),
      createSvgElement('text', {
        class: 'axis-label', x, y: axisY - axisTickLength - 4, 'text-anchor': 'middle',
      }, year),
    );
  });

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

// ---------- Cells ----------

/** One month cell: colored rect, plus daily lines in Level 2. */
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

// ---------- Interaction ----------

/** Hover/focus shows the tooltip; Level 2 shows the day under the pointer. */
function attachCellInteractions(cell, summary, showDailyLines, geometry, tooltip) {
  const background = cell.querySelector('.cell-background');
  const monthText = describeMonth(summary);

  cell.setAttribute('tabindex', '0');
  cell.setAttribute('aria-label', `${monthText.title}. ${monthText.lines.join('. ')}`);

  cell.addEventListener('pointermove', event => {
    let content = monthText;
    if (showDailyLines) {
      const dayRecord = findDayAtPointer(event, background, summary, geometry.cellWidth);
      if (dayRecord) content = describeDay(summary, dayRecord); // missing day → month text
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

/** Screen pointer → day record (the SVG is scaled, so convert to cell units). */
function findDayAtPointer(event, background, summary, cellWidth) {
  const bounds = background.getBoundingClientRect();
  const cellX = (event.clientX - bounds.left) / bounds.width * cellWidth;
  return findDayAtPosition(summary, cellX, cellWidth);
}
