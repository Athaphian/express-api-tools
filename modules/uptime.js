const log = require('./logging');

/**
 * Uptime module for this service. Will return the time that elapsed between now and starting the service.
 * It can be reset by calling the /reset endpoint. This way frontends can automatically refresh when the
 * server uptime is lower than the previously retrieved uptime.
 *
 * Usage:
 * const express = require('express');
 * const app = express();
 * const uptime = require('express-api-tools').uptime;
 * uptime.api(app, '/api/uptime');
 */
module.exports = (function() {

	let compensation = 0;

	function api(express, baseUrl) {
		express.use(baseUrl + '/reset', function api(req, res) {

			log.info('[X] Handling', req.originalUrl);

			compensation = Math.round(process.uptime());

			console.log('[ ] Compensation:', compensation);

			getUptime(function(serviceResponse) {
				res.end(JSON.stringify(serviceResponse));
			});
		});

		express.use(baseUrl, function api(req, res) {

			log.info('[X] Handling', req.originalUrl);
			getUptime(function(serviceResponse) {
				res.end(JSON.stringify(serviceResponse));
			});
		});
	}

	function getUptime(success) {
		success(Math.round(process.uptime() - compensation));
	}

	return {
		'getUptime': getUptime,
		'api': api
	};
}());
