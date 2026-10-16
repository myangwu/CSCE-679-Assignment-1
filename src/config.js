/**
 * config.js — every adjustable setting for the visualization lives here.
 *
 * Change a value in this file to restyle or resize the charts; no other
 * module contains hard-coded colors, sizes, or data paths.
 */

/** Location of the daily temperature dataset (relative to index.html). */
export const DATA_URL = './temperature_daily.csv';

/** Column names expected in the first line of the CSV file. */
export const CSV_HEADER = 'date,max_temperature,min_temperature';

/** Row labels for the matrix (index 0 = January). */
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * The two values a cell can be colored by. The key matches the property
 * name used on each monthly summary object (see data.js).
 */
export const METRICS = {
  maximum: { label: 'Max', description: 'highest daily maximum' },
  minimum: { label: 'Min', description: 'lowest daily minimum' },
};
export const DEFAULT_METRIC = 'maximum';

/** Level 2 only shows the most recent years; these are the choices offered. */
export const RECENT_YEAR_OPTIONS = [5, 10];
export const DEFAULT_RECENT_YEARS = 10;

/** Temperature color scale shared by both charts. */
export const TEMPERATURE_SCALE = {
  /** Range shown on the legend and used for the mini line charts (°C). */
  domain: [0, 40],
  /**
   * The reference images split integer temperatures 0–39 into equally wide
   * color bins, so the binning uses 39 as its upper bound while the legend
   * still reads 0–40. Values outside the range are clamped to the end colors.
   */
  binUpperBound: 39,
  /** Reversed 11-class ColorBrewer "Spectral" palette (cold → hot). */
  colors: [
    '#5e4fa2', '#3288bd', '#66c2a5', '#abdda4', '#e6f598', '#ffffbf',
    '#fee08b', '#fdae61', '#f46d43', '#d53e4f', '#9e0142',
  ],
  unit: '°C',
};

/** Colors of the daily lines drawn inside each Level 2 cell. */
export const DAILY_LINE_STYLE = {
  maximum: { color: '#2ca25f', label: 'Daily max' },
  minimum: { color: '#a8d8ed', label: 'Daily min' },
  /** Inner padding (px) between a cell's border and its lines. */
  padding: 4,
};

/**
 * Chart geometry in SVG user units. The SVG scales to fit its container,
 * so these numbers set proportions rather than exact screen pixels.
 */
export const LAYOUT = {
  /** Space around the matrix for the axes (left/top) and the legend (right). */
  margin: { top: 40, right: 120, bottom: 16, left: 90 },
  /** Distance between axis lines and their text labels. */
  axisLabelOffset: 10,
  axisTickLength: 5,

  /** Vertical color legend drawn to the right of the matrix. */
  legend: {
    offsetX: 24,       // gap between the last column and the legend
    swatchWidth: 18,
    swatchHeight: 22,
    lineSampleLength: 24,
    lineLegendGap: 28, // gap between the color legend and the line legend
    lineLegendRowHeight: 18,
  },

  /** Level 1: one plain colored cell per month. */
  monthly: { width: 1250, rowHeight: 40, cellGapX: 8, cellGapY: 8 },

  /** Level 2: taller cells so the daily lines are readable. */
  daily: { width: 1250, rowHeight: 80, cellGapX: 18, cellGapY: 14 },
};

/** Tooltip distance (px) from the mouse pointer and from the window edges. */
export const TOOLTIP_OFFSET = 14;
export const TOOLTIP_EDGE_MARGIN = 8;
