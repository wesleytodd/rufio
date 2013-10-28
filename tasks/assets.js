var path = require('path');

module.exports = function(grunt) {

	// Reference _ from Grunt
	var _ = grunt.util._;

	// Default Options
	var defaultOptions = {
		urlBase: '/',
		type: 'script',
		scriptTemplate: '<script src="<%= file %>"></script>',
		linkTemplate: '<link href="<%= file %>" rel="stylesheet" />'
	};

	grunt.registerMultiTask('assets', 'A generic script tag builder', function() {

		// Merge config with defaults
		var options = _.extend({}, defaultOptions, this.options());

		// Log options
		grunt.verbose.writeflags(options, 'Options');

		options[options.type + 'Template'] = _.template(options[options.type + 'Template']);

		this.files.forEach(function(file) {
			var out = '';
			file.src.forEach(function(f) {
				out += options[options.type + 'Template']({
					file: options.urlBase + f
				});
			});
			try {
				grunt.file.write(file.dest, out);
				grunt.verbose.ok('Wrote file: ' + file.dest);
			} catch (e) {
				grunt.verbose.error('Error writing file: ' + file.dest);
			}
		});

	});

};
