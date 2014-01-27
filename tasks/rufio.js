module.exports = function (grunt) {

	grunt.registerMultiTask('rufio', 'Builds a Rufio site', function() {
		// This is an async task
		var done = this.async();

		// Default Options
		var defaultOptions = {
			environment: 'prod',
			silent: false,
			version: 'active'
		};

		// Merge config with defaults
		var options = grunt.util._.extend(defaultOptions, this.options());

		// Log options
		grunt.verbose.writeflags(options, 'Options');

		// Pass along verbose
		var flags = grunt.option.flags();
		if (flags.indexOf('--verbose') !== -1 || flags.indexOf('-v') !== -1) {
			process.env.RUFIO_VERBOSE_LOGGING = true;
		}

		// Set the rufio environment
		process.env.RUFIO_ENVIRONMENT = options.environment;

		// Silent?
		if (options.silent) {
			process.env.RUFIO_SILENT = options.silent;
		}

		// Load rufio
		var rufio = require('..');

		// Initalize Rufio
		rufio.init(function(err) {
			// Kill on init error
			if (err) {
				grunt.fatal(err);
			}

			// Load the content
			rufio.load.all(function(err, data) {
				// Exit on load error
				if (err) {
					grunt.fatal(err);
				}

				// Write
				rufio.write.all(data, function(err) {
					// Exit on write error
					if (err) {
						grunt.fatal(err);
					}

					grunt.log.ok('Site build complete to version: ' + rufio.config.get('BUILD_VERSION'));
					done();
				});
			});
		});
		
	});

};
