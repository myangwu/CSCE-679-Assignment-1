/**
 * scales.js — functions that map data values to visual values
 * (temperature → color, number → pixel position).
 */
import { TEMPERATURE_SCALE } from './config.js';

/**
 * Creates a linear scale that maps [domainStart, domainEnd] onto
 * [rangeStart, rangeEnd]. Works like d3.scaleLinear without clamping.
 */
export function createLinearScale([domainStart, domainEnd], [rangeStart, rangeEnd]) {
  const ratio = (rangeEnd - rangeStart) / (domainEnd - domainStart);
  return value => rangeStart + (value - domainStart) * ratio;
}

/**
 * Returns the legend color for a temperature (°C).
 * The palette is discrete: the range is cut into equally wide bins, one per
 * color, and out-of-range values use the first or last color.
 */
export function temperatureToColor(temperature) {
  const { domain: [lowest], binUpperBound, colors } = TEMPERATURE_SCALE;
  const binWidth = (binUpperBound - lowest) / colors.length;
  const binIndex = Math.floor((temperature - lowest) / binWidth);
  const clampedIndex = Math.max(0, Math.min(colors.length - 1, binIndex));
  return colors[clampedIndex];
}
