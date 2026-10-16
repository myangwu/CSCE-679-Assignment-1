# CSCE 679 Assignment 1: Hong Kong Temperature Heatmaps

Interactive year × month heatmaps of Hong Kong temperatures from 1997 to 2017, built with plain JavaScript and SVG.

- **Level 1:** a monthly heatmap for all years that can switch between max and min temperature.
- **Level 2:** the same heatmap for the last 10 or 5 years, with daily max (green) and min (light blue) lines in each cell.

## Run

```sh
npm start
```

Open <http://127.0.0.1:8000>. The page must be served over HTTP; opening `index.html` directly will not load the data.

To run the tests:

```sh
npm test
```

## Features

- Years on the x-axis and months on the y-axis
- Radio buttons switch between max and min temperature
- Hovering shows a tooltip with the date and temperatures
- A color legend (0–40 °C) next to each chart
- In Level 2, x is the day of the month and y is the temperature

## Files

```
index.html          page layout
styles.css          page styles
src/config.js       all settings (colors, sizes, options)
src/data.js         CSV parsing and monthly summaries
src/scales.js       temperature → color, linear scale
src/heatmap.js      draws one heatmap (both levels)
src/daily-lines.js  mini line charts for Level 2
src/legend.js       color legend
src/tooltip.js      hover tooltip
src/svg.js          SVG helper
src/main.js         entry point
tests/              unit tests
```

## Notes

- The monthly max is the highest daily max, and the monthly min is the lowest daily min.
- November and December 2017 have no data, so those cells are empty.
- To change colors or sizes, edit `src/config.js`.
