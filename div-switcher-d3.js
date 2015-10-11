// Adapted from http://wpaoli.building58.com/2009/10/super-simple-jquery-content-swapper/
// Note: the jcps project does not work with d3.js: https://code.google.com/p/jquery-content-panel-switcher/

var settings = {
    contentClass : '.switchable-div',
    switchClass : 'button.div-switch'
};

function divSwitcherHandler(d, i) {
    d3.selectAll('button.div-switch'). classed('active', false);
    d3.selectAll('.switchable-div').
	transition().style('display','none');
    // https://stackoverflow.com/questions/12923942/d3-js-binding-an-object-to-data-and-appending-for-each-key
    // https://stackoverflow.com/a/30463508
    // "d3 relies on the this keyword to point to the DOM element -
    // using this almost like another argument passed
    // to the handler function."
    target = d3.select(this).attr('value');
console.log(target);
    d3.select(this).classed('active', true);
    d3.select(target).
	transition().style('display','block');
}

d3.selectAll('button.div-switch').on('click.div-switch', divSwitcherHandler);

