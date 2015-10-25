/* global window, console, d3, queue */

// https://stackoverflow.com/questions/11957977/how-to-fix-foo-is-not-defined-error-reported-by-jslint

var G = {};  // global variables

// https://github.com/MasterMaps/d3-slider
function onAgeMinChange(evt, value) {
    d3.select('#text-age-min').text(value);
    var n = + value + Number(d3.select('#text-age-span').text()) - 1;
    d3.select('#text-age-max').text(n);
    refreshAll();
}

function onAgeSpanChange(evt, value) {
    d3.select('#text-age-span').text(value);
    var n = + d3.select('#text-age-min').text() + value - 1;
    d3.select('#text-age-max').text(n);
    refreshAll();
}

function popRatio(d) { 
    var minAge = + d3.select('#text-age-min').text();
    var ageSpan = + d3.select('#text-age-span').text();
    var upper = minAge + ageSpan;
    if (upper > 101) { upper = 101; }
    return (d['男'][upper] + d['女'][upper] -
	  d['男'][minAge] - d['女'][minAge] ) /
	  (d['男'][101] + d['女'][101]);
}

function maleBinomialZ(d) { 
    var minAge = + d3.select('#text-age-min').text();
    var ageSpan = + d3.select('#text-age-span').text();
    var upper = minAge + ageSpan;
    if (upper > 101) { upper = 101; }
    var m = d['男'][upper] - d['男'][minAge];
    var f = d['女'][upper] - d['女'][minAge];
    return (m === 0) ?
	((f === 0) ? 0 : -9) :
	((f === 0) ? 9 : (m-f)/2*Math.sqrt((m+f)/m/f));
    // http://homepages.wmich.edu/~bwagner/StatReview/Binomial/Binomial%20Hyp.htm
}

function refreshBarChart() {
    var barChart = d3.select('#bar-chart-proper');
    var width = parseInt(barChart.style('width')) - 140;
    var bcEntries = barChart.selectAll('.bc-entry');
    bcEntries.select('.entry-bar').transition()
	.style('width', function (d) {
	    return (popRatio(d)*width).toString() + 'px';
	});
}

function refreshGenderPlot() {
    var width = parseInt(d3.select('#gender-plot-panel').style('width'));
    var height = width*0.6;
    d3.select('#gender-plot-panel svg').
	attr('width', width).
	attr('height', height);
    var dataValues = G.targetCensusData.map(popRatio);
    var sx = d3.scale.linear()
	.range([0, width])
	.domain([d3.min(dataValues), d3.max(dataValues)]);
    dataValues = G.targetCensusData.map(maleBinomialZ);
    var sy = d3.scale.linear()
	.range([height*0.9, height*0.1])
	.domain([d3.min(dataValues), d3.max(dataValues)]);

    var canvas = d3.select('#gp-canvas');
    var towns = canvas.selectAll('.town');
    towns.transition()
	.attr('x', function(d) { return sx(popRatio(d)); } )
	.attr('y', function(d) { return sy(maleBinomialZ(d)); } );

    var axisX = d3.svg.axis().scale(sx).orient('bottom'),
	axisY = d3.svg.axis().scale(sy).orient('left');
    canvas.select('#x_axis')
	.attr('transform', 'translate(0,' + height/2 + ')')
	.call(axisX);
    canvas.select('#y_axis')
	.attr('transform', 'translate(40,0)')
	.call(axisY);
}

// http://bl.ocks.org/mbostock/4060606 "choropleth"
function refreshPopMap() {
    var width = parseInt(d3.select('#pop-map-panel').style('width'));
    var height = width;
    d3.select('#pop-map-panel svg').
	attr('width', width).
	attr('height', height);
    var canvas = d3.select('#pm-canvas'),
	towns = canvas.selectAll('path.town'),
	prmin = d3.min(G.targetCensusData, popRatio),
	prmax = d3.max(G.targetCensusData, popRatio);
    // "d3.js piecewise scale" =>
    // https://github.com/mbostock/d3/wiki/Quantitative-Scales
    // https://nelsonslog.wordpress.com/2011/04/11/d3-scales-and-interpolation/
    // https://gist.github.com/mbostock/3014589
    // http://bl.ocks.org/mbostock/3014589
    var color = d3.scale.linear()
	.range(['blue', 'white', 'red'])
	.interpolate(d3.interpolateLab)
	.domain([prmin, (prmin+prmax)/2, prmax]);
    towns.transition()
	.attr('fill', function(d) {
	    return color(popRatio(d));
	});
}

function refreshAll() {
    refreshBarChart();
    refreshGenderPlot();
    refreshPopMap();
}

function createAxes() {
    // https://stackoverflow.com/questions/16919280/how-to-update-axis-using-d3-js
    var sx = d3.scale.linear().domain([0,1]).range([0,800]),
	sy = d3.scale.linear().domain([-3,3]).range([0,600]),
	axisX = d3.svg.axis().scale(sx).orient('bottom'),
	axisY = d3.svg.axis().scale(sy).orient('left'),
	canvas = d3.select('#gp-canvas');
    canvas.append('g').attr('id', 'x_axis');
    canvas.append('g').attr('id', 'y_axis');
}

