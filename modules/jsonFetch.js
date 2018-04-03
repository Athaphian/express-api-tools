const fetch = require('node-fetch'),
	fs = require('fs'),
	log = require('./logging'),
	path = require('path');

module.exports = (function() {
	const DEFAULT_TIMEOUT = 20000;
	let useMocks = false,
		mocks,
		generateMocks = false,
		mocksDirName;

	const mocksFile = process.argv.filter(arg => arg.startsWith('mocks=')).map(arg => arg.substr(6))[0];
	const generateMocksFile = process.argv.filter(arg => arg.startsWith('generate-mocks=')).map(arg => arg.substr(15))[0];
	const reportUnmockedCalls = process.argv.filter(arg => arg.startsWith('report-unmocked=')).map(arg => arg.substr(16)).map(arg => arg === 'true')[0];

	const handleHttpErrors = response => {
		if (response.status !== 200) {
			throw {error: `${response.status} ${response.statusText}`, response: response};
		} else {
			return response;
		}
	};

	const writeObjectToFile = (file, contents) => {
		fs.writeFile(file, JSON.stringify(contents), function(err) {
			if (err) throw err;
		});
	};

	const saveMocks = () => {
		writeObjectToFile(generateMocksFile, mocks);
	};

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
	} else if (generateMocksFile) {
		console.log('generation?');
		// Force logging on, since this might be important, mocks are only used during development anyway
		const loggingWasEnabled = log.isEnabled();
		log.setEnabled(true);

		try {
			if (fs.existsSync(generateMocksFile)) {
				mocks = JSON.parse(fs.readFileSync(generateMocksFile, 'utf8'));
				log.info('[ ] Mock generation enabled to file "' + generateMocksFile + '", WARNING, EXISTING FILE WILL BE ALTERED.');
			} else {
				mocks = {};
				saveMocks();
				log.info('[ ] Mock generation enabled to file "' + generateMocksFile + '".');
			}

			mocksDirName = path.dirname(generateMocksFile);
			generateMocks = true;
		} catch (e) {
			log.error('[ ] Error while accessing mock generation file "' + generateMocksFile + '" MOCK GENERATION IS DISABLED.');
			generateMocks = false;
		}

		// Set logging to original state
		log.setEnabled(loggingWasEnabled);
	}

	const generateMocksFunction = url => response => {
		if (generateMocks) {
			try {
				const mockFileName = `${mocksDirName}/${url.replace(/http:\/\/|https:\/\//g, '').replace(/\.|\/|\?/g, '_')}.json`;
				log.info('[X] Recording mock:', url, mockFileName);
				mocks[url] = mockFileName;
				writeObjectToFile(mockFileName, response);
				saveMocks();
			} catch (err) {
				log.error('[ ] Error while writing mock file,', err);
			}
		}
		return response;
	};

	const getMock = url => {
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

			if (reportUnmockedCalls) {
				log.info('[X] NO MOCK FOUND for url:', url);
			}
		}
	};

	function getJson(url, headers = {}) {
		return getMock(url) || fetch(url, {
			'headers': headers,
			'timeout': DEFAULT_TIMEOUT
		})
			.then(handleHttpErrors)
			.then(response => response.json())
			.then(generateMocksFunction(url));
	}

	function postJson(url, body, headers = {}) {
		return getMock(url) || fetch(url, {
			'headers': headers,
			'timeout': DEFAULT_TIMEOUT,
			'body': body,
			'method': 'POST'
		})
			.then(handleHttpErrors)
			.then((response) => response.json())
			.then(generateMocksFunction(url));
		;
	}

	return {
		'getJson': getJson,
		'postJson': postJson
	};
}());
