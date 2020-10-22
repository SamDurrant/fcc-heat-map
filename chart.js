async function drawHeatMap() {
  // ---------------------------------------------------
  // 1. ACCESS DATA
  // ---------------------------------------------------
  const dataset = await d3
    .json(
      'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json'
    )
    .then((res) => res)
  const data = dataset.monthlyVariance.map((d) => ({
    ...d,
    month: d.month - 1,
  }))
  console.log(dataset)

  // takes in num and returns the month text value
  const yAccessor = (d) => {
    const date = new Date().setMonth(d)
    const monthParser = d3.timeFormat('%B')
    return monthParser(date)
  }

  // takes in an object and returns the year
  const xAccessor = (d) => d.year

  // takes in object and returns temp for color
  const colorAccessor = (d) => (d.variance + dataset.baseTemperature).toFixed(1)

  // ---------------------------------------------------
  // 2. CREATE CHART DIMENSIONS
  // ---------------------------------------------------
  const dimensions = createChartDimensions()

  // ---------------------------------------------------
  // 3. DRAW CANVAS
  // ---------------------------------------------------
  const title = d3.select('#wrapper').append('text').attr('id', 'title')

  const description = d3
    .select('#wrapper')
    .append('text')
    .attr('id', 'description')

  const svg = d3
    .select('#wrapper')
    .append('svg')
    .attr('class', 'svg')
    .style('background', '#b33503')
    .attr('width', dimensions.width)
    .attr('height', dimensions.height)

  const bounds = svg
    .append('g')
    .attr('class', 'bounds')
    .style(
      'transform',
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    )

  // append y axis parts
  bounds
    .append('g')
    .attr('id', 'y-axis')
    .append('text')
    .attr('id', 'y-axis-label')

  // append x axis parts
  bounds
    .append('g')
    .attr('id', 'x-axis')
    .style('transform', `translateY(${dimensions.boundedHeight}px)`)
    .append('text')
    .attr('id', 'x-axis-label')

  bounds
    .append('g')
    .attr('class', 'legend')
    .style(
      'transform',
      `translate(${dimensions.boundedWidth - dimensions.legendWidth - 10}px, ${
        dimensions.boundedHeight + dimensions.margin.bottom / 2
      }px)`
    )

  bounds.append('g').attr('class', 'cells')
  // ---------------------------------------------------
  // 4. CREATE SCALES
  // ---------------------------------------------------
  const yScale = d3
    .scaleBand()
    .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].keys())
    .range([dimensions.boundedHeight, 0])
    .padding(0.015)

  // filter for unique years
  let xYears = [...new Set(data.map(xAccessor))]
  // filter for years by 10
  let xTicks = xYears.filter((y) => y % 10 === 0)
  const xScale = d3
    .scaleBand()
    .domain(xYears)
    .range([0, dimensions.boundedWidth])
    .padding(0.15)

  const colorScale = d3
    .scaleSequential()
    .interpolator(d3.interpolateViridis)
    .domain(d3.extent(data, colorAccessor))

  const legendScale = d3
    .legendColor()
    .scale(colorScale)
    .orient('horizontal')
    .labelFormat(d3.format('.1f'))
    .labelAlign('middle')
    .shape('rect')
    .shapePadding(5)
    .cells(5)
    .shapeWidth(dimensions.legendWidth / 5)

  // ---------------------------------------------------
  // 5. DRAW DATA
  // ---------------------------------------------------

  const cells = d3
    .select('.cells')
    .selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .on('mouseenter', (e, d) => onMouseEnter(e, d))
    .on('mouseleave', onMouseLeave)
    .attr('data-month', (d) => d.month)
    .attr('data-year', (d) => xAccessor(d))
    .attr('data-temp', (d) => (d.variance + dataset.baseTemperature).toFixed(1))
    .attr('y', (d) => yScale(d.month))
    .attr('x', (d) => xScale(d.year))
    .attr('width', xScale.bandwidth)
    .attr('height', yScale.bandwidth)
    .style('fill', (d) => colorScale(colorAccessor(d)))

  // ---------------------------------------------------
  // 6. DRAW PERIPHERALS
  // ---------------------------------------------------
  const yAxisGenerator = d3.axisLeft().scale(yScale).tickFormat(yAccessor)

  // attach the y axis
  const yAxis = bounds.select('#y-axis').call(yAxisGenerator)

  // attach y axis labels
  const yAxisLabel = yAxis
    .select('#y-axis-label')
    .attr('y', -(dimensions.margin.left - 20))
    .attr('x', -(dimensions.boundedHeight / 2))
    .text('MONTH')
    .attr('fill', '#e0beb0')
    .attr('font-size', '1rem')
    .attr('transform', 'rotate(-90)')

  const xAxisGenerator = d3.axisBottom().scale(xScale).tickValues(xTicks)

  // attach the x axis
  const xAxis = bounds.select('#x-axis').call(xAxisGenerator)

  // attach x axis labels
  const xAxisLabel = xAxis
    .select('#x-axis-label')
    .attr('y', dimensions.margin.bottom / 2)
    .attr('x', dimensions.boundedWidth / 2)
    .text('YEAR')
    .attr('fill', '#e0beb0')
    .attr('font-size', '1rem')

  const titleLabel = d3
    .select('#title')
    .attr('y', 10)
    .attr('x', dimensions.width / 2)
    .text('Monthly Global Temperatures')
    .attr('fill', '#e0beb0')

  const descLabel = d3
    .select('#description')
    .attr('y', 15)
    .attr('x', dimensions.width / 2)
    .text(
      `${Math.min(...xYears)} - ${Math.max(...xYears)}: base temperature ${
        dataset.baseTemperature
      }°C`
    )
    .attr('fill', '#e0beb0')

  const legend = d3
    .select('.legend')
    .call(legendScale)
    .attr('id', 'legend')
    .attr('fill', '#e0beb0')

  const tooltip = d3.select('#tooltip')
  // ---------------------------------------------------
  // 7. SET UP INTERACTIONS
  // ---------------------------------------------------
  function onMouseEnter(e, d) {
    let x = xScale(xAccessor(d))
    let y = yScale(d.month)

    tooltip
      .style('opacity', 1)
      .style('left', e.pageX - 5 + 'px')
      .style('top', e.pageY - 45 + 'px')
      .style('transform', `translate(-50%, -50%)`)
      .attr('data-year', xAccessor(d))

    tooltip.select('#time').text(`${yAccessor(d.month)} ${xAccessor(d)}`)
    tooltip.select('#temp').text(`${colorAccessor(d)}°C`)
  }

  function onMouseLeave() {
    tooltip.style('opacity', 0)
  }
}

drawHeatMap()

function createChartDimensions() {
  // draw chart
  let dimensions = {
    width: window.innerWidth * 0.9,
    height: 500,
    legendWidth: 200,
    legendHeight: 20,
    barPadding: 2,
    margin: {
      top: 15,
      right: 15,
      bottom: 120,
      left: 90,
    },
  }

  // compute bounds dimensions by subtracting margins
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom

  return dimensions
}
