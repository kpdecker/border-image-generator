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
        cssEl = $("#cssEl"),
        fit = $(".fit"),

        validImage = false,
        naturalSize = {},

        state = {
            src: "",

            linkBorder: true,
            borderWidth: [0, 0, 0, 0],
            imageOffset: [0, 0, 0, 0],

            setFit: false,
            fit: ["repeat", "repeat"],      // Default per w3c. Does not match implementation

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
            setValue: function(el) { state.imageOffset[1] = calcPixels(editorEl.innerWidth() - $(el).position().left + 2) },
            updatePos: function(el) { $(el).css("left", (editorEl.innerWidth() - 2 - state.imageOffset[1]*state.scaleFactor)); }
        },
        dividerBottom: {
            setValue: function(el) { state.imageOffset[2] = calcPixels(editorEl.innerHeight() - $(el).position().top + 2) },
            updatePos: function(el) { $(el).css("top", (editorEl.innerHeight() - 2 - state.imageOffset[2]*state.scaleFactor)); }
        },
        dividerLeft: {
            setValue: function(el) { state.imageOffset[3] = calcPixels($(el).position().left) },
            updatePos: function(el) { $(el).css("left", state.imageOffset[3]*state.scaleFactor); }
        },
    }, fitMap = {
        fitVertical: { index: 0 },
        fitHorizontal: { index: 1 },
    };
    
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
    function updateFit() {
        fit.each(function(index, el) {
            var map = fitMap[el.id];
            $(el).val(state.fit[map.index]);
        })
    }
    function updateHash() {
        HistoryHandler.store(JSON.stringify(state));
    }
    function updateCSS() {
        var borderImage = "", borderWidthStr = "", style = "",
            fitStr = state.setFit ? state.fit.join(" ") : "";
        
        if (validImage) {
            var img = "url(" + pathToImage.val() + ")",
                imageOffset = state.imageOffset,
                borderWidth = state.linkBorder ? state.imageOffset : state.borderWidth;

            borderImage = img + " " + imageOffset.join(" ");
            borderWidthStr = borderWidth.join("px ") + "px";
            style = "border-width: " + borderWidthStr + ";\n"
                + "-moz-border-image: " + borderImage + " " + fitStr + ";\n"
                + "-webkit-border-image: " + borderImage + ";\n"
                + "border-image: " + borderImage + ";\n"
                + (state.setFit ? "border-fit: " + fitStr + ";\n" : "");
        }

        $("#cssEl").html(style)
                .css("border-width", borderWidthStr)
                .css("-moz-border-image", borderImage + " " + fitStr)
                .css("-webkit-border-image", borderImage)
                .css("border-image", borderImage);
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

    fit.change(function() {
        var map = fitMap[this.id];
        state.fit[map.index] = $(this).val();
        updateCSS();
        updateHash();
    })

    imageEl.load(function() {
        var img = this,
            natWidth = img.naturalWidth || img.width,
            natHeight = img.naturalHeight || img.height,
            width = natWidth*state.scaleFactor,
            height = natHeight*state.scaleFactor;

        naturalSize = {
            width: natWidth,
            height: natHeight
        };

        // Correct for any HTTP escaping issues in the input
        state.src = img.src;

        editorEl.width(width).height(height);
        editorEl.show();
        validImage = true;

        sliders.filter(":odd").slider("option", "max", natWidth);
        sliders.filter(":even").slider("option", "max", natHeight);
        updateSliders();
        updateDividers();
        updateCSS();
        updateHash();
    });
    imageEl.error(function() {
        editorEl.hide();
        validImage = false;

        updateCSS();
    });
    pathToImage.change(function(event) {
        // Clear the frame size so Opera can scale the editor down if the new image is smaller than the last
        editorEl.width("auto").height("auto");
        state.src = pathToImage.val();
        imageEl[0].src = state.src;
    });

    $("#borderOptionsExpander").expander(
        "#borderOptions",
        function() {
            state.linkBorder = false;
            updateCSS();
            updateHash();
        },
        function() {
            state.linkBorder = true;
            updateCSS();
            updateHash();
        });
    $("#fitOptionsExpander").expander(
        "#fitOptions",
        function() {
            state.setFit = true;
            updateCSS();
            updateHash();
        },
        function() {
            state.setFit = false;
            updateCSS();
            updateHash();
        });

    editorEl.resizable({
        reverseXAxis: true,
        handles: "s, w, sw",
        aspectRatio: true,
        resize: function() {
            state.scaleFactor = editorEl.innerWidth() / naturalSize.width;

            updateSliders();
            updateDividers();
            updateCSS();
        },
        stop: function() {
            updateHash();
        }
    });

    HistoryHandler.init(function(hash) {
        var prevScale = state.scaleFactor;

        if (hash) {
            $.extend(state, JSON.parse(hash));
        }
        if ($("#borderOptions").is(":visible") === state.linkBorder) {
            $("#borderOptionsExpander").click();
        }
        if ($("#fitOptions").is(":visible") !== state.setFit) {
            $("#fitOptionsExpander").click();
        }

        if (imageEl[0].src !== state.src) {
            // The other values will update when the image loads
            pathToImage.val(state.src);
            pathToImage.change();
        } else if (prevScale !== state.scaleFactor) {
            imageEl.load();
        } else {
            updateSliders();
            updateDividers();
            updateCSS();
        }

        updateFit();
    });
});
