const cellSize = Math.min((document.documentElement.clientWidth - 40)/ 8, 40)
const marginSize = 2
const labelSize = 100
const labelPadding = 10
const rectRadius = 3
const monthNameHeight = 40
const monthNames = ['一月', '二月', '三月', '四月', '五月']

const dateParse = d3.timeParse('%Y-%m-%d')

const dateFormat = d3.timeFormat('%Y-%m-%d')
const weekDayFormat = d3.timeFormat('%w');
const weekFormat = d3.timeFormat('%U');

const forecastInterpolate = d3.interpolateRgb('#83AFFE', '#022256')
const forecastWordMap = d3.scalePoint().domain(['有微雨', '有驟雨', '有雨', '狂風雷暴']).range([0, 1]);
  
(async function() {
  const actuals = await d3.json('/actuals-transform.json')
  const forecasts = await d3.json('/forecasts-transform.json')

  // Prepare the data
  const forecastsLookup = d3.nest()
    .key(a => a.date)
    .rollup(a => a[0].rain)
    .object(forecasts);

  const actualsLookup = d3.nest()
    .key(a => a.date)
    .rollup(a => a[0].rain)
    .object(actuals);

  const minDate = d3.min(actuals.map(a => dateParse(a.date)))
  const maxDate = d3.max(actuals.map(a => dateParse(a.date)))
  const maxRain = d3.max(actuals.map(a => a.rain))

  const months = d3.timeMonth.range(d3.timeMonth.floor(minDate), maxDate, 1);
  
  // Drawing Legend
  const legend = d3.select('#legend')
    .append('svg')
    .attr('width', (cellSize + labelSize) * forecastWordMap.domain().length)
    .attr('height', cellSize * 4 + marginSize * 5)
  
  const actualLegend = legend.append('g');
  
  actualLegend.selectAll('rect')
    .data(forecastWordMap.domain())
    .enter().append('rect')
    .attr('x', (_d, i) => (cellSize + labelSize) * i)
    .attr('y', cellSize + marginSize)
    .attr('rx', rectRadius)
    .attr('ry', rectRadius)
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr('fill', (d) => forecastInterpolate(forecastWordMap(d)))

    actualLegend.selectAll('text.label')
    .data(forecastWordMap.domain())
    .enter().append('text')
    .classed('label', true)
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 16)
    .attr('x', (_d, i) => (cellSize + labelSize) * i + cellSize + labelPadding )
    .attr('y', cellSize + marginSize + cellSize / 2)
    .text((d) => d)

  actualLegend.append('text')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 16)
    .attr('y', cellSize / 2)
    .text('早上 7 時 45 分天氣預報')

  const forecastLegend = legend.append('g')
    .attr('transform', 'translate(0, ' + (cellSize * 2 + marginSize * 3) + ')');
  
  forecastLegend.selectAll('rect')
    .data(d3.range(0, 1, 1/forecastWordMap.domain().length))
    .enter().append('rect')
    .attr('x', (_d, i) => (cellSize + labelSize) * i)
    .attr('y', cellSize + marginSize)
    .attr('rx', rectRadius)
    .attr('ry', rectRadius)
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr('fill', '#cccccc')

  forecastLegend.selectAll('text.cloud')
    .data(d3.range(0, 1, 1/forecastWordMap.domain().length))
    .enter().append('text')
    .classed('fa', true)
    .classed('cloud', true)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 16)
    .attr('fill', 'white')
    .attr('x', (_d, i) => (cellSize + labelSize) * i + cellSize / 2 )
    .attr('y', cellSize + marginSize + cellSize / 2)
    .attr('font-size', d => d * 20 + 10)
    .text((d) => d > 0 ? '\uf73d' : '')
  
  forecastLegend.selectAll('text.label')
    .data(d3.range(0, 1, 1/forecastWordMap.domain().length))
    .enter().append('text')
    .classed('label', true)
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 16)
    .attr('x', (_d, i) => (cellSize + labelSize) * i + cellSize + labelPadding )
    .attr('y', cellSize + marginSize + cellSize / 2)
    .text((d) => (d * maxRain).toFixed(0) + ' 毫升')
  
  forecastLegend.append('text')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 16)
    .attr('y', cellSize / 2)
    .text('當日實際落雨量')

  // Drawing Calendars
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
    .attr('rx', rectRadius)
    .attr('ry', rectRadius)
    .attr('fill', d => forecastsLookup[dateFormat(d)] != null ? forecastInterpolate(forecastWordMap(forecastsLookup[dateFormat(d)])) : '#cccccc')
    .attr('width', cellSize)
    .attr('height', cellSize)
  
  svg.selectAll('text.day')
    .data(m => d3.timeDay.range(m, d3.timeMonth.offset(m, 1)))
    .enter().append('text')
    .classed('fa', true)
    .classed('day', true)
    .attr('fill', '#ffffff')
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
    .attr('font-weight', 'bold')
    .text(m => monthNames[m.getMonth()])
})();

// console.log(weekDayFormat(d3.timeMonth.floor(endDate)))
// console.log(weekDayFormat(endDate))