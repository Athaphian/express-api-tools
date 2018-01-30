const cache = require('./modules/cache'),
	logging = require('./modules/logging'),
	register_endpoint = require('./modules/register_endpoint'),
	env = require('./modules/env'),
	health = require('./modules/health'),
	uptime = require('./modules/uptime');

module.exports = {
	cache,
	logging,
	register_endpoint,
	env,
	health,
	uptime
};
