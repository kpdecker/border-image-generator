/*
 * Copyright (c) 2010 Kevin Decker (http://www.incaseofstairs.com/)
 * See LICENSE for license information
 */
// TODO : Parameter loading
// TODO : Border width dropdown mode
// TODO : Optimize output
$(document).ready(function() {
    var pathToImage = $("#pathToImage"),
        editorEl = $("#editorEl"),
        imageEl = $("#imageEl"),
        dividers = $(".divider"),
        sliders = $(".slider"),

        borderWidth = [0, 0, 0, 0],
        imageOffset = [0, 0, 0, 0],
        scaleFactor = 3;

    var sliderMap = {
        imageTop: { array: imageOffset, index: 0 },
        imageRight: { array: imageOffset, index: 1 },
        imageBottom: { array: imageOffset, index: 2 },
        imageLeft: { array: imageOffset, index: 3 },

        borderTop: { array: borderWidth, index: 0 },
        borderRight: { array: borderWidth, index: 1 },
        borderBottom: { array: borderWidth, index: 2 },
        borderLeft: { array: borderWidth, index: 3 },
    }, dividerMap = {
        dividerTop: {
            setValue: function(el) { imageOffset[0] = calcPixels($(el).position().top) },
            updatePos: function(el) { $(el).css("top", imageOffset[0]*scaleFactor); }
        },
        dividerRight: {
            setValue: function(el) { imageOffset[1] = calcPixels(editorEl.innerWidth() - $(el).position().left - 2) },
            updatePos: function(el) { $(el).css("left", (editorEl.innerWidth() - imageOffset[1]*scaleFactor) + 2); }
        },
        dividerBottom: {
            setValue: function(el) { imageOffset[2] = calcPixels(editorEl.innerHeight() - $(el).position().top - 2) },
            updatePos: function(el) { $(el).css("top", (editorEl.innerHeight() - imageOffset[2]*scaleFactor) + 2); }
        },
        dividerLeft: {
            setValue: function(el) { imageOffset[3] = calcPixels($(el).position().left) },
            updatePos: function(el) { $(el).css("left", imageOffset[3]*scaleFactor); }
        },
    }
    
    function calcPixels(pos) {
        return (pos / scaleFactor) | 0;
    }
    function updateSliders() {
        $(".image-offset").each(function(index, el) {
            var map = sliderMap[el.id];
            $(el).slider("option", "value", map.array[map.index])
        });
    }
    function updateDividers() {
        dividers.each(function(index, el) {
            dividerMap[el.id].updatePos(el);
        });
    }
    function updateCSS() {
        var img = "url(" + pathToImage.val() + ")",
            borderImage = img + " " + imageOffset.join(" "),
            borderWidthStr = borderWidth.join("px ") + "px",
            style = "border-width: " + borderWidthStr + ";\n"
                + "-moz-border-image: " + borderImage + ";\n"
                + "-webkit-border-image: " + borderImage + ";\n"
                + "border-image: " + borderImage + ";";

        $("#cssEl").html(style)
                .css("border-width", borderWidthStr)
                .css("-moz-border-image", borderImage)
                .css("-webkit-border-image", borderImage)
                .css("border-image", borderImage);
    }

    sliders.slider({
        max: 100,
        slide: function(event, ui) {
            var map = sliderMap[event.target.id];
            map.array[map.index] = ui.value;
            
            updateCSS();
            updateDividers();
        }
    });
    dividers.draggable({
        containment: "parent",
        drag: function(event, ui) {
            // TODO : Prevent overlap along the same axis
            dividerMap[event.target.id].setValue(event.target);
            updateCSS();
            updateSliders();
        }
    });
    dividers.filter(":even").draggable("option", "axis", "y");
    dividers.filter(":odd").draggable("option", "axis", "x");

    imageEl.load(function() {
         var img = this,
            width = img.natualWidth*scaleFactor,
            height = img.naturalHeight*scaleFactor;

        $("#editorEl, #imageEl").width(width).height(height);
        updateCSS();
    })
    pathToImage.change(function(event) {
        imageEl[0].src = pathToImage.val();
    });

    pathToImage.change();
});
