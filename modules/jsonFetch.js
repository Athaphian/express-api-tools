const fetch = require('node-fetch'),
	jsonFetchMocks = require('./jsonFetchMocks');

module.exports = (function() {
	const DEFAULT_TIMEOUT = 20000;

	const handleHttpErrors = response => {
		if (response.status !== 200) {
			throw {error: `${response.status} ${response.statusText}`, response: response};
		} else {
			return response;
		}
	};

	function getJson(url, headers = {}) {
		return jsonFetchMocks.getMock(url, 'GET') || fetch(url, {
			'headers': headers,
			'timeout': DEFAULT_TIMEOUT
		})
			.then(handleHttpErrors)
			.then(response => response.json())
			.then(jsonFetchMocks.generateMocks(url, 'GET'));
	}

	function postJson(url, body, headers = {}) {
		return jsonFetchMocks.getMock(url, 'POST') || fetch(url, {
			'headers': headers,
			'timeout': DEFAULT_TIMEOUT,
			'body': body,
			'method': 'POST'
		})
			.then(handleHttpErrors)
			.then((response) => response.json())
			.then(jsonFetchMocks.generateMocks(url, 'POST'));
	}

	return {
		'getJson': getJson,
		'postJson': postJson
	};
}());
