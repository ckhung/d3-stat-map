d3.select('#slider_age_min').call(d3.slider().axis(true).min(0).max(100).
    step(5).on("slide", onAgeMinChange));

d3.select('#slider_age_span').call(d3.slider().axis(true).min(5).max(100).
    step(5).on("slide", onAgeSpanChange));

function onAgeMinChange(evt, value) {
    d3.select('#text_age_min').text(value);
    n = Number(value) + Number(d3.select('#text_age_span').text()) - 1;
    d3.select('#text_age_max').text(n);
}

function onAgeSpanChange(evt, value) {
    d3.select('#text_age_span').text(value);
    n = Number(d3.select('#text_age_min').text()) + Number(value) - 1;
    d3.select('#text_age_max').text(n);
}

var census_data;

function main() {
    d3.json("census-town.json", function(error, data) {
	if (error) return console.warn(error);
	census_data = data;
    });
}

main();
