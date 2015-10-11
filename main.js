d3.select('#slider_age_min').call(d3.slider().axis(true).min(0).max(100).
    step(1).on('slide', onAgeMinChange));

d3.select('#slider_age_span').call(d3.slider().axis(true).min(1).max(101).
    step(1).on('slide', onAgeSpanChange));

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

var census_data;

function pop_ratio(d) { 
    var min_age = Number(d3.select('#text_age_min').text());
    var age_span = Number(d3.select('#text_age_span').text());
    var upper = min_age+age_span;
    if (upper > 101) upper = 101;
    return (d['男'][upper] + d['女'][upper]
	  - d['男'][min_age] - d['女'][min_age] )
	  / (d['男'][101] + d['女'][101]);
}

function refresh_bar_chart() {
    var bar_chart = d3.select('#bar_chart_proper');
    var width = parseInt(bar_chart.style('width')) - 140;
    var divs = bar_chart.selectAll('.entry').data(
	census_data, function(d) { return d.name; }
    );

    divs.exit().remove();

    // https://stackoverflow.com/questions/13203897/d3-nested-appends-and-data-flow
    var new_entries = divs.enter()
	.append('div')
	.attr('class', 'entry');
    new_entries.append('div')
	.attr('class', 'entry_text')
	.html(function(d) { return d.name; });
    new_entries.append('div')
	.attr('class', 'entry_bar')
	.html('&nbsp;');

    divs.select('.entry_bar').transition()
	.style('width', function (d) {
	    return (pop_ratio(d)*width).toString() + 'px';
	});
}

function refresh_gender_plot() {
    var width = parseInt(d3.select('#gender_plot_panel').style('width'));
    var svg = d3.select('#gender_plot_panel').select('svg');
    var height = width;
    svg.attr('width', width).attr('height', height);
    svg.select('#background')
	.attr('width', '100%')
	.attr('height', '100%');
    var x = d3.scale.linear()
	.range([0, width])
	.domain(Object.keys(census_data).map(function (k) {
	    return pop_ratio(census_data[k]);
	}));
    var y = x;
    
/*
    var towns = svg.selectAll('text.town').data(
	d3.entries(census_data), function(d) { return d.key; }
    );

    towns.exit().remove();

    var new_towns = svg.enter()
	.append('text')
	.attr('class', 'town')
	.text(function (d) { return d.key; });

    towns.select('text.town').transition()
	.attr('x', pop_ratio)
	.attr('y', pop_ratio);
*/
}

function refresh_all() {
    refresh_bar_chart();
//    refresh_gender_plot();
}

d3.json('census-taichung.json', function(error, data) {
    if (error) return console.warn(error);
    census_data = data;
    census_data.forEach(function (d) {
	d['男'].unshift(0);
	d['女'].unshift(0);
    });

    var svg = d3.select("#gender_plot_panel").append("svg");
    svg.append('rect')
	.attr('id', 'background')
	.attr('fill', '#eef');

    d3.select(window).on('resize', refresh_all); 
    d3.selectAll('button.div-switch').on('click.refresh', refresh_all); 
    refresh_all();
});

    // https://stackoverflow.com/questions/13808741/bar-chart-with-d3-js-and-an-associative-array
    // Bar chart with d3.js and an associative array
//    var divs = bar_chart.selectAll('.entry').data(
//        d3.entries(census_data), function(d) { return d.key; }
//    );
