var census_data = null;
var town_boundary = null;
var n2census = {};

function onAgeMinChange(evt, value) {
    d3.select('#text_age_min').text(value);
    var n = Number(value) + Number(d3.select('#text_age_span').text()) - 1;
    d3.select('#text_age_max').text(n);
    refresh_all();
}

function onAgeSpanChange(evt, value) {
    d3.select('#text_age_span').text(value);
    var n = Number(d3.select('#text_age_min').text()) + Number(value) - 1;
    d3.select('#text_age_max').text(n);
    refresh_all();
}

function pop_ratio(d) { 
    var min_age = Number(d3.select('#text_age_min').text());
    var age_span = Number(d3.select('#text_age_span').text());
    var upper = min_age+age_span;
    if (upper > 101) upper = 101;
    return (d['男'][upper] + d['女'][upper] -
	  d['男'][min_age] - d['女'][min_age] ) /
	  (d['男'][101] + d['女'][101]);
}

function male_binomial_z(d) { 
    var min_age = Number(d3.select('#text_age_min').text());
    var age_span = Number(d3.select('#text_age_span').text());
    var upper = min_age+age_span;
    if (upper > 101) upper = 101;
    var m = d['男'][upper] - d['男'][min_age];
    var f = d['女'][upper] - d['女'][min_age];
    return (m === 0) ?
	((f === 0) ? 0 : -9) :
	((f === 0) ? 9 : (m-f)/2*Math.sqrt((m+f)/m/f));
    // http://homepages.wmich.edu/~bwagner/StatReview/Binomial/Binomial%20Hyp.htm
}

function refresh_bar_chart() {
    var bar_chart = d3.select('#bar_chart_proper');
    var width = parseInt(bar_chart.style('width')) - 140;
    var bc_entries = bar_chart.selectAll('.bc_entry');
    bc_entries.select('.entry_bar').transition()
	.style('width', function (d) {
	    return (pop_ratio(d)*width).toString() + 'px';
	});
}

function refresh_gender_plot() {
    var width = parseInt(d3.select('#gender_plot_panel').style('width'));
    var height = width*0.6;
    d3.select('#gender_plot_panel svg').
	attr('width', width).
	attr('height', height);
    var data_values = census_data.map(pop_ratio);
    var sx = d3.scale.linear()
	.range([0, width])
	.domain([d3.min(data_values), d3.max(data_values)]);
    data_values = census_data.map(male_binomial_z);
    var sy = d3.scale.linear()
	.range([height*0.9, height*0.1])
	.domain([d3.min(data_values), d3.max(data_values)]);

    var canvas = d3.select('#gp_canvas');
    var towns = canvas.selectAll('.town');
    towns.transition()
	.attr('x', function(d) { return sx(pop_ratio(d)); } )
	.attr('y', function(d) { return sy(male_binomial_z(d)); } );

    var axisX = d3.svg.axis().scale(sx).orient("bottom"),
	axisY = d3.svg.axis().scale(sy).orient("left");
    canvas.select('#x_axis')
	.attr('transform', 'translate(0,' + height/2 + ')')
	.call(axisX);
    canvas.select('#y_axis')
	.attr('transform', 'translate(40,0)')
	.call(axisY);
}

// http://bl.ocks.org/mbostock/4060606 "choropleth"
function refresh_pop_map() {
    var width = parseInt(d3.select('#pop_map_panel').style('width'));
    var height = width;
    d3.select('#pop_map_panel svg').
	attr('width', width).
	attr('height', height);
    var canvas = d3.select('#pm_canvas'),
	towns = canvas.selectAll("path.town"),
	prmin = d3.min(census_data, pop_ratio),
	prmax = d3.max(census_data, pop_ratio);
    // "d3.js piecewise scale" => https://github.com/mbostock/d3/wiki/Quantitative-Scales
    // https://nelsonslog.wordpress.com/2011/04/11/d3-scales-and-interpolation/
    // https://gist.github.com/mbostock/3014589
    // http://bl.ocks.org/mbostock/3014589
    var color = d3.scale.linear()
	.range(['blue', 'white', 'red'])
	.interpolate(d3.interpolateLab)
	.domain([prmin, (prmin+prmax)/2, prmax]);
    towns.transition()
	.attr('fill', function(d) {
	    var c = n2census[d.properties.name];
	    // return typeof c === 'undefined' ? '#aaa' :
	    return color(pop_ratio(c));
	});
}

function refresh_all() {
    refresh_bar_chart();
    refresh_gender_plot();
    refresh_pop_map();
}

function create_axes() {
    // https://stackoverflow.com/questions/16919280/how-to-update-axis-using-d3-js
    var sx = d3.scale.linear().domain([0,1]).range([0,800]),
	sy = d3.scale.linear().domain([-3,3]).range([0,600]),
	axisX = d3.svg.axis().scale(sx).orient('bottom'),
	axisY = d3.svg.axis().scale(sy).orient('left'),
	canvas = d3.select('#gp_canvas');
    canvas.append('g').attr('id', 'x_axis');
    canvas.append('g').attr('id', 'y_axis');
}

