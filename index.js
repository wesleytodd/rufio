// Requires
var path = require('path'),
	fs = require('fs'),
	config = require('./lib/config'),
	util = require('./lib/util'),
	hooks = require('./lib/hooks'),
	filters = require('./lib/filters'),
	load = require('./lib/load'),
	write = require('./lib/write'),
	plugins = require('./lib/plugins');

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
		util.logger.warn('Initalization already in progress');
		done('Initalization already in progress');
	}
	initalizing = true;
	util.logger.info('Initalizing Rufio');

	// 
	// Load & validate the config
	//
	config.load(function(err) {
		if (err) {
			util.logger.error('Error loading config:', err);
			return done(err);
		}

		//
		// Set env vars
		//
		config.constant('RUFIO_ROOT', __dirname);
		config.constant('SITE_ROOT', process.cwd());
		config.constant('BUILD_VERSION', process.env.RUFIO_BUILD_VERSION || config.get('build.active') || 'active');
		config.constant('BUILD_ROOT', path.join(config.get('SITE_ROOT'), config.get('build.directory')));
		config.constant('THEME_ROOT', path.join(config.get('SITE_ROOT'), config.get('themes.directory'), config.get('themes.active')));

		// Add core filter load paths
		plugins.addLoadPath(path.join(config.get('RUFIO_ROOT'), 'node_modules'));
		plugins.addLoadPath(path.join(config.get('SITE_ROOT'), 'node_modules'));

		// Add core filter load paths
		filters.addLoadPath(path.join(config.get('RUFIO_ROOT'), 'filters'), 1000);
		filters.addLoadPath(path.join(config.get('SITE_ROOT'), 'filters'), 50);
		filters.addLoadPath(path.join(config.get('THEME_ROOT'), 'filters'), 10);

		// Load and init the plugins
		plugins.load(rufio, config.get('plugins.active'), function(err) {
			// Log error
			if (err) {
				util.logger.error('Error loadding plugins:', err);
				return done(err);
			}

			// Run the validation
			config.validate(function(err) {
				// Log error
				if (err) {
					util.logger.error('Config validation errors:', err);
					return done(err);
				}
				
				// Load the filters
				filters.load(function(err) {
					// Log error
					if (err) {
						util.logger.error('Error loading filters:', err);
						return done(err);
					}

					// Everything is loaded and ready to go
					done();
				});
			});

		});

	});
};

// Load the package.json
try {
	// Get path to package.json
	var pkgPath = path.join(__dirname, 'package.json')
	util.logger.info('Loading ' + pkgPath);

	// Load the file
	var pkg = fs.readFileSync(pkgPath, {encoding: 'utf8'});
	pkg = JSON.parse(pkg);

	// Set the verison
	config.constant('RUFIO_VERSION', pkg.version || 'unknown');
} catch(err) {
	util.logger.error('Error loading package.json', err);
}

//
// Public Interface
//
var rufio = module.exports = {

	// Version
	version: config.get('RUFIO_VERSION'),

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

	// Load Methods
	load: load,

	// Write Methods
	write: write,

};
