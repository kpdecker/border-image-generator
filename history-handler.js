/*
 * Copyright (c) 2010 Kevin Decker (http://www.incaseofstairs.com/)
 * See LICENSE for license information
 */
var HistoryHandler = (function() {
	var currentHash, callbackFn;

	function loadHash() {
		return decodeURIComponent(/#(.*)$/.exec((location.href || []))[1] || "");
	}
	function checkHistory(){
		var hashValue = loadHash();
		if(hashValue !== currentHash) {
			currentHash = hashValue;
			callbackFn(currentHash);
		}
	}

	return {
		init: function(callback) {
			callbackFn = callback;

			currentHash = loadHash();
			callbackFn(currentHash);
			setInterval(checkHistory, 500);
		},
		store: function(state) {
			currentHash = state;
			location = "#" + encodeURIComponent(state);
		}
	}
})();
