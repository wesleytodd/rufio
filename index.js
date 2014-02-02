// Requirements
var path = require('path'),
	fs = require('fs'),
	async = require('async'),
	Logger = require('./lib/logger'),
	Config = require('./lib/config'),
	Hooks = require('./lib/hooks'),
	Filters = require('./lib/filters'),
	Plugins = require('./lib/plugins'),
	Template = require('./lib/template'),
	Type = require('./lib/type'),
	util = require('./lib/util'),
	coreValidationRules = require('./lib/validation-rules');

//
// Rufio App Constructor
//
var Rufio = module.exports = function(options) {

	// Site root
	var siteRoot = options.siteRoot || process.cwd();

	// Environment
	var env = options.environment || 'prod';

	// Require rufio.json file in site root
	var rufioJsonFile = path.join(siteRoot, 'rufio.json')
	if (!fs.existsSync(rufioJsonFile)) {
		console.error('Invalid Rufio site.  A rufio.json file must exist in the site root.');
		console.error('File does not exist: ' + rufioJsonFile);
		process.exit(1);
	}

	// Setup config
	this.config = new Config({
		files: [
			path.join(siteRoot, env + '-rufio.json'),
			rufioJsonFile,
		]
	}, {
		'RUFIO_ROOT': __dirname,
		'SITE_ROOT': siteRoot,
		'ENVIRONMENT': env
	}, options);

	// Massage build version, since you can pass it in from the cli
	var bv = this.config.get('buildVersion');
	if (bv) {
		this.config.set('build:active', bv);
	}

	// Set composite paths
	this.config.set('BUILD_ROOT', path.join(this.config.get('SITE_ROOT'), this.config.get('build:directory'), this.config.get('build:active')));
	this.config.set('THEME_ROOT', path.join(this.config.get('SITE_ROOT'), this.config.get('themes:directory'), this.config.get('themes:active')));

	// Setup the logger
	this.logger = new Logger({
		cli: this.config.get('rufio:cli'),
		logLevel: this.config.get('rufio:logLevel'),
		silent: this.config.get('rufio:silent'),
		logFile: this.config.get('rufio:logFile'),
	});

	// Version
	this.version = pkg.version || 'unknown';

	// Initalizing?
	this.initializing = false;

	// Ready?
	this.ready = false;

	// The compiled types
	this.types = {};

	// Expose utilities
	this.util = util;

	// Template Cache
	this.templates = new Template(this);

	// Plugins
	this.plugins = new Plugins(this);

	// Filters api
	this.filters = new Filters(this);

	// Event Hooks
	this.hooks = new Hooks(this);

};

Rufio.prototype.init = function(done) {
	// Log our progress
	this.logger.info('Initalizing Rufio');

	// Log the options
	this.logger.info('Config', this.config.get());

	// Add core config validation rules
	for (var i in coreValidationRules) {
		this.config.validate(i, coreValidationRules[i]);
	}

	// Load and init the plugins
	this.logger.info('Loading plugins');
	this.plugins.load(this.config.get('plugins:active'), function(err) {
		// Log error
		if (err) {
			this.logger.error('Failed to load plugins:', err);
			this.initializing = false;
			return done(err);
		}

		// Run the validation
		this.logger.info('Validating configs');
		this.config.validate(function(err) {
			// Log error
			if (err) {
				this.logger.error('Config validation errors: \n', err);
				this.initializing = false;
				return done(err);
			}
			
			// Load the filters
			this.logger.info('Loading filters');
			this.filters.load(function(err) {
				// Log error
				if (err) {
					this.logger.error('Failed to load filters:', err);
					this.initializing = false;
					return done(err);
				}

				// Everything is loaded and ready to go
				this.ready = true;
				done();
			}.bind(this));
		}.bind(this));
	}.bind(this));

	// Chainable
	return this;
};

// Load all the types and items
Rufio.prototype.loadAll = function(done) {

	// Dont try to load until ready
	if (!this.ready) {
		this.logger.error('Cannot load data until Rufio is ready');
		return;
	}

	// Run hooks before and after loading data
	async.series([

		// Before load hook
		function(done) {
			this.hooks.trigger('beforeLoad', this, done);
		}.bind(this),

		// Load each type individually
		function(done) {
			async.each(Object.keys(this.config.get('types')), function(type, done) {
				// Load the new type
				this.loadType(type, function(t) {
					this.types[type] = t;
					done();
				}.bind(this));
			}.bind(this), done);
		}.bind(this),

		// After load hook
		function(done) {
			this.hooks.trigger('afterLoad', this, done);
		}.bind(this)

	], function() {
		done(null, this.types);
	});

	// Chainable
	return this;
};

Rufio.prototype.loadType = function(type, done) {

	// Create the type
	var t = new Type(type, this);

	// Run hooks before and after compiling data
	async.series([

		// Before load type hook
		function(done) {
			this.hooks.trigger('beforeLoad:' + type, t, done);
		}.bind(this),

		// load the type files
		function(done) {
			t.loadFiles(done);
		}.bind(this),

		// After load type hook
		function(done) {
			this.hooks.trigger('afterLoad:' + type, t, done);
		}.bind(this)

	], function() {
		done(t);
	});

	// Chainable
	return this;
};

// Write all output files
Rufio.prototype.writeAll = function(done) {

	// Run hooks and writing files
	async.series([

		// Before write hook
		function(done) {
			this.hooks.trigger('beforeWrite', this, done);
		}.bind(this),
		
		// Write each type
		function(done) {
			async.each(Object.keys(this.config.get('types')), function(type, done) {
				this.writeType(this.types[type], done);
			}.bind(this), done);
		}.bind(this),
		
		// After write hook
		function(done) {
			this.hooks.trigger('afterWrite', this, done);
		}.bind(this)

	], done);

	// Chainable
	return this;
};


// Write a single types' output
Rufio.prototype.writeType = function(type, done) {

	async.series([
			
		// Before write type hook
		function (done) {
			this.hooks.trigger('beforeWrite:' + type.name, type, done);
		}.bind(this),
		
		// Write the type
		function (done) {
			type.writeAll(done);
		}.bind(this),
		
		// After write type hook
		function (done) {
			this.hooks.trigger('afterWrite:' + type.name, type, done);
		}.bind(this)

	], done);

	// Chainable
	return this;
};

// Load the package.json
try {
	// Get path to package.json
	var pkgPath = path.join(__dirname, 'package.json');

	// Load the file
	var pkg = fs.readFileSync(pkgPath, {encoding: 'utf8'});
	pkg = JSON.parse(pkg);

	// Add version to rufio
	module.exports.version = pkg.version;

} catch(err) {
	console.error('Failed to load rufio package.json, version unknown');
	console.error(err);
}
