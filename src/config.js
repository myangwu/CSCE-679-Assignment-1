// All chart settings: data path, colors, sizes.

export const DATA_URL = './temperature_daily.csv';
export const CSV_HEADER = 'date,max_temperature,min_temperature';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Values a cell can be colored by (keys match MonthSummary fields).
export const METRICS = {
  maximum: { label: 'Max', description: 'highest daily maximum' },
  minimum: { label: 'Min', description: 'lowest daily minimum' },
};
export const DEFAULT_METRIC = 'maximum';

// Level 2 year choices.
export const RECENT_YEAR_OPTIONS = [5, 10];
export const DEFAULT_RECENT_YEARS = 10;

export const TEMPERATURE_SCALE = {
  domain: [0, 40],
  // Reference images bin 0–39 °C into 11 equal colors.
  binUpperBound: 39,
  // Reversed ColorBrewer Spectral, cold → hot.
  colors: [
    '#5e4fa2', '#3288bd', '#66c2a5', '#abdda4', '#e6f598', '#ffffbf',
    '#fee08b', '#fdae61', '#f46d43', '#d53e4f', '#9e0142',
  ],
  unit: '°C',
};

export const DAILY_LINE_STYLE = {
  maximum: { color: '#2ca25f', label: 'Daily max' },
  minimum: { color: '#a8d8ed', label: 'Daily min' },
  padding: 4,
};

// Sizes in SVG units (the SVG scales to fit the page).
export const LAYOUT = {
  margin: { top: 40, right: 120, bottom: 16, left: 90 },
  axisLabelOffset: 10,
  axisTickLength: 5,
  legend: {
    offsetX: 24,
    swatchWidth: 18,
    swatchHeight: 22,
    lineSampleLength: 24,
    lineLegendGap: 28,
    lineLegendRowHeight: 18,
  },
  monthly: { width: 1250, rowHeight: 40, cellGapX: 8, cellGapY: 8 },
  daily: { width: 1250, rowHeight: 80, cellGapX: 18, cellGapY: 14 },
};

export const TOOLTIP_OFFSET = 14;
export const TOOLTIP_EDGE_MARGIN = 8;
