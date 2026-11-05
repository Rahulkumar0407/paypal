# components/charts/

**Owner:** Person 2. Task P2-5 (built Thu 5 Nov).

`ForecastChart({ forecast })`: the 14-day forecast in **AG Charts Community** only (never `ag-charts-enterprise`;
animation, for one, is Enterprise, so it's off). One column per day coloured like the day tickets, labelled axes, the
owner's minimum as a dashed line, the short day banded and labelled, and a tooltip with each day's money in and out
(`AgForecastChart`). Downloaded only on a wide screen; phones, the loading moment and any failure get the light SVG
version of the same numbers (`ForecastChartSvg`).
