  
// d.group switched to d.location
function bubbleChart() {
  var width = window.innerWidth;
  var height = 425;

  var tooltip = floatingTooltip('breach_tooltip', 240);

  var center = { x: width / 2, y: height / 2 };

  var yearCenters = {
    2015: { x: 1*width /8, y: height / 2 },
    2016: { x: 2*width /8, y: height / 2 },
    2017: { x: 3*width /8, y: height / 2 },
    2018: { x: 4*width /8, y: height / 2 },
    2019: { x: 5*width /8, y: height / 2 },
    2020: { x: 6*width /8, y: height / 2 },
    2021: { x: 7*width /8, y: height / 2 }

  };

  var yearsTitleX = {

    2015: 1*width/8,
    2016: 2*width/8,
    2017: 3*width/8,
    2018: 4*width/8,
    2019: 5*width/8,
    2020: 6*width/8,
    2021: 7*width/8
  };

  var sourceCenters = {
    "Hacking": { x: width/5, y: height/2},
    "Theft/Loss": { x: 2*width/5 , y: height/2},
    "Improper Disposal": { x: 3*width/5 , y: height/2},
    "Unauthorized Access": { x: 4*width/5, y: height/2}
  };

  
  var sourceTitleX = {
    "Hacking" : width/5,
    "Theft/Loss": 2*width/5 +30,
    "Improper Disposal": 3*width/5 +25,
    "Unauthorized Access": 4*width/5 +35
  };

  

  var forceStrength = 0.03;

  var svg = null;
  var bubbles = null;
  var nodes = [];

  function charge(d) {
    return -Math.pow(d.radius, 2.0) * forceStrength;
  }

  var simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('x', d3.forceX().strength(forceStrength).x(center.x))
    .force('y', d3.forceY().strength(forceStrength).y(center.y))
    .force('charge', d3.forceManyBody().strength(charge))
    .on('tick', ticked);

  simulation.stop();

  var fillColor = d3.scaleOrdinal()

    .domain(['Network Server','Email','Computer','Paper/Films','Other'])
    .range(['#ff8585', '#3895d3', '#a1fa9d', '#ffffab', '#eaaffa']);
  


  function createNodes(rawData) {


    var maxAmount = d3.max(rawData, function (d) { return +d.records; });



    var radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([4, 30])
      .domain([0, maxAmount]);




    var myNodes = rawData.map(function (d) {
      return {
        id: d.id,
        radius: radiusScale(+d.records),
        value: +d.records,
        name: d.organization,
    
        source: d.source,
        group: d.group,
        year: d.year,
        continent: d.continent,
        x: Math.random() * 900,
        y: Math.random() * 800
      };
    });




    myNodes.sort(function (a, b) { return b.value - a.value; });

    return myNodes;
  }

  /*
   * Main entry point to the bubble chart. This function is returned
   * by the parent closure. It prepares the rawData for visualization
   * and adds an svg element to the provided selector and starts the
   * visualization creation process.
   *
   * selector is expected to be a DOM element or CSS selector that
   * points to the parent element of the bubble chart. Inside this
   * element, the code will add the SVG container for the visualization.
   *
   * rawData is expected to be an array of data objects as provided by
   * a d3 loading function like d3.csv.
   */
  var chart = function chart(selector, rawData) {

    nodes = createNodes(rawData);



    svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);


    bubbles = svg.selectAll('.bubble')
      .data(nodes, function (d) { return d.id; });






    var bubblesE = bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', function (d) { return fillColor(d.group); })
      .attr('stroke', function (d) { return d3.rgb(fillColor(d.group)).darker(); })
      .attr('stroke-width', 2)
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail);


    bubbles = bubbles.merge(bubblesE);



    bubbles.transition()
      .duration(2000)
      .attr('r', function (d) { return d.radius; });



    simulation.nodes(nodes);


    groupBubbles();
  };

  /*
   * Callback function that is called after every tick of the
   * force simulation.
   * Here we do the acutal repositioning of the SVG circles
   * based on the current x and y values of their bound node data.
   * These x and y values are modified by the force simulation.
   */
  function ticked() {
    bubbles
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });
  }

  /*
   * Provides a x value for each node to be used with the split by year
   * x force.
   */
  function nodeYearPos(d) {
    return yearCenters[d.year].x;
  }

  function nodeSourcePos(d) {
    return sourceCenters[d.source].x;
  }


  /*
   * Sets visualization in "single group mode".
   * The year labels are hidden and the force layout
   * tick function is set to move all nodes to the
   * center of the visualization.
   */
  function groupBubbles() {
    hideYearTitles();


    simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));


    simulation.alpha(1).restart();
  }


  /*
   * Sets visualization in "split by year mode".
   * The year labels are shown and the force layout
   * tick function is set to move nodes to the
   * yearCenter of their data's year.
   */
  function splitBubbles() {
    showYearTitles();


    simulation.force('x', d3.forceX().strength(forceStrength).x(nodeYearPos));


    simulation.alpha(1).restart();
  }

  function sourceSplitBubbles() {
    simulation.force('x', d3.forceX().strength(forceStrength).x(nodeSourcePos));
    simulation.alpha(1).restart();
  }

  /*
   * Hides Year title displays.
   */
  function hideYearTitles() {
    svg.selectAll('.year').remove();
  }

  /*
   * Shows Year title displays.
   */
  function showYearTitles() {


    var yearsData = d3.keys(yearsTitleX);
    var years = svg.selectAll('.year')
      .data(yearsData);

    years.enter().append('text')
      .attr('class', 'year')
      .attr('x', function (d) { return yearsTitleX[d]; })
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .text(function (d) { return d; });
  }
	function hideSourceTitles() {
		svg.selectAll('.source').remove();
	}

  function showSourceTitles() {
    var sourceData = d3.keys(sourceTitleX);
    var sources = svg.selectAll('.source')
      .data(sourceData);

    sources.enter().append('text')
      .attr('class','source')
      .attr('x',function (d) {return sourceTitleX[d]; })
      .attr('y', 40)
      .attr('text-anchor','middle')
      .text(function (d) {return d; });
  }



  /*
   * Function called on mouseover to display the
   * details of a bubble in the tooltip.
   */
  function showDetail(d) {

    d3.select(this).attr('stroke', 'black');

    var content = '<span class="name">Title: </span><span class="value">' +
                  d.name +
                  '</span><br/>' +
                  '<span class="name">Amount: </span><span class="value">' +
                  addCommas(d.value) +
                  '</span><br/>' +
                  '<span class="name">Year: </span><span class="value">' +
                  d.year +
                  '</span>';

    tooltip.showTooltip(content, d3.event);
  }

  /*
   * Hides tooltip
   */
  function hideDetail(d) {

    d3.select(this)
      .attr('stroke', d3.rgb(fillColor(d.group)).darker());

    tooltip.hideTooltip();
  }

  chart.toggleDisplay = function (displayName) {
    if (displayName === 'year') {
    	hideSourceTitles();
      splitBubbles();
    } else if (displayName == 'source') {
      hideYearTitles();
      showSourceTitles();
      sourceSplitBubbles();
    } else {
      hideSourceTitles();
      groupBubbles();
    }
  };


  return chart;
}


var myBubbleChart = bubbleChart();


function display(error, data) {
  if (error) {
    console.log(error);
  }

  myBubbleChart('#vis', data);
}


function setupButtons() {
  d3.select('#toolbar')
    .selectAll('.button')
    .on('click', function () {
  
      d3.selectAll('.button').classed('active', false);
  
      var button = d3.select(this);

  
      button.classed('active', true);

  
      var buttonId = button.attr('id');

  
  
      myBubbleChart.toggleDisplay(buttonId);
    });
}


function addCommas(nStr) {
  nStr += '';
  var x = nStr.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }

  return x1 + x2;
}
d3.csv('bubblechart.csv', display);
setupButtons();