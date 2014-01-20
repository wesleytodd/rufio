// Require rufio
var rufio = require('..');

module.exports = function (grunt) {

	// Wrap common task actions
	function task(fnc) {
		return function () {
			// These are async operations
			var done = this.async();

			// Default Options
			var defaultOptions = {};

			// Merge config with defaults
			var options = grunt.util._.extend(defaultOptions, this.options());

			// Log options
			grunt.verbose.writeflags(options, 'Options');

			rufio.init(function(err) {
				// Kill on init error
				if (err) {
					grunt.fatal(Err);
				}
				// Compile the site content
				rufio.compile.all(function(err, data) {
					if (err) grunt.fatal(err);
					grunt.log.ok('Data Compilation Complete');
					fnc(data, done);
				});
			});
		};
	};

	grunt.registerTask('rufio', 'Build a Rufio site', task(function(data, done) {
		// Build all types
		rufio.build.all(data, function() {
			grunt.log.ok('Build Complete');
			done();
		});
	}));

	// Dev task with env flag
	grunt.registerTask('rufio-dev', 'Build a Rufio site in development', task(function(data, done) {
		// Set dev flag
		rufio.config.ENVIRONMENT = 'dev';
		// Build all types
		rufio.build.all(data, function() {
			grunt.log.ok('Build Complete');
			done();
		});
	}));

	// Register a build task for each type
	for (var type in rufio.config.get('types')) {
		(function(type) {
			grunt.registerTask('rufio-' + type, task(function(data, done) {
				// Build items
				rufio.build.type(type, data, done);
			}));
			grunt.registerTask('rufio-' + type + '-dev', task(function(data, done) {
				// Set dev flag
				rufio.config.ENVIRONMENT = 'dev';
				// Build items
				rufio.build.type(type, data, done);
			}));
		})(type);
	}

};
