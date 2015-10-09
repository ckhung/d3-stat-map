d3.select('#slider_age_min').call(d3.slider().axis(true).min(0).max(100).
    step(5).on('slide', onAgeMinChange));

d3.select('#slider_age_span').call(d3.slider().axis(true).min(5).max(100).
    step(5).on('slide', onAgeSpanChange));

function onAgeMinChange(evt, value) {
    d3.select('#text_age_min').text(value);
    n = Number(value) + Number(d3.select('#text_age_span').text()) - 1;
    d3.select('#text_age_max').text(n);
    update_data_on_display();
}

function onAgeSpanChange(evt, value) {
    d3.select('#text_age_span').text(value);
    n = Number(d3.select('#text_age_min').text()) + Number(value) - 1;
    d3.select('#text_age_max').text(n);
    update_data_on_display();
}

var census_data, data_on_display = {};

function update_data_on_display() {
    age = Number(d3.select('#text_age_min').text());
    span = Number(d3.select('#text_age_span').text());

    for (town in census_data) {
	ratio = 0;
	for (i=0; i<span/5; ++i) ratio += census_data[town]['男'][age/5+i];
	ratio /= census_data[town]['male_total'];
	data_on_display[town] = {
	    'percent': ratio
	};
    }

    bar_chart = d3.select('#bar_chart');
    width = parseInt(bar_chart.style("width")) - 10;
    console.log(width);
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
    divs = bar_chart.selectAll('div').data(
	d3.entries(data_on_display), function(d) {
	    return d.key;
	}
    );

    divs.exit().remove();
    divs.enter()
	.append('div')
	.attr('class', 'stat_bar')
	.append('span')
	.attr('class', 'stat_text')
	.html(function(d) { return d.key; });
    divs.transition()
	.style('width', function(d) { return (d.value.percent*width).toString() + 'px'; });
}

d3.json('census-taichung.json', function(error, data) {
    if (error) return console.warn(error);
    census_data = data;
    update_data_on_display();
});

