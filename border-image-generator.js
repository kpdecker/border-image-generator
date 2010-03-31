/*
 * Copyright (c) 2010 Kevin Decker (http://www.incaseofstairs.com/)
 * See LICENSE for license information
 */
// TODO : Optimize output
$(document).ready(function() {
    var pathToImage = $("#pathToImage"),
        editorEl = $("#editorEl"),
        imageEl = $("#imageEl"),
        dividers = $(".divider"),
        sliders = $(".slider"),

        marginSize,

        state = {
            src: "http://www.css3.info/wp-content/uploads/2007/09/border.png",
            linkBorder: true,
            borderWidth: [0, 0, 0, 0],
            imageOffset: [0, 0, 0, 0],
            scaleFactor: 3
        };

    var sliderMap = {
        imageTop: { array: "imageOffset", index: 0 },
        imageRight: { array: "imageOffset", index: 1 },
        imageBottom: { array: "imageOffset", index: 2 },
        imageLeft: { array: "imageOffset", index: 3 },

        borderTop: { array: "borderWidth", index: 0 },
        borderRight: { array: "borderWidth", index: 1 },
        borderBottom: { array: "borderWidth", index: 2 },
        borderLeft: { array: "borderWidth", index: 3 },
    }, dividerMap = {
        dividerTop: {
            setValue: function(el) { state.imageOffset[0] = calcPixels($(el).position().top) },
            updatePos: function(el) { $(el).css("top", state.imageOffset[0]*state.scaleFactor); }
        },
        dividerRight: {
            setValue: function(el) { state.imageOffset[1] = calcPixels(editorEl.innerWidth() - $(el).position().left - 2) },
            updatePos: function(el) { $(el).css("left", (editorEl.innerWidth() - state.imageOffset[1]*state.scaleFactor) + 2); }
        },
        dividerBottom: {
            setValue: function(el) { state.imageOffset[2] = calcPixels(editorEl.innerHeight() - $(el).position().top - 2) },
            updatePos: function(el) { $(el).css("top", (editorEl.innerHeight() - state.imageOffset[2]*state.scaleFactor) + 2); }
        },
        dividerLeft: {
            setValue: function(el) { state.imageOffset[3] = calcPixels($(el).position().left) },
            updatePos: function(el) { $(el).css("left", state.imageOffset[3]*state.scaleFactor); }
        },
    }
    
    function calcPixels(pos) {
        return (pos / state.scaleFactor) | 0;
    }
    function updateSliders() {
        $(".slider").each(function(index, el) {
            var map = sliderMap[el.id];
            $(el).slider("option", "value", state[map.array][map.index]);
        });
    }
    function updateDividers() {
        dividers.each(function(index, el) {
            dividerMap[el.id].updatePos(el);
        });
    }
    function updateHash() {
        HistoryHandler.store(JSON.stringify(state));
    }
    function updateCSS() {
        var img = "url(" + pathToImage.val() + ")",
            imageOffset = state.imageOffset,
            borderWidth = state.linkBorder ? state.imageOffset : state.borderWidth,
            borderImage = img + " " + imageOffset.join(" "),
            borderWidthStr = borderWidth.join("px ") + "px",
            style = "border-width: " + borderWidthStr + ";\n"
                + "-moz-border-image: " + borderImage + ";\n"
                + "-webkit-border-image: " + borderImage + ";\n"
                + "border-image: " + borderImage + ";",

            // We want to keep everythign in the same position while dragging, so make the margin 
            marginSize = borderWidth.map(function(input) { return marginSize-input; }).join("px ") + "px";

        $("#cssEl").html(style)
                .css("border-width", borderWidthStr)
                .css("-moz-border-image", borderImage)
                .css("-webkit-border-image", borderImage)
                .css("border-image", borderImage)
                .css("margin", marginSize);
    }

    sliders.slider({
        max: 100,
        slide: function(event, ui) {
            var map = sliderMap[event.target.id];
            state[map.array][map.index] = ui.value;

            updateCSS();
            updateDividers();
        },
        stop: function() {
            updateHash();
        }
    });
    dividers.draggable({
        containment: "parent",
        drag: function(event, ui) {
            // TODO : Prevent overlap along the same axis
            dividerMap[event.target.id].setValue(event.target);
            updateCSS();
            updateSliders();
        },
        stop: function() {
            updateHash();
        }
    });
    dividers.filter(":even").draggable("option", "axis", "y");
    dividers.filter(":odd").draggable("option", "axis", "x");

    imageEl.load(function() {
        var img = this,
            width = img.naturalWidth*state.scaleFactor,
            height = img.naturalHeight*state.scaleFactor;

        marginSize = Math.max(width, height);

        sliders.filter(":odd").slider("option", "max", img.naturalWidth);
        sliders.filter(":even").slider("option", "max", img.naturalHeight);

        $("#editorEl, #imageEl").width(width).height(height);
        updateSliders();
        updateDividers();
        updateCSS();
    })
    pathToImage.change(function(event) {
        state.src = pathToImage.val();
        imageEl[0].src = state.src;
        updateHash();
    });

    $("#borderOptionsExpander").toggle(
        function() {
            $("#borderOptionsExpander > span").removeClass("ui-icon-triangle-1-e").addClass("ui-icon-triangle-1-s");
            $("#borderOptions").show();
            state.linkBorder = false;
            updateCSS();
            updateHash();
        },
        function() {
            $("#borderOptionsExpander > span").removeClass("ui-icon-triangle-1-s").addClass("ui-icon-triangle-1-e");
            $("#borderOptions").hide();
            state.linkBorder = true;
            updateCSS();
            updateHash();
        });

    HistoryHandler.init(function(hash) {
        if (hash) {
            state = JSON.parse(hash);
        }
        if ($("#borderOptions").is(":visible") === state.linkBorder) {
            $("#borderOptionsExpander").click();
        }
        updateSliders();
        updateDividers();
        updateCSS();
        pathToImage.val(state.src);
    });
    pathToImage.change();
});
