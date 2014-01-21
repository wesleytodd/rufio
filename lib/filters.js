// Requirements
var path = require('path'),
	util = require('./util'), 
	config = require('./config');

// Private variables
var filters = {};

// Create the load path list
var loadPath = new util.LoadPathList();

// Adds a load path and sorts them
var addLoadPath = function(path, priority) {
	return loadPath.add(path, priority);
};

// Loads all filters from the lookup paths
var load = function load(done) {
	loadPath.load(function(loadPath, done) {
		util.eachInDir(loadPath, function(file, done) {
			define(path.basename(file, '.js'), path.join(loadPath, file));
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
	names.forEach(function(name) {
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
	apply: apply,
	addLoadPath: addLoadPath
};
