// Requirements
var util = require('./util'),
	filters = require('./filters');

// A plugin loader
var Plugins = module.exports = function(rufio) {
	// The rufio instance this is attached to
	this.rufio = rufio;

	// Create the load path list
	this.loadPath = new util.LoadPathList();
	this.loadPath.add(path.join(rufio.config.get('RUFIO_ROOT'), 'node_modules'), 1000);
	this.loadPath.add(path.join(rufio.config.get('SITE_ROOT'), 'node_modules'), 100);
};

// Adds a load path
Plugins.prototype.addLoadPath =function(path, priority) {
	return this.loadPath.add(path, priority);
};

// Loads the plugins
Plugins.prototype.load = function(plugins, done) {
	// Plugins are actually optional
	plugins = plugins || [];

	// Collect the errors
	var errors = [];

	// Loop through the plugins
	util.async.each(plugins, function(plugin, done) {

		// Try to load the path
		this.loadPath.load(function(loadPath, done) {
			try {
				var p = path.join(loadPath, 'rufio-' + plugin);
				var m = require.resolve(p);
				if (m) {
					done(m);
				}
			} catch (e) {
				done();
			}
		}.bind(this), function(p) {
			if (typeof p !== 'undefined') {
				// Log the load
				this.rufio.logger.info('Loading plugin ' + plugin + ' from ' + p);

				// Require the module
				var module = require(p);

				// Call the module
				module(this.rufio);

				// Push the module path onto the filters load path
				this.rufio.filters.addLoadPath(path.join(p, 'filters'));
			} else {
				errors.push('Could not find plugin: ' + plugin);
			}
			done();
		}.bind(this));

	}.bind(this), function() {
		// Error loading?
		if (errors.length) {
			// Log error and return
			this.rufio.logger.error('Error loading plugins', errors);
			done(errors);
		}
		// Plugins loaded
		done();
	});

};
