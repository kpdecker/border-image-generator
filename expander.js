/*
 * Copyright (c) 2010 Kevin Decker (http://www.incaseofstairs.com/)
 * See LICENSE for license information
 */
(function($) {
    // Helper method that implements the expander UI
    $.fn.expander = function(child, onShow, onHide) {
        var self = this;

        self.toggle(
            function() {
                self.children("span").removeClass("ui-icon-triangle-1-e").addClass("ui-icon-triangle-1-s");
                $(child).show();

                onShow();
            },
            function() {
                self.children("span").removeClass("ui-icon-triangle-1-s").addClass("ui-icon-triangle-1-e");
                $(child).hide();

                onHide();
            });
    };
})(jQuery);
