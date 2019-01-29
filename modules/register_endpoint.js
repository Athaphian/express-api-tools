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

	const callImplementation = (implementation, request, response, cacheTime, method) => {
		implementation(request.params, cacheTime, request.body).then(result => {
			const jsonResult = JSON.stringify(result);
			response.type('json');
			response.end(jsonResult);
			cache.putInCache(method, request.originalUrl, cacheTime, jsonResult);
			cache.cleanupCache();
		}).catch(errorHandler(response));
	};

	const wrapInCache = (request, response, method, implementation) => {
		const cachedResponse = cache.getFromCache(method, request.originalUrl);

		if (cachedResponse) {
			log.info('[ ] Serving', request.originalUrl, 'from cache.');
			response.end(cachedResponse);
		} else {
			implementation();
		}
	};

	function registerEndpoint(express, baseUrl, cacheTime, implementation) {
		express.use(baseUrl, function api(request, response) {
			wrapInCache(request, response, 'get', () => {
				log.info('[X] Handling', request.originalUrl);
				callImplementation(implementation, request, response, cacheTime, 'get');
			});
		});
	}

	function registerPostEndpoint(express, baseUrl, cacheTime, implementation) {
		express.post(baseUrl, function api(request, response) {
			wrapInCache(request, response, 'post', () => {
				log.info('[X] Handling', request.originalUrl);
				callImplementation(implementation, request, response, cacheTime, 'post');
			});
		});
	}

	function registerPutEndpoint(express, baseUrl, cacheTime, implementation) {
		express.put(baseUrl, function api(request, response) {
			wrapInCache(request, response, 'put', () => {
				log.info('[X] Handling', request.originalUrl);
				callImplementation(implementation, request, response, cacheTime, 'put');
			});
		});
	}

	function registerDeleteEndpoint(express, baseUrl, cacheTime, implementation) {
		express.delete(baseUrl, function api(request, response) {
			wrapInCache(request, response, 'delete', () => {
				log.info('[X] Handling', request.originalUrl);
				callImplementation(implementation, request, response, cacheTime, 'delete');
			});
		});
	}

	function registerEndpointWithRateLimit(express, baseUrl, cacheTime, implementation, millisecondsToWait) {
		const limiter = new RateLimiter(1, millisecondsToWait);

		express.use(baseUrl, function api(request, response) {
			wrapInCache(request, response, 'get', () => {
				limiter.removeTokens(1, function() {
					log.info('[X] Handling', request.originalUrl);
					callImplementation(implementation, request, response, cacheTime, 'get');
				});
			});
		});
	}

	return {
		'default': registerEndpoint,
		'withRateLimit': registerEndpointWithRateLimit,
		'registerPost': registerPostEndpoint,
		'get': registerEndpoint,
		'post': registerPostEndpoint,
		'put': registerPutEndpoint,
		'delete': registerDeleteEndpoint
	};
}());
