const cache = require('./cache'),
	log = require('./logging'),
	RateLimiter = require('limiter').RateLimiter;

module.exports = (function() {
	const errorHandler = (response) => (error) => {
		if (error.error) {
			// This is for when the registerEndpoint is used in combination with jsonFetch (which returns {error} in stead of error)
			log.error(error.error);
		} else {
			log.error(error);
		}
		response.end(JSON.stringify({}));
	};

	const callImplementation = (implementation, request, response, cacheTime) => {
		implementation(request.params, cacheTime).then(result => {
			const jsonResult = JSON.stringify(result);
			response.end(jsonResult);
			cache.putInCache('get', request.originalUrl, cacheTime, jsonResult);
			cache.cleanupCache();
		}).catch(errorHandler(response));
	};

	const wrapInCache = (request, response, implementation) => {
		const cachedResponse = cache.getFromCache('get', request.originalUrl);

		if (cachedResponse) {
			log.info('[ ] Serving', request.originalUrl, 'from cache.');
			response.end(cachedResponse);
		} else {
			implementation();
		}
	};

	function registerEndpoint(express, baseUrl, cacheTime, implementation) {
		express.use(baseUrl, function api(request, response) {
			wrapInCache(request, response, () => {
				log.info('[X] Handling', request.originalUrl);
				callImplementation(implementation, request, response, cacheTime);
			});
		});
	}

	function registerEndpointWithRateLimit(express, baseUrl, cacheTime, implementation, millisecondsToWait) {
		const limiter = new RateLimiter(1, millisecondsToWait);

		express.use(baseUrl, function api(request, response) {
			wrapInCache(request, response, () => {
				limiter.removeTokens(1, function() {
					log.info('[X] Handling', request.originalUrl);
					callImplementation(implementation, request, response, cacheTime);
				});
			});
		});
	}

	return {
		'default': registerEndpoint,
		'withRateLimit': registerEndpointWithRateLimit
	};
}());
