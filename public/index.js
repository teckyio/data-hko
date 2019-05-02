const cellSize = 30
const marginSize = 2
const monthNameHeight = 30
const monthNames = ['一月', '二月', '三月', '四月', '五月']

const dateParse = d3.timeParse('%Y-%m-%d')

const dateFormat = d3.timeFormat('%Y-%m-%d')
const weekDayFormat = d3.timeFormat('%w');
const weekFormat = d3.timeFormat('%U');

(async function() {
  const actuals = await d3.json('/actuals-transform.json')
  const forecasts = await d3.json('/forecasts-transform.json')

  const forecastInterpolate = d3.interpolateRgb('#b7d2ff', '#146bfc')
  const forecastWordMap = d3.scalePoint().domain(['有微雨', '有驟雨', '有雨', '狂風雷暴']).range([0, 1]);
  
  const forecastsLookup = d3.nest()
    .key(a => a.date)
    .rollup(a => a[0].rain)
    .object(forecasts);

  console.log(forecasts);
  console.log(forecastsLookup)

  const actualsLookup = d3.nest()
    .key(a => a.date)
    .rollup(a => a[0].rain)
    .object(actuals);

  const minDate = d3.min(actuals.map(a => dateParse(a.date)))
  const maxDate = d3.max(actuals.map(a => dateParse(a.date)))
  const maxRain = d3.max(actuals.map(a => a.rain))

  const months = d3.timeMonth.range(d3.timeMonth.floor(minDate), maxDate, 1);
  
  const svg = d3.select('#calendar')
    .selectAll('svg')
    .data(months)
    .enter().append('svg')
    .attr('width', cellSize * 7 + marginSize * 8)
    .attr('height', m => (cellSize + marginSize) * (d3.timeWeek.range(m, d3.timeMonth.offset(m, 1)).length + 1) + marginSize + monthNameHeight)
    .append('g')
  
  svg.selectAll('rect')
    .data(m => d3.timeDay.range(m, d3.timeMonth.offset(m, 1)))
    .enter().append('rect')
    .attr('x', d => weekDayFormat(d) * (cellSize + marginSize))
    .attr('y', d => monthNameHeight + (weekFormat(d) - weekFormat(d3.timeMonth.floor(d))) * (cellSize + marginSize))
    .attr('fill', d => forecastsLookup[dateFormat(d)] != null ? forecastInterpolate(forecastWordMap(forecastsLookup[dateFormat(d)])) : '#eaeaea')
    .attr('width', cellSize)
    .attr('height', cellSize)
  
  svg.selectAll('text')
    .data(m => d3.timeDay.range(m, d3.timeMonth.offset(m, 1)))
    .enter().append('text')
    .classed('fa', true)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('x', d => cellSize / 2 + weekDayFormat(d) * (cellSize + marginSize))
    .attr('y', d => cellSize / 2 + monthNameHeight + (weekFormat(d) - weekFormat(d3.timeMonth.floor(d))) * (cellSize + marginSize))
    .attr('font-size', d => actualsLookup[dateFormat(d)] > 0 ? actualsLookup[dateFormat(d)] / maxRain * 20 + 10 : 0)
    .text(d => actualsLookup[dateFormat(d)] > 0 ? '\uf73d' : '')

  svg.append('text')
    .attr('x', 0)
    .attr('y', monthNameHeight / 2)
    .attr('fill', '#000000')
    .attr('dorminant-baseline', 'middle')
    .attr('font-size', 16)
    .text(m => monthNames[m.getMonth()])
})();

// console.log(weekDayFormat(d3.timeMonth.floor(endDate)))
// console.log(weekDayFormat(endDate))