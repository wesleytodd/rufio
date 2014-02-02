// Requirements
var util = require('util'),
	path = require('path'),
	async = require('async'),
	Looker = require('looker');

// A plugin loader
var Plugins = module.exports = function(rufio) {
	// Call the Looker constructor
	Looker.call(this);

	// Setup the load paths
	this.lookupPath(path.join(rufio.config.get('RUFIO_ROOT'), 'node_modules'), 1000);
	this.lookupPath(path.join(rufio.config.get('SITE_ROOT'), 'node_modules'), 100);

	// The rufio instance this is attached to
	this.rufio = rufio;

	// Keep a list of loaded plugins
	this.loadedPlugins = [];
};
util.inherits(Plugins, Looker);

// Loads the plugins
Plugins.prototype.load = function(plugins, done) {

	// Collect the errors
	var errors = [];

	async.eachSeries(plugins, function(plugin, done) {
		if (this.loadedPlugins.indexOf(plugin) === -1) {
			// Require the plugin
			this.require('rufio-' + plugin, function(err, pluginInit, pluginPath) {
				// Exit on error
				if (err) {
					errors.push('Could not find plugin: ' + plugin);
					errors.push(err);
					return done();
				}

				// Exit if plugin is not a function
				if (typeof pluginInit !== 'function') {
					errors.push('Plugin ' + plugin + ' is not a function');
					return done();
				}

				// Call the init function for the plugin
				this.rufio.logger.info('Loading plugin: ' + plugin);
				pluginInit(this.rufio);

				// Push the module path onto the filters load path
				this.rufio.filters.lookupPath(path.join(pluginPath, 'filters'));

				// Push the module path onto the templates load path
				this.rufio.templates.lookupPath(path.join(pluginPath, 'templates'));

				// Add to list of loaded plugins
				this.loadedPlugins.push(plugins);
				
				// Done
				done();
			}.bind(this));
		} else {
			done();
		}
	}.bind(this), function() {
		// Callback with errors
		done((errors.length) ? errors : null);
	});

};
