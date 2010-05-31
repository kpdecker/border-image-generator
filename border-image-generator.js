/*
 * Copyright (c) 2010 Kevin Decker (http://www.incaseofstairs.com/)
 * See LICENSE for license information
 */
$(document).ready(function() {
    var pathToImage = $("#pathToImage"),
        editorEl = $("#editorEl"),
        imageEl = $("#imageEl"),
        dividers = $(".divider"),
        sliders = $(".slider"),
        cssEl = $("#cssEl"),
        repeat = $(".repeat"),

        validImage = false,
        naturalSize = {},

        state = {
            src: "http://www.w3.org/TR/css3-background/border.png",

            linkBorder: true,
            borderWidth: [0, 0, 0, 0],
            imageOffset: [27, 27, 27, 27],

            setRepat: false,
            repeat: ["repeat", "repeat"],

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
    }, repeatMap = {
        repeatVertical: { index: 1 },
        repeatHorizontal: { index: 0 },
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
    function updateRepeat() {
        repeat.each(function(index, el) {
            var map = repeatMap[el.id];
            $(el).val(state.repeat[map.index]);
        })
    }
    function updateHash() {
        HistoryHandler.store(JSON.stringify(state));
    }
    function joinValues(values, join) {
        var ret = [];
        if (values[3] && values[3] !== values[1]) {
            ret.unshift(values[3]);
        }
        if (ret.length || (values[2] && values[2] !== values[0])) {
            ret.unshift(values[2]);
        }
        if (ret.length || (values[1] && values[1] !== values[0])) {
            ret.unshift(values[1]);
        }
        ret.unshift(values[0]);
        return ret.join(join || " ");
    }
    function updateCSS() {
        var borderImage = "", borderWidthStr = "", style = "",
            repeatStr = state.setRepeat ? " " + joinValues(state.repeat) : "";
        
        if (validImage) {
            var img = "url(" + ImageList.getDisplayName() + ")",
                imageOffset = state.imageOffset,
                borderWidth = state.linkBorder ? state.imageOffset : state.borderWidth;

            borderImage = img + " " + joinValues(imageOffset);
            borderWidthStr = joinValues(borderWidth, "px ") + "px";
            style = "border-width: " + borderWidthStr + ";\n"
                + "-moz-border-image: " + borderImage + repeatStr + ";\n"
                + "-webkit-border-image: " + borderImage + repeatStr + ";\n"
                + "border-image: " + borderImage + repeatStr + ";\n";

            borderImage = "url(" + ImageList.getSrc() + ") " + joinValues(imageOffset);
        }

        $("#cssEl").html(style)
                .css("border-width", borderWidthStr)
                .css("-moz-border-image", borderImage + repeatStr)
                .css("-webkit-border-image", borderImage + repeatStr)
                .css("border-image", borderImage + repeatStr);
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

    repeat.change(function() {
        var map = repeatMap[this.id];
        state.repeat[map.index] = $(this).val();
        updateCSS();
        updateHash();
    });

    ImageList.setEl(imageEl[0]);
    imageEl.load(function() {
        var img = this,
            natWidth = img.naturalWidth || img.width,
            natHeight = img.naturalHeight || img.height,
            width = natWidth*state.scaleFactor,
            height = natHeight*state.scaleFactor;

        // Ensure that the initial scale for the image is always smaller that the size of the screen
        if (width > window.innerWidth || height > window.innerHeight) {
            state.scaleFactor = Math.min(window.innerWidth/width, window.innerHeight/height);
            width = natWidth*state.scaleFactor;
            height = natHeight*state.scaleFactor;
        }

        naturalSize = {
            width: natWidth,
            height: natHeight
        };

        // Correct for any HTTP escaping issues in the input
        state.src = ImageList.getCurEntry();

        editorEl.width(width).height(height);
        editorEl.show();

        $(".errorMsg").hide();
        validImage = true;

        sliders.filter(":odd").slider("option", "max", natWidth);
        sliders.filter(":even").slider("option", "max", natHeight);
        updateSliders();
        updateDividers();
        updateCSS();
        updateHash();
    });
    
    function errorHandler(code) {
        var msg;
        if (code === ImageList.NOT_FOUND) {
            msg = "Unable to find image. This may be due to an incorrect path name or a local file that has not been properly loaded.";
        } else if (code) {
            msg = "Failed to load image. Error code: " + code;
        } else {
            msg = "Unknown error occured loading image " + ImageList.getDisplayName();
        }

        // Only show the message if the user as attempted to load an image
        if (ImageList.getCurEntry()) {
            $(".errorMsg").html("*** " + msg).show();
        }

        editorEl.hide();
        validImage = false;

        updateCSS();
    }
    imageEl.error(function() { errorHandler(); });
    pathToImage.change(function(event) {
        // Clear the frame size so Opera can scale the editor down if the new image is smaller than the last
        editorEl.width("auto").height("auto");
        ImageList.load(pathToImage.val(), errorHandler);
    });

    function setFlag(name, value) {
        return function() {
            state[name] = value;
            updateCSS();
            updateHash();
        };
    }
    $("#borderOptionsExpander").expander("#borderOptions", setFlag("linkBorder", false), setFlag("linkBorder", true));
    $("#repeatOptionsExpander").expander("#repeatOptions", setFlag("setRepeat", true), setFlag("setRepeat", false));

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

    if (ImageList.isLocalSupported()) {
        $("body").bind("dragenter dragover", function(event) {
            // We have to cancel these events or we will not recieve the drop event
            event.preventDefault();
            event.stopPropagation();
        });
        $("body").bind("drop", function(event) {
            event.preventDefault();
            event.stopPropagation();
            var dataTransfer = event.originalEvent.dataTransfer,
                file = dataTransfer.files[0];

            ImageList.load(file, errorHandler);
        });
        $("#localImage").bind("change", function(event) {
            var file = this.files[0];

            ImageList.load(file, errorHandler);
        });
    } else {
        $("body").addClass("no-local");
    }

    $(".toggleStyle").click(function(event) {
        $("body").toggleClass("light");
        var lightness = $("#lightnessStyle");
        lightness[0].disabled = !lightness[0].disabled;
        event.preventDefault();
    });

    HistoryHandler.init(function(hash) {
        var prevScale = state.scaleFactor;

        if (hash) {
            $.extend(state, JSON.parse(hash));
        }
        if ($("#borderOptions").is(":visible") === state.linkBorder) {
            $("#borderOptionsExpander").click();
        }
        if ($("#repeatOptions").is(":visible") !== state.setRepeat) {
            $("#repeatOptionsExpander").click();
        }

        if (ImageList.getCurEntry() !== state.src) {
            // The other values will update when the image loads
            ImageList.load(state.src, errorHandler);
        } else if (prevScale !== state.scaleFactor) {
            imageEl.load();
        } else {
            updateSliders();
            updateDividers();
            updateCSS();
        }

        updateRepeat();
    });
});
