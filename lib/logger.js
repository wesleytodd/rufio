var winston = require('winston'),
	util = require('util');

var Logger = module.exports = function(options) {
	// Options are optiona
	options = options || {};

	var transports = [];

	// Logfile overrides console transport
	if (options.logFile) {

		// Add the file transport
		transports.push(new winston.transports.File({
			filename: options.logFile,
			level: options.logLevel || 'error',
			silent: options.silent || false,
		}));

	} else {

		// Setup console logger
		transports.push(new winston.transports.Console({
			colorize: options.cli || false,
			prettyPrint: options.cli || false,
			level: options.logLevel || 'error',
			silent: options.silent || false,
		}));

		// Add an exception handler logfile
		transports.push(new winston.transports.File({
			filename: 'rufio.log',
			handleExceptions: true
		}));

	}

	// Extends from winston logger
	winston.Logger.call(this, {
		transports: transports
	});
};
util.inherits(Logger, winston.Logger);
