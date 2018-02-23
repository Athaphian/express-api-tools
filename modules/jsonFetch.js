const fetch = require('node-fetch'),
	fs = require('fs'),
	log = require('./logging');

module.exports = (function() {
	const DEFAULT_TIMEOUT = 20000;
	let useMocks = false,
		mocks;

	const handleHttpErrors = response => {
		if (response.status !== 200) {
			throw {error: `${response.status} ${response.statusText}`, response: response};
		} else {
			return response;
		}
	};

	const mocksFile = process.argv.filter(arg => arg.startsWith('mocks=')).map(arg => arg.substr(6))[0];
	if (mocksFile) {

		// Force logging on, since this might be important, mocks are only used during development anyway
		const loggingWasEnabled = log.isEnabled();
		log.setEnabled(true);

		try {
			mocks = JSON.parse(fs.readFileSync(mocksFile, 'utf8'));
			useMocks = true;
			log.info('[ ] Loaded mocks file "' + mocksFile + '", MOCKS ARE ENABLED.');
		} catch (e) {
			log.error('[ ] Mocks file "' + mocksFile + '" not found, MOCKS ARE DISABLED.');
		}

		// Set logging to original state
		log.setEnabled(loggingWasEnabled);
	}

	function getJson(url, headers) {
		if (useMocks) {
			const mockResponseFile = mocks[url];
			if (mockResponseFile) {
				if (mockResponseFile === 'ENOTFOUND') {
					return new Promise(function(resolve, reject) {
						reject({
							message: 'request failed because of mock ENOTFOUND',
							code: 'ENOTFOUND',
							name: 'FetchError'
						})
					});
				}

				try {
					const mockResponse = JSON.parse(fs.readFileSync(mockResponseFile, 'utf8'));
					log.info('[ ] Mock "' + mockResponseFile + '" used to simulate response.');
					return new Promise(function(resolve) {
						resolve(mockResponse);
					});
				} catch (e) {
					log.error('[ ] Mock "' + mockResponseFile + '" not found. Check your mocks file!');
				}
			}
		}

		return fetch(url, {
			'headers': headers,
			'timeout': DEFAULT_TIMEOUT
		})
			.then(handleHttpErrors)
			.then(response => response.json());
	}

	function postJson(url, headers, body) {
		return fetch(url, {
			'headers': headers,
			'timeout': DEFAULT_TIMEOUT,
			'body': body,
			'method': 'POST'
		})
			.then(handleHttpErrors)
			.then((response) => response.json());
	}

	return {
		'getJson': getJson,
		'postJson': postJson
	};
}());
