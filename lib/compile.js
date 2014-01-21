// Requirements
var hooks = require('./hooks'),
	config = require('./config'),
	filters = require('./filters'),
	util = require('./util'),
	Type = require('./type');

// Compile all types
var compileAll = function compileAll(done) {
	// Object to collect data
	var data = {};

	// Run hooks before and after compiling data
	util.async.series([function(done) {
		// Before compile hook
		hooks.trigger('beforeCompile', {
			data: data,
			config: config,
			util: util,
			filters: filters,
			hooks: hooks
		}, done);
	}, function(done) {
		// Compile each type individually
		util.async.each(Object.keys(config.get('types')), function(type, done) {
			compileType(type, function(t) {
				data[type] = t;
				done();
			});
		}, done);
	}, function(done) {
		// After compile hook
		hooks.trigger('afterCompile', {
			data: data,
			config: config,
			util: util,
			filters: filters,
			hooks: hooks
		}, done);
	}], function() {
		done(null, data);
	});
};

// Compile a single type
var compileType = function compileType(type, done) {
	var t;
	// Run hooks before and after compiling data
	util.async.series([function(done) {
		// Before compile type hook
		hooks.trigger('beforeCompile:' + type, [], done);
	}, function(done) {
		// Create the type object
		t = new Type(type);
		// Compile the data
		t.compile(done);
	}, function(done) {
		// After compile type hook
		hooks.trigger('afterCompile:' + type, [t], done);
	}], function() {
		done(t);
	});
};

//
// Public Interface
//
module.exports = {
	all: compileAll,
	type: compileType
};
