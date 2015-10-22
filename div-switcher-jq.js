// obsolete. this file is not used

// Adapted from http://wpaoli.building58.com/2009/10/super-simple-jquery-content-swapper/
// Note: the jcps project does not work with d3.js: https://code.google.com/p/jquery-content-panel-switcher/

function divSwitcher(settings){
    var settings = {
       contentClass : '.switchable-div',
       switchClass : 'button.div-switch'
    };

    $(settings.switchClass).click(function(e) {
console.log('divSwitcher');
        var target = $(this).attr('value');
        target = $(target);
        $(settings.switchClass).removeClass('active');
        $(settings.contentClass).fadeOut();
        $(this).addClass('active');
        target.fadeIn();
    });
    $(settings.switchClass+':first').trigger("click");
}
$(divSwitcher);
