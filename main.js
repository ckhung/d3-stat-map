/* global window, console, d3, queue */
// https://stackoverflow.com/questions/11957977/how-to-fix-foo-is-not-defined-error-reported-by-jslint
var G = { }; // global variables

// https://github.com/MasterMaps/d3-slider
function onAgeMinChange(evt, value) {
  d3.select('#text-age-min').text(value);
  var n = +value + Number(d3.select('#text-age-span').text()) - 1;
  d3.select('#text-age-max').text(n);
  refreshCurrent();
}

function onAgeSpanChange(evt, value) {
  d3.select('#text-age-span').text(value);
  var n = +d3.select('#text-age-min').text() + value - 1;
  d3.select('#text-age-max').text(n);
  refreshCurrent();
}

function popRatio(d) {
  var minAge = +d3.select('#text-age-min').text();
  var ageSpan = +d3.select('#text-age-span').text();
  var upper = minAge + ageSpan;
  if (upper > 101) {
    upper = 101;
  }
  return (d['男'][upper] + d['女'][upper] -
      d['男'][minAge] - d['女'][minAge]) /
    (d['男'][101] + d['女'][101]);
}

function maleBinomialZ(d) {
  var minAge = +d3.select('#text-age-min').text();
  var ageSpan = +d3.select('#text-age-span').text();
  var upper = minAge + ageSpan;
  if (upper > 101) {
    upper = 101;
  }
  var m = d['男'][upper] - d['男'][minAge];
  var f = d['女'][upper] - d['女'][minAge];
  // assuming population mean of males is 0.5
  return (m - f) / Math.sqrt(m + f + 0.01);
  // https://onlinecourses.science.psu.edu/stat414/node/179
  // http://homepages.wmich.edu/~bwagner/StatReview/Binomial/Binomial%20Hyp.htm
}

function refreshBarChart() {
  var barChart = d3.select('#bar-chart-proper');
  var width = barChart.style('width').match(/(\d+)px/);
  width = width && +width[1] > 140 ? + width[1] - 140 : 0;
  // this does not work: width = barChart.node().style.width - 140;
  // https://stackoverflow.com/questions/3778335/how-to-retrieve-the-display-property-of-a-dom-element
  // https://groups.google.com/forum/#!topic/d3-js/k_yiGCIDe0Y
  var bcEntries = barChart.selectAll('.bc-entry');
  bcEntries.select('.entry-bar').transition()
    .style('width', function(d) {
      return (popRatio(d) * width).toString() + 'px';
    });
}

function refreshGenderPlot() {
  // https://stackoverflow.com/questions/16265123/resize-svg-when-window-is-resized-in-d3-js
  var viewBox = d3.select('#gp-rsvg-wrapper svg')
    .attr('viewBox').split(' ').map(parseFloat);
  var width = viewBox[2], height = viewBox[3];
  var dataValues = G.targetCensusData.map(popRatio);
  var sx = d3.scale.linear()
    .range([0, width])
    .domain([d3.min(dataValues) * 0.8, d3.max(dataValues) * 1.2]);
  dataValues = G.targetCensusData.map(maleBinomialZ);
  var sy = d3.scale.linear()
    .range([height * 0.9, height * 0.1])
    .domain([-20, 20]);

  var canvas = d3.select('#gp-canvas');
  var towns = canvas.selectAll('.town');
  towns.transition()
    .attr('x', function(d) {
      return sx(popRatio(d));
    })
    .attr('y', function(d) {
      return sy(maleBinomialZ(d));
    });

  var axisX = d3.svg.axis().scale(sx).orient('bottom'),
    axisY = d3.svg.axis().scale(sy).orient('left');
  canvas.select('#x_axis')
    .attr('transform', 'translate(0,' + height / 2 + ')')
    .call(axisX);
  canvas.select('#y_axis')
    .attr('transform', 'translate(40,0)')
    .call(axisY);
}

// http://bl.ocks.org/mbostock/4060606 'choropleth'
function refreshPopMap() {
  var canvas = d3.select('#pm-canvas'),
    towns = canvas.selectAll('path.town'),
    prmin = d3.min(G.targetCensusData, popRatio),
    prmax = d3.max(G.targetCensusData, popRatio);
  // 'd3.js piecewise scale' =>
  // https://github.com/mbostock/d3/wiki/Quantitative-Scales
  // https://nelsonslog.wordpress.com/2011/04/11/d3-scales-and-interpolation/
  // https://gist.github.com/mbostock/3014589
  // http://bl.ocks.org/mbostock/3014589
  var ratio2color = d3.scale.linear()
    .range(['blue', 'white', 'red'])
    .interpolate(d3.interpolateLab)
    .domain([prmin, (prmin+prmax)/2, prmax]);
  towns.transition()
    .attr('fill', function(d) {
      return ratio2color(popRatio(d));
    });

  // note: ratio2color is being irresponsibly recycled
  // in a different context...
  ratio2color.domain(ratio2color.domain().map(function(r) { return r*100; }));
  G.legendPainter.scale(ratio2color);
  G.legendPainter(d3.select('#color-legend'));
  // https://github.com/susielu/d3-legend/issues/18
}

