/**
 * Health check for this service. Will return 200 when the node process is running.
 *
 * Usage:
 * const express = require('express');
 * const app = express();
 * const health = require('express-api-tools').health;
 * health.api(app, '/api/health');
 */
module.exports = (function() {
	function api(express, baseUrl) {
		express.use(baseUrl, function(req, res) {
			res.end();
		});
	}

	return {
		'api': api
	};
}());
