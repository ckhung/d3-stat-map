d3.select('#slider_age_min').call(d3.slider().axis(true).min(0).max(100).
    step(5).on('slide', onAgeMinChange));

d3.select('#slider_age_span').call(d3.slider().axis(true).min(5).max(100).
    step(5).on('slide', onAgeSpanChange));

function onAgeMinChange(evt, value) {
    d3.select('#text_age_min').text(value);
    n = Number(value) + Number(d3.select('#text_age_span').text()) - 1;
    d3.select('#text_age_max').text(n);
    refresh();
}

function onAgeSpanChange(evt, value) {
    d3.select('#text_age_span').text(value);
    n = Number(d3.select('#text_age_min').text()) + Number(value) - 1;
    d3.select('#text_age_max').text(n);
    refresh();
}

var census_data, data_on_display = {};

function percentage(d) { 
    min_group = Number(d3.select('#text_age_min').text()) / 5;
    total_groups = Number(d3.select('#text_age_span').text()) / 5;
    town = d.key;
    ratio = 0;
    for (i=0; i<total_groups && min_group+i<=20; ++i)
	ratio += census_data[town]['男'][min_group+i] + census_data[town]['女'][min_group+i];
    ratio /= census_data[town]['male_total'] + census_data[town]['female_total'];
    return (ratio*width).toString() + 'px';
}

function refresh() {
    bar_chart = d3.select('#bar_chart');
    width = parseInt(bar_chart.style('width')) - 120;
/*
    data_on_display = {
	'臺中市霧峰區': { 'percent': 0.3 },
	'臺中市大里區': { 'percent': 0.1 },
	'臺中市太平區': { 'percent': 0.2 },
	'臺中市烏日區': { 'percent': 0.25 }
    };
*/
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
	.style('width', percentage);
}

d3.json('census-taichung.json', function(error, data) {
    if (error) return console.warn(error);
    census_data = data;
    refresh();
});