function prepareTargetRegion(selected) {
    G.targetCity = selected;

    G.targetCensusData = G.fullCensusData.filter(function (d) {
	return d.name.indexOf(G.targetCity) >= 0;
    });

    /******************* bar chart *******************/
    var bcEntries = d3
	.select('#bar-chart-proper')
	.selectAll('.bc-entry')
	.data(
	    G.targetCensusData, function(d) { return d.name; }
	);
    bcEntries.exit().remove();
    // https://stackoverflow.com/questions/13203897/d3-nested-appends-and-data-flow
    var newEntries = bcEntries.enter()
	.append('div')
	.attr('class', 'bc-entry');
    newEntries.append('div')
	.attr('class', 'entry-text')
	.html(function(d) { return d.name; });
    newEntries.append('div')
	.attr('class', 'entry-bar')
	.html('&nbsp;');

    /******************* gender plot *******************/
    var towns = d3.select('#gp-canvas').selectAll('.town').data(
	G.targetCensusData, function(d) { return d.name; }
    );
    towns.exit().remove();
    towns.enter()
	.append('text')
	.attr('class', 'town')
	.text(function (d) {
	    var match = /^.*?(縣|市)(.*)$/.exec(d.name);
	    return match[2];
	});

    /******************* population map *******************/
// https://stackoverflow.com/questions/14492284/center-a-map-in-d3-given-a-geojson-object
    var width = 600;
    var height = width;
    var projection = d3.geo.mercator().scale(1).translate([0, 0]);
    var path = d3.geo.path().projection(projection);
    var targetBoundary = { 'type': 'FeatureCollection' };
	targetBoundary.features = G.townBoundary.features.filter(function (d) {
	    return d.properties.name.indexOf(G.targetCity) >= 0;
	});
    var b = path.bounds(targetBoundary),
	s = 0.95 / Math.max((b[1][0] - b[0][0]) / width,
	    (b[1][1] - b[0][1]) / height),
	t = [(width - s * (b[1][0] + b[0][0])) / 2,
	    (height - s * (b[1][1] + b[0][1])) / 2];
    projection.scale(s).translate(t);

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
        .attr('d', path)
        .attr('class', 'county')
	.attr('fill', '#ffe')
	.attr('stroke', 'black')
	.attr('stroke-width', 0.5)
	.append('svg:title')
        .text(function(d) { return d.properties['C_Name']; });

    towns = d3.select('#pm-canvas').selectAll('path.town')
        .data(G.targetCensusData, function(d) { return d.name; });
    towns.exit().remove();
    towns.enter()
        .append('path')
        .attr('d', function(d) { return path(d.boundary); })
        .attr('class', 'town')
	.append('svg:title')
        .text(function(d) { return d.name; });

    /******************* overall setup *******************/
    d3.select(window).on('resize', refreshAll); 
    d3.selectAll('button.div-switch').on('click.refresh', refreshAll); 
    refreshAll();
}

function init(error, data) {
    /******************* received input data files *******************/
    if (error) { return console.warn(error); }

    G.fullCensusData = data[0];
    G.townBoundary = data[1];
    G.countyBoundary = data[2];

    var n2map = {};
    G.townBoundary.features.forEach(function (d) {
	n2map[d.properties.name] = d;
    });

    var regionList = {};
    G.fullCensusData.forEach(function (d) {
	regionList[/^(.{2,3}(縣|市))/.exec(d.name)[1]] = 0;
	if (d.name in n2map) {
	    d.boundary = n2map[d.name];
	} else {
	    console.log(d.name + ' of census-town.json not found in town-boundary.json');
	}
    });

    G.fullCensusData.forEach(function (d) {
	d['男'].unshift(0);
	d['女'].unshift(0);
    });

    /******************* slider *******************/
    d3.select('#slider-age-min').call(d3.slider().axis(true).min(0).max(100).
	step(1).on('slide', onAgeMinChange));
    d3.select('#slider-age-span').call(d3.slider().axis(true).min(1).max(101).
	step(1).on('slide', onAgeSpanChange));

    /******************* city/county selection *******************/
    var regionSelection = d3
	.select('#region-selection')
	.selectAll('option')
	.data(Object.keys(regionList))
	.enter()
	.append('option')
	.attr('class', 'bc-entry')
	.html(function(d) { return d; });
    d3.select('#region-selection').on('change', function() {
	// https://stackoverflow.com/questions/18883675/d3-js-get-value-of-selected-option
	prepareTargetRegion(this.options[this.selectedIndex].value);
    });

    /******************* gender plot *******************/
    // gender plot zoom listener
    var gpzl = d3.behavior.zoom()
	.scaleExtent([0.2, 8])
	.on('zoom', function gpzh() {
	    d3.select('#gp-canvas').attr('transform', 'translate(' +
	    d3.event.translate + ')scale(' + d3.event.scale + ')');
	});

    // http://bl.ocks.org/cpdean/7a71e687dd5a80f6fd57
    d3.select('#gender-plot-panel')
	.append('svg')
	.call(gpzl)
	.attr('style', 'outline: thin solid #088;')
	.append('g')
	.attr('id', 'gp-canvas');
    createAxes();

    /******************* population map *******************/
    // population map zoom listener
    var pmzl = d3.behavior.zoom()
	.scaleExtent([0.1, 30])
	.on('zoom', function () {
	    d3.select('#pm-canvas').attr('transform', 'translate(' +
	    d3.event.translate + ')scale(' + d3.event.scale + ')');
	});

    d3.select('#pop-map-panel')
	.append('svg')
	.call(pmzl)
	.attr('style', 'outline: thin solid #088;')
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
