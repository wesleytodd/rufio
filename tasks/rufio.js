// Load rufio
var Rufio = require('..');

module.exports = function (grunt) {

	grunt.registerMultiTask('rufio', 'Builds a Rufio site', function() {
		// This is an async task
		var done = this.async();

		// Default Options
		var defaultOptions = {
			rufio: {
				silent: true
			}
		};

		// Merge config with defaults
		var options = grunt.util._.extend(defaultOptions, this.options());

		// Log options
		grunt.verbose.writeflags(options, 'Options');

		// Pass along verbose
		var flags = grunt.option.flags();
		if (flags.indexOf('--verbose') !== -1 || flags.indexOf('-v') !== -1) {
			options.rufio.logLevel = 'info';
			options.rufio.silent = false;
		}

		// Create an instance of a rufio app
		var rufio = new Rufio(options);

		// Initalize Rufio
		rufio.init(function(err) {
			// Kill on init error
			if (err) {
				grunt.fatal(err);
			}

			// Load the content
			rufio.loadAll(function(err) {
				// Exit on load error
				if (err) {
					grunt.fatal(err);
				}

				// Write
				rufio.writeAll(function(err) {
					// Exit on write error
					if (err) {
						grunt.fatal(err);
					}

					grunt.log.ok('Site build complete to version: ' + rufio.config.get('build:active'));
					done();
				});
			});
		});
		
	});

};
