const log = require('./logging');

module.exports = (function() {
	let cache = [];

	function getFromCache(method, url, body) {
		return cache.filter(function(cached) {
			return cached.method === method &&
				cached.url === url &&
				cached.cacheTime + cached.cacheTimeout > new Date().getTime() &&
				(body === undefined || body === cached.body);
		}).map(function(cached) {
			return cached.result;
		})[0];
	}

	function putInCache(method, url, cacheTimeout, result, body) {
		cache.push({
			method: method,
			url: url,
			cacheTimeout: cacheTimeout,
			cacheTime: new Date().getTime(),
			body: body,
			result: result
		});
	}

	function cleanupCache() {
		cache = cache.filter(function(cached) {
			return cached.cacheTime + cached.cacheTimeout > new Date().getTime();
		});

		log.info('[-] Cache cleanup done. Current cache size:', getCacheSize());
	}

	function getCacheSize() {
		return cache.length;
	}

	return {
		'getFromCache': getFromCache,
		'putInCache': putInCache,
		'cleanupCache': cleanupCache,
		'getCacheSize': getCacheSize
	};
}());
