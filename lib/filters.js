// Requirements
var path = require('path'),
	util = require('util'),
	Looker = require('looker');

var Filters = module.exports = function(rufio) {
	// Rufio reference this is attached to
	this.rufio = rufio;

	// Call the Looker constructor
	Looker.call(this);

	// The loaded filters
	this.filters = {};

	// The filter load paths
	this.lookupPath(path.join(rufio.config.get('THEME_ROOT'), 'filters'), 10);
	this.lookupPath(path.join(rufio.config.get('SITE_ROOT'), 'filters'), 100);
	this.lookupPath(path.join(rufio.config.get('RUFIO_ROOT'), 'filters'), 1000);
};
util.inherits(Filters, Looker);

// Loads all filters from the lookup paths
Filters.prototype.load = function(done) {

	// Requires all the filter files
	this.requireAll(function(filters) {
		for (var i in filters) {
			// Name is the filename minus the extention
			var name = path.basename(i, '.js');

			// Only use the highest priority filter
			if (!this.filters[name]) {
				// Log the load
				this.rufio.logger.info('Loading filter ' + name + ': ' + i);

				// Add to the list of filters
				this.define(name, filters[i]);
			}
		}

		// complete the loading
		done();

	}.bind(this));

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

	// Loop the filters
	if (typeof this.filters[name] === 'function') {
		// Call the filter function with the given content and context
		content = this.filters[name].apply(this.rufio, args);
	}

	// Return the filtered content
	return content;
};