function refreshCurrent() {
  var active = d3.select('.div-switch.active').attr('value');
  if (active == '#bar-chart-panel') {
    refreshBarChart();
  } else if (active == '#gender-plot-panel') {
    refreshGenderPlot();
  } else if (active == '#pop-map-panel') {
    refreshPopMap();
  }
}

function createAxes() {
  // https://stackoverflow.com/questions/16919280/how-to-update-axis-using-d3-js
  var sx = d3.scale.linear().domain([0, 1]).range([0, 800]),
    sy = d3.scale.linear().domain([-3, 3]).range([0, 600]),
    canvas = d3.select('#gp-canvas');
  canvas.append('g').attr('id', 'x_axis');
  canvas.append('g').attr('id', 'y_axis');
}

function rebuildLegend() {
  // http://d3-legend.susielu.com/
  // https://github.com/susielu/d3-legend/issues/15
  // take care to prevent the legend from being scaled
  d3.select('#color-legend').remove();
  var legendBox = d3.select('#pm-zoom-or-zoomless')
    .append('g')
    .attr('id', 'color-legend')
    .attr('transform', 'translate(20,20)');
  G.legendPainter = d3.legend.color()
    .cells(7)
    .title('圖例(%)')
    .ascending(true);
  // https://github.com/susielu/d3-legend/issues/15
  // https://github.com/susielu/d3-legend/issues/18
}

function prepareTargetRegion(selected) {
  if (typeof selected == 'undefined') {
    var rs = d3.select('#region-selection').node();
    selected = rs.options[rs.selectedIndex].value;
  }
  G.targetCity = selected;

  G.targetCensusData = G.fullCensusData.filter(function(d) {
    return d.name.indexOf(G.targetCity) >= 0;
  });

  /******************* bar chart *******************/
  var bcEntries = d3
    .select('#bar-chart-proper')
    .selectAll('.bc-entry')
    .data(
      G.targetCensusData,
      function(d) {
        return d.name;
      }
    );
  bcEntries.exit().remove();
  // https://stackoverflow.com/questions/13203897/d3-nested-appends-and-data-flow
  var newEntries = bcEntries.enter()
    .append('div')
    .attr('class', 'bc-entry');
  newEntries.append('div')
    .attr('class', 'entry-text')
    .html(function(d) {
      return d.name;
    });
  newEntries.append('div')
    .attr('class', 'entry-bar')
    .html('&nbsp;');

  /******************* gender plot *******************/
  var towns = d3.select('#gp-canvas').selectAll('.town').data(
    G.targetCensusData,
    function(d) {
      return d.name;
    }
  );
  towns.exit().remove();
  towns.enter()
    .append('text')
    .attr('class', 'town')
    .text(function(d) {
      var match = /^.*?(縣|市)(.*)$/.exec(d.name);
      return match[2];
    });

  /******************* population map *******************/
  // https://stackoverflow.com/questions/14492284/center-a-map-in-d3-given-a-geojson-object
  // https://stackoverflow.com/questions/16265123/resize-svg-when-window-is-resized-in-d3-js
  var viewBox = d3.select('#pm-rsvg-wrapper svg')
    .attr('viewBox').split(' ').map(parseFloat);
  var width = viewBox[2], height = viewBox[3];
  var mproj = d3.geo.mercator().scale(1).translate([0, 0]);
  var mapObjs = d3.geo.path().projection(mproj);
  var targetBoundary = {
    'type': 'FeatureCollection'
  };
  targetBoundary.features = G.countyBoundary.features.filter(function(d) {
    return d.properties['C_Name'].indexOf(G.targetCity) >= 0;
  });
  var b = mapObjs.bounds(targetBoundary),
    s = 0.95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
    t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
  mproj.scale(s).translate(t);

  // draw counties before towns of target county for
  // correct z-order
  // https://stackoverflow.com/questions/482115/with-javascript-can-i-change-the-z-index-layer-of-an-svg-g-element
  var counties = d3.select('#pm-canvas').selectAll('path.county');
  counties.remove();
  counties = d3.select('#pm-canvas').selectAll('path.county')
    .data(G.countyBoundary.features, function(d) {
      return d.properties['C_Name'];
    });
  counties.enter()
    .append('path')
    .attr('d', mapObjs)
    .attr('class', 'county')
    .attr('fill', '#ffe')
    .attr('stroke', 'black')
    .attr('stroke-width', 0.5)
    .append('svg:title')
    .text(function(d) {
      return d.properties['C_Name'];
    });

  towns = d3.select('#pm-canvas').selectAll('path.town')
    .data(G.targetCensusData, function(d) {
      return d.name;
    });
  towns.exit().remove();
  towns.enter()
    .append('path')
    .attr('d', function(d) {
      return mapObjs(d.boundary);
    })
    .attr('class', 'town')
    .append('svg:title')
    .text(function(d) {
      return d.name;
    });

  rebuildLegend();

  /******************* overall setup *******************/
  d3.selectAll('button.div-switch').on('click', refreshCurrent);
  refreshCurrent();
}

