const log = require('./logging');

/**
 * Can be used to identify the environment on which this node process is running (dev, test, acc, prod).
 *
 * envSystemVar is the process.env system variable that contains the environment string on which
 * the app is running.
 *
 * envDefault contains the default environment string when process.env.envSystemVar is not set.
 *
 * Usage:
 * const express = require('express');
 * const app = express();
 * const env = require('express-api-tools').env('NODE_ENV', 'prod');
 * env.api(app, '/api/env');
 */
module.exports = (function() {
	return function(envSystemVar, envDefault) {
		function api(express, baseUrl) {
			express.use(baseUrl, function api(req, res) {
				log.info('[X] Handling', req.originalUrl);
				res.end(getEnv());
			});
		}

		function getEnv() {
			return process.env[envSystemVar] || envDefault;
		}

		return {
			'getEnv': getEnv,
			'api': api
		};
	}
}());
