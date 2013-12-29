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
		var done = this.async();
		// Build all types
		rufio.build(done);
	}));

	// Dev task with env flag
	grunt.registerTask('rufio-dev', 'Build a Rufio site in development', task(function() {
		var done = this.async();
		// Set dev flag
		rufio.setEnvironment('dev');
		// Build all types
		rufio.build(done);
	}));

	// Register a build task for each type
	for (var type in rufioConf.types) {
		(function(type) {
			grunt.registerTask('rufio-' + type, task(function() {
				var done = this.async();
				// Build items
				rufio.buildType(type, done);
			}));
			grunt.registerTask('rufio-' + type + '-dev', task(function() {
				var done = this.async();
				// Set dev flag
				rufio.setEnvironment('dev');
				// Build items
				rufio.buildType(type, done);
			}));
		})(type);
	}

};
