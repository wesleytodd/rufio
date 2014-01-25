// Requirements
var util = require('./util'),
	filters = require('./filters');

// Create the load path list
var loadPath = new util.LoadPathList();

// Load active plugins
var load = function(rufio, plugins, done) {

	// Plugins are actually optional
	plugins = plugins || [];

	// Collect the modules
	var modules = [];

	// Collect the errors
	var errors = [];

	// Loop through the plugins
	util.async.each(plugins, function(plugin, done) {

		// Try to load the path
		loadPath.load(function(loadPath, done) {
			try {
				var p = path.join(loadPath, 'rufio-' + plugin);
				var m = require.resolve(p);
				done(m);
			} catch (e) {
				done();
			}
		}, function(p) {
			if (typeof p !== 'undefined') {
				// Require the module
				var module = require(p);
				// Call the module
				module(rufio);
				// Push the module path onto the filters load path
				filters.addLoadPath(path.join(p, 'filters'));
			} else {
				errors.push('Could not find plugin: ' + plugin);
			}
			done();
		});

	}, function() {
		// Plugins loaded
		done((errors.length > 0) ? errors : null);
	});

};

//
// Public Interface
//
module.exports = {
	load: load,
	addLoadPath: function(path, priority) {
		return loadPath.add(path, priority);
	}
};
