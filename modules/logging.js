module.exports = (function() {

	let logging = false;

	function setEnabled(loggingEnabled) {
		logging = loggingEnabled;
	}

	function isEnabled() {
		return logging;
	}

	function info() {
		if (logging) {
			console.log.apply(this, arguments);
		}
	}

	function error() {
		if (logging) {
			console.log.apply(this, arguments);
		}
	}

	function enableLoggingBasedOnParam(param) {
		process.argv.forEach(function(val) {
			if (val.indexOf(param) === 0) {
				setEnabled(true);
			}
		});
	}

	return {
		'info': info,
		'error': error,
		'setEnabled': setEnabled,
		'enableLoggingBasedOnParam': enableLoggingBasedOnParam,
		'isEnabled': isEnabled
	};
}());
