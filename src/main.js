// Entry point: load data, connect controls, draw both charts.
import {
  DATA_URL, METRICS, DEFAULT_METRIC, RECENT_YEAR_OPTIONS, DEFAULT_RECENT_YEARS,
} from './config.js';
import { parseTemperatureCsv, summarizeByMonth, getYearRange } from './data.js';
import { renderHeatmap } from './heatmap.js';
import { createTooltip } from './tooltip.js';

const elements = {
  metricInputs: document.querySelectorAll('input[name="metric"]'),
  recentYearsSelect: document.querySelector('#recent-years'),
  monthlyChart: document.querySelector('#monthly-chart'),
  monthlyDescription: document.querySelector('#monthly-description'),
  dailyChart: document.querySelector('#daily-chart'),
  dataSummary: document.querySelector('#data-summary'),
  errorMessage: document.querySelector('#error-message'),
};

const tooltip = createTooltip(document.querySelector('#tooltip'));

// Current user selections.
const state = {
  metric: DEFAULT_METRIC,
  recentYears: DEFAULT_RECENT_YEARS,
};

let monthSummaries;
let allYears;

/** Redraw Level 1 (all years) and Level 2 (recent years). */
function renderCharts() {
  tooltip.hide();
  elements.monthlyDescription.textContent =
    `Each cell is colored by the ${METRICS[state.metric].description} of that month.`;

  renderHeatmap(elements.monthlyChart, {
    summaries: monthSummaries,
    years: allYears,
    metric: state.metric,
    showDailyLines: false,
    tooltip,
  });

  renderHeatmap(elements.dailyChart, {
    summaries: monthSummaries,
    years: allYears.slice(-state.recentYears),
    metric: state.metric,
    showDailyLines: true,
    tooltip,
  });
}

/** Fill the "recent years" dropdown and handle changes. */
function setUpRecentYearsControl() {
  const options = RECENT_YEAR_OPTIONS.map(count => {
    const option = new Option(`Last ${count} years`, count);
    option.selected = count === state.recentYears;
    return option;
  });
  elements.recentYearsSelect.replaceChildren(...options);
  elements.recentYearsSelect.addEventListener('change', event => {
    state.recentYears = Number(event.target.value);
    renderCharts();
  });
}

/** Max/Min radio buttons. */
function setUpMetricControl() {
  for (const input of elements.metricInputs) {
    input.checked = input.value === state.metric;
    input.addEventListener('change', () => {
      state.metric = input.value;
      renderCharts();
    });
  }
}

/** Show an error message instead of empty charts. */
function showLoadError(error) {
  elements.dataSummary.textContent = 'Data unavailable';
  elements.errorMessage.hidden = false;
  elements.errorMessage.textContent =
    `Could not load the temperature data (${error.message}). ` +
    'Serve this folder over HTTP — run "npm start" and open http://127.0.0.1:8000.';
}

async function initialize() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const records = parseTemperatureCsv(await response.text());
    if (records.length === 0) throw new Error('the CSV file has no records');

    monthSummaries = summarizeByMonth(records);
    allYears = getYearRange(records);
    elements.dataSummary.textContent =
      `${records.length.toLocaleString('en-US')} daily records, ` +
      `${records[0].date} to ${records.at(-1).date}`;

    setUpMetricControl();
    setUpRecentYearsControl();
    renderCharts();
  } catch (error) {
    showLoadError(error);
  }
}

initialize();
