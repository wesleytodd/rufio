// Requirements
var path = require('path'),
	util = require('./util');

var Filters = module.exports = function(rufio) {
	// Rufio reference this is attached to
	this.rufio = rufio;

	// The loaded filters
	this.filters = {};

	// The filter load paths
	this.loadPath = new util.LoadPathList();
	this.loadPath.add(path.join(rufio.config.get('RUFIO_ROOT'), 'filters'), 1000);
	this.loadPath.add(path.join(rufio.config.get('SITE_ROOT'), 'filters'), 100);
	this.loadPath.add(path.join(rufio.config.get('THEME_ROOT'), 'filters'), 10);
};

// Adds a load path
Filters.prototype.addLoadPath = function(path, priority) {
	return this.loadPath.add(path, priority);
};

// Loads all filters from the lookup paths
Filters.prototype.load = function(done) {
	// Load the filters from the different paths
	this.loadPath.load(function(loadPath, done) {
		util.eachInDir(loadPath, function(file, done) {
			var n = path.basename(file, '.js');
			var p = path.join(loadPath, file);

			// Log the load
			this.rufio.logger.info('Loading filter ' + n + ': ' + p);

			// Define the filter
			this.define(n, p);
			done();
		}.bind(this), done);
	}.bind(this), done);
};

// Define a single filter
Filters.prototype.define = function(name, fnc) {
	// Filter function can be a path to a file which exports the function
	if (typeof fnc === 'string') {
		fnc = require(fnc);
	}
	// Add to the list of known filters
	this.filters[name] = fnc;
};

// Apply a filter
Filters.prototype.apply = function(name, content) {
	// Args is optional
	var args = Array.prototype.slice.call(arguments, 1);

	if (name == 'template,markdown') {
		console.trace();
	}

	// Loop the filters
	if (typeof this.filters[name] === 'function') {
		// Call the filter function with the given content and context
		content = this.filters[name].apply(this.rufio, args);
	}

	// Return the filtered content
	return content;
};
