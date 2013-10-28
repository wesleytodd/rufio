// Requires
var rufio = require('..');

module.exports = function (grunt) {

	function task(fnc) {
		return function () {
			// Default Options
			var defaultOptions = {};

			// Merge config with defaults
			var options = grunt.util._.extend(defaultOptions, this.options());

			// Log options
			grunt.verbose.writeflags(options, 'Options');

			// Tun task
			fnc.call(this);
		};
	};
	// Load Rufio config
	var rufioConf = grunt.file.readJSON('rufio.json');

	grunt.registerTask('rufio', 'Build a Rufio site', task(function() {
		// Build all types
		rufio.build();
	}));

	// Dev task with env flag
	grunt.registerTask('rufio-dev', 'Build a Rufio site in development', task(function() {
		// Set dev flag
		rufio.setEnvironment('dev');
		// Build all types
		rufio.build();
	}));

	// Register a build task for each type
	for (var type in rufioConf.types) {
		(function(type) {
			grunt.registerTask('rufio-' + type, task(function() {
				// Build items
				rufio.buildType(type);
			}));
			grunt.registerTask('rufio-' + type + '-dev', task(function() {
				// Set dev flag
				rufio.setEnvironment('dev');
				// Build items
				rufio.buildType(type);
			}));
		})(type);
	}

};
