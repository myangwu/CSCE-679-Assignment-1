# CSCE 679 Assignment 1 — Hong Kong Temperature Heatmaps

Interactive year × month heatmaps of Hong Kong temperatures (1997–2017).
Built with plain JavaScript, HTML, CSS, and SVG. No libraries or build step are needed.

- **Level 1:** monthly heatmap for every year. Switch between monthly **max** and **min** temperatures.
- **Level 2:** the same heatmap for the last 10 (or 5) years. Each cell also contains a mini line chart of daily max (green) and min (light blue) temperatures.

The original task description is in [level1.md](level1.md). The reference images are [level1.png](level1.png) and [level2.png](level2.png).

## How to run

The page loads the CSV with `fetch`, so it must be served over HTTP. Opening `index.html` directly from the file system won't work.

```sh
npm start          # or: python3 -m http.server 8000
```

Then open <http://127.0.0.1:8000>.

To run the unit tests (Node.js 18+):

```sh
npm test
```

## Features

| Requirement | Implementation |
| --- | --- |
| Years on x, months on y | Year axis on top, month axis on the left, one cell per month |
| Show max and min temperature | "Color cells by" radio buttons recolor both charts |
| Tooltip on hover | Level 1: `Date: 2002-03, Max: 28 °C, Min: 14 °C`. Level 2: the hovered day's values plus the month's extremes |
| Legend | Vertical color legend to the right of each chart (0–40 °C). Level 2 also has a line legend |
| Level 2 mini charts | x = day of month, y = temperature on a fixed 0–40 °C scale shared by all cells |
| Last 5–10 years | "Show" dropdown: last 10 years (default) or last 5 years |

### How the data is shown

- **Monthly max** is the highest daily maximum in the month. **Monthly min** is the lowest daily minimum. These are extremes, not averages, which matches the reference tooltip (March 2002: 28 / 14).
- The colors are the 11-class *Spectral* palette, reversed (blue = cold, dark red = hot), binned the same way as the reference images.
- November and December 2017 have no data, so those cells are left empty (as in the reference). October 2017 ends on day 28.
- Daily lines are broken at missing days instead of being joined across the gap.

## Project structure

```
index.html            Page layout and controls
styles.css            Page styling (theme colors are CSS variables at the top)
temperature_daily.csv Dataset
src/
  config.js           All settings: colors, sizes, margins, data path, year options
  data.js             Parse and validate the CSV, then group days into monthly summaries
  scales.js           Linear scale and temperature → color mapping
  heatmap.js          Draws one matrix: axes, cells, optional daily lines, interactions
  daily-lines.js      Geometry for the mini line charts (path + day under pointer)
  legend.js           Vertical color legend and line legend
  tooltip.js          Tooltip text and positioning
  svg.js              Helper for creating SVG elements
  main.js             Entry point: loads data, handles controls, redraws charts
tests/
  data.test.js        Unit tests for parsing, monthly extremes, colors, and line geometry
```

Both levels use the same `renderHeatmap()` function. Level 2 simply passes `showDailyLines: true`.

## Customizing

All visual settings are in [`src/config.js`](src/config.js). For example:

- **Colors:** `TEMPERATURE_SCALE.colors`, `DAILY_LINE_STYLE`
- **Temperature range:** `TEMPERATURE_SCALE.domain`
- **Chart size and spacing:** `LAYOUT.monthly`, `LAYOUT.daily`, `LAYOUT.margin`
- **Year choices for Level 2:** `RECENT_YEAR_OPTIONS`, `DEFAULT_RECENT_YEARS`
