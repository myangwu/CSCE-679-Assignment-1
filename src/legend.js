/**
 * legend.js — the vertical color legend (and optional line legend) drawn to
 * the right of each matrix, following the layout of the reference image.
 */
import { TEMPERATURE_SCALE, DAILY_LINE_STYLE, METRICS, LAYOUT } from './config.js';
import { createSvgElement } from './svg.js';

/**
 * Appends the legend to an SVG.
 *
 * @param {SVGElement} svg
 * @param {Object} options
 * @param {number} options.x        Left edge of the legend (SVG units).
 * @param {number} options.y        Top edge of the legend (SVG units).
 * @param {string} options.metric   'maximum' | 'minimum', shown in the title.
 * @param {boolean} options.showLineKey  Also explain the green/blue daily lines.
 */
export function drawLegend(svg, { x, y, metric, showLineKey }) {
  const { swatchWidth, swatchHeight } = LAYOUT.legend;
  const { colors, domain: [lowest, highest], unit } = TEMPERATURE_SCALE;
  const legend = createSvgElement('g', {
    class: 'legend',
    transform: `translate(${x},${y})`,
  });

  legend.append(createSvgElement('text', { class: 'legend-title', x: 0, y: -12 },
    `Monthly ${METRICS[metric].label.toLowerCase()}`));

  // One square per color, coldest at the top like the reference image.
  colors.forEach((color, index) => {
    legend.append(createSvgElement('rect', {
      x: 0,
      y: index * swatchHeight,
      width: swatchWidth,
      height: swatchHeight,
      fill: color,
    }));
  });

  const colorBarHeight = colors.length * swatchHeight;
  const labelX = swatchWidth + 6;
  legend.append(
    createSvgElement('text', { x: labelX, y: 10 }, `${lowest} ${unit}`),
    createSvgElement('text', { x: labelX, y: colorBarHeight }, `${highest} ${unit}`),
  );

  if (showLineKey) {
    const lineKeyTop = colorBarHeight + LAYOUT.legend.lineLegendGap;
    drawLineKey(legend, lineKeyTop);
  }

  svg.append(legend);
}

/** Draws a short colored line + label for the daily max and min series. */
function drawLineKey(legend, top) {
  const { lineSampleLength, lineLegendRowHeight } = LAYOUT.legend;
  const series = [DAILY_LINE_STYLE.maximum, DAILY_LINE_STYLE.minimum];

  series.forEach(({ color, label }, index) => {
    const rowY = top + index * lineLegendRowHeight;
    legend.append(
      createSvgElement('line', {
        class: 'legend-line',
        x1: 0, x2: lineSampleLength, y1: rowY, y2: rowY,
        stroke: color,
      }),
      createSvgElement('text', { x: lineSampleLength + 6, y: rowY + 4 }, label),
    );
  });
}
