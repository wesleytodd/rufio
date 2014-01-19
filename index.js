// Requires
var path = require('path'),
	fs = require('fs'),
	config = require('./lib/config'),
	util = require('./lib/util'),
	hooks = require('./lib/hooks'),
	filters = require('./lib/filters'),
	compile = require('./lib/compile'),
	build = require('./lib/build');

//
// Core Validation
//

// Config cannot be missing or null
config.validate(null, function(val, done) {
	if (typeof val === 'undefined' || val === null) {
		var err = 'Error loading config.  Are you sure it exists and is valid JSON?';
	}
	done(err);
});

// Hostname is required
config.validate('hostname', function(val, done) {
	if (typeof val !== 'string') {
		var err =  'Hostname is required.  Please specify one in your rufio.json';
	}
	done(err);
});

// Must have a rufio key which must have a metaEnd
config.validate('rufio', function(val, done) {
	var err;
	if (typeof val === 'undefined' || val === null) {
		err = [
			'Rufio config is required.',
			'Make sure your rufio.json has something like this in it:',
			'"rufio": {',
				'\t"metaEnd": "--META--"',
			'}',
		].join('\n');
	}
	if (typeof val.metaEnd !== 'string') {
		err = [
			'Rufio\'s metaEnd is required.',
			'Make sure your rufio.json has something like this in it:',
			'"rufio": {',
				'\t"metaEnd": "--META--"',
			'}',
		].join('\n');
	}
	done(err);
});

// Require build directory and active version
config.validate('build', function(val, done) {
	var err;
	if (typeof val === 'undefined' || val === null) {
		err = [
			'Build config is required.  Make sure your rufio.json has something like this in it:',
			'"build": {',
				'\t"directory": "build"',
				'\t"active": "0.0.0"',
			'}',
		].join('\n');
	}
	if (typeof val.directory !== 'string' || typeof val.active !== 'string') {
		err = [
			'Build config requires both directory and active.',
			'Make sure your rufio.json has something like this in it:',
			'"build": {',
				'\t"directory": "build"',
				'\t"active": "0.0.0"',
			'}',
		].join('\n');
	}
	done(err);
});

// Require theme directory and active theme
config.validate('themes', function(val, done) {
	var err;
	if (typeof val === 'undefined' || val === null) {
		err = [
			'Themes config is required.',
			'Make sure your rufio.json has something like this in it:',
			'"theme": {',
				'\t"directory": "build"',
				'\t"active": "0.0.0"',
			'}',
		].join('\n');
	}
	if (typeof val.directory !== 'string' || typeof val.active !== 'string') {
		err = [
			'Themes config requires both directory and active.',
			'Make sure your rufio.json has something like this in it:',
			'"theme": {',
				'\t"directory": "build"',
				'\t"active": "0.0.0"',
			'}',
		].join('\n');
	}
	done(err);
});

// Validate the types
config.validate('types', function(val, done) {
	var err;
	// Types is required
	if (typeof val === 'undefined' || val === null) {
		err = [
			'Types config requires.',
			'Make sure your rufio.json has something like this in it:',
			'"types": {',
				'\t// Data Types',
			'}',
		].join('\n');
	}

	// Validate type directories
	util.async.each(val, function(v, done) {
		if (typeof v.directory === 'undefined' || v.directory === null) {
			err = 'Type ' + i + ' does not have a directory specified.';
		}
		fs.exists(path.join(config.get('SITE_ROOT'), v.directory), function(exists) {
			if (!exists) {
				err = 'Type ' + i + '\'s directory does not exist.';
			}
			done();
		});
	}, function() {
		done(err);
	});
});

//
// Init Rufio
//
var initalizing = false;

var init = function(done) {
	// Only allow one init call
	if (initalizing) {
		done('Initalization already in progress');
	}
	initalizing = true;

	// 
	// Load & validate the config
	//
	config.load(function(err) {
		if (err) {
			return done(err);
		}

		//
		// Set env vars
		//
		config.constant('RUFIO_ROOT', __dirname);
		config.constant('SITE_ROOT', process.cwd());
		config.constant('BUILD_ROOT', path.join(config.get('SITE_ROOT'), config.get('build.directory'), config.get('build.active')));
		config.constant('THEME_ROOT', path.join(config.get('SITE_ROOT'), config.get('themes.directory'), config.get('themes.active')));

		// @TODO Load plugins

		// Run the validation
		config.validate(function(err) {
			// Log error
			if (err) {
				return done(err);
			}
			
			// Load the filters
			filters.load(process.env.RUFIO_FILTER_PATH, function(err) {
				// Log error
				if (err) {
					return done(err);
				}

				// Everything is loaded and ready to go
				done();
			});
		});

	});
};

//
// Public Interface
//
module.exports = {

	// The init method
	init: init,

	// Expose utilities
	util: util,

	// Config api
	config: config,

	// Filters api
	filters: filters,

	// Event Hooks
	hooks: hooks,

	// Compile Methods
	compile: compile,

	// Build Methods
	build: build,

};
