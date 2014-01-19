// Requirements
var path = require('path'),
	util = require('./util'), 
	config = require('./config');

// Private variables
var filters = {};

// Loads all filters from the lookup paths
var load = function load(paths, done) {

	// Custom paths are optional
	paths = paths || [];

	// Add the site filters
	paths.unshift(path.join(config.get('SITE_ROOT'), 'filters'));

	// @TODO Plugin filters

	// Add the rufio core filters
	paths.unshift(path.join(config.get('RUFIO_ROOT'), 'filters'));

	// Load from each path
	util.async.each(paths, function(p, done) {
		util.eachInDir(p, function(file, done) {
			define(path.basename(file, '.js'), path.join(p, file));
			done();
		}, done);
	}, done);
};

// Define a single filter
var define = function define(name, fnc) {
	// Filter function can be a path to a file which exports the function
	if (typeof fnc === 'string') {
		fnc = require(fnc);
	}
	// Add to the list of known filters
	filters[name] = fnc;
};

// Apply a filter
var apply = function apply(names, content, ctx) {
	// Args is optional
	if (typeof ctx === 'function') {
		done = ctx;
		ctx = null;
	}

	// names can be a comma demimited string or an array
	// so convert the string to an array
	if (typeof names === 'string') {
		names = util._.map(names.split(','), function(s) {
			return s.trim();
		});
	}

	// Loop the filters
	names.forEach(function(name, done) {
		if (typeof filters[name] === 'function') {
			// Call the filter function with the given content and context
			content = filters[name].call(ctx, content);
		}
	});

	return content;
};

//
// Public Interface
//
module.exports = {
	load: load,
	define: define,
	apply: apply
};
