// Adapted from http://wpaoli.building58.com/2009/10/super-simple-jquery-content-swapper/
// Note: this does not work with d3.js: https://code.google.com/p/jquery-content-panel-switcher/

function divSwitcher(settings){
    var settings = {
       contentClass : '.switchable-div',
       switchClass : 'a.div-switch'
    };

    $(settings.switchClass).click(function(e){
        e.preventDefault();
        var contentToShow = $(this).attr('href');
        contentToShow = $(contentToShow);
        $(settings.switchClass).removeClass('active');
        $(this).addClass('active');
        $(settings.contentClass).fadeOut();
        contentToShow.fadeIn();
    });

    $(settings.switchClass+':first').trigger("click");
}
$(divSwitcher);
