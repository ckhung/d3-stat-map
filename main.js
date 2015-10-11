d3.select('#slider_age_min').call(d3.slider().axis(true).min(0).max(100).
    step(1).on('slide', onAgeMinChange));

d3.select('#slider_age_span').call(d3.slider().axis(true).min(1).max(101).
    step(1).on('slide', onAgeSpanChange));

function onAgeMinChange(evt, value) {
    d3.select('#text_age_min').text(value);
    n = Number(value) + Number(d3.select('#text_age_span').text()) - 1;
    d3.select('#text_age_max').text(n);
    refresh_all();
}

function onAgeSpanChange(evt, value) {
    d3.select('#text_age_span').text(value);
    n = Number(d3.select('#text_age_min').text()) + Number(value) - 1;
    d3.select('#text_age_max').text(n);
    refresh_all();
}

var census_data;

function pop_ratio(d) { 
    min_age = Number(d3.select('#text_age_min').text());
    age_span = Number(d3.select('#text_age_span').text());
    town = d.key;
    upper = min_age+age_span;
    if (upper > 101) upper = 101;
    ratio = (census_data[town]['男'][upper]
	  + census_data[town]['女'][upper]
	  - census_data[town]['男'][min_age]
	  - census_data[town]['女'][min_age] )
	  / (census_data[town]['男'][101] + census_data[town]['女'][101]);
    return (ratio*width).toString() + 'px';
}

function refresh_bar_chart() {
    bar_chart = d3.select('#bar_chart_proper');
    width = parseInt(bar_chart.style('width')) - 140;
    // https://stackoverflow.com/questions/13808741/bar-chart-with-d3-js-and-an-associative-array
    // Bar chart with d3.js and an associative array
    divs = bar_chart.selectAll('.entry').data(
	d3.entries(census_data), function(d) { return d.key; }
    );

    divs.exit().remove();

    // https://stackoverflow.com/questions/13203897/d3-nested-appends-and-data-flow
    new_entries = divs.enter()
	.append('div')
	.attr('class', 'entry');
    new_entries.append('div')
	.attr('class', 'entry_text')
	.html(function(d) { return d.key; });
    new_entries.append('div')
	.attr('class', 'entry_bar')
	.html('&nbsp;');

    divs.select('.entry_bar').transition()
	.style('width', pop_ratio);
}

function refresh_gender_plot() {
    width = parseInt(d3.select('#gender_plot_panel').style('width'));
    svg = d3.select('#gender_plot_panel').select('svg');
    svg.attr('width', width).attr('height', width);
    svg.append('rect')
	.attr('width', '100%')
	.attr('height', '100%')
	.attr('fill', '#eef');
}

function refresh_all(e) {
    refresh_bar_chart();
    refresh_gender_plot();
}

d3.json('census-taichung.json', function(error, data) {
    if (error) return console.warn(error);
    census_data = data;
    for (var town in census_data) {
	census_data[town]['男'].unshift(0);
	census_data[town]['女'].unshift(0);
    }

    d3.select("#gender_plot_panel").append("svg");

    d3.select(window).on('resize', refresh_all); 
    d3.selectAll('button.div-switch').on('click.refresh', refresh_all); 
    refresh_all();
});