function init() {
    /******************* slider *******************/
    d3.select('#slider_age_min').call(d3.slider().axis(true).min(0).max(100).
	step(1).on('slide', onAgeMinChange));
    d3.select('#slider_age_span').call(d3.slider().axis(true).min(1).max(101).
	step(1).on('slide', onAgeSpanChange));

    /******************* bar chart *******************/
    var bc_entries = d3
	.select('#bar_chart_proper')
	.selectAll('.bc_entry')
	.data(
	    census_data, function(d) { return d.name; }
	);
    bc_entries.exit().remove();
    // https://stackoverflow.com/questions/13203897/d3-nested-appends-and-data-flow
    var new_entries = bc_entries.enter()
	.append('div')
	.attr('class', 'bc_entry');
    new_entries.append('div')
	.attr('class', 'entry_text')
	.html(function(d) { return d.name; });
    new_entries.append('div')
	.attr('class', 'entry_bar')
	.html('&nbsp;');

    /******************* gender plot *******************/
    // gender plot zoom listener
    var gpzl = d3.behavior.zoom()
	.scaleExtent([0.2, 8])
	.on('zoom', function gpzh() {
	    d3.select('#gp_canvas').attr('transform', 'translate(' +
	    d3.event.translate + ')scale(' + d3.event.scale + ')');
	});

    // http://bl.ocks.org/cpdean/7a71e687dd5a80f6fd57
    var canvas = d3.select('#gender_plot_panel')
	.append('svg')
	.call(gpzl)
	.attr('style', 'outline: thin solid #088;')
	.append('g')
	.attr('id', 'gp_canvas');
    create_axes();

    var towns = canvas.selectAll('.town').data(
	census_data, function(d) { return d.name; }
    );
    towns.exit().remove();
    var new_towns = towns.enter()
	.append('text')
	.attr('class', 'town')
	.text(function (d) {
	    match = /^.*?(縣|市)(.*)$/.exec(d.name);
	    return match[2];
	});

    /******************* population map *******************/
//    https://stackoverflow.com/questions/14492284/center-a-map-in-d3-given-a-geojson-object
    var width = 600;
    var height = width*1.2;
    var projection = d3.geo.mercator().scale(1).translate([0, 0]);
    var path = d3.geo.path().projection(projection);
    var b = path.bounds(town_boundary),
	s = 0.95 / Math.max((b[1][0] - b[0][0]) / width,
	    (b[1][1] - b[0][1]) / height),
	t = [(width - s * (b[1][0] + b[0][0])) / 2,
	    (height - s * (b[1][1] + b[0][1])) / 2];
    projection.scale(s).translate(t);
    // population map zoom listener
    var pmzl = d3.behavior.zoom()
	.scaleExtent([0.2, 8])
	.on('zoom', function () {
	    d3.select('#pm_canvas').attr('transform', 'translate(' +
	    d3.event.translate + ')scale(' + d3.event.scale + ')');
	});

    canvas = d3.select('#pop_map_panel')
	.append('svg')
	.call(pmzl)
	.attr('style', 'outline: thin solid #088;')
	.append('g')
	.attr('id', 'pm_canvas');
    canvas.selectAll("path")
        .data(town_boundary.features)
    .enter()
        .append('path')
        .attr('d', path)
        .attr('class', 'town')
	.append('svg:title')
        .text(function(d) { return d.properties.name; });

    /******************* overall setup *******************/
    d3.select(window).on('resize', refresh_all); 
    d3.selectAll('button.div-switch').on('click.refresh', refresh_all); 
    refresh_all();
}

function is_ready() {
    return census_data!==null && town_boundary!==null;
}
    
d3.json('census-taichung.json', function(error, data) {
    if (error) return console.warn(error);
    data.forEach(function (d) {
	d['男'].unshift(0);
	d['女'].unshift(0);
	n2census[d.name] = d;
    });
    census_data = data;
    if (is_ready()) init();
});

d3.json('town-boundary.json', function(error, data) {
    if (error) return console.warn(error);
    data.features = data.features.filter(function (d) {
	return d.properties.name.indexOf('臺中市') >= 0;
    });
    town_boundary = data;
    if (is_ready()) init();
});

    // https://stackoverflow.com/questions/13808741/bar-chart-with-d3-js-and-an-associative-array
    // Bar chart with d3.js and an associative array
//    var divs = bar_chart.selectAll('.entry').data(
//        d3.entries(census_data), function(d) { return d.key; }
//    );
//	    match = /^(.*?(縣|市))(.*)$/.exec(d.name);
