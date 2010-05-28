var ImageList;
(function() {
    var cache = [],
        curEntry,
        image;

    ImageList = {
        getCurEntry: function() { return cache[curEntry] && cache[curEntry].entryId; },
        getDisplayName: function() { return cache[curEntry] && cache[curEntry].displayName; },
        getSrc: function() { return cache[curEntry] && cache[curEntry].src },

        setEl: function(el) {
            image = el;
        },

        load: function(file) {
            var entry = curEntry+1;
            cache.splice(curEntry+1, cache.length);

            if (typeof file === "string") {
                curEntry = entry;
                cache[entry] = { entryId: file, src: file, displayName: file };
                image.src = file;
            }
            return entry;
        },
    };
})();