function init(error, data) {
  /******************* received input data files *******************/
  if (error) { return console.warn(error); }

  G.fullCensusData = data[0];
  G.townBoundary = data[1];
  G.countyBoundary = data[2];

  var n2map = {};
  G.townBoundary.features.forEach(function(d) {
    n2map[d.properties.name] = d;
  });

  var regionList = {};
  G.fullCensusData.forEach(function(d) {
    regionList[/^(.{2,3}(縣|市))/.exec(d.name)[1]] = 0;
    if (d.name in n2map) {
      d.boundary = n2map[d.name];
    } else {
      console.log(d.name + ' of census-town.json not found in town-boundary.json');
    }
  });

  G.fullCensusData.forEach(function(d) {
    d['男'].unshift(0);
    d['女'].unshift(0);
  });

  /******************* slider *******************/
  var v = d3.select('#text-age-min').text();
  d3.select('#slider-age-min').call(
    d3.slider().axis(true).min(0).max(100)
      .step(1).value(v).on('slide', onAgeMinChange)
  );
  v = d3.select('#text-age-span').text();
  d3.select('#slider-age-span').call(
    d3.slider().axis(true).min(1).max(101)
      .step(1).value(v).on('slide', onAgeSpanChange)
  );

  /******************* city/county selection *******************/
  var regionSelection = d3
    .select('#region-selection')
    .selectAll('option')
    .data(Object.keys(regionList))
    .enter()
    .append('option')
    .attr('class', 'bc-entry')
    .html(function(d) {
      return d;
    });
  d3.select('#region-selection').on('change', prepareTargetRegion);
  // https://stackoverflow.com/questions/18883675/d3-js-get-value-of-selected-option

  /******************* gender plot *******************/
  // gender plot zoom
  var gpzoom = d3.behavior.zoom()
    .scaleExtent([0.2, 8])
    .on('zoom', function () {
      d3.select('#gp-canvas').attr('transform', 'translate(' +
        d3.event.translate + ')scale(' + d3.event.scale + ')');
    });

  // http://bl.ocks.org/cpdean/7a71e687dd5a80f6fd57
  // https://stackoverflow.com/questions/16265123/resize-svg-when-window-is-resized-in-d3-js
  d3.select('#gp-rsvg-wrapper')
    .append('svg')
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('viewBox', '0 0 800 600')
    .attr('class', 'rsvg-content')
    .call(gpzoom)
    .append('g')
    .attr('id', 'gp-canvas');
  createAxes();

  /******************* population map *******************/
  // population map zoom
  var pmzoom = d3.behavior.zoom()
    .scaleExtent([0.1, 30])
    .on('zoom', function() {
      d3.select('#pm-canvas').attr('transform', 'translate(' +
        d3.event.translate + ')scale(' + d3.event.scale + ')');
    });

  d3.select('#pm-rsvg-wrapper')
    .append('svg')
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('viewBox', '0 0 800 600')
    .attr('class', 'rsvg-content')
    .call(pmzoom)
    .append('g')
    .attr('id', 'pm-zoom-or-zoomless')	// see legend
    .append('g')
    .attr('id', 'pm-canvas');

  /**************** start default target city/county ****************/
  var defaultTarget = '臺中市';
  d3.select('#region-selection').property('value', defaultTarget);
  prepareTargetRegion(defaultTarget);
}

// https://github.com/mbostock/queue
queue()
  .defer(d3.json, 'census-town.json')
  .defer(d3.json, 'town-boundary.json')
  .defer(d3.json, 'county-boundary.json')
  .awaitAll(init);

// https://stackoverflow.com/questions/13808741/bar-chart-with-d3-js-and-an-associative-array
// Bar chart with d3.js and an associative array
//    var divs = barChart.selectAll('.entry').data(
//        d3.entries(G.targetCensusData), function(d) { return d.key; }
//    );
//	    match = /^(.*?(縣|市))(.*)$/.exec(d.name);
