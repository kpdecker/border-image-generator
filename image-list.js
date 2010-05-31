/*
 * Copyright (c) 2010 Kevin Decker (http://www.incaseofstairs.com/)
 * See LICENSE for license information
 */
// Specs in use:
// http://www.w3.org/TR/FileAPI/
// http://www.w3.org/TR/webstorage/
var ImageList;
(function() {
    var curEntry,
        image;

    // Check for browser support of session storage and that it is accessible
    // This may be inaccessible under certain contexts such as file://
    function supportsSessionStorage() {
        try {
            return !!window.sessionStorage;
        } catch (err) {
            return false;
        }
    }
    var localDataBinding = (function() {
        if (supportsSessionStorage()) {
            // If they support FileReader they really should support storage... but who knows (With the exception of file://)
            return {
                storeImage: function(name, data) {
                    var entryId = (parseInt(sessionStorage["imageList-count"])||0)+1;
                    sessionStorage["imageList-count"] = entryId;
                    sessionStorage["imageList-src-" + entryId] = data;
                    sessionStorage["imageList-display-" + entryId] = name;
                    return entryId;
                },
                getImage: function(entryId) {
                    return { src: sessionStorage["imageList-src-" + entryId], displayName: sessionStorage["imageList-display-" + entryId] };
                }
            };
        } else {
            // Fail over to plain js structures, meaing that refresh, etc will cause failures.
            var cache = [];
            return {
                storeImage: function(name, data) {
                    cache.push({ src: data, displayName: name });
                    return cache.length-1;
                },
                getImage: function(entryId) {
                    return cache[entryId];
                }
            };
        }
    })();

    ImageList = {
        isLocalSupported: function() {
            try {
                return !!window.FileReader;
            } catch (err) {
                return false;
            }
        },

        getCurEntry: function() { return curEntry && curEntry.entryId; },
        getDisplayName: function() { return curEntry && curEntry.displayName; },
        getSrc: function() { return curEntry && curEntry.src },

        setEl: function(el) {
            image = el;
        },

        load: function(file, onError) {
            // the file from the session store if that is the case
            if (typeof file === "string") {
                var match = /^page-store:\/\/(.*)$/.exec(file);
                if (this.isLocalSupported() && match) {
                    curEntry = localDataBinding.getImage(match[1]);
                    if (!curEntry) {
                        // We could not find the cache data. This could be due to a refresh in the local case,
                        // or due to someone attempting to paste a URL that uses a local reference.
                        onError && onError(FileError.NOT_FOUND_ERR);
                        return;
                    }
                    curEntry.entryId = "page-store://" + match[1];
                } else {
                    curEntry = { entryId: file, src: file, displayName: file };
                }
                image.src = ImageList.getSrc();
            } else if (this.isLocalSupported() && file instanceof File) {
                var reader = new FileReader();
                reader.onload = function(event) {
                    var entryId = localDataBinding.storeImage(file.name || file.fileName, reader.result);  // std || impl to be safe
                    curEntry = localDataBinding.getImage(entryId);
                    curEntry.entryId = "page-store://" + entryId;
                    image.src = ImageList.getSrc();
                };
                reader.onerror = function(event) {
                    onError && onError(reader.error);
                };
                reader.readAsDataURL(file);
            } else {
                onError && onError(FileError.NOT_READABLE_ERR);
            }
        },
    };
})();
