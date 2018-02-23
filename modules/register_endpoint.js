const cache = require('./cache'),
	log = require('./logging'),
	RateLimiter = require('limiter').RateLimiter;

module.exports = (function() {
	function registerEndpoint(express, baseUrl, cacheTime, implementation) {
		express.use(baseUrl, function api(req, res) {
			const cachedResponse = cache.getFromCache('get', req.originalUrl);

			if (cachedResponse) {
				log.info('[ ] Serving', req.originalUrl, 'from cache.');
				res.end(cachedResponse);
			} else {
				log.info('[X] Handling', req.originalUrl);
				implementation(req.params, cacheTime).then(result => {
					const jsonResult = JSON.stringify(result);
					res.end(jsonResult);
					cache.putInCache('get', req.originalUrl, cacheTime, jsonResult);
					cache.cleanupCache();
				}).catch(error => {
					if (error.error) {
						// This is for when the registerEndpoint is used in combination with jsonFetch (which returns {error} in stead of error)
						log.error(error.error);
					} else {
						log.error(error);
					}
					res.end(JSON.stringify({}));
				});
			}
		});
	}

	function registerEndpointWithRateLimit(express, baseUrl, cacheTime, implementation, millisecondsToWait) {
		const limiter = new RateLimiter(1, millisecondsToWait);

		express.use(baseUrl, function api(req, res) {
			const cachedResponse = cache.getFromCache('get', req.originalUrl);

			if (cachedResponse) {
				log.info('[ ] Serving', req.originalUrl, 'from cache.');
				res.end(cachedResponse);
			} else {
				limiter.removeTokens(1, function() {
					log.info('[X] Handling', req.originalUrl);
					implementation(req.params, cacheTime).then(result => {
						const jsonResult = JSON.stringify(result);
						res.end(jsonResult);
						cache.putInCache('get', req.originalUrl, cacheTime, jsonResult);
						cache.cleanupCache();
					}).catch(error => {
						if (error.error) {
							// This is for when the registerEndpoint is used in combination with jsonFetch (which returns {error} in stead of error)
							log.error(error.error);
						} else {
							log.error(error);
						}
						res.end(JSON.stringify({}));
					});
				});
			}
		});
	}

	return {
		'default': registerEndpoint,
		'withRateLimit': registerEndpointWithRateLimit
	};
}());
