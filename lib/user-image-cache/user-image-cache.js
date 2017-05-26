/*
 * Copyright (c) 2010-2011 Kevin Decker (http://www.incaseofstairs.com/)
 * See LICENSE for license information
 */
// Specs in use:
// http://www.w3.org/TR/FileAPI/
// http://www.w3.org/TR/webstorage/
var UserImageCache;
(function() {
    var curEntry,
        remoteProxyUrl,
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
                count: function() {
                    return parseInt(sessionStorage.getItem("imageList-count"), 10)||0;
                },
                lru: function(set) {
                    if (set) {
                        sessionStorage.setItem("imageList-lru", set.join(","));
                    } else {
                        var lru = sessionStorage.getItem("imageList-lru")||"";
                        if (!lru) {
                            return [];
                        } else {
                            return lru.split(",");
                        }
                    }
                },
                reset: function() {
                    var len = this.count()+1;
                    while (--len) {
                        sessionStorage.removeItem("imageList-src-" + len);
                        sessionStorage.removeItem("imageList-display-" + len);
                    }
                    sessionStorage.removeItem("imageList-lru");
                    sessionStorage.removeItem("imageList-count");
                },
                storeImage: function(name, data) {
                    var count = this.count(),
                        entryId = count+1,
                        lru;

                    do {
                        try {
                            sessionStorage.setItem("imageList-src-" + entryId, data);
                            sessionStorage.setItem("imageList-display-" + entryId, name);

                            lru = this.lru();
                            lru.push(entryId);
                            this.lru(lru);

                            break;
                        } catch (err) {
                            // Cache filled, remove the least recently used
                            lru = this.lru();
                            sessionStorage.removeItem("imageList-src-" + lru[0]);
                            sessionStorage.removeItem("imageList-display-" + lru[0]);
                            lru.shift();
                            this.lru(lru);

                            // Also cleanup any data that may have made it in
                            sessionStorage.removeItem("imageList-src-" + entryId);
                            sessionStorage.removeItem("imageList-display-" + entryId);

                            count--;
                        }
                    } while (count > 0);

                    sessionStorage.setItem("imageList-count", entryId);
                    return entryId;
                },
                getImage: function(entryId) {
                    var ret = {
                        src: sessionStorage.getItem("imageList-src-" + entryId),
                        displayName: sessionStorage.getItem("imageList-display-" + entryId)
                    };

                    var lru = this.lru().filter(function(a) {
                        return a != entryId;
                    });
                    if (ret.src) {
                        lru.push(entryId);
                    }
                    this.lru(lru);

                    return ret;
                }
            };
        } else {
            // Fail over to plain js structures, meaing that refresh, etc will cause failures.
            var cache = [];
            return {
                reset: function() {
                    cache = [];
                },
                storeImage: function(name, data) {
                    cache.push({ src: data, displayName: name });
                    return cache.length;
                },
                getImage: function(entryId) {
                    return cache[entryId-1];
                }
            };
        }
    })();

    UserImageCache = {
        NOT_FOUND: "not_found",
        UNKNOWN_TYPE: "unknown_type",

        /**
         * Determines if local file reads are possible in the current execution environment.
         */
        isLocalSupported: function() {
            try {
                return !!window.FileReader;
            } catch (err) {
                return false;
            }
        },

        /**
         * Retrieves the entry id for the current entry, if one is defined.
         * This value may be passed to the load method to reload the image
         * if it is still cached.
         */
        getEntryId: function() { return curEntry && curEntry.entryId; },

        /**
         * Retrieves the display name for the current entry, if one is defined.
         */
        getDisplayName: function() { return curEntry && curEntry.displayName; },

        /**
         * Retrieves the src URI for the current entry, if one is defined.
         */
        getSrc: function() { return curEntry && curEntry.src; },

        /**
         * Sets the element that images will be loaded into.
         */
        setImageEl: function(el) {
            image = el;
        },

        /*
         * Sets the URL of the proxy server for loading remote URLs. On load the
         * file href URL will be appended to the remote proxy url, if defined.
         */
        setRemoteProxy: function(proxyUrl) {
            remoteProxyUrl = proxyUrl;
        },

        /**
         * Loads a given image.
         *
         * @param file may be one of:
         *  - File object (if supported)
         *  - Image URI
         *  - Entry ID returned by getEntryId for a previous image
         *
         * @param onError(error) optional callback that is executed if the image can not be loaded
         *      Errors include:
         *          - UserImageCache.NOT_FOUND : Unable to lookup cached image element.
         *          - UserImageCache.UNKNOWN_TYPE : File is unknown type
         *          - Result of FileReader.error
         */
        load: function(file, onError) {
            if (!image) {
                throw new Error("Must call setImageEl prior to attempting to load an image");
            }

            // the file from the session store if that is the case
            if (typeof file === "string") {
                var match = /^page-store:\/\/(.*)$/.exec(file);
                if (this.isLocalSupported() && match) {
                    var loadEntry = localDataBinding.getImage(match[1]);
                    if (!loadEntry || !loadEntry.src) {
                        // We could not find the cache data. This could be due to a refresh in the local case,
                        // or due to someone attempting to paste a URL that uses a local reference.
                        onError && onError(UserImageCache.NOT_FOUND);
                        return;
                    }
                    loadEntry.entryId = "page-store://" + match[1];
                    curEntry = loadEntry;
                } else {
                    var srcUrl = file;
                    if (remoteProxyUrl && /https?:\/\/.*/.test(file)) {
                        srcUrl = remoteProxyUrl + encodeURIComponent(file);
                    }
                    curEntry = { entryId: file, src: srcUrl, displayName: file };
                }
                image.src = UserImageCache.getSrc();
            } else if (this.isLocalSupported() && file instanceof File) {
                var reader = new FileReader();
                reader.onload = function(event) {
                    var entryId = localDataBinding.storeImage(file.name || file.fileName, reader.result);  // std || impl to be safe
                    curEntry = localDataBinding.getImage(entryId);
                    if (!curEntry || !curEntry.src) {
                        // The file is too large for the remaining data
                        curEntry = {src: reader.result, displayName: file.name || file.fileName};
                    }
                    curEntry.entryId = "page-store://" + entryId;
                    image.src = UserImageCache.getSrc();
                };
                reader.onerror = function(event) {
                    onError && onError(reader.error);
                };
                reader.readAsDataURL(file);
            } else {
                onError && onError(UserImageCache.UNKNOWN_TYPE);
            }
        },

        reset: function() {
            localDataBinding.reset();
            image = undefined;
            curEntry = undefined;
            remoteProxyUrl = undefined;
        }
    };
})();
