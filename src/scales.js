// Map data values to colors and positions.
import { TEMPERATURE_SCALE } from './config.js';

/** Linear scale, like d3.scaleLinear (no clamping). */
export function createLinearScale([domainStart, domainEnd], [rangeStart, rangeEnd]) {
  const ratio = (rangeEnd - rangeStart) / (domainEnd - domainStart);
  return value => rangeStart + (value - domainStart) * ratio;
}

/** Temperature → discrete legend color, clamped to the end colors. */
export function temperatureToColor(temperature) {
  const { domain: [lowest], binUpperBound, colors } = TEMPERATURE_SCALE;
  const binWidth = (binUpperBound - lowest) / colors.length;
  const binIndex = Math.floor((temperature - lowest) / binWidth);
  const clampedIndex = Math.max(0, Math.min(colors.length - 1, binIndex));
  return colors[clampedIndex];
}
