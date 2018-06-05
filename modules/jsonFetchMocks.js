const fs = require('fs'),
	log = require('./logging'),
	path = require('path');

module.exports = (function() {
	let useMocks = false,
		mocks,
		generateMocks = false,
		mocksDirName;

	const mocksFile = process.argv.filter(arg => arg.startsWith('mocks=')).map(arg => arg.substr(6))[0];
	const generateMocksFile = process.argv.filter(arg => arg.startsWith('generate-mocks=')).map(arg => arg.substr(15))[0];
	const reportUnmockedCalls = process.argv.filter(arg => arg.startsWith('report-unmocked=')).map(arg => arg.substr(16)).map(arg => arg === 'true')[0];

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
			useMocks = true;
			mocksDirName = path.dirname(generateMocksFile);
			generateMocks = true;
		} catch (e) {
			log.error('[ ] Error while accessing mock generation file "' + generateMocksFile + '" MOCK GENERATION IS DISABLED.');
			generateMocks = false;
		}

		// Set logging to original state
		log.setEnabled(loggingWasEnabled);
	}

	const generateMocksFunction = (url, method) => response => {
		if (generateMocks) {
			try {
				const existingMock = mocks[method + '|' + url];
				const mockFileName = `${mocksDirName}/${url.replace(/http:\/\/|https:\/\//g, '').replace(/\.|\/|\?/g, '_')}.json`;
				if (existingMock) {
					log.info('[ ] Mock already exists:', url, mockFileName);
				} else {
					log.info('[X] Recording mock:', url, mockFileName);
					mocks[method + '|' + url] = mockFileName;
					writeObjectToFile(mockFileName, response);
					saveMocks();
				}
			} catch (err) {
				log.error('[ ] Error while writing mock file,', err);
			}
		}
		return response;
	};

	const getMock = (url, method) => {
		if (useMocks) {
			const mockResponseFile = mocks[method + '|'+ url];
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

	return {
		'getMock': getMock,
		'generateMocks': generateMocksFunction
	};
}());
