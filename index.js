const cache = require('./modules/cache'),
	logging = require('./modules/logging'),
	register_endpoint = require('./modules/register_endpoint'),
	env = require('./modules/env'),
	health = require('./modules/health'),
	uptime = require('./modules/uptime'),
	jsonFetch = require('./modules/jsonFetch'),
	enablePost = require('./modules/enablePost');

module.exports = {
	cache,
	logging,
	register_endpoint,
	env,
	health,
	uptime,
	jsonFetch,
	enablePost
};
